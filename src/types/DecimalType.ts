import { Element } from 'libxmljs2';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';
import SerializationType, { convert, SerializationReturnType } from '../enum/SerializationType';
import { assertElement } from '../util/xmlUtil';

import Range from './Range';
import { Named, RequiredField, WithCustomProperties } from './mixins';

const TYPE = BuiltInType.decimal64;
const SERIALIZATION_TYPE = SerializationType.number;

export default class DecimalType implements Named, RequiredField, WithCustomProperties {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public addNamedProps: Named['addNamedProps'];
  public type: Named['type'];
  public validateRequiredFields: RequiredField['validateRequiredFields'];

  public range: Range;
  public fractionDigits: number;

  public addCustomProperties: WithCustomProperties['addCustomProperties'];
  public otherProps: WithCustomProperties['otherProps'];

  constructor(el: Element) {
    this.addNamedProps(el);
    this.validateRequiredFields(el, ['fraction-digits'], this.type);
    this.parseType(el);
  }

  public parseType(el: Element) {
    const rangeEl = el.get('./yin:range', ns);
    const fractionDigitsEl = assertElement(el.get('./yin:fraction-digits', ns)!);

    if (rangeEl) {
      this.range = new Range(assertElement(rangeEl));
    }

    this.fractionDigits = parseInt(fractionDigitsEl.attr('value')!.value(), 10);

    this.addCustomProperties(el, ['range', 'fraction-digits']);
  }

  public serialize(val: string): SerializationReturnType {
    return convert(val, SERIALIZATION_TYPE);
  }
}

applyMixins(DecimalType, [Named, RequiredField, WithCustomProperties]);
