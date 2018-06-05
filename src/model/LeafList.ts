import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { OrderedBy, Visibility, Status } from '../enum';
import { LeafListInstance, Instance } from '../instance/index';
import { Type } from '../types';

import { ListLike, Statement, Typed, Whenable, WithIdentities, WithRegistry } from './mixins';
import { IWhen } from './mixins/Whenable';
import { Model, Case, Identities, Choice } from './';

export default class LeafList implements ListLike, Statement, Typed, Whenable, WithIdentities, WithRegistry {
  public choiceCase: Case;
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
  public type: Type;
  public visibility: Visibility | null;
  public when: IWhen[];
  public hasWhenAncestorOrSelf: boolean;

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

    this.register(parentModel, this);
  }

  public buildInstance(config: Element, parent?: Instance) {
    return new LeafListInstance(this, config, parent);
  }
}

applyMixins(LeafList, [ListLike, Statement, Typed, Whenable, WithIdentities, WithRegistry]);
