import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import { BitsType } from '../';

describe('Bits Type', () => {
  const typeEl = xmlUtil.toElement(`
    <type ${yinNS} name="bits">
      <yin:bit>foo</yin:bit>
      <yin:bit position="1">bar</yin:bit>
    </type>
  `);

  it('should match a bits type', () => {
    const name = typeEl.attr('name').value();

    expect(BitsType.matches(name)).to.equal(true);
  });

  it('should fail to parse if bit is not present', () => {
    const badTypeEl = xmlUtil.toElement(`<type ${yinNS} name="bits" />`);

    expect(() => new BitsType(badTypeEl)).to.throw('bits type must specify bit.');
  });

  it('should parse', () => {
    const type = new BitsType(typeEl);

    expect(type.type).to.equal('bits');
  });

  it('should serialize to a string', () => {
    const type = new BitsType(typeEl);

    expect(type.serialize('carrots peas')).to.equal('carrots peas');
  });
});
