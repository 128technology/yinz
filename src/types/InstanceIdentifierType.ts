import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';

import { Named, StringSerialize } from './mixins';

const TYPE = BuiltInType.instanceIdentifier;

// TODO: Currently not used.
export default class InstanceIdentifierType implements Named, StringSerialize {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public addNamedProps: Named['addNamedProps'];
  public serialize: StringSerialize['serialize'];
  public type: Named['type'];

  constructor(el: Element) {
    this.addNamedProps(el);
  }
}

applyMixins(InstanceIdentifierType, [Named, StringSerialize]);
