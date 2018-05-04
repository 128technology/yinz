import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';
import SerializationType, { convert, SerializationReturnType } from '../enum/SerializationType';

import Range from './Range';
import { Named } from './mixins';

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

export default class IntegerType implements Named {
  public static matches(typeName: string) {
    return TYPES.indexOf(enumValueOf(typeName)) !== -1;
  }

  public type: string;
  public range: Range;

  public addNamedProps: (el: Element) => void;

  constructor(el: Element) {
    this.addNamedProps(el);
    this.parseType(el);
  }

  public parseType(el: Element) {
    const rangeEl = el.get('./yin:range', ns);

    if (rangeEl) {
      this.range = new Range(rangeEl);
    }
  }

  public serialize(val: string): SerializationReturnType {
    return convert(val, SERIALIZATION_TYPE);
  }
}

applyMixins(IntegerType, [Named]);
