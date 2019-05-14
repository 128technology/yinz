import * as _ from 'lodash';
import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { List, Leaf, Container, LeafList } from '../model';
import { isElement, defineNamespaceOnRoot } from '../util/xmlUtil';

import { Searchable, WithAttributes } from './mixins';
import {
  Path,
  Instance,
  LeafInstance,
  ListInstance,
  LeafListInstance,
  Visitor,
  LeafJSON,
  ListJSON,
  LeafListJSON,
  IContainerJSON,
  NoMatchHandler,
  Parent
} from './';

export type ChoiceName = string;
export type SelectedCaseName = string;
export type ChildName = string;

export interface IKeys {
  [keyName: string]: string;
}
export interface IListChildJSON {
  [childName: string]: LeafJSON | LeafListJSON | ListJSON | IContainerJSON;
}

export default class ListChildInstance implements Searchable, WithAttributes {
  public model: List;
  public config: Element;
  public parent: Parent;
  public instance: Map<ChildName, Instance>;
  public activeChoices: Map<ChoiceName, SelectedCaseName>;

  public customAttributes: Map<string, string>;
  public getPath: () => Path;
  public isTryingToMatchMe: (path: Path) => boolean;
  public isMatch: (path: Path) => boolean;
  public handleNoMatch: () => void;

  constructor(model: List, config: Element | IListChildJSON, parent: Parent) {
    this.model = model;
    this.parent = parent;
    this.instance = new Map();
    this.activeChoices = new Map();

    if (config instanceof Element) {
      this.config = config;
      this.injestConfigXML(config);
    } else {
      this.injestConfigJSON(config);
    }
  }

  public get keys() {
    return Array.from(this.model.keys.values()).reduce((acc: IKeys, key) => {
      acc[key] = (this.instance.get(key) as LeafInstance).value;
      return acc;
    }, {});
  }

  public injestConfigJSON(config: IListChildJSON) {
    for (const childName in config) {
      if (this.model.hasChild(childName)) {
        const child = config[childName];
        const childModel = this.model.getChild(childName);

        if (childModel.choiceCase) {
          this.activeChoices.set(childModel.choiceCase.parentChoice.name, childModel.choiceCase.name);
        }

        let instance: Instance;

        if (childModel instanceof Leaf) {
          instance = childModel.buildInstance(child as LeafJSON, this);
        } else if (childModel instanceof LeafList) {
          instance = childModel.buildInstance(child as LeafListJSON, this);
        } else if (childModel instanceof Container) {
          instance = childModel.buildInstance(child as IContainerJSON, this);
        } else if (childModel instanceof List) {
          instance = childModel.buildInstance(child as ListJSON, this);
        } else {
          throw new Error(`Unknown child of type ${typeof childModel} encountered.`);
        }

        this.instance.set(childName, instance);
      }
    }
  }

  public injestConfigXML(config: Element) {
    config
      .childNodes()
      .filter(isElement)
      .forEach(el => {
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

  public toJSON(camelCase = false, convert = true): IListChildJSON {
    return [...this.instance.values()]
      .map(field => field.toJSON(camelCase, convert))
      .reduce((acc, field) => Object.assign(acc, field), {});
  }

  public toXML(parent: Element) {
    const [prefix, href] = this.model.ns;
    defineNamespaceOnRoot(parent, prefix, href);
    const outer = parent.node(this.model.name);
    outer.namespace(prefix);

    Array.from(this.instance.values()).forEach(child => {
      child.toXML(outer);
    });
  }

  public getInstance(path: Path, noMatchHandler: NoMatchHandler = this.handleNoMatch): Instance {
    if (path.length === 0) {
      return this;
    } else {
      const nextSegment = _.head(path);
      if (this.instance.has(nextSegment.name)) {
        return this.instance.get(nextSegment.name).getInstance(path, noMatchHandler);
      }
    }

    noMatchHandler(this, path);
  }

  public visit(visitor: Visitor) {
    visitor(this);

    Array.from(this.instance.values()).forEach(child => {
      child.visit(visitor);
    });
  }
}

applyMixins(ListChildInstance, [Searchable, WithAttributes]);
