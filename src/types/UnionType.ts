import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';
import { Identities } from '../model';
import { SerializationReturnType } from '../enum/SerializationType';

import TypeParser from './util/TypeParser';
import { Named, RequiredField, StringSerialize, Traversable } from './mixins';
import { Type } from './';

const TYPE = BuiltInType.union;

export default class UnionType implements Named, RequiredField, StringSerialize, Traversable {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public type: string;
  public types: Type[];

  public serialize: (val: string) => SerializationReturnType;
  public addNamedProps: (el: Element) => void;
  public validateRequiredFields: (el: Element, fields: string[], type: string) => void;
  public traverse: (action: (type: Type) => void) => void;

  constructor(el: Element, identities?: Identities) {
    this.addNamedProps(el);
    this.validateRequiredFields(el, ['type'], this.type);
    this.parseType(el, identities);
  }

  public parseType(el: Element, identities?: Identities) {
    this.types = el.find('./yin:type', ns).map(typeEl => TypeParser.parse(typeEl, identities));
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
