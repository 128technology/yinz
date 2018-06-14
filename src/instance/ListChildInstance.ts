import * as _ from 'lodash';
import * as Lazy from 'lazy.js';
import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { List } from '../model';

import { Searchable, WithAttributes } from './mixins';
import { Path, Instance, LeafInstance, ListInstance, LeafListInstance } from './';

export type ChoiceName = string;
export type SelectedCaseName = string;
export type ChildName = string;

export interface IKeys {
  [keyName: string]: string;
}

export default class ListChildInstance implements Searchable, WithAttributes {
  public model: List;
  public config: Element;
  public parent: Instance;
  public instance: Map<ChildName, Instance>;
  public activeChoices: Map<ChoiceName, SelectedCaseName>;

  public customAttributes: Map<string, string>;
  public getPath: () => Path;
  public isTryingToMatchMe: (path: Path) => boolean;
  public isMatch: (path: Path) => boolean;
  public handleNoMatch: () => void;

  constructor(model: List, config: Element, parent: Instance) {
    this.model = model;
    this.config = config;
    this.parent = parent;
    this.instance = new Map();
    this.activeChoices = new Map();

    this.injestConfig(config);
  }

  public get keys() {
    return Array.from(this.model.keys.values()).reduce((acc: IKeys, key) => {
      acc[key] = (this.instance.get(key) as LeafInstance).value;
      return acc;
    }, {});
  }

  public injestConfig(config: Element) {
    Lazy(config.childNodes())
      .filter(node => node.type() === 'element')
      .each(el => {
        const localName = el.name();

        if (this.model.hasChild(localName)) {
          if (this.instance.has(localName)) {
            const child = this.instance.get(localName);

            if (child instanceof ListInstance || child instanceof LeafListInstance) {
              child.add(el);
            }
          } else {
            const childModel = this.model.getChild(localName);

            if (childModel.choiceCase) {
              this.activeChoices.set(childModel.choiceCase.parentChoice.name, childModel.choiceCase.name);
            }

            this.instance.set(localName, childModel.buildInstance(el, this));
          }
        }
      });
  }

  public toJSON(camelCase = false): object {
    return [...this.instance.values()]
      .map(field => field.toJSON(camelCase))
      .reduce((acc, field) => Object.assign(acc, field), {});
  }

  public getInstance(path: Path): Instance {
    if (path.length === 0) {
      return this;
    } else {
      const nextSegment = _.head(path);
      if (this.instance.has(nextSegment.name)) {
        return this.instance.get(nextSegment.name).getInstance(path);
      }
    }

    this.handleNoMatch();
  }
}

applyMixins(ListChildInstance, [Searchable, WithAttributes]);
