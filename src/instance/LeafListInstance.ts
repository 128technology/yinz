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
  Authorized,
  JSONMapper,
  MapToJSONOptions
} from './types';
import Path, { isSegmentWithValue } from './Path';
import { getDefaultMapper } from './util';
import { LeafListChildInstance } from './';
import { allow } from './util';

export default class LeafListInstance implements Searchable {
  public model: LeafList;
  public parent: Parent;

  public getPath: Searchable['getPath'];
  public isTryingToMatchMe: Searchable['isTryingToMatchMe'];
  public isMatch: Searchable['isMatch'];
  public handleNoMatch: Searchable['handleNoMatch'];

  private children: LeafListChildInstance[];

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

  public getChildren(authorized: Authorized) {
    return authorized(this) ? this.children : [];
  }

  public getValues(authorized: Authorized) {
    return this.children.filter(child => authorized(child)).map(child => child.value);
  }

  public getRawValues(authorized: Authorized) {
    return this.children.map(child => child.getRawValue(authorized));
  }

  public add(config: Element | LeafJSON) {
    this.children.push(new LeafListChildInstance(this.model, config, this));
  }

  public toJSON(authorized: Authorized, camelCase = false, convert = true): { [name: string]: LeafListJSONValue } {
    if (!authorized(this)) {
      return {};
    }

    return {
      [this.model.getName(camelCase)]: convert ? this.getValues(authorized) : this.getRawValues(authorized)
    };
  }

  public mapToJSON(
    authorized: Authorized,
    map: JSONMapper = getDefaultMapper(authorized),
    options: MapToJSONOptions = { overrideOnKeyMap: false }
  ) {
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
        const match = this.children.find(child => child.getRawValue(allow) === head.value);

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
