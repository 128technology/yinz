import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { isVisible } from '../enum/Visibility';
import { Visibility, Status } from '../enum';
import { EmptyType } from '../types';
import { Whenable } from './mixins';
import { IWhen } from './mixins/Whenable';
import { buildChildren, buildChild } from './util/childBuilder';
import { Model, Choice, Leaf, Visitor } from './';
import { StatusParser, VisibilityParser } from './parsers';

export default class Case implements Whenable {
  public name: string;
  public children: Map<string, Model>;
  public modelType: string;
  public otherProps: Map<string, string | boolean> = new Map();
  public status: Status | null;
  public when: IWhen[];
  public visibility: Visibility | null;
  public hasWhenAncestorOrSelf: boolean;

  public addWhenableProps: (el: Element) => void;

  constructor(el: Element, public parentChoice: Choice, parentModel: Model) {
    this.modelType = 'case';
    this.name = el.attr('name')!.value();
    this.status = StatusParser.parse(el);
    this.visibility = VisibilityParser.parse(el);
    this.addWhenableProps(el);

    if (el.name() === 'case') {
      this.buildChildrenFromCase(el, parentModel);
    } else {
      this.buildChildrenFromImplicitCase(el, parentModel);
    }

    [...this.children.values()].forEach(child => {
      child.choiceCase = this;
    });
  }

  public isEmpty() {
    if (this.children.size === 1) {
      const singleChild = Array.from(this.children.values())[0];
      return singleChild instanceof Leaf && singleChild.getResolvedType() instanceof EmptyType;
    } else {
      return false;
    }
  }

  get isPrototype(): boolean {
    return this.visibility !== null ? this.visibility === Visibility.prototype : this.parentChoice.isPrototype;
  }

  get isVisible(): boolean {
    return this.visibility !== null ? isVisible(this.visibility) : this.parentChoice.isVisible;
  }

  get isObsolete() {
    return this.status !== null ? this.status === Status.obsolete : this.parentChoice.isObsolete;
  }

  get isDeprecated() {
    return this.status !== null ? this.status === Status.deprecated : this.parentChoice.isDeprecated;
  }

  public visit(visitor: Visitor) {
    visitor(this);

    for (const value of this.children.values()) {
      value.visit(visitor);
    }
  }

  private buildChildrenFromCase(el: Element, parentModel: Model) {
    // TODO: Handle another choice nested in a case.
    const { children } = buildChildren(el, parentModel);
    this.children = children;
  }

  private buildChildrenFromImplicitCase(el: Element, parentModel: Model) {
    const child = buildChild(el, parentModel);

    if (child instanceof Choice) {
      this.children = child.children;
    } else if (child) {
      this.children = new Map([[child.name, child]]);
    }
  }
}

applyMixins(Case, [Whenable]);
