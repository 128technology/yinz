import * as _ from 'lodash';
import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { Container, Leaf, LeafList, List } from '../model';
import { isElement, defineNamespaceOnRoot } from '../util/xmlUtil';

import { Searchable, WithAttributes } from './mixins';
import { ListJSON, LeafJSON, LeafListJSON, IContainerJSON, AddAttributes } from './types';
import {
  Path,
  Instance,
  ListInstance,
  LeafListInstance,
  Visitor,
  NoMatchHandler,
  Parent,
  XMLSerializationOptions,
  ShouldSkip
} from './';

export default class ContainerInstance implements Searchable, WithAttributes {
  public model: Container;
  public config: Element;
  public parent: Parent;
  public children: Map<string, Instance>;
  public activeChoices: Map<string, string>;

  public customAttributes: WithAttributes['customAttributes'];
  public parseAttributesFromXML: WithAttributes['parseAttributesFromXML'];
  public parseAttributesFromJSON: WithAttributes['parseAttributesFromJSON'];
  public hasAttributes: WithAttributes['hasAttributes'];
  public rawAttributes: WithAttributes['rawAttributes'];
  public addAttributes: WithAttributes['addAttributes'];
  public getValueFromJSON: WithAttributes['getValueFromJSON'];
  public getPath: Searchable['getPath'];
  public isTryingToMatchMe: Searchable['isTryingToMatchMe'];
  public isMatch: Searchable['isMatch'];
  public handleNoMatch: Searchable['handleNoMatch'];

  constructor(model: Container, config: Element | IContainerJSON, parent?: Parent) {
    this.model = model;
    this.parent = parent;
    this.children = new Map();
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

  public toJSON(camelCase = false, convert = true, shouldSkip?: ShouldSkip): IContainerJSON {
    const containerInner = [...this.children.values()].reduce(
      (acc, child) => Object.assign(acc, child.toJSON(camelCase, convert, shouldSkip)),
      {}
    );

    return {
      [this.model.getName(camelCase)]: containerInner
    };
  }

  public toXML(parent: Element, options: XMLSerializationOptions = { includeAttributes: false }) {
    const [prefix, href] = this.model.ns;
    const outer = parent.node(this.model.name);
    defineNamespaceOnRoot(parent, prefix, href);
    outer.namespace(prefix);

    if (options.includeAttributes && this.hasAttributes) {
      this.addAttributes(outer);
    }

    Array.from(this.children.values()).forEach(child => {
      child.toXML(outer, options);
    });
  }

  public getInstance(path: Path, noMatchHandler: NoMatchHandler = this.handleNoMatch): Instance {
    if (this.isTryingToMatchMe(path) && this.isMatch(path)) {
      return this;
    } else if (path.length > 1) {
      const tail = _.tail(path);
      const nextSegment = _.head(tail);

      if (this.children.has(nextSegment.name)) {
        return this.children.get(nextSegment.name).getInstance(tail, noMatchHandler);
      }
    }

    noMatchHandler(this, _.tail(path));
  }

  public visit(visitor: Visitor) {
    visitor(this);

    Array.from(this.children.values()).forEach(child => {
      child.visit(visitor);
    });
  }

  private injestConfigJSON(configJSON: IContainerJSON | AddAttributes<IContainerJSON>) {
    const config = this.getValueFromJSON(configJSON) as IContainerJSON;

    for (const rawChildName in config) {
      if (config.hasOwnProperty(rawChildName)) {
        const childName = this.model.hasChild(rawChildName) ? rawChildName : _.kebabCase(rawChildName);
        if (this.model.hasChild(childName)) {
          const child = config[rawChildName];
          const childModel = this.model.getChild(childName);

          // Note: This does not support nested choices
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

          this.children.set(childName, instance);
        }
      }
    }
  }

  private injestConfigXML(config: Element) {
    config
      .childNodes()
      .filter(isElement)
      .forEach(el => {
        const localName = el.name();

        if (this.model.hasChild(localName)) {
          if (this.children.has(localName)) {
            const child = this.children.get(localName);

            if (child instanceof ListInstance || child instanceof LeafListInstance) {
              child.add(el);
            }
          } else {
            const childModel = this.model.getChild(localName);

            // Note: This does not support nested choices
            if (childModel.choiceCase) {
              this.activeChoices.set(childModel.choiceCase.parentChoice.name, childModel.choiceCase.name);
            }

            this.children.set(localName, childModel.buildInstance(el, this));
          }
        }
      });
  }
}

applyMixins(ContainerInstance, [Searchable, WithAttributes]);
