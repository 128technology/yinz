import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import ns from '../util/ns';
import { Identities } from '../model';
import { SerializationReturnType } from '../enum/SerializationType';

import { Named, RequiredField, StringSerialize } from './mixins';

const TYPE = BuiltInType.identityref;

export default class IdentityRefType implements Named, StringSerialize, RequiredField {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public type: string;
  public options: string[];

  public serialize: (val: string) => SerializationReturnType;
  public addNamedProps: (el: Element) => void;
  public validateRequiredFields: (el: Element, fields: string[], type: string) => void;

  constructor(el: Element, identities: Identities) {
    this.addNamedProps(el);
    this.validateRequiredFields(el, ['base'], this.type);
    this.parseType(el, identities);
  }

  public parseType(el: Element, identities: Identities) {
    const base = el.get('./yin:base', ns).attr('name').value();

    this.options = identities.getOptions(base);
  }
}

applyMixins(IdentityRefType, [Named, RequiredField, StringSerialize]);
