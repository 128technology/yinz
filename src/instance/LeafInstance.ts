import { Element } from 'libxmljs';
import * as _ from 'lodash';

import applyMixins from '../util/applyMixins';
import { Leaf } from '../model';
import { defineNamespaceOnRoot } from '../util/xmlUtil';

import { Searchable, WithAttributes } from './mixins';
import {
  LeafJSON,
  XMLSerializationOptions,
  Visitor,
  NoMatchHandler,
  Parent,
  LeafJSONValue,
  Authorized,
  JSONMapper,
  MapToJSONOptions
} from './types';
import { getDefaultMapper } from './util';
import { Path } from './';

export default class LeafInstance implements Searchable, WithAttributes {
  public model: Leaf;
  public parent: Parent;

  public customAttributes: WithAttributes['customAttributes'];
  public parseAttributesFromXML: WithAttributes['parseAttributesFromXML'];
  public parseAttributesFromJSON: WithAttributes['parseAttributesFromJSON'];
  public hasAttributes: WithAttributes['hasAttributes'];
  public rawAttributes: WithAttributes['rawAttributes'];
  public addAttributes: WithAttributes['addAttributes'];
  public getValueFromJSON: WithAttributes['getValueFromJSON'];
  public addOperation: WithAttributes['addOperation'];
  public addPosition: WithAttributes['addPosition'];

  public getPath: Searchable['getPath'];
  public isTryingToMatchMe: Searchable['isTryingToMatchMe'];
  public isMatch: Searchable['isMatch'];
  public handleNoMatch: Searchable['handleNoMatch'];

  private config: Element;
  private value: string | null;

  constructor(model: Leaf, config: Element | LeafJSON, parent: Parent) {
    this.model = model;
    this.parent = parent;

    if (config instanceof Element) {
      this.config = config;
      this.injestConfigXML(config);
      this.parseAttributesFromXML(config);
    } else {
      this.injestConfigJSON(config);
      this.parseAttributesFromJSON(config);
    }
  }

  public getConfig(authorized: Authorized) {
    if (authorized(this)) {
      return this.config;
    } else {
      throw new Error('Unauthorized');
    }
  }

  public setConfig(el: Element) {
    this.config = el;
  }

  public getValue(authorized: Authorized) {
    return authorized(this) ? this.value : null;
  }

  public getConvertedValue(authorized: Authorized) {
    if (!authorized(this)) {
      return null;
    }

    return this.value ? this.model.type.serialize(this.value) : null;
  }

  public toJSON(authorized: Authorized, camelCase = false, convert = true): { [name: string]: LeafJSONValue } {
    if (!authorized(this)) {
      return {};
    }

    return {
      [this.model.getName(camelCase)]: convert ? this.getConvertedValue(authorized) : this.getValue(authorized)
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
    const el = parent.node(this.model.name, this.value || undefined);
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

  private injestConfigJSON(configJSON: LeafJSON) {
    const config = this.getValueFromJSON(configJSON) as LeafJSONValue;
    this.value = config === null ? null : config.toString();
  }

  private injestConfigXML(config: Element) {
    const text = config.text();
    this.value = _.isNil(text) ? null : text;
  }
}

applyMixins(LeafInstance, [Searchable, WithAttributes]);
