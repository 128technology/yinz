import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import ns from '../util/ns';
import { ListInstance, ListChildInstance, ContainerInstance } from '../instance';
import { ListJSON } from '../instance/types';

import { Statement, ListLike, Whenable, WithRegistry } from './mixins';
import { buildChildren } from './util/childBuilder';
import { Model, Choice, Identities, Visitor } from './';

export default class List implements ListLike, Statement, Whenable, WithRegistry {
  private static getKeys(el: Element) {
    const keyString = el.get('./yin:key', ns)!.attr('value')!.value();
    return keyString.split(' ');
  }

  public addListLikeProps: ListLike['addListLikeProps'];
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
  public maxElements: ListLike['maxElements'];
  public minElements: ListLike['minElements'];
  public name: Statement['name'];
  public ns: Statement['ns'];
  public orderedBy: ListLike['orderedBy'];
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
  public keys: Set<string>;
  public modelType: string;

  constructor(el: Element, parentModel: Model, identities?: Identities) {
    this.modelType = 'list';
    this.addStatementProps(el, parentModel);
    this.identities = identities;

    this.keys = new Set(List.getKeys(el));
    this.addListLikeProps(el);
    this.addWhenableProps(el);

    const { children, choices } = buildChildren(el, this);
    this.children = children;
    this.choices = choices;

    this.register(parentModel, this);
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

  public getKeyNodes() {
    return [...this.keys.values()].map(key => this.children.get(key)!);
  }

  public buildInstance(config: Element | ListJSON, parent: ListChildInstance | ContainerInstance) {
    return new ListInstance(this, config, parent);
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

applyMixins(List, [ListLike, Statement, Whenable, WithRegistry]);
