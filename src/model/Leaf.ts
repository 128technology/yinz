import { Element } from 'libxmljs';
import * as _ from 'lodash';

import applyMixins from '../util/applyMixins';
import { Visibility, Status } from '../enum';
import { LeafInstance, Instance, LeafJSON } from '../instance';
import { Type, DerivedType, BuiltInType } from '../types';

import { MandatoryParser, DefaultParser } from './parsers';
import { Statement, Typed, Whenable, WithIdentities, WithRegistry, WithUnits } from './mixins';
import { IWhen } from './mixins/Whenable';
import { List, Model, Case, Identities, Choice, Visitor } from './';

export default class Leaf implements Statement, Typed, Whenable, WithIdentities, WithRegistry, WithUnits {
  public choiceCase: Case;
  public default: string;
  public definedUnits: string;
  public description: string;
  public hasWhenAncestorOrSelf: boolean;
  public identities: Identities;
  public isObsolete: boolean;
  public isDeprecated: boolean;
  public isPrototype: boolean;
  public isVisible: boolean;
  public mandatory: boolean;
  public modelType: string;
  public name: string;
  public ns: [string, string];
  public otherProps: Map<string, string | boolean> = new Map();
  public parentModel: Model;
  public path: string;
  public status: Status;
  public type: Type;
  public units: string;
  public visibility: Visibility | null;
  public when: IWhen[];

  public addIdentityProps: (parentModel: Model) => void;
  public addStatementProps: (el: Element, parentModel: Model) => void;
  public addTypeProps: (el: Element, identities: Identities) => void;
  public addWhenableProps: (el: Element) => void;
  public addDefinedUnits: (el: Element) => void;
  public getName: (camelCase?: boolean) => string;
  public register: (parentModel: Model, thisModel: Model | Choice) => void;

  constructor(el: Element, parentModel?: Model) {
    this.modelType = 'leaf';
    this.addStatementProps(el, parentModel);
    this.addIdentityProps(parentModel);
    this.addTypeProps(el, this.identities);
    this.addWhenableProps(el);
    this.addDefinedUnits(el);

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

  public buildInstance(config: Element | LeafJSON, parent?: Instance) {
    return new LeafInstance(this, config, parent);
  }

  public getResolvedType(): BuiltInType {
    return this.type instanceof DerivedType ? this.type.builtInType : this.type;
  }

  public visit(visitor: Visitor) {
    visitor(this);
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

applyMixins(Leaf, [Statement, Typed, Whenable, WithIdentities, WithRegistry, WithUnits]);
