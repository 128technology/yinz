import { Element } from 'libxmljs';

import ns from '../util/ns';
import { Status } from '../enum';
import { StatusParser } from '../model/parsers';

export default class EnumerationMemberType {
  public isObsolete = () => this.status === Status.obsolete;

  public description: string;
  public value: number;
  public reference: string;
  public status: Status = Status.current;

  constructor(enumEl: Element) {
    this.parseType(enumEl);
  }

  public parseType(enumEl: Element) {
    this.status = StatusParser.parse(enumEl) || Status.current;
    this.description = this.parseOptionalMember(enumEl, 'description');
    this.reference = this.parseOptionalMember(enumEl, 'reference');
    this.value = parseInt(this.parseOptionalMember(enumEl, 'value'));
  }

  private parseOptionalMember(enumEl: Element, nodeName: string) {
    const member = enumEl.get(`./yin:${nodeName}`, ns);

    if (member && member.attr('value')) {
      return member.attr('value').value();
    }
  }
}
