import { Element } from 'libxmljs2';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import SerializationType, { convert, SerializationReturnType } from '../enum/SerializationType';
import { Named, WithCustomProperties } from './mixins';

const TYPE = BuiltInType.boolean;
const SERIALIZATION_TYPE = SerializationType.boolean;

export default class BooleanType implements Named, WithCustomProperties {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public addNamedProps: Named['addNamedProps'];
  public type: Named['type'];

  public addCustomProperties: WithCustomProperties['addCustomProperties'];
  public otherProps: WithCustomProperties['otherProps'];

  constructor(el: Element) {
    this.addNamedProps(el);
    this.addCustomProperties(el);
  }

  public serialize(val: string): SerializationReturnType {
    return convert(val, SERIALIZATION_TYPE);
  }
}

applyMixins(BooleanType, [Named, WithCustomProperties]);
