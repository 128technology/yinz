import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';

import { EmptyType } from '../types';
import { Whenable } from './mixins';
import { IWhen } from './mixins/Whenable';
import { buildChildren, buildChild } from './util/childBuilder';
import { Model, Choice, Leaf } from './';

export default class Case implements Whenable {
  public name: string;
  public children: Map<string, Model>;
  public modelType: string;
  public parentChoice: Choice;
  public when: IWhen[];
  public hasWhenAncestorOrSelf: boolean;

  public addWhenableProps: (el: Element) => void;

  constructor(el: Element, parentChoice: Choice, parentModel?: Model) {
    this.modelType = 'case';
    this.parentChoice = parentChoice;
    this.name = el.attr('name').value();
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

  private buildChildrenFromCase(el: Element, parentModel?: Model) {
    // TODO: Handle another choice nested in a case.
    const { children } = buildChildren(el, parentModel);
    this.children = children;
  }

  private buildChildrenFromImplicitCase(el: Element, parentModel?: Model) {
    const child = buildChild(el, parentModel);

    if (child instanceof Choice) {
      this.children = child.children;
    } else {
      this.children = new Map([[child.name, child]]);
    }
  }
}

applyMixins(Case, [Whenable]);
