import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';
import { Identities } from '../model';
import { SerializationReturnType } from '../enum/SerializationType';

import TypeParser from './util/TypeParser';
import { Named, RequiredField } from './mixins';
import { Type } from './';

const TYPE = BuiltInType.leafref;

export default class LeafRefType implements Named, RequiredField {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public addNamedProps: Named['addNamedProps'];
  public type: Named['type'];
  public validateRequiredFields: RequiredField['validateRequiredFields'];

  public path: string;
  public refType: Type;

  constructor(el: Element, identities?: Identities) {
    this.addNamedProps(el);
    this.validateRequiredFields(el, ['path'], this.type);
    this.parseType(el, identities);
  }

  public parseType(el: Element, identities?: Identities) {
    const typeEl = el.get('./yin:type', ns);
    this.refType = TypeParser.parse(typeEl, identities);
    this.path = el.get('./yin:path', ns).attr('value').value();
  }

  public serialize(val: string): SerializationReturnType {
    return this.refType.serialize(val);
  }
}

applyMixins(LeafRefType, [Named, RequiredField]);
