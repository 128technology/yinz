import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { Leaf } from '../model';

import Searchable from './mixins/Searchable';
import { Path, Instance } from './';

export default class LeafInstance implements Searchable {
  public model: Leaf;
  public config: Element;
  public parent: Instance;
  public value: string;

  public getPath: () => Path;
  public isTryingToMatchMe: (path: Path) => boolean;
  public isMatch: (path: Path) => boolean;
  public handleNoMatch: () => void;

  constructor(model: Leaf, config: Element, parent?: Instance) {
    this.model = model;
    this.config = config;
    this.parent = parent;
    this.value = null;

    this.injestConfig(config);
  }

  public getConvertedValue() {
    return this.model.type.serialize(this.value);
  }

  public toJSON(camelCase = false): object {
    return {
      [this.model.getName(camelCase)]: this.getConvertedValue()
    };
  }

  public getInstance(path: Path) {
    if (this.isTryingToMatchMe(path) && this.isMatch(path)) {
      return this;
    }

    this.handleNoMatch();
  }

  private injestConfig(config: Element) {
    this.value = config.text();
  }
}

applyMixins(LeafInstance, [Searchable]);
