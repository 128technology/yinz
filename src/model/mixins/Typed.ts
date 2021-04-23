import { Element } from 'libxmljs2';

import ns from '../../util/ns';
import TypeParser from '../../types/util/TypeParser';
import { Type } from '../../types';
import { Identities } from '../';
import { assertElement } from '../../util/xmlUtil';

export default class Typed {
  public type: Type;

  public addTypeProps(el: Element, identities: Identities) {
    const typeEl = assertElement(el.get('./yin:type', ns)!);
    this.type = TypeParser.parse(typeEl, identities);
  }
}
