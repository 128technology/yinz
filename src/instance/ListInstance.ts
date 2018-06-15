import * as _ from 'lodash';
import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { List } from '../model';

import { Searchable } from './mixins';
import { Path, Instance, ListChildInstance, LeafInstance, Visitor } from './';
import { isKeyedSegment } from './Path';

// Comma separated string of key values
export type Key = string;

export default class ListInstance implements Searchable {
  public children: Map<Key, ListChildInstance>;
  public parent: Instance;
  public model: List;

  public getPath: () => Path;
  public isTryingToMatchMe: (path: Path) => boolean;
  public isMatch: (path: Path) => boolean;
  public handleNoMatch: () => void;

  constructor(model: List, config: Element, parent?: Instance) {
    this.model = model;
    this.parent = parent;
    this.children = new Map();

    this.add(config);
  }

  public add(config: Element) {
    const newChild = new ListChildInstance(this.model, config, this.parent);

    const keys = [...this.model.keys]
      .map(key => {
        const keyLeaf = newChild.instance.get(key);

        if (keyLeaf instanceof LeafInstance) {
          return keyLeaf.value;
        } else {
          throw new Error(`Key is not a leaf. Model: ${this.model.name} Key: ${key}`);
        }
      })
      .join(',');

    this.children.set(keys, newChild);
  }

  public toJSON(camelCase = false): object {
    return {
      [this.model.getName(camelCase)]: [...this.children.values()].map(child => child.toJSON(camelCase))
    };
  }

  public getInstance(path: Path): Instance {
    if (this.isTryingToMatchMe(path) && this.isMatch(path) && !isKeyedSegment(_.head(path))) {
      // Returns the entire list if no keys provided
      return this;
    } else if (path.length >= 1) {
      const firstSegment = _.head(path);

      if (isKeyedSegment(firstSegment)) {
        const keyMap = firstSegment.keys.reduce((acc, { key, value }) => acc.set(key, value), new Map());
        const modelKeys = [...this.model.keys];

        if (_.isEqual(modelKeys, [...keyMap.keys()])) {
          const keyString = modelKeys.map(key => keyMap.get(key)).join(',');

          if (this.children.has(keyString)) {
            return this.children.get(keyString).getInstance(_.tail(path));
          }
        }
      }
    }

    this.handleNoMatch();
  }

  public visit(visitor: Visitor) {
    visitor(this);

    Array.from(this.children.values()).forEach(child => {
      child.visit(visitor);
    });
  }
}

applyMixins(ListInstance, [Searchable]);
