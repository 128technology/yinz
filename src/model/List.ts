import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import ns from '../util/ns';
import { ListInstance, Instance } from '../instance';
import { OrderedBy, Visibility, Status } from '../enum';

import { Statement, ListLike, Searchable, Whenable } from './mixins';
import { IWhen } from './mixins/Whenable';
import { buildChildren } from './util/childBuilder';
import { Model, Case, Choice, Identities } from './';

export default class List implements ListLike, Statement, Searchable, Whenable {
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
  public isObsolete: boolean;
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
  public handleNoMatch: () => void;
  public isMatch: (segments: string[]) => boolean;

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

  public getModelForPath(segments: string[]): Model | Choice {
    if (this.isMatch(segments)) {
      return this;
    } else if (this.children.has(segments[0])) {
      const firstSegment = segments.shift();
      return this.children.get(firstSegment).getModelForPath(segments);
    } else if (this.choices.has(segments[0]) && segments.length === 1) {
      return this.choices.get(segments[0]);
    }

    this.handleNoMatch();
  }
}

applyMixins(List, [ListLike, Statement, Searchable, Whenable]);
