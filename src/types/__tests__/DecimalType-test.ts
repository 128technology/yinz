import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import { DecimalType } from '../';

describe('Decimal Type', () => {
  const typeEl = xmlUtil.toElement(`
    <type ${yinNS} name="decimal64">
      <yin:fraction-digits value="3" />
    </type>
  `);

  it('should match a decimal type', () => {
    const name = typeEl.attr('name')!.value();

    expect(DecimalType.matches(name)).to.equal(true);
  });

  it('should throw on parse if no fraction-digits', () => {
    const badTypeEl = xmlUtil.toElement(`<type ${yinNS} name="decimal64" />`);
    expect(() => new DecimalType(badTypeEl)).to.throw('decimal64 type must specify fraction-digits.');
  });

  it('should parse', () => {
    const type = new DecimalType(typeEl);

    expect(type.type).to.equal('decimal64');
  });

  it('should serialize to decimal', () => {
    const type = new DecimalType(typeEl);

    expect(type.serialize('5.123')).to.equal(5.123);
  });
});
