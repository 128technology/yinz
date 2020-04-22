import { Element } from 'libxmljs';

import ns from '../util/ns';
import { Status } from '../enum';
import * as Parsers from '../model/parsers';

export default class EnumerationMemberType {
  public readonly description: string | null;
  public readonly value: number | null;
  public readonly reference: string | null;
  public readonly status: Status = Status.current;

  constructor(enumEl: Element) {
    this.status = Parsers.StatusParser.parse(enumEl) || Status.current;
    this.description = Parsers.DescriptionParser.parse(enumEl);
    this.reference = Parsers.ReferenceParser.parse(enumEl);
    this.value = this.parseValue(enumEl);
  }

  public isObsolete = () => this.status === Status.obsolete;

  public parseValue(enumEl: Element) {
    const valueEl = enumEl.get('./yin:value', ns);
    return valueEl && valueEl.attr('value') ? parseInt(valueEl.attr('value')!.value(), 10) : null;
  }
}
