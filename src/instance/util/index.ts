import { Element, parseXmlString } from 'libxmljs';

import DataModel from '../../model';
import Path, { isKeyedSegment, PathSegment } from '../Path';

export * from './leafRefUtil';

export function getPathXPath(path: Path) {
  const tail = path.map(segment => getSegmentXPath(segment)).join('/');
  return `//*[local-name()='config']/${tail}`;
}

export function getSegmentXPath(segment: PathSegment) {
  const { name } = segment;
  let keySelector = '';

  if (isKeyedSegment(segment)) {
    const keyInner = segment.keys.map(({ key, value }) => `*[local-name()='${key}']='${value}'`).join(' and ');
    keySelector = `[${keyInner}]`;
  }

  return `*[local-name()='${name}']${keySelector}`;
}

export function addEmptyTree(path: Path, model: DataModel, instance: Element): Element {
  const instanceCopy = instance.clone();

  let walkRef = instanceCopy;
  let modelPath = '';
  path.forEach((segment, i) => {
    const { name } = segment;
    modelPath = `${modelPath}${i > 0 ? '.' : ''}${name}`;

    const match = walkRef.get(getSegmentXPath(segment));
    if (match) {
      walkRef = match;
    } else {
      const pathModel = model.getModelForPath(modelPath);
      const [prefix, href] = pathModel.ns;
      const newNode = walkRef.node(name);
      newNode.namespace(prefix, href);

      if (isKeyedSegment(segment)) {
        // Assuming that the keys have the same NS as the parent, this
        // SHOULD always hold.
        segment.keys.forEach(({ key, value }) => {
          newNode.node(key, value).namespace(prefix, href);
        });
      }

      walkRef = newNode;
    }
  });

  return parseXmlString(instanceCopy.toString()).root();
}

export function getFieldIdFromParentAxis(element: Element) {
  const stack = [];
  let currentElement = element;

  while (currentElement && currentElement.name() !== 'config') {
    stack.push(currentElement.name());
    currentElement = currentElement.parent();
  }

  return stack.reverse().join('.');
}
