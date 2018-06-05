import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { OrderedBy, Visibility, Status } from '../enum';
import { LeafListInstance, Instance } from '../instance/index';
import { Type } from '../types';

import { ListLike, Statement, Searchable, Typed, Whenable, WithIdentities } from './mixins';
import { IWhen } from './mixins/Whenable';
import { Model, Case, Identities } from './';

export default class LeafList implements ListLike, Statement, Searchable, Typed, Whenable, WithIdentities {
  public choiceCase: Case;
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
  public handleNoMatch: () => void;
  public isMatch: (segments: string[]) => boolean;

  constructor(el: Element, parentModel?: Model) {
    this.modelType = 'leafList';
    this.addStatementProps(el, parentModel);
    this.addIdentityProps(parentModel);
    this.addListLikeProps(el);
    this.addTypeProps(el, this.identities);
    this.addWhenableProps(el);
  }

  public buildInstance(config: Element, parent?: Instance) {
    return new LeafListInstance(this, config, parent);
  }

  public getModelForPath(segments: string[]): Model {
    if (this.isMatch(segments)) {
      return this;
    }

    this.handleNoMatch();
  }
}

applyMixins(LeafList, [ListLike, Statement, Searchable, Typed, Whenable, WithIdentities]);
