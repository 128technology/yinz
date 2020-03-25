import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { LeafList } from '../model';

import { WithAttributes } from './mixins';
import { AddAttributes, LeafJSON } from './types';
import { Visitor, Path, LeafListInstance, XMLSerializationOptions } from './';

export default class LeafListChildInstance implements WithAttributes {
  public model: LeafList;
  public config: Element;
  public parent: LeafListInstance;
  public rawValue: string;

  public customAttributes: WithAttributes['customAttributes'];
  public parseAttributesFromXML: WithAttributes['parseAttributesFromXML'];
  public parseAttributesFromJSON: WithAttributes['parseAttributesFromJSON'];
  public hasAttributes: WithAttributes['hasAttributes'];
  public rawAttributes: WithAttributes['rawAttributes'];
  public addAttributes: WithAttributes['addAttributes'];
  public getValueFromJSON: WithAttributes['getValueFromJSON'];

  constructor(model: LeafList, config: Element | LeafJSON, parent?: LeafListInstance) {
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

  public get value() {
    return this.model.type.serialize(this.rawValue);
  }

  private injestConfigJSON(configJSON: LeafJSON | AddAttributes<LeafJSON>) {
    const config = this.getValueFromJSON(configJSON) as LeafJSON;
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
