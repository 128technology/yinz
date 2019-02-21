import { Element } from 'libxmljs';
import * as _ from 'lodash';

import applyMixins from '../util/applyMixins';
import { Leaf } from '../model';
import { defineNamespaceOnRoot } from '../util/xmlUtil';

import { Searchable, WithAttributes } from './mixins';
import { Path, Instance, Visitor } from './';

export type LeafJSON = string | number | boolean;

export default class LeafInstance implements Searchable, WithAttributes {
  public model: Leaf;
  public config: Element;
  public parent: Instance;
  public value: string;

  public customAttributes: Map<string, string>;
  public getPath: () => Path;
  public isTryingToMatchMe: (path: Path) => boolean;
  public isMatch: (path: Path) => boolean;
  public handleNoMatch: () => void;

  constructor(model: Leaf, config: Element | LeafJSON, parent?: Instance) {
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

  public toJSON(camelCase = false): { [name: string]: LeafJSON } {
    return {
      [this.model.getName(camelCase)]: this.getConvertedValue()
    };
  }

  public toXML(parent: Element) {
    const [prefix, href] = this.model.ns;
    defineNamespaceOnRoot(parent, prefix, href);
    parent.node(this.model.name, this.value).namespace(prefix);
  }

  public getInstance(path: Path) {
    if (this.isTryingToMatchMe(path) && this.isMatch(path)) {
      return this;
    }

    this.handleNoMatch();
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
