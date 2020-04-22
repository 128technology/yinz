import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';
import SerializationType, { convert, SerializationReturnType } from '../enum/SerializationType';

import Range from './Range';
import { Named, RequiredField } from './mixins';

const TYPE = BuiltInType.decimal64;
const SERIALIZATION_TYPE = SerializationType.number;

export default class DecimalType implements Named, RequiredField {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public addNamedProps: Named['addNamedProps'];
  public type: Named['type'];
  public validateRequiredFields: RequiredField['validateRequiredFields'];

  public range: Range;
  public fractionDigits: number;

  constructor(el: Element) {
    this.addNamedProps(el);
    this.validateRequiredFields(el, ['fraction-digits'], this.type);
    this.parseType(el);
  }

  public parseType(el: Element) {
    const rangeEl = el.get('./yin:range', ns);
    const fractionDigitsEl = el.get('./yin:fraction-digits', ns)!;

    if (rangeEl) {
      this.range = new Range(rangeEl);
    }

    this.fractionDigits = parseInt(fractionDigitsEl.attr('value')!.value(), 10);
  }

  public serialize(val: string): SerializationReturnType {
    return convert(val, SERIALIZATION_TYPE);
  }
}

applyMixins(DecimalType, [Named, RequiredField]);
