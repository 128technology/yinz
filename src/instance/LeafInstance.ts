import { Element } from 'libxmljs';
import * as _ from 'lodash';

import applyMixins from '../util/applyMixins';
import { Leaf } from '../model';
import { defineNamespaceOnRoot } from '../util/xmlUtil';

import { Searchable, WithAttributes } from './mixins';
import { Path, Parent, Visitor, NoMatchHandler } from './';

export type LeafJSON = string | number | boolean;

export default class LeafInstance implements Searchable, WithAttributes {
  public model: Leaf;
  public config: Element;
  public parent: Parent;
  public value: string;

  public customAttributes: Map<string, string>;
  public getPath: () => Path;
  public isTryingToMatchMe: (path: Path) => boolean;
  public isMatch: (path: Path) => boolean;
  public handleNoMatch: () => void;

  constructor(model: Leaf, config: Element | LeafJSON, parent?: Parent) {
    this.model = model;
    this.parent = parent;
    this.value = null;

    if (config instanceof Element) {
      this.config = config;
      this.injestConfigXML(config);
    } else {
      this.injestConfigJSON(config);
    }
  }

  public getConvertedValue() {
    return this.model.type.serialize(this.value);
  }

  public toJSON(camelCase = false, convert = true): { [name: string]: LeafJSON } {
    return {
      [this.model.getName(camelCase)]: convert ? this.getConvertedValue() : this.value
    };
  }

  public toXML(parent: Element) {
    const [prefix, href] = this.model.ns;
    defineNamespaceOnRoot(parent, prefix, href);
    parent.node(this.model.name, this.value).namespace(prefix);
  }

  public getInstance(path: Path, noMatchHandler: NoMatchHandler = this.handleNoMatch) {
    if (this.isTryingToMatchMe(path) && this.isMatch(path)) {
      return this;
    }

    noMatchHandler(this, path);
  }

  public visit(visitor: Visitor) {
    visitor(this);
  }

  private injestConfigJSON(config: LeafJSON) {
    this.value = config.toString();
  }

  private injestConfigXML(config: Element) {
    this.value = config.text();
  }
}

applyMixins(LeafInstance, [Searchable, WithAttributes]);
