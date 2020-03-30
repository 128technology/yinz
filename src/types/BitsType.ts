import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';

import { Named, RequiredField, StringSerialize } from './mixins';

const TYPE = BuiltInType.bits;

export default class BitsType implements Named, RequiredField, StringSerialize {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public addNamedProps: Named['addNamedProps'];
  public serialize: StringSerialize['serialize'];
  public type: Named['type'];
  public validateRequiredFields: RequiredField['validateRequiredFields'];

  constructor(el: Element) {
    this.addNamedProps(el);
    this.validateRequiredFields(el, ['bit'], this.type);
  }
}

applyMixins(BitsType, [Named, RequiredField, StringSerialize]);
