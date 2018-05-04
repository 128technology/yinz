import { expect } from 'chai';

import applyMixins from '../../../util/applyMixins';
import { SerializationReturnType } from '../../../enum/SerializationType';
import { StringSerialize } from '../';

describe('String Serialize Mixin', () => {
  class Test implements StringSerialize {
    public serialize: (val: string) => SerializationReturnType;
  }

  applyMixins(Test, [StringSerialize]);

  it('should parse the type name', () => {
    const testType = new Test();

    expect(testType.serialize('foo')).to.equal('foo');
  });
});
