import { Element } from 'libxmljs';
import * as _ from 'lodash';

import applyMixins from '../util/applyMixins';
import { LeafList } from '../model';
import { defineNamespaceOnRoot } from '../util/xmlUtil';

import { Searchable } from './mixins';
import {
  LeafListJSON,
  NoMatchHandler,
  Parent,
  XMLSerializationOptions,
  Visitor,
  LeafJSON,
  LeafListJSONValue,
  JSONMapper,
  MapToJSONOptions
} from './types';
import Path, { isSegmentWithValue } from './Path';
import { defaultMapper } from './util';
import { LeafListChildInstance } from './';

export default class LeafListInstance implements Searchable {
  public model: LeafList;
  public parent: Parent;
  public children: LeafListChildInstance[];

  public getPath: Searchable['getPath'];
  public isTryingToMatchMe: Searchable['isTryingToMatchMe'];
  public isMatch: Searchable['isMatch'];
  public handleNoMatch: Searchable['handleNoMatch'];

  constructor(model: LeafList, config: Element | LeafListJSON, parent: Parent) {
    this.model = model;
    this.parent = parent;
    this.children = [];

    if (config instanceof Element) {
      this.add(config);
    } else {
      config.forEach(child => {
        this.add(child);
      });
    }
  }

  public add(config: Element | LeafJSON) {
    this.children.push(new LeafListChildInstance(this.model, config, this));
  }

  public get values() {
    return this.children.map(child => child.value);
  }

  public get rawValues() {
    return this.children.map(child => child.rawValue);
  }

  public toJSON(camelCase = false, convert = true): { [name: string]: LeafListJSONValue } {
    return {
      [this.model.getName(camelCase)]: convert ? this.values : this.rawValues
    };
  }

  public mapToJSON(map: JSONMapper = defaultMapper, options: MapToJSONOptions = { overrideOnKeyMap: false }) {
    return map(this);
  }

  public toXML(parent: Element, options: XMLSerializationOptions = { includeAttributes: false }) {
    const [prefix, href] = this.model.ns;
    defineNamespaceOnRoot(parent, prefix, href);
    this.children.forEach(child => {
      child.toXML(parent, options);
    });
  }

  public getInstance(path: Path, noMatchHandler: NoMatchHandler = this.handleNoMatch) {
    const head = _.head(path);

    if (head && this.isTryingToMatchMe(path) && this.isMatch(path)) {
      if (!isSegmentWithValue(head)) {
        return this;
      } else {
        const match = this.children.find(child => child.rawValue === head.value);

        if (match) {
          return match;
        } else {
          noMatchHandler(this, path);
        }
      }
    }

    noMatchHandler(this, path);
  }

  public visit(visitor: Visitor) {
    visitor(this);

    this.children.forEach(child => {
      child.visit(visitor);
    });
  }
}

applyMixins(LeafListInstance, [Searchable]);
