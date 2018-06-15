import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { LeafList } from '../model';

import { Searchable } from './mixins';
import { Path, Instance, Visitor, LeafListChildInstance } from './';

export default class LeafListInstance implements Searchable {
  public model: LeafList;
  public parent: Instance;
  public children: LeafListChildInstance[];

  public getPath: () => Path;
  public isTryingToMatchMe: (path: Path) => boolean;
  public isMatch: (path: Path) => boolean;
  public handleNoMatch: () => void;

  constructor(model: LeafList, config: Element, parent?: Instance) {
    this.model = model;
    this.parent = parent;
    this.children = [];

    this.add(config);
  }

  public add(config: Element) {
    this.children.push(new LeafListChildInstance(this.model, config, this));
  }

  public get values() {
    return this.children.map(child => child.value);
  }

  public toJSON(camelCase = false): object {
    return {
      [this.model.getName(camelCase)]: this.values
    };
  }

  public getInstance(path: Path) {
    if (this.isTryingToMatchMe(path) && this.isMatch(path)) {
      return this;
    }

    this.handleNoMatch();
  }

  public visit(visitor: Visitor) {
    visitor(this);

    this.children.forEach(child => {
      child.visit(visitor);
    });
  }
}

applyMixins(LeafListInstance, [Searchable]);
