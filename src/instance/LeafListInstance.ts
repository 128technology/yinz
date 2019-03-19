import { Element } from 'libxmljs';
import * as _ from 'lodash';

import applyMixins from '../util/applyMixins';
import { LeafList } from '../model';
import { defineNamespaceOnRoot } from '../util/xmlUtil';

import { Searchable } from './mixins';
import { Path, Visitor, LeafListChildInstance, LeafJSON, NoMatchHandler, Parent } from './';

export type LeafListJSON = LeafJSON[];

export default class LeafListInstance implements Searchable {
  public model: LeafList;
  public parent: Parent;
  public children: LeafListChildInstance[];

  public getPath: () => Path;
  public isTryingToMatchMe: (path: Path) => boolean;
  public isMatch: (path: Path) => boolean;
  public handleNoMatch: () => void;

  constructor(model: LeafList, config: Element | LeafListJSON, parent?: Parent) {
    this.model = model;
    this.parent = parent;
    this.children = [];

    if (config instanceof Element) {
      this.add(config);
    } else {
      config.forEach(child => {
        this.add(child);
      });
    }
  }

  public add(config: Element | LeafJSON) {
    this.children.push(new LeafListChildInstance(this.model, config, this));
  }

  public get values() {
    return this.children.map(child => child.value);
  }

  public toJSON(camelCase = false): { [name: string]: LeafListJSON } {
    return {
      [this.model.getName(camelCase)]: this.values
    };
  }

  public toXML(parent: Element) {
    const [prefix, href] = this.model.ns;
    defineNamespaceOnRoot(parent, prefix, href);
    this.values.forEach(value => {
      parent.node(this.model.name, value.toString()).namespace(prefix);
    });
  }

  public getInstance(path: Path, noMatchHandler: NoMatchHandler = this.handleNoMatch) {
    if (this.isTryingToMatchMe(path) && this.isMatch(path)) {
      return this;
    }

    noMatchHandler(this, path);
  }

  public visit(visitor: Visitor) {
    visitor(this);

    this.children.forEach(child => {
      child.visit(visitor);
    });
  }
}

applyMixins(LeafListInstance, [Searchable]);
