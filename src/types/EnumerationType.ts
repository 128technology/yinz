import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';
import { isElement } from '../util/xmlUtil';

import EnumerationMemberType from './EnumerationMemberType';
import { Named, RequiredField, StringSerialize, WithCustomProperties } from './mixins';

const TYPE = BuiltInType.enumeration;

export default class EnumerationType implements Named, RequiredField, StringSerialize, WithCustomProperties {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public addNamedProps: Named['addNamedProps'];
  public serialize: StringSerialize['serialize'];
  public type: Named['type'];
  public validateRequiredFields: RequiredField['validateRequiredFields'];

  public members: Map<string, EnumerationMemberType>;

  public addCustomProperties: WithCustomProperties['addCustomProperties'];
  public otherProps: WithCustomProperties['otherProps'];

  get options() {
    return Array.from(this.members.entries())
      .filter(([key, member]) => !member.isObsolete())
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
      .filter(isElement)
      .reduce(
        (acc, enumEl) => acc.set(enumEl.attr('name')!.value(), new EnumerationMemberType(enumEl)),
        new Map<string, EnumerationMemberType>()
      );
    this.addCustomProperties(el);
  }
}

applyMixins(EnumerationType, [Named, RequiredField, StringSerialize, WithCustomProperties]);
