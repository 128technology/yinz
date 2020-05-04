import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { LeafList } from '../model';

import { WithAttributes } from './mixins';
import { LeafJSON, Visitor, XMLSerializationOptions, Authorized } from './types';
import { Path, LeafListInstance } from './';

export default class LeafListChildInstance implements WithAttributes {
  private config: Element;
  private rawValue: string;

  public model: LeafList;
  public parent: LeafListInstance;

  public customAttributes: WithAttributes['customAttributes'];
  public parseAttributesFromXML: WithAttributes['parseAttributesFromXML'];
  public parseAttributesFromJSON: WithAttributes['parseAttributesFromJSON'];
  public hasAttributes: WithAttributes['hasAttributes'];
  public rawAttributes: WithAttributes['rawAttributes'];
  public addAttributes: WithAttributes['addAttributes'];
  public getValueFromJSON: WithAttributes['getValueFromJSON'];
  public addOperation: WithAttributes['addOperation'];
  public addPosition: WithAttributes['addPosition'];

  constructor(model: LeafList, config: Element | LeafJSON, parent: LeafListInstance) {
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

  public getRawValue(authorized: Authorized) {
    return authorized(this) ? this.rawValue : null;
  }

  public get value() {
    return this.model.type.serialize(this.rawValue);
  }

  public injestConfigJSON(configJSON: LeafJSON) {
    const config = this.getValueFromJSON(configJSON) as string | number | boolean;
    this.rawValue = config.toString();
  }

  public injestConfigXML(config: Element) {
    this.rawValue = config.text();
  }

  public toXML(parent: Element, options: XMLSerializationOptions = { includeAttributes: false }) {
    const [prefix] = this.model.ns;
    const el = parent.node(this.model.name, this.rawValue);
    el.namespace(prefix);

    if (options.includeAttributes && this.hasAttributes) {
      this.addAttributes(el);
    }
  }

  public getPath(): Path {
    return this.parent.getPath();
  }

  public visit(visitor: Visitor) {
    visitor(this);
  }
}

applyMixins(LeafListChildInstance, [WithAttributes]);
