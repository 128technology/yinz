import { Element } from 'libxmljs2';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';
import { Identities } from '../model';
import { SerializationReturnType } from '../enum/SerializationType';
import { assertElement } from '../util/xmlUtil';

import TypeParser from './util/TypeParser';
import { Named, RequiredField, WithCustomProperties } from './mixins';
import { Type } from './';

const TYPE = BuiltInType.leafref;

export default class LeafRefType implements Named, RequiredField, WithCustomProperties {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public addNamedProps: Named['addNamedProps'];
  public type: Named['type'];
  public validateRequiredFields: RequiredField['validateRequiredFields'];

  public path: string;
  public refType: Type;

  public addCustomProperties: WithCustomProperties['addCustomProperties'];
  public otherProps: WithCustomProperties['otherProps'];

  constructor(el: Element, identities: Identities) {
    this.addNamedProps(el);
    this.validateRequiredFields(el, ['path'], this.type);
    this.parseType(el, identities);
  }

  public parseType(el: Element, identities: Identities) {
    const typeEl = assertElement(el.get('./yin:type', ns)!);
    this.refType = TypeParser.parse(typeEl, identities);
    this.path = assertElement(el.get('./yin:path', ns)!).attr('value')!.value();

    this.addCustomProperties(el, ['type', 'path']);
  }

  public serialize(val: string): SerializationReturnType {
    return this.refType.serialize(val);
  }
}

applyMixins(LeafRefType, [Named, RequiredField, WithCustomProperties]);
