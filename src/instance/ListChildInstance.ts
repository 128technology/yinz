import * as _ from 'lodash';
import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { List, Leaf, Container, LeafList } from '../model';
import { isElement, defineNamespaceOnRoot } from '../util/xmlUtil';

import { Searchable, WithAttributes } from './mixins';
import {
  ListJSON,
  ListChildJSON,
  LeafJSON,
  LeafListJSON,
  XMLSerializationOptions,
  Visitor,
  NoMatchHandler,
  Parent,
  ShouldSkip,
  ListChildJSONValue,
  ContainerJSON
} from './types';
import { Path, Instance, LeafInstance, ListInstance, LeafListInstance, LeafListChildInstance } from './';

export type ChoiceName = string;
export type SelectedCaseName = string;
export type ChildName = string;

export interface IKeys {
  [keyName: string]: string;
}

export default class ListChildInstance implements Searchable, WithAttributes {
  public model: List;
  public config: Element;
  public parent: Parent;
  public listParent: ListInstance;
  public instance: Map<ChildName, Instance>;
  public activeChoices: Map<ChoiceName, SelectedCaseName>;

  public customAttributes: WithAttributes['customAttributes'];
  public parseAttributesFromXML: WithAttributes['parseAttributesFromXML'];
  public parseAttributesFromJSON: WithAttributes['parseAttributesFromJSON'];
  public hasAttributes: WithAttributes['hasAttributes'];
  public rawAttributes: WithAttributes['rawAttributes'];
  public addAttributes: WithAttributes['addAttributes'];
  public getValueFromJSON: WithAttributes['getValueFromJSON'];
  public addOperation: WithAttributes['addOperation'];
  public addPosition: WithAttributes['addPosition'];

  public getPath: Searchable['getPath'];
  public isTryingToMatchMe: Searchable['isTryingToMatchMe'];
  public isMatch: Searchable['isMatch'];
  public handleNoMatch: Searchable['handleNoMatch'];

  constructor(model: List, config: Element | ListChildJSON, parent: Parent, listParent: ListInstance) {
    this.model = model;
    this.parent = parent;
    this.listParent = listParent;
    this.instance = new Map();
    this.activeChoices = new Map();

    if (config instanceof Element) {
      this.config = config;
      this.injestConfigXML(config);
      this.parseAttributesFromXML(config);
    } else {
      this.injestConfigJSON(config);
      this.parseAttributesFromJSON(config);
    }
  }

  public delete(childName: string) {
    const child = this.instance.get(childName);

    if (!child) {
      throw new Error(`Cannot delete ${childName}, it was not found on ${this.model.name}.`);
    } else if (this.model.keys.has(child.model.name)) {
      throw new Error(`Cannot delete key ${childName}.`);
    }

    this.instance.delete(childName);
  }

  public get keys() {
    return Array.from(this.model.keys.values()).reduce((acc: IKeys, key) => {
      acc[key] = (this.instance.get(key) as LeafInstance).value;
      return acc;
    }, {});
  }

  public injestConfigJSON(configJSON: ListChildJSON) {
    const config = this.getValueFromJSON(configJSON) as ListChildJSONValue;

    for (const rawChildName in config) {
      if (config.hasOwnProperty(rawChildName)) {
        const childName = this.model.hasChild(rawChildName) ? rawChildName : _.kebabCase(rawChildName);
        if (this.model.hasChild(childName)) {
          const child = config[rawChildName];
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
            instance = childModel.buildInstance(child as ContainerJSON, this);
          } else if (childModel instanceof List) {
            instance = childModel.buildInstance(child as ListJSON, this);
          } else {
            throw new Error(`Unknown child of type ${typeof childModel} encountered.`);
          }

          this.instance.set(childName, instance);
        }
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

  public toJSON(camelCase = false, convert = true, shouldSkip?: ShouldSkip): ListChildJSONValue {
    return [...this.instance.values()]
      .map(field =>
        field instanceof LeafInstance || field instanceof LeafListInstance
          ? field.toJSON(camelCase, convert)
          : field.toJSON(camelCase, convert, shouldSkip)
      )
      .reduce((acc, field) => Object.assign(acc, field), {});
  }

  public toXML(parent: Element, options: XMLSerializationOptions = { includeAttributes: false }) {
    const [prefix, href] = this.model.ns;
    defineNamespaceOnRoot(parent, prefix, href);
    const outer = parent.node(this.model.name);
    outer.namespace(prefix);

    if (options.includeAttributes && this.hasAttributes) {
      this.addAttributes(outer);
    }

    Array.from(this.instance.values()).forEach(child => {
      child.toXML(outer, options);
    });
  }

  public getInstance(
    path: Path,
    noMatchHandler: NoMatchHandler = this.handleNoMatch
  ): Instance | LeafListChildInstance {
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
