import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { LeafList } from '../model';

import Searchable from './mixins/Searchable';
import { Path, Instance } from './';

export default class LeafListInstance implements Searchable {
  public model: LeafList;
  public config: Element;
  public parent: Instance;
  public values: string[];

  public getPath: () => Path;
  public isTryingToMatchMe: (path: Path) => boolean;
  public isMatch: (path: Path) => boolean;
  public handleNoMatch: () => void;

  constructor(model: LeafList, config: Element, parent?: Instance) {
    this.model = model;
    this.config = config;
    this.parent = parent;
    this.values = [];

    this.add(config);
  }

  public add(config: Element) {
    this.values.push(config.text());
  }

  public getConvertedValues() {
    return this.values.map(value => this.model.type.serialize(value));
  }

  public toJSON(camelCase = false): object {
    return {
      [this.model.getName(camelCase)]: this.getConvertedValues()
    };
  }

  public getInstance(path: Path) {
    if (this.isTryingToMatchMe(path) && this.isMatch(path)) {
      return this;
    }

    this.handleNoMatch();
  }
}

applyMixins(LeafListInstance, [Searchable]);
