import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import SerializationType, { convert, SerializationReturnType } from '../enum/SerializationType';
import { Named } from './mixins';

const TYPE = BuiltInType.boolean;
const SERIALIZATION_TYPE = SerializationType.boolean;

export default class BooleanType {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public type: string;

  public addNamedProps: (el: Element) => void;

  constructor(el: Element) {
    this.addNamedProps(el);
  }

  public serialize(val: string): SerializationReturnType {
    return convert(val, SERIALIZATION_TYPE);
  }
}

applyMixins(BooleanType, [Named]);
