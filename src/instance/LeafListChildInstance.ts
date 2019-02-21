import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { LeafList } from '../model';

import { WithAttributes } from './mixins';
import { Visitor, Path, LeafListInstance, LeafJSON } from './';

export default class LeafListChildInstance implements WithAttributes {
  public model: LeafList;
  public config: Element;
  public parent: LeafListInstance;
  public rawValue: string;

  public customAttributes: Map<string, string>;

  constructor(model: LeafList, config: Element | LeafJSON, parent?: LeafListInstance) {
    this.model = model;
    this.parent = parent;

    if (config instanceof Element) {
      this.config = config;
      this.injestConfigXML(config);
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

  public getPath(): Path {
    return this.parent.getPath();
  }

  public visit(visitor: Visitor) {
    visitor(this);
  }
}

applyMixins(LeafListChildInstance, [WithAttributes]);
