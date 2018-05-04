import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import { BinaryType, Range } from '../';

describe('Binary Type', () => {
  const typeEl = xmlUtil.toElement(`
    <type ${yinNS} name="binary">
      <yin:length value="0..63"/>
    </type>
  `);

  it('should match a binary type', () => {
    const name = typeEl.attr('name').value();

    expect(BinaryType.matches(name)).to.equal(true);
  });

  it('should parse', () => {
    const type = new BinaryType(typeEl);

    expect(type.type).to.equal('binary');
  });

  it('should parse length', () => {
    const type = new BinaryType(typeEl);

    expect(type.length).to.be.an.instanceof(Range);
  });

  it('should serialize to a string', () => {
    const type = new BinaryType(typeEl);

    // Zm9v is 'foo' base64 encoded
    expect(type.serialize('Zm9v')).to.equal('Zm9v');
  });
});
