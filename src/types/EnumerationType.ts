import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';
import { SerializationReturnType } from '../enum/SerializationType';

import EnumerationMemberType from './EnumerationMemberType';
import { Named, RequiredField, StringSerialize } from './mixins';

const TYPE = BuiltInType.enumeration;

export default class EnumerationType implements Named, RequiredField, StringSerialize {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public type: string;
  public members: Map<string, EnumerationMemberType>;

  public serialize: (val: string) => SerializationReturnType;
  public addNamedProps: (el: Element) => void;
  public validateRequiredFields: (el: Element, fields: string[], type: string) => void;

  get options() {
    return Array.from(this.members.entries())
      .filter(([key, member]) => member.isObsolete())
      .map(([key]) => key);
  }

  constructor(el: Element) {
    this.addNamedProps(el);
    this.validateRequiredFields(el, ['enum'], this.type);
    this.parseType(el);
  }

  public parseType(el: Element) {
    this.members = el
      .find('./yin:enum', ns)
      .reduce(
        (acc, enumEl) => acc.set(enumEl.attr('name').value(), new EnumerationMemberType(enumEl)),
        new Map<string, EnumerationMemberType>()
      );
  }
}

applyMixins(EnumerationType, [Named, RequiredField, StringSerialize]);
