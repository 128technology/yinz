import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';

import Range from './Range';
import { Named, StringSerialize } from './mixins';

const TYPE = BuiltInType.string;

export default class StringType implements Named, StringSerialize {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public addNamedProps: Named['addNamedProps'];
  public serialize: StringSerialize['serialize'];
  public type: Named['type'];

  public pattern: string;
  public length: Range;

  constructor(el: Element) {
    this.addNamedProps(el);
    this.parseType(el);
  }

  public parseType(el: Element) {
    const lengthEl = el.get('./yin:length', ns);
    const patternEl = el.get('./yin:pattern', ns);

    if (lengthEl) {
      this.length = new Range(lengthEl);
    }

    if (patternEl) {
      this.pattern = patternEl.attr('value')!.value();
    }
  }
}

applyMixins(StringType, [Named, StringSerialize]);
