import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';
import SerializationType, { convert, SerializationReturnType } from '../enum/SerializationType';

import Range from './Range';
import { Named, WithCustomProperties } from './mixins';

const TYPES = [
  BuiltInType.int8,
  BuiltInType.int16,
  BuiltInType.int32,
  BuiltInType.int64,
  BuiltInType.uint8,
  BuiltInType.uint16,
  BuiltInType.uint32,
  BuiltInType.uint64
];
const SERIALIZATION_TYPE = SerializationType.number;

export default class IntegerType implements Named, WithCustomProperties {
  public static matches(typeName: string) {
    const type = enumValueOf(typeName);
    return type !== null ? TYPES.indexOf(type) !== -1 : false;
  }

  public addNamedProps: Named['addNamedProps'];
  public type: Named['type'];

  public range: Range;

  public addCustomProperties: WithCustomProperties['addCustomProperties'];
  public otherProps: WithCustomProperties['otherProps'];


  constructor(el: Element) {
    this.addNamedProps(el);
    this.parseType(el);
  }

  public parseType(el: Element) {
    const rangeEl = el.get('./yin:range', ns);

    if (rangeEl) {
      this.range = new Range(rangeEl);
    }
    this.addCustomProperties(el, ['range']);
  }

  public serialize(val: string): SerializationReturnType {
    return convert(val, SERIALIZATION_TYPE);
  }
}

applyMixins(IntegerType, [Named, WithCustomProperties]);
