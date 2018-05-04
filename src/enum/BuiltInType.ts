import * as _ from 'lodash';

export function enumValueOf(value: string): BuiltInType | null {
  const theType = _.camelCase(value);

  if (Object.keys(BuiltInType).indexOf(theType) !== -1) {
    return BuiltInType[theType as keyof typeof BuiltInType];
  } else {
    return null;
  }
}

export enum BuiltInType {
  binary,
  bits,
  boolean,
  decimal64,
  empty,
  enumeration,
  identityref,
  instanceIdentifier,
  int8,
  int16,
  int32,
  int64,
  leafref,
  string,
  uint8,
  uint16,
  uint32,
  uint64,
  union
}

export default BuiltInType;
