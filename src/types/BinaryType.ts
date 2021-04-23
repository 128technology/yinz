import { Element } from 'libxmljs2';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';
import { assertElement } from '../util/xmlUtil';

import Range from './Range';
import { Named, StringSerialize, WithCustomProperties } from './mixins';

const TYPE = BuiltInType.binary;

export default class BinaryType implements Named, StringSerialize, WithCustomProperties {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public addNamedProps: Named['addNamedProps'];
  public serialize: StringSerialize['serialize'];
  public type: Named['type'];

  public length: Range;

  public addCustomProperties: WithCustomProperties['addCustomProperties'];
  public otherProps: WithCustomProperties['otherProps'];

  constructor(el: Element) {
    this.addNamedProps(el);
    this.parseType(el);
  }

  public parseType(el: Element) {
    const lengthEl = el.get('./yin:length', ns);

    if (lengthEl) {
      this.length = new Range(assertElement(lengthEl));
    }
    this.addCustomProperties(el, ['length']);
  }
}

applyMixins(BinaryType, [Named, StringSerialize, WithCustomProperties]);
