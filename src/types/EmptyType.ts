import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import BuiltInType, { enumValueOf } from '../enum/BuiltInType';
import { SerializationReturnType } from '../enum/SerializationType';

import { Named } from './mixins';

const TYPE = BuiltInType.empty;

export default class EmptyType implements Named {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === TYPE;
  }

  public type: string;

  public addNamedProps: (el: Element) => void;

  constructor(el: Element) {
    this.addNamedProps(el);
  }

  public serialize(val: string): SerializationReturnType {
    // If this is called, the empty type must have existed, thus returning true.
    return true;
  }
}

applyMixins(EmptyType, [Named]);
