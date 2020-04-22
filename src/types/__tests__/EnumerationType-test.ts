import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import EnumerationMemberType from '../EnumerationMemberType';
import { EnumerationType } from '../';

describe('Enumeration Type', () => {
  const typeEl = xmlUtil.toElement(`
    <type ${yinNS} name="enumeration">
      <yin:enum name="foo">
        <yin:description>
          <yin:text>This is a foo description.</yin:text>
        </yin:description>
        <yin:value value="0" />
        <yin:reference>
          <yin:text>This is a foo reference.</yin:text>
        </yin:reference>
        <yin:status value="deprecated" />
      </yin:enum>
      <yin:enum name="bar">
        <yin:description>
          <yin:text>This is a bar description.</yin:text>
        </yin:description>
        <yin:value value="1" />
        <yin:reference>
          <yin:text>This is a foo reference.</yin:text>
        </yin:reference>
      </yin:enum>
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
    const name = typeEl.attr('name')!.value();

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

  it('should parse members', () => {
    const type = new EnumerationType(typeEl);
    const fooMember = new EnumerationMemberType(
      xmlUtil.toElement(`
        <yin:enum ${yinNS} name="foo">
          <yin:description>
            <yin:text>This is a foo description.</yin:text>
          </yin:description>
          <yin:value>0</yin:value>
          <yin:reference>
            <yin:text>This is a foo reference.</yin:text>
          </yin:reference>
          <yin:status value="deprecated" />
        </yin:enum>
      `)
    );

    const barMember = new EnumerationMemberType(
      xmlUtil.toElement(`
        <yin:enum ${yinNS} name="bar">
          <yin:description>
            <yin:text>This is a bar description.</yin:text>
          </yin:description>
          <yin:value>1</yin:value>
          <yin:reference>
            <yin:text>This is a foo reference.</yin:text>
          </yin:reference>
        </yin:enum>
      `)
    );

    expect(type.members).to.deep.equal(
      new Map([
        ['foo', fooMember],
        ['bar', barMember]
      ])
    );
  });

  it('should parse member options', () => {
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
