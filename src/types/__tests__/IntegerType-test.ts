import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import { IntegerType } from '../';

const TYPES = ['int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64'];

describe('Integer Type', () => {
  TYPES.forEach(type => {
    it(`should match ${type} type`, () => {
      const typeEl = xmlUtil.toElement(`<type ${yinNS} name="${type}" />`);
      const name = typeEl.attr('name')!.value();

      expect(IntegerType.matches(name)).to.equal(true);
    });
  });
  const int32TypeEl = xmlUtil.toElement(`<type ${yinNS} name="${TYPES[2]}" />`);

  it('should parse', () => {
    const type = new IntegerType(int32TypeEl);

    expect(type.type).to.equal('int32');
  });

  it('should serialize to an integer', () => {
    const type = new IntegerType(int32TypeEl);

    expect(type.serialize('50')).to.equal(50);
  });
});
