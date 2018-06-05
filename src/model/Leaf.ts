import { Element } from 'libxmljs';
import * as _ from 'lodash';

import applyMixins from '../util/applyMixins';
import { Visibility } from '../enum';
import { LeafInstance, Instance } from '../instance';
import { Type, DerivedType } from '../types';

import { MandatoryParser, DefaultParser } from './parsers';
import { Statement, Typed, Whenable, WithIdentities, WithRegistry } from './mixins';
import { IWhen } from './mixins/Whenable';
import { List, Model, Case, Identities, Choice } from './';

export default class Leaf implements Statement, Typed, Whenable, WithIdentities, WithRegistry {
  public choiceCase: Case;
  public default: string;
  public description: string;
  public identities: Identities;
  public isPrototype: boolean;
  public isVisible: boolean;
  public mandatory: boolean;
  public modelType: string;
  public name: string;
  public ns: [string, string];
  public otherProps: Map<string, string | boolean>;
  public parentModel: Model;
  public path: string;
  public type: Type;
  public visibility: Visibility | null;
  public when: IWhen[];
  public hasWhenAncestorOrSelf: boolean;

  public addIdentityProps: (parentModel: Model) => void;
  public addStatementProps: (el: Element, parentModel: Model) => void;
  public addTypeProps: (el: Element, identities: Identities) => void;
  public addWhenableProps: (el: Element) => void;
  public getName: (camelCase?: boolean) => string;
  public register: (parentModel: Model, thisModel: Model | Choice) => void;

  constructor(el: Element, parentModel?: Model) {
    this.modelType = 'leaf';
    this.addStatementProps(el, parentModel);
    this.addIdentityProps(parentModel);
    this.addTypeProps(el, this.identities);
    this.addWhenableProps(el);

    this.mandatory = MandatoryParser.parse(el);
    this.parseDefault(el);

    this.register(parentModel, this);
  }

  get isKey() {
    return this.parentModel instanceof List && this.parentModel.keys.has(this.name);
  }

  get required() {
    return this.mandatory || this.isKey;
  }

  public buildInstance(config: Element, parent?: Instance) {
    return new LeafInstance(this, config, parent);
  }

  public getResolvedType() {
    return this.type instanceof DerivedType ? this.type.baseType : this.type;
  }

  private parseDefault(el: Element) {
    const leafDefault = DefaultParser.parse(el);

    if (!_.isNil(leafDefault)) {
      this.default = leafDefault;
    } else if (this.type instanceof DerivedType && !_.isNil(this.type.default)) {
      this.default = this.type.default;
    }
  }
}

applyMixins(Leaf, [Statement, Typed, Whenable, WithIdentities, WithRegistry]);
