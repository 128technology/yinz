import { Element } from 'libxmljs2';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';

import { Named, RequiredField, StringSerialize, WithCustomProperties } from './mixins';

const TYPE = BuiltInType.bits;

export default class BitsType implements Named, RequiredField, StringSerialize, WithCustomProperties {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public addNamedProps: Named['addNamedProps'];
  public serialize: StringSerialize['serialize'];
  public type: Named['type'];
  public validateRequiredFields: RequiredField['validateRequiredFields'];

  public addCustomProperties: WithCustomProperties['addCustomProperties'];
  public otherProps: WithCustomProperties['otherProps'];

  constructor(el: Element) {
    this.addNamedProps(el);
    this.validateRequiredFields(el, ['bit'], this.type);

    this.addCustomProperties(el);
  }
}

applyMixins(BitsType, [Named, RequiredField, StringSerialize, WithCustomProperties]);
