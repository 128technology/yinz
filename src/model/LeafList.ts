import { Element } from 'libxmljs2';

import applyMixins from '../util/applyMixins';
import { LeafListInstance, ListChildInstance, ContainerInstance } from '../instance';
import { LeafListJSON } from '../instance/types';
import { DerivedType, BuiltInType } from '../types';

import { ListLike, Statement, Typed, Whenable, WithIdentities, WithRegistry, WithUnits } from './mixins';
import { Model, Visitor } from './';

export default class LeafList implements ListLike, Statement, Typed, Whenable, WithIdentities, WithRegistry, WithUnits {
  public addDefinedUnits: WithUnits['addDefinedUnits'];
  public addIdentityProps: WithIdentities['addIdentityProps'];
  public addListLikeProps: ListLike['addListLikeProps'];
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
  public type: Typed['type'];
  public units: WithUnits['units'];
  public visibility: Statement['visibility'];
  public when: Whenable['when'];

  public keys: Set<string>;
  public modelType: string;

  constructor(el: Element, parentModel: Model) {
    this.modelType = 'leafList';
    this.addStatementProps(el, parentModel);
    this.addIdentityProps(parentModel);
    this.addListLikeProps(el);
    this.addTypeProps(el, this.identities);
    this.addWhenableProps(el);
    this.addDefinedUnits(el);

    this.register(parentModel, this);
  }

  public getResolvedType(): BuiltInType {
    return this.type instanceof DerivedType ? this.type.builtInType : this.type;
  }

  public buildInstance(config: Element | LeafListJSON, parent: ListChildInstance | ContainerInstance) {
    return new LeafListInstance(this, config, parent);
  }

  public visit(visitor: Visitor) {
    visitor(this);
  }
}

applyMixins(LeafList, [ListLike, Statement, Typed, Whenable, WithIdentities, WithRegistry, WithUnits]);
