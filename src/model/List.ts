import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import ns from '../util/ns';
import { ListInstance, Instance } from '../instance';
import { OrderedBy, Visibility, Status } from '../enum';

import { Statement, ListLike, Whenable, WithRegistry } from './mixins';
import { IWhen } from './mixins/Whenable';
import { buildChildren } from './util/childBuilder';
import { Model, Case, Choice, Identities } from './';

export default class List implements ListLike, Statement, Whenable, WithRegistry {
  private static getKeys(el: Element) {
    const keyString = el
      .get('./yin:key', ns)
      .attr('value')
      .value();
    return keyString.split(' ');
  }

  public children: Map<string, Model>;
  public choiceCase: Case;
  public choices: Map<string, Choice>;
  public description: string;
  public identities: Identities;
  public isPrototype: boolean;
  public isVisible: boolean;
  public keys: Set<string>;
  public maxElements: number;
  public minElements: number;
  public modelType: string;
  public name: string;
  public ns: [string, string];
  public orderedBy: OrderedBy;
  public otherProps: Map<string, string | boolean>;
  public parentModel: Model;
  public path: string;
  public status: Status;
  public visibility: Visibility | null;
  public when: IWhen[];
  public hasWhenAncestorOrSelf: boolean;

  public addListLikeProps: (el: Element) => void;
  public addStatementProps: (el: Element, parentModel: Model) => void;
  public addWhenableProps: (el: Element) => void;
  public getName: (camelCase?: boolean) => string;
  public register: (parentModel: Model, thisModel: Model | Choice) => void;

  constructor(el: Element, parentModel?: Model, identities?: Identities) {
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
    return [...this.keys.values()].map(key => this.children.get(key));
  }

  public buildInstance(config: Element, parent?: Instance) {
    return new ListInstance(this, config, parent);
  }
}

applyMixins(List, [ListLike, Statement, Whenable, WithRegistry]);
