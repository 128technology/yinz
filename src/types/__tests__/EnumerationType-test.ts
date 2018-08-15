import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import { EnumerationType } from '../';

describe('Enumeration Type', () => {
  const typeEl = xmlUtil.toElement(`
    <type ${yinNS} name="enumeration">
      <yin:enum name="foo" />
      <yin:enum name="bar" />
    </type>
  `);

  const obsoleteTypeEl = xmlUtil.toElement(`
    <type ${yinNS} name="enumeration">
      <yin:enum name="foo">
        <yin:status value="obsolete" />
      </yin:enum>
      <yin:enum name="bar" />
    </type>
  `);

  it('should match a enumeration type', () => {
    const name = typeEl.attr('name').value();

    expect(EnumerationType.matches(name)).to.equal(true);
  });

  it('should fail to parse if enums not present', () => {
    const badTypeEl = xmlUtil.toElement(`<type ${yinNS} name="enumeration" />`);

    expect(() => new EnumerationType(badTypeEl)).to.throw('enumeration type must specify enum.');
  });

  it('should parse', () => {
    const type = new EnumerationType(typeEl);

    expect(type.type).to.equal('enumeration');
  });

  it('should parse options', () => {
    const type = new EnumerationType(typeEl);

    expect(type.options).to.deep.equal(['foo', 'bar']);
  });

  it('should filter out obsolete options', () => {
    const type = new EnumerationType(obsoleteTypeEl);

    expect(type.options).to.deep.equal(['bar']);
  });

  it('should serialize', () => {
    const type = new EnumerationType(typeEl);

    expect(type.serialize('foo')).to.equal('foo');
  });
});
