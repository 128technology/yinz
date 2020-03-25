import * as _ from 'lodash';
import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { List } from '../model';

import { Searchable } from './mixins';
import {
  ListJSON,
  Visitor,
  NoMatchHandler,
  Parent,
  ShouldSkip,
  XMLSerializationOptions,
  ListChildJSON,
  ListJSONValue
} from './types';
import { Path, ListChildInstance, LeafInstance } from './';
import { isKeyedSegment } from './Path';

// Comma separated string of key values
export type Key = string;

export default class ListInstance implements Searchable {
  public children: Map<Key, ListChildInstance>;
  public parent: Parent;
  public model: List;

  public getPath: Searchable['getPath'];
  public isTryingToMatchMe: Searchable['isTryingToMatchMe'];
  public isMatch: Searchable['isMatch'];
  public handleNoMatch: Searchable['handleNoMatch'];

  constructor(model: List, config: Element | ListJSON, parent?: Parent) {
    this.model = model;
    this.parent = parent;
    this.children = new Map();

    if (config instanceof Element) {
      this.add(config);
    } else {
      config.forEach(child => {
        this.add(child);
      });
    }
  }

  public add(config: Element | ListChildJSON) {
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

  public toJSON(camelCase = false, convert = true, shouldSkip?: ShouldSkip): { [name: string]: ListJSONValue } {
    const value = [];
    if (shouldSkip) {
      for (const child of this.children.values()) {
        if (!shouldSkip(child)) {
          value.push(child.toJSON(camelCase, convert, shouldSkip));
        }
      }
    } else {
      for (const child of this.children.values()) {
        value.push(child.toJSON(camelCase, convert));
      }
    }
    return {
      [this.model.getName(camelCase)]: value
    };
  }

  public toXML(parent: Element, options: XMLSerializationOptions = { includeAttributes: false }) {
    Array.from(this.children.values()).forEach(child => {
      child.toXML(parent, options);
    });
  }

  public getInstance(path: Path, noMatchHandler: NoMatchHandler = this.handleNoMatch) {
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
            return this.children.get(keyString).getInstance(_.tail(path), noMatchHandler);
          }
        }
      }
    }

    noMatchHandler(this, path);
  }

  public visit(visitor: Visitor) {
    visitor(this);

    Array.from(this.children.values()).forEach(child => {
      child.visit(visitor);
    });
  }
}

applyMixins(ListInstance, [Searchable]);
