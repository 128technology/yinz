import * as _ from 'lodash';

import { Instance, ListChildInstance, LeafInstance } from '../';
import Path, { isKeyedSegment, ISegmentKeys } from '../Path';

export function findBestCandidate(matchCandidates: Instance[], auxiliaryKeys: Map<string, string>) {
  for (const potentialMatch of matchCandidates) {
    const path = evaluateCandidate(potentialMatch, auxiliaryKeys);

    if (path) {
      return path;
    }
  }

  throw new Error('Reference entity not found.');
}

export function evaluateCandidate(potentialMatch: Instance, auxiliaryKeys: Map<string, string>) {
  const auxiliaryKeysNames = Array.from(auxiliaryKeys.keys());
  const path: Path = [];

  let current: typeof potentialMatch | null = potentialMatch;
  while (current) {
    if (current instanceof ListChildInstance) {
      const parentModel = current.model;
      const segmentKeys: ISegmentKeys[] = [];

      const substituteKeys = auxiliaryKeysNames.filter(key => key.includes(parentModel.name));
      if (substituteKeys.length > 1) {
        throw new Error('Compound keys of more than two parts are not supported');
      }

      for (const key of parentModel.keys) {
        const keyNode = (current.instance.get(key) as LeafInstance).value;
        const substituteKeyValue = substituteKeys.length === 1 ? auxiliaryKeys.get(substituteKeys[0]) : null;

        if ((substituteKeyValue === null || keyNode === substituteKeyValue) && keyNode) {
          // Value from auxiliary key map matches the key value of this instance, so we have a match
          segmentKeys.push({ key, value: keyNode });
        } else {
          // Key name is in auxiliary key map but key value doesn't match, return and move on
          return undefined;
        }
      }

      path.push({ name: parentModel.name, keys: segmentKeys });
    } else {
      if (current) {
        path.push({ name: current.model.name });
      }
    }

    current = current.parent;
  }

  return path.reverse();
}

export function buildAuxiliaryKeyMap(path: Path) {
  return path.reduce((acc, segment, index) => {
    if (isKeyedSegment(segment)) {
      const { keys, name } = segment;

      if (keys.length > 1) {
        // Then item has a compound key. Build up a map of those keys that we haven't used yet.
        // We can ignore the key for the leafRef field we are querying for, they will be needed
        // later when we evaluate candidates.
        const nextSegment = path[index + 1];
        keys.forEach(key => {
          const { key: keyName, value } = key;

          if (keyName !== nextSegment.name) {
            acc.set(`${name}.${keyName}`, value);
          }
        });
      }
    }

    return acc;
  }, new Map());
}

/**
 * Apply the leaf entity value as a condition within the given XPath expression
 *
 * @param xPath simple leafRef XPath expression
 * @param leafValue expected text value of the leaf node pointed to by the XPath expression
 * @returns string modified XPath expression
 */
export function applyConditionToPath(xPath: string, leafValue: string) {
  return xPath
    .split('/')
    .map((pathPart, index, pathParts) => {
      if (index === pathParts.length - 2) {
        return `${pathPart}[${_.last(pathParts)}='${leafValue}']`;
      }

      return pathPart;
    })
    .join('/');
}
