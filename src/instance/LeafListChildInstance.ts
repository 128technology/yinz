import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { LeafList } from '../model';

import { WithAttributes } from './mixins';
import { Instance, Visitor, Path, LeafListInstance } from './';

export default class LeafListChildInstance implements WithAttributes {
  public model: LeafList;
  public config: Element;
  public parent: LeafListInstance;
  public rawValue: string;

  public customAttributes: Map<string, string>;

  constructor(model: LeafList, config: Element, parent?: LeafListInstance) {
    this.model = model;
    this.config = config;
    this.parent = parent;

    this.injestConfig(config);
  }

  public get value() {
    return this.model.type.serialize(this.rawValue);
  }

  public injestConfig(config: Element) {
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
