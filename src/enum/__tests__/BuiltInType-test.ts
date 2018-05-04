import { expect } from 'chai';

import BuiltInType, { enumValueOf } from '../BuiltInType';

describe('Built-In Types', () => {
  it('should get enum value of lowercased type', () => {
    const val = enumValueOf('int32');

    expect(val).to.equal(BuiltInType.int32);
  });

  it('should get enum value of kebab-cased type', () => {
    const val = enumValueOf('instance-identifier');

    expect(val).to.equal(BuiltInType.instanceIdentifier);
  });

  it('should get enum value null for no match', () => {
    const val = enumValueOf('moo');

    expect(val).to.equal(null);
  });
});
