import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { isElement } from '../util/xmlUtil';
import { Visibility, Status } from '../enum';

import { Statement, Whenable, WithRegistry } from './mixins';
import { MandatoryParser } from './parsers';
import { IWhen } from './mixins/Whenable';
import { Model, Case, Visitor } from './';

export default class Choice implements Statement, Whenable, WithRegistry {
  private static CASE_TYPES = new Set(['case', 'leaf', 'leaf-list', 'list', 'container']);

  private static isCase(el: Element) {
    return Choice.CASE_TYPES.has(el.name());
  }

  public cases: Case[];
  public children: Map<string, Model>;
  public choiceCase: Case;
  public description: string;
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
      function* (): Iterable<[string, Model]> {
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

  public visit(visitor: Visitor) {
    visitor(this);

    this.cases.forEach(theCase => {
      theCase.visit(visitor);
    });
  }

  private buildCases(el: Element, parentModel?: Model) {
    return el
      .childNodes()
      .filter(isElement)
      .filter(caseEl => Choice.isCase(caseEl))
      .map(caseEl => new Case(caseEl, this, parentModel));
  }
}

applyMixins(Choice, [Statement, Whenable, WithRegistry]);
