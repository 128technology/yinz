import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';
import { Identities } from '../model';
import { isElement } from '../util/xmlUtil';

import TypeParser from './util/TypeParser';
import { Named, RequiredField, StringSerialize, Traversable } from './mixins';
import { Type } from './';

const TYPE = BuiltInType.union;

export default class UnionType implements Named, RequiredField, StringSerialize, Traversable {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public addNamedProps: Named['addNamedProps'];
  public serialize: StringSerialize['serialize'];
  public traverse: Traversable['traverse'];
  public type: Named['type'];
  public validateRequiredFields: RequiredField['validateRequiredFields'];

  public types: Type[];

  constructor(el: Element, identities?: Identities) {
    this.addNamedProps(el);
    this.validateRequiredFields(el, ['type'], this.type);
    this.parseType(el, identities);
  }

  public parseType(el: Element, identities?: Identities) {
    this.types = el
      .find('./yin:type', ns)
      .filter(isElement)
      .map(typeEl => TypeParser.parse(typeEl, identities));
  }

  public childTypes(): Type[] {
    const result = [];
    // Return types in reverse order. Eventually they will be popped off a stack in original order.
    for (let i = this.types.length; i > 0; i--) {
      result.push(this.types[i - 1]);
    }
    return result;
  }
}

applyMixins(UnionType, [Named, RequiredField, StringSerialize, Traversable]);
