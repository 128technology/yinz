import { Element } from 'libxmljs';

import ns from '../../util/ns';
import TypeParser from '../../types/util/TypeParser';
import { Type } from '../../types';
import { Identities } from '../';

export default class Typed {
  public type: Type;

  public addTypeProps(el: Element, identities: Identities) {
    const typeEl = el.get('./yin:type', ns);
    this.type = TypeParser.parse(typeEl, identities);
  }
}
