import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import { EnumerationMemberType } from '../';

describe('Enumeration Member Type', () => {
  const typeEl = xmlUtil.toElement(`
    <yin:enum ${yinNS} name="foo">
      <yin:description>
        <yin:text>This is a foo description.</yin:text>
      </yin:description>
      <yin:value value="0" />
      <yin:reference>
        <yin:text>RFC1997</yin:text>
      </yin:reference>
      <yin:status value="deprecated" />
    </yin:enum>
  `);

  const typeElEmpty = xmlUtil.toElement(`
    <yin:enum name="foo" />
  `);

  it('should parse', () => {
    const type = new EnumerationMemberType(typeEl);

    expect(type.description).to.equal('This is a foo description.');
    expect(type.value).to.equal(0);
    expect(type.reference).to.equal('RFC1997');
    expect(type.status).to.equal('deprecated');
  });

  it('should default status to `current`', () => {
    const type = new EnumerationMemberType(typeElEmpty);

    expect(type.status).to.equal('current');
  });

  it('should set missing fields to null', () => {
    const type = new EnumerationMemberType(typeElEmpty);

    expect(type.description).to.equal(null);
    expect(type.value).to.equal(null);
    expect(type.reference).to.equal(null);
  });
});
