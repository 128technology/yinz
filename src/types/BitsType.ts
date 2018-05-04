import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import { SerializationReturnType } from '../enum/SerializationType';

import { Named, RequiredField, StringSerialize } from './mixins';

const TYPE = BuiltInType.bits;

export default class BitsType implements Named, RequiredField, StringSerialize {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public type: string;

  public serialize: (val: string) => SerializationReturnType;
  public addNamedProps: (el: Element) => void;
  public validateRequiredFields: (el: Element, fields: string[], type: string) => void;

  constructor(el: Element) {
    this.addNamedProps(el);
    this.validateRequiredFields(el, ['bit'], this.type);
  }
}

applyMixins(BitsType, [Named, RequiredField, StringSerialize]);
