import * as _ from 'lodash';
import { Element } from 'libxmljs2';

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
  ContainerJSON,
  Authorized,
  JSONMapper,
  MapToJSONOptions
} from './types';
import { Path, Instance, LeafInstance, ListInstance, LeafListInstance, LeafListChildInstance } from './';
import { allow, getDefaultMapper } from './util';

export type ChoiceName = string;
export type SelectedCaseName = string;
export type ChildName = string;

export interface IKeys {
  [keyName: string]: string;
}

export default class ListChildInstance implements Searchable, WithAttributes {
  public activeChoices: Map<ChoiceName, SelectedCaseName> = new Map();

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

  private instance: Map<ChildName, Instance> = new Map();
  private config?: Element;

  constructor(
    public model: List,
    config: Element | ListChildJSON,
    public parent: Parent,
    public listParent: ListInstance
  ) {
    if (config instanceof Element) {
      this.config = config;
      this.injestConfigXML(config);
      this.parseAttributesFromXML(config);
    } else {
      this.injestConfigJSON(config);
      this.parseAttributesFromJSON(config);
    }
  }

  public getConfig(authorized: Authorized) {
    if (authorized(this)) {
      return this.config;
    } else {
      throw new Error('Unauthorized');
    }
  }

  public setConfig(el: Element) {
    this.config = el;
  }

  public getChildren(authorized: Authorized) {
    const children: Map<string, Instance> = new Map();

    for (const [k, v] of this.instance) {
      if (authorized(v)) {
        children.set(k, v);
      }
    }

    return children;
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

  public get keyString() {
    let result = '';
    for (let i = 0, len = this.model.keyList.length; i < len; i++) {
      const keyName = this.model.keyList[i];
      const keyValue = (this.instance.get(keyName) as LeafInstance).getValue(allow)!;

      if (i === len - 1) {
        result += keyValue;
      } else {
        result += keyValue + ',';
      }
    }
    return result;
  }

  public get keys() {
    return this.model.keyList.reduce<IKeys>((acc, key) => {
      acc[key] = (this.instance.get(key) as LeafInstance).getValue(allow)!;
      return acc;
    }, {});
  }

  public getKeys(authorized: Authorized) {
    return this.model.keyList.reduce<IKeys>((acc, key) => {
      acc[key] = (this.instance.get(key) as LeafInstance).getValue(authorized)!;
      return acc;
    }, {});
  }

  public injestConfigJSON(configJSON: ListChildJSON) {
    const config = this.getValueFromJSON(configJSON) as ListChildJSONValue;

    // tslint:disable-next-line:forin
    for (const rawChildName in config) {
      const child = config[rawChildName];
      const childModel = this.model.getChild(rawChildName);
      if (!_.isNil(child) && childModel) {
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

        this.instance.set(childModel.name, instance);
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
            const childModel = this.model.getChild(localName)!;

            if (childModel.choiceCase) {
              this.activeChoices.set(childModel.choiceCase.parentChoice.name, childModel.choiceCase.name);
            }

            this.instance.set(localName, childModel.buildInstance(el, this));
          }
        }
      });
  }

  public toJSON(
    authorized: Authorized,
    camelCase = false,
    convert = true,
    shouldSkip?: ShouldSkip
  ): ListChildJSONValue {
    return [...this.instance.values()]
      .map(field =>
        field instanceof LeafInstance || field instanceof LeafListInstance
          ? field.toJSON(authorized, camelCase, convert)
          : field.toJSON(authorized, camelCase, convert, shouldSkip)
      )
      .filter(item => !_.isEmpty(item))
      .reduce((acc, field) => Object.assign(acc, field), {});
  }

  public mapToJSON(
    authorized: Authorized,
    map: JSONMapper = getDefaultMapper(authorized),
    options: MapToJSONOptions = { overrideOnKeyMap: false }
  ) {
    const inner = {};
    let shouldMapSelf = false;

    for (const child of this.instance.values()) {
      const mappedChild = child.mapToJSON(authorized, map, options);

      if (options.overrideOnKeyMap && _.size(mappedChild) > 0 && child instanceof LeafInstance && child.model.isKey) {
        shouldMapSelf = true;
        break;
      }

      Object.assign(inner, mappedChild);
    }

    if (shouldMapSelf) {
      const result = map(this);
      if (!_.isArray(result)) {
        throw new Error('Must map a list child to an array of list children.');
      }

      return result;
    } else {
      return _.size(inner) > 0 ? [Object.assign(this.getKeys(authorized), inner)] : null;
    }
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
  ): Instance | LeafListChildInstance | undefined {
    if (path.length === 0) {
      return this;
    } else {
      const nextSegment = _.head(path);
      if (nextSegment && this.instance.has(nextSegment.name)) {
        return this.instance.get(nextSegment.name)!.getInstance(path, noMatchHandler);
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
