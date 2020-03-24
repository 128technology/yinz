import { Element } from 'libxmljs';
import * as _ from 'lodash';

import applyMixins from '../util/applyMixins';
import { LeafList } from '../model';
import { defineNamespaceOnRoot } from '../util/xmlUtil';

import { Searchable } from './mixins';
import { Path, Visitor, LeafListChildInstance, LeafJSON, NoMatchHandler, Parent, XMLSerializationOptions } from './';

export type LeafListJSON = LeafJSON[];

export default class LeafListInstance implements Searchable {
  public model: LeafList;
  public parent: Parent;
  public children: LeafListChildInstance[];

  public getPath: Searchable['getPath'];
  public isTryingToMatchMe: Searchable['isTryingToMatchMe'];
  public isMatch: Searchable['isMatch'];
  public handleNoMatch: Searchable['handleNoMatch'];

  constructor(model: LeafList, config: Element | LeafListJSON, parent?: Parent) {
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

  public toJSON(camelCase = false, convert = true): { [name: string]: LeafListJSON } {
    return {
      [this.model.getName(camelCase)]: convert ? this.values : this.rawValues
    };
  }

  public toXML(parent: Element, options: XMLSerializationOptions = { includeAttributes: false }) {
    const [prefix, href] = this.model.ns;
    defineNamespaceOnRoot(parent, prefix, href);
    this.children.forEach(child => {
      child.toXML(parent, options);
    });
  }

  public getInstance(path: Path, noMatchHandler: NoMatchHandler = this.handleNoMatch) {
    if (this.isTryingToMatchMe(path) && this.isMatch(path)) {
      return this;
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
