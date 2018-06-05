import { Element } from 'libxmljs';
import * as _ from 'lodash';

import applyMixins from '../util/applyMixins';
import { ContainerInstance, Instance } from '../instance';
import { Visibility } from '../enum';

import { PresenceParser } from './parsers';
import { Statement, Whenable, WithRegistry } from './mixins';
import { IWhen } from './mixins/Whenable';
import { buildChildren } from './util/childBuilder';
import { Model, Case, Choice, Identities, ModelRegistry } from './';

export default class Container implements Statement, Whenable, WithRegistry {
  public children: Map<string, Model>;
  public choiceCase: Case;
  public choices: Map<string, Choice>;
  public description: string;
  public identities: Identities;
  public isPrototype: boolean;
  public isVisible: boolean;
  public modelRegistry: ModelRegistry;
  public modelType: string;
  public name: string;
  public ns: [string, string];
  public otherProps: Map<string, string | boolean>;
  public parentModel: Model;
  public path: string;
  public presence: string;
  public visibility: Visibility | null;
  public when: IWhen[];
  public hasWhenAncestorOrSelf: boolean;

  public addStatementProps: (el: Element, parentModel: Model) => void;
  public addWhenableProps: (el: Element) => void;
  public getName: (camelCase?: boolean) => string;
  public register: (parentModel: Model, thisModel: Model | Choice) => void;

  constructor(el: Element, parentModel?: Model, identities?: Identities, modelRegistry?: ModelRegistry) {
    this.modelType = 'container';
    this.addStatementProps(el, parentModel);
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

  public buildInstance(config: Element, parent?: Instance) {
    return new ContainerInstance(this, config, parent);
  }
}

applyMixins(Container, [Statement, Whenable, WithRegistry]);
