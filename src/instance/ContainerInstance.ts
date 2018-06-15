import * as _ from 'lodash';
import * as Lazy from 'lazy.js';
import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { Container } from '../model';

import { Searchable, WithAttributes } from './mixins';
import { Path, Instance, ListInstance, LeafListInstance, Visitor } from './';

export default class ContainerInstance implements Searchable, WithAttributes {
  public model: Container;
  public config: Element;
  public parent: Instance;
  public children: Map<string, Instance>;
  public activeChoices: Map<string, string>;

  public customAttributes: Map<string, string>;
  public getPath: () => Path;
  public isTryingToMatchMe: (path: Path) => boolean;
  public isMatch: (path: Path) => boolean;
  public handleNoMatch: () => void;

  constructor(model: Container, config: Element, parent?: Instance) {
    this.model = model;
    this.config = config;
    this.parent = parent;
    this.children = new Map();
    this.activeChoices = new Map();

    this.injestConfig(config);
  }

  public toJSON(camelCase = false): object {
    const containerInner = [...this.children.values()].reduce(
      (acc, child) => Object.assign(acc, child.toJSON(camelCase)),
      {}
    );

    return {
      [this.model.getName(camelCase)]: containerInner
    };
  }

  public getInstance(path: Path): Instance {
    if (this.isTryingToMatchMe(path) && this.isMatch(path)) {
      return this;
    } else if (path.length > 1) {
      const tail = _.tail(path);
      const nextSegment = _.head(tail);

      if (this.children.has(nextSegment.name)) {
        return this.children.get(nextSegment.name).getInstance(tail);
      }
    }

    this.handleNoMatch();
  }

  public visit(visitor: Visitor) {
    visitor(this);

    Array.from(this.children.values()).forEach(child => {
      child.visit(visitor);
    });
  }

  private injestConfig(config: Element) {
    Lazy(config.childNodes())
      .filter(node => node.type() === 'element')
      .each(node => {
        const localName = node.name();

        if (this.model.hasChild(localName)) {
          if (this.children.has(localName)) {
            const child = this.children.get(localName);

            if (child instanceof ListInstance || child instanceof LeafListInstance) {
              child.add(node);
            }
          } else {
            const childModel = this.model.getChild(localName);

            // Note: This does not support nested choices
            if (childModel.choiceCase) {
              this.activeChoices.set(childModel.choiceCase.parentChoice.name, childModel.choiceCase.name);
            }

            this.children.set(localName, childModel.buildInstance(node, this));
          }
        }
      });
  }
}

applyMixins(ContainerInstance, [Searchable, WithAttributes]);
