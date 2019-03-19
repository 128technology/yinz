import { Element } from 'libxmljs';
import * as _ from 'lodash';

import DataModel from '../../model';
import Path, { isKeyedSegment, PathSegment } from '../Path';
import { Instance, LeafInstance, ContainerInstance, LeafListChildInstance, ListChildInstance } from '../';

export * from './leafRefUtil';

function cleanUp(el: Element) {
  el.remove();
}

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

export function addEmptyTree(remainingPath: Path, model: DataModel, closestAncestor: Instance) {
  let emptyXmlRoot: Element | undefined;
  let modelPath: string | undefined;
  let closestXml: Element | undefined;
  if (
    closestAncestor instanceof LeafInstance ||
    closestAncestor instanceof LeafListChildInstance ||
    closestAncestor instanceof ListChildInstance ||
    closestAncestor instanceof ContainerInstance
  ) {
    closestXml = closestAncestor.config;
    modelPath = closestAncestor.model.path;
  } else {
    closestXml = closestAncestor.parent.config!;
    modelPath = closestAncestor.parent.model.path;
  }

  let walkRef = closestXml;
  remainingPath.forEach((segment, i) => {
    const { name } = segment;
    modelPath = `${modelPath}.${name}`;

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

    if (i === 0) {
      emptyXmlRoot = newNode;
    }
    walkRef = newNode;
  });

  return { cleanUpHiddenTree: _.partial(cleanUp, emptyXmlRoot), contextEl: walkRef };
}

export function getFieldIdFromParentAxis(element: Element) {
  const stack = [];
  let currentElement = element;

  while (currentElement && currentElement.name() !== 'config') {
    stack.push(currentElement.name());
    currentElement = currentElement.parent() as Element;
  }

  return stack.reverse().join('.');
}
