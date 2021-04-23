import * as _ from 'lodash';
import { Element } from 'libxmljs2';

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
  ListJSONValue,
  Authorized,
  JSONMapper,
  MapToJSONOptions
} from './types';
import { getDefaultMapper } from './util';
import { Path, ListChildInstance } from './';
import { isKeyedSegment } from './Path';

// Comma separated string of key values
export type Key = string;

export default class ListInstance implements Searchable {
  public getPath: Searchable['getPath'];
  public isTryingToMatchMe: Searchable['isTryingToMatchMe'];
  public isMatch: Searchable['isMatch'];
  public handleNoMatch: Searchable['handleNoMatch'];

  private children: Map<Key, ListChildInstance> = new Map();

  constructor(public model: List, config: Element | ListJSON, public parent: Parent) {
    if (config instanceof Element) {
      this.add(config);
    } else {
      for (const child of config) {
        this.add(child);
      }
    }
  }

  public getChildren(authorized: Authorized) {
    const children: Map<Key, ListChildInstance> = new Map();

    for (const [k, v] of this.children) {
      if (authorized(v)) {
        children.set(k, v);
      }
    }

    return children;
  }

  public add(config: Element | ListChildJSON) {
    const newChild = new ListChildInstance(this.model, config, this.parent, this);

    this.children.set(newChild.keyString, newChild);
  }

  public delete(key: Key) {
    this.children.delete(key);
  }

  public toJSON(
    authorized: Authorized,
    camelCase = false,
    convert = true,
    shouldSkip?: ShouldSkip
  ): { [name: string]: ListJSONValue } {
    const value = [];
    if (shouldSkip) {
      for (const child of this.children.values()) {
        if (!shouldSkip(child)) {
          value.push(child.toJSON(authorized, camelCase, convert, shouldSkip));
        }
      }
    } else {
      for (const child of this.children.values()) {
        value.push(child.toJSON(authorized, camelCase, convert));
      }
    }
    const returnVal = value.filter(item => !_.isEmpty(item));
    return _.isEmpty(returnVal) ? {} : { [this.model.getName(camelCase)]: returnVal };
  }

  public mapToJSON(
    authorized: Authorized,
    map: JSONMapper = getDefaultMapper(authorized),
    options: MapToJSONOptions = { overrideOnKeyMap: false }
  ) {
    const value = [];

    for (const child of this.children.values()) {
      const childJSON = child.mapToJSON(authorized, map, options);
      if (childJSON) {
        value.push(...childJSON);
      }
    }

    return value.length > 0
      ? {
          [this.model.getName()]: value
        }
      : {};
  }

  public toXML(parent: Element, options: XMLSerializationOptions = { includeAttributes: false }) {
    Array.from(this.children.values()).forEach(child => {
      child.toXML(parent, options);
    });
  }

  public getInstance(path: Path, noMatchHandler: NoMatchHandler = this.handleNoMatch) {
    const firstSegment = _.head(path);
    if (firstSegment && this.isTryingToMatchMe(path) && this.isMatch(path) && !isKeyedSegment(firstSegment)) {
      // Returns the entire list if no keys provided
      return this;
    } else if (firstSegment && path.length >= 1) {
      if (isKeyedSegment(firstSegment)) {
        const keyMap = firstSegment.keys.reduce((acc, { key, value }) => acc.set(key, value), new Map());
        const modelKeys = [...this.model.keys];

        if (_.isEqual(modelKeys, [...keyMap.keys()])) {
          const keyString = modelKeys.map(key => keyMap.get(key)).join(',');

          if (this.children.has(keyString)) {
            return this.children.get(keyString)!.getInstance(_.tail(path), noMatchHandler);
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
