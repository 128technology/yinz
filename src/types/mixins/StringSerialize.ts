import { SerializationReturnType } from '../../enum/SerializationType';

export default class StringSerialize {
  public serialize(val: string): SerializationReturnType {
    return val;
  }
}
