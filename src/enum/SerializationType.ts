import * as _ from 'lodash';

export function convert(val: string, serializationType: SerializationType) {
  if (serializationType === SerializationType.number) {
    return _.toNumber(val);
  } else if (serializationType === SerializationType.boolean) {
    return val === 'true';
  }

  return val;
}

export type SerializationReturnType = boolean | number | string;

export enum SerializationType {
  number,
  string,
  boolean
}

export default SerializationType;
