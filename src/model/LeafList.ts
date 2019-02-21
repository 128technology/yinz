import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { OrderedBy, Visibility, Status } from '../enum';
import { LeafListInstance, Instance, LeafListJSON } from '../instance';
import { Type } from '../types';

import { ListLike, Statement, Typed, Whenable, WithIdentities, WithRegistry, WithUnits } from './mixins';
import { IWhen } from './mixins/Whenable';
import { Model, Case, Identities, Choice, Visitor } from './';

export default class LeafList implements ListLike, Statement, Typed, Whenable, WithIdentities, WithRegistry, WithUnits {
  public choiceCase: Case;
  public definedUnits: string;
  public description: string;
  public hasWhenAncestorOrSelf: boolean;
  public identities: Identities;
  public isObsolete: boolean;
  public isDeprecated: boolean;
  public isPrototype: boolean;
  public isVisible: boolean;
  public keys: Set<string>;
  public maxElements: number;
  public minElements: number;
  public modelType: string;
  public name: string;
  public ns: [string, string];
  public orderedBy: OrderedBy;
  public otherProps: Map<string, string | boolean> = new Map();
  public parentModel: Model;
  public path: string;
  public status: Status;
  public type: Type;
  public units: string;
  public visibility: Visibility | null;
  public when: IWhen[];

  public addDefinedUnits: (el: Element) => void;
  public addIdentityProps: (parentModel: Model) => void;
  public addListLikeProps: (el: Element) => void;
  public addStatementProps: (el: Element, parentModel: Model) => void;
  public addTypeProps: (el: Element, identities: Identities) => void;
  public addWhenableProps: (el: Element) => void;
  public getName: (camelCase?: boolean) => string;
  public register: (parentModel: Model, thisModel: Model | Choice) => void;

  constructor(el: Element, parentModel?: Model) {
    this.modelType = 'leafList';
    this.addStatementProps(el, parentModel);
    this.addIdentityProps(parentModel);
    this.addListLikeProps(el);
    this.addTypeProps(el, this.identities);
    this.addWhenableProps(el);
    this.addDefinedUnits(el);

    this.register(parentModel, this);
  }

  public buildInstance(config: Element | LeafListJSON, parent?: Instance) {
    return new LeafListInstance(this, config, parent);
  }

  public visit(visitor: Visitor) {
    visitor(this);
  }
}

applyMixins(LeafList, [ListLike, Statement, Typed, Whenable, WithIdentities, WithRegistry, WithUnits]);
