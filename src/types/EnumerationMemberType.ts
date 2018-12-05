import { Element } from 'libxmljs';

import ns from '../util/ns';
import { Status } from '../enum';
import * as Parsers from '../model/parsers';

export default class EnumerationMemberType {
  public description: string;
  public value: number;
  public reference: string;
  public status: Status = Status.current;

  constructor(enumEl: Element) {
    this.parseType(enumEl);
  }

  public parseType(enumEl: Element) {
    this.status = Parsers.StatusParser.parse(enumEl) || Status.current;
    this.description = Parsers.DescriptionParser.parse(enumEl);
    this.reference = Parsers.ReferenceParser.parse(enumEl);
    this.value = this.parseValue(enumEl);
  }

  public isObsolete = () => this.status === Status.obsolete;

  public parseValue(enumEl: Element) {
    const valueEl = enumEl.get('./yin:value', ns);
    return valueEl && valueEl.attr('value') ? parseInt(valueEl.attr('value').value(), 10) : null;
  }
}
