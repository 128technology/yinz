import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';
import { Identities } from '../model';

import { Named, RequiredField, StringSerialize, WithCustomProperties } from './mixins';

const TYPE = BuiltInType.identityref;

export default class IdentityRefType implements Named, StringSerialize, RequiredField, WithCustomProperties {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public addNamedProps: Named['addNamedProps'];
  public serialize: StringSerialize['serialize'];
  public type: Named['type'];
  public validateRequiredFields: RequiredField['validateRequiredFields'];

  public options: string[];

  public addCustomProperties: WithCustomProperties['addCustomProperties'];
  public otherProps: WithCustomProperties['otherProps'];


  constructor(el: Element, identities: Identities) {
    this.addNamedProps(el);
    this.validateRequiredFields(el, ['base'], this.type);
    this.parseType(el, identities);
  }

  public parseType(el: Element, identities: Identities) {
    const splitVal = el.get('./yin:base', ns)!.attr('name')!.value().split(':');
    const base = splitVal.length > 1 ? splitVal[1] : splitVal[0];

    this.options = identities.getOptions(base);

    this.addCustomProperties(el, ['base']);
  }
}

applyMixins(IdentityRefType, [Named, RequiredField, StringSerialize, WithCustomProperties]);
