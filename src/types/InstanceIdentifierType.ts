import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';

import { Named, StringSerialize, WithCustomProperties } from './mixins';

const TYPE = BuiltInType.instanceIdentifier;

// TODO: Currently not used.
export default class InstanceIdentifierType implements Named, StringSerialize, WithCustomProperties {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public addNamedProps: Named['addNamedProps'];
  public serialize: StringSerialize['serialize'];
  public type: Named['type'];

  public addCustomProperties: WithCustomProperties['addCustomProperties'];
  public otherProps: WithCustomProperties['otherProps'];

  constructor(el: Element) {
    this.addNamedProps(el);
    this.addCustomProperties(el);
  }
}

applyMixins(InstanceIdentifierType, [Named, StringSerialize, WithCustomProperties]);
