import { Element } from 'libxmljs';
import * as _ from 'lodash';

import applyMixins from '../util/applyMixins';
import { LeafInstance, Parent } from '../instance';
import { LeafJSON } from '../instance/types';
import { DerivedType, BuiltInType } from '../types';

import { MandatoryParser, DefaultParser } from './parsers';
import { Statement, Typed, Whenable, WithIdentities, WithRegistry, WithUnits } from './mixins';
import { List, Model, Visitor } from './';

export default class Leaf implements Statement, Typed, Whenable, WithIdentities, WithRegistry, WithUnits {
  public addDefinedUnits: WithUnits['addDefinedUnits'];
  public addIdentityProps: WithIdentities['addIdentityProps'];
  public addStatementProps: Statement['addStatementProps'];
  public addTypeProps: Typed['addTypeProps'];
  public addWhenableProps: Whenable['addWhenableProps'];
  public choiceCase: Statement['choiceCase'];
  public definedUnits: WithUnits['definedUnits'];
  public description: Statement['description'];
  public getName: Statement['getName'];
  public hasWhenAncestorOrSelf: Whenable['hasWhenAncestorOrSelf'];
  public identities: WithIdentities['identities'];
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
  public type: Typed['type'];
  public units: WithUnits['units'];
  public visibility: Statement['visibility'];
  public when: Whenable['when'];

  public default: string;
  public mandatory: boolean;
  public modelType: string;

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

  public buildInstance(config: Element | LeafJSON, parent?: Parent) {
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
