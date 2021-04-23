import { Element } from 'libxmljs2';
import * as _ from 'lodash';

import DataModel from '../../model';
import Path, { isKeyedSegment, PathSegment } from '../Path';
import {
  Instance,
  LeafInstance,
  ContainerInstance,
  LeafListChildInstance,
  ListChildInstance,
  LeafListInstance
} from '../';
import { JSONMapper, Authorized } from '../types';
import NoDomError from '../../util/noDomError';

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
    closestXml = closestAncestor.getConfig(allow);
    modelPath = closestAncestor.model.path;
  } else {
    closestXml = closestAncestor.parent.getConfig(allow)!;
    modelPath = closestAncestor.parent.model.path;
  }

  if (!closestXml) {
    throw new NoDomError();
  }

  let walkRef = closestXml;
  for (let i = 0, lengthI = remainingPath.length; i < lengthI; i++) {
    const segment = remainingPath[i];
    const { name } = segment;
    modelPath = `${modelPath}.${name}`;

    const pathModel = model.getModelForPath(modelPath);
    const [prefix, href] = pathModel.ns;
    walkRef = walkRef.node(name);
    walkRef.namespace(prefix, href);

    if (i === 0) {
      emptyXmlRoot = walkRef;
    }

    if (isKeyedSegment(segment)) {
      const keys = new Map<string, Element>();

      // Assuming that the keys have the same NS as the parent, this
      // SHOULD always hold.
      segment.keys.forEach(({ key, value }) => {
        const newKey = walkRef.node(key, value);
        newKey.namespace(prefix, href);
        keys.set(key, newKey);
      });

      // If next segment is a key, skip it since we created it above.
      const nextSegment = remainingPath[i + 1];
      if (nextSegment) {
        const matchedKey = keys.get(nextSegment.name);
        if (matchedKey) {
          walkRef = matchedKey;
          i += 1;
        }
      }
    }
  }

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

export const allow = () => true;

export function getDefaultMapper(authorized: Authorized) {
  const defaultMapper: JSONMapper = instance => {
    if (instance instanceof LeafInstance || instance instanceof LeafListInstance) {
      return instance.toJSON(authorized);
    } else if (instance instanceof ListChildInstance) {
      return [instance.toJSON(authorized)];
    }
  };

  return defaultMapper;
}
