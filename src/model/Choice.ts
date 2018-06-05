import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { Visibility } from '../enum';

import { Statement, Whenable, WithRegistry } from './mixins';
import { MandatoryParser } from './parsers';
import { IWhen } from './mixins/Whenable';
import { Model, Case } from './';

export default class Choice implements Statement, Whenable, WithRegistry {
  private static CASE_TYPES = new Set(['case', 'leaf', 'leaf-list', 'list', 'container']);

  private static isCase(el: Element) {
    return Choice.CASE_TYPES.has(el.name());
  }

  public cases: Case[];
  public children: Map<string, Model>;
  public choiceCase: Case;
  public description: string;
  public isPrototype: boolean;
  public isVisible: boolean;
  public mandatory: boolean;
  public modelType: string;
  public name: string;
  public ns: [string, string];
  public otherProps: Map<string, string | boolean>;
  public parentModel: Model;
  public path: string;
  public visibility: Visibility | null;
  public when: IWhen[];
  public hasWhenAncestorOrSelf: boolean;

  public addStatementProps: (el: Element, parentModel: Model) => void;
  public addWhenableProps: (el: Element) => void;
  public getName: (camelCase?: boolean) => string;
  public register: (parentModel: Model, thisModel: Model | Choice) => void;

  constructor(el: Element, parentModel?: Model) {
    this.modelType = 'choice';
    this.addStatementProps(el, parentModel);
    this.addWhenableProps(el);

    this.mandatory = MandatoryParser.parse(el);
    this.cases = this.buildCases(el, parentModel);

    // Merge the child maps together
    this.children = new Map(
      function*(): Iterable<[string, Model]> {
        for (let i = 0, lenI = this.cases.length; i < lenI; i++) {
          yield* this.cases[i].children;
        }
      }.bind(this)()
    );

    this.register(parentModel, this);
  }

  public get caseNames() {
    return this.cases.map(theCase => theCase.name);
  }

  public get emptyCases() {
    return this.cases.filter(theCase => theCase.isEmpty());
  }

  private buildCases(el: Element, parentModel?: Model) {
    return el
      .childNodes()
      .filter(node => node.type() === 'element' && Choice.isCase(node))
      .map(caseEl => new Case(caseEl, this, parentModel));
  }
}

applyMixins(Choice, [Statement, Whenable, WithRegistry]);
