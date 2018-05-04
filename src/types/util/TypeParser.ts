import { Element } from 'libxmljs';

import BuiltInType from '../../enum/BuiltInType';
import ns from '../../util/ns';
import { Identities } from '../../model';
import { Type } from '../';
import {
  BinaryType,
  BitsType,
  BooleanType,
  DecimalType,
  DerivedType,
  EmptyType,
  EnumerationType,
  IdentityRefType,
  InstanceIdentifierType,
  IntegerType,
  LeafRefType,
  StringType,
  UnionType
} from '../';

interface IConstructable {
  new (el: Element, identities?: Identities): Type;
}

function getTypeConstructor(typeName: string): IConstructable {
  const TYPE_REGISTRY = [
    BinaryType,
    BitsType,
    BooleanType,
    DecimalType,
    DerivedType,
    EmptyType,
    EnumerationType,
    IdentityRefType,
    InstanceIdentifierType,
    IntegerType,
    LeafRefType,
    StringType,
    UnionType
  ];

  return TYPE_REGISTRY.find(typeDef => typeDef.matches(typeName));
}

export default class TypeParser {
  public static parse(typeEl: Element, identities: Identities): Type {
    const typeName = typeEl.attr('name').value();
    const MatchedType = getTypeConstructor(typeName);

    return new MatchedType(typeEl, identities);
  }
}
