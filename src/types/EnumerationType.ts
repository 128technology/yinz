import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import { Status } from '../enum';
import { StatusParser } from '../model/parsers';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';
import { SerializationReturnType } from '../enum/SerializationType';

import { Named, RequiredField, StringSerialize } from './mixins';

const TYPE = BuiltInType.enumeration;

export default class EnumerationType implements Named, RequiredField, StringSerialize {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public type: string;
  public options: string[];

  public serialize: (val: string) => SerializationReturnType;
  public addNamedProps: (el: Element) => void;
  public validateRequiredFields: (el: Element, fields: string[], type: string) => void;

  constructor(el: Element) {
    this.addNamedProps(el);
    this.validateRequiredFields(el, ['enum'], this.type);
    this.parseType(el);
  }

  public parseType(el: Element) {
    this.options = el
      .find('./yin:enum', ns)
      .filter(enumEl => {
        const enumStatus = StatusParser.parse(enumEl);
        return enumStatus !== Status.obsolete;
      })
      .map(enumEl => enumEl.attr('name').value());
  }
}

applyMixins(EnumerationType, [Named, RequiredField, StringSerialize]);
