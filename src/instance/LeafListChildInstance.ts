import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { LeafList } from '../model';

import { WithAttributes } from './mixins';
import { Visitor, Path, LeafListInstance, LeafJSON, XMLSerializationOptions } from './';

export default class LeafListChildInstance implements WithAttributes {
  public model: LeafList;
  public config: Element;
  public parent: LeafListInstance;
  public rawValue: string;

  public customAttributes: WithAttributes['customAttributes'];
  public parseCustomAttributes: WithAttributes['parseCustomAttributes'];
  public hasCustomAttributes: WithAttributes['hasCustomAttributes'];
  public customAttributesContainer: WithAttributes['customAttributesContainer'];
  public addCustomAttributes: WithAttributes['addCustomAttributes'];

  constructor(model: LeafList, config: Element | LeafJSON, parent?: LeafListInstance) {
    this.model = model;
    this.parent = parent;

    if (config instanceof Element) {
      this.config = config;
      this.injestConfigXML(config);
      this.parseCustomAttributes(config);
    } else {
      this.injestConfigJSON(config);
    }
  }

  public get value() {
    return this.model.type.serialize(this.rawValue);
  }

  public injestConfigJSON(config: LeafJSON) {
    this.rawValue = config.toString();
  }

  public injestConfigXML(config: Element) {
    this.rawValue = config.text();
  }

  public toXML(parent: Element, options: XMLSerializationOptions = { includeAttributes: false }) {
    const [prefix] = this.model.ns;
    const el = parent.node(this.model.name, this.rawValue);
    el.namespace(prefix);

    if (options.includeAttributes && this.hasCustomAttributes) {
      this.addCustomAttributes(el);
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
