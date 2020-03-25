import { Element } from 'libxmljs';
import * as _ from 'lodash';

import applyMixins from '../util/applyMixins';
import { Leaf } from '../model';
import { defineNamespaceOnRoot } from '../util/xmlUtil';

import { Searchable, WithAttributes } from './mixins';
import { LeafJSON, AddAttributes } from './types';
import { Path, Parent, Visitor, NoMatchHandler, XMLSerializationOptions } from './';

export default class LeafInstance implements Searchable, WithAttributes {
  public model: Leaf;
  public config: Element;
  public parent: Parent;
  public value: string;

  public customAttributes: WithAttributes['customAttributes'];
  public parseAttributesFromXML: WithAttributes['parseAttributesFromXML'];
  public parseAttributesFromJSON: WithAttributes['parseAttributesFromJSON'];
  public hasAttributes: WithAttributes['hasAttributes'];
  public rawAttributes: WithAttributes['rawAttributes'];
  public addAttributes: WithAttributes['addAttributes'];
  public getValueFromJSON: WithAttributes['getValueFromJSON'];
  public getPath: Searchable['getPath'];
  public isTryingToMatchMe: Searchable['isTryingToMatchMe'];
  public isMatch: Searchable['isMatch'];
  public handleNoMatch: Searchable['handleNoMatch'];

  constructor(model: Leaf, config: Element | LeafJSON, parent?: Parent) {
    this.model = model;
    this.parent = parent;
    this.value = null;

    if (config instanceof Element) {
      this.config = config;
      this.injestConfigXML(config);
      this.parseAttributesFromXML(config);
    } else {
      this.injestConfigJSON(config);
      this.parseAttributesFromJSON(config);
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

  public toXML(parent: Element, options: XMLSerializationOptions = { includeAttributes: false }) {
    const [prefix, href] = this.model.ns;
    defineNamespaceOnRoot(parent, prefix, href);
    const el = parent.node(this.model.name, this.value);
    el.namespace(prefix);

    if (options.includeAttributes && this.hasAttributes) {
      this.addAttributes(el);
    }
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

  private injestConfigJSON(configJSON: LeafJSON | AddAttributes<LeafJSON>) {
    const config = this.getValueFromJSON(configJSON) as LeafJSON;
    this.value = config.toString();
  }

  private injestConfigXML(config: Element) {
    this.value = config.text();
  }
}

applyMixins(LeafInstance, [Searchable, WithAttributes]);
