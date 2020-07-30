import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import { StringType, Range } from '../';

describe('String Type', () => {
  const typeEl = xmlUtil.toElement(`
    <type ${yinNS} name="string">
      <yin:length value="0..253" />
      <yin:pattern value="*" />
      <foo>bar</foo>
      <moo/>
    </type>
  `);

  it('should match a string type', () => {
    const name = typeEl.attr('name')!.value();

    expect(StringType.matches(name)).to.equal(true);
  });

  it('should parse', () => {
    const type = new StringType(typeEl);

    expect(type.type).to.equal('string');
  });

  it('should parse length', () => {
    const type = new StringType(typeEl);

    expect(type.length).to.be.an.instanceof(Range);
  });

  it('should parse pattern', () => {
    const type = new StringType(typeEl);

    expect(type.pattern).to.equal('*');
  });

  it('should serialize to a string', () => {
    const type = new StringType(typeEl);

    expect(type.serialize('foo')).to.equal('foo');
  });

  it('should parse text property', () => {
    const type = new StringType(typeEl);

    expect(type.otherProps.get('moo')).to.equal(true);
  });

  it('should parse presence property', () => {
    const type = new StringType(typeEl);

    expect(type.otherProps.get('foo')).to.equal('bar');
  });
});
