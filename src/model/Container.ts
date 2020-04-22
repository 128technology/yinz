import { Element } from 'libxmljs';
import * as _ from 'lodash';

import applyMixins from '../util/applyMixins';
import { ContainerInstance, Parent } from '../instance';
import { ContainerJSON } from '../instance/types';

import { PresenceParser } from './parsers';
import { Statement, Whenable, WithRegistry } from './mixins';
import { buildChildren } from './util/childBuilder';
import { Model, Choice, Identities, ModelRegistry, Visitor } from './';

export default class Container implements Statement, Whenable, WithRegistry {
  public addStatementProps: Statement['addStatementProps'];
  public addWhenableProps: Whenable['addWhenableProps'];
  public choiceCase: Statement['choiceCase'];
  public description: Statement['description'];
  public getName: Statement['getName'];
  public hasWhenAncestorOrSelf: Whenable['hasWhenAncestorOrSelf'];
  public isDeprecated: Statement['isDeprecated'];
  public isObsolete: Statement['isObsolete'];
  public isPrototype: Statement['isPrototype'];
  public isVisible: Statement['isVisible'];
  public name: Statement['name'];
  public ns: Statement['ns'];
  public otherProps: Statement['otherProps'];
  public parentModel: Statement['parentModel'];
  public path: Statement['path'];
  public register: WithRegistry['register'];
  public status: Statement['status'];
  public visibility: Statement['visibility'];
  public when: Whenable['when'];

  public children: Map<string, Model>;
  public choices: Map<string, Choice>;
  public identities?: Identities;
  public modelRegistry?: ModelRegistry;
  public modelType: string;
  public presence: string | null;

  constructor(el: Element, parentModel?: Model, identities?: Identities, modelRegistry?: ModelRegistry) {
    this.modelType = 'container';
    this.addStatementProps(el, parentModel || null);
    this.addWhenableProps(el);
    this.identities = identities;
    this.modelRegistry = modelRegistry;

    const { children, choices } = buildChildren(el, this);
    this.children = children;
    this.choices = choices;

    this.presence = PresenceParser.parse(el);

    if (this.modelRegistry) {
      this.modelRegistry.addModel(this);
    } else {
      this.register(parentModel, this);
    }
  }

  public isPresenceContainer() {
    return !_.isNil(this.presence);
  }

  public getPresenceDescription() {
    return this.presence;
  }

  public hasChild(name: string) {
    return this.children.has(name);
  }

  public getChild(name: string) {
    return this.children.get(name);
  }

  public getChildren() {
    return this.children;
  }

  public buildInstance(config: Element | ContainerJSON, parent: Parent | null) {
    return new ContainerInstance(this, config, parent);
  }

  public visit(visitor: Visitor) {
    visitor(this);

    for (const value of this.choices.values()) {
      value.visit(visitor);
    }

    for (const value of this.children.values()) {
      if (!value.choiceCase) {
        value.visit(visitor);
      }
    }
  }
}

applyMixins(Container, [Statement, Whenable, WithRegistry]);
