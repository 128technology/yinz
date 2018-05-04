import { Element } from 'libxmljs';
import * as _ from 'lodash';

import applyMixins from '../util/applyMixins';
import { ContainerInstance, Instance } from '../instance';
import { Visibility } from '../enum';

import { PresenceParser } from './parsers';
import { Statement, Searchable, Whenable } from './mixins';
import { IWhen } from './mixins/Whenable';
import { buildChildren } from './util/childBuilder';
import { Model, Case, Choice, Identities } from './';

export default class Container implements Statement, Searchable, Whenable {
  public children: Map<string, Model>;
  public choiceCase: Case;
  public choices: Map<string, Choice>;
  public description: string;
  public identities: Identities;
  public isVisible: boolean;
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
  public handleNoMatch: () => void;
  public isMatch: (segments: string[]) => boolean;

  constructor(el: Element, parentModel?: Model, identities?: Identities) {
    this.modelType = 'container';
    this.addStatementProps(el, parentModel);
    this.addWhenableProps(el);
    this.identities = identities;

    const { children, choices } = buildChildren(el, this);
    this.children = children;
    this.choices = choices;

    this.presence = PresenceParser.parse(el);
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

applyMixins(Container, [Statement, Searchable, Whenable]);
