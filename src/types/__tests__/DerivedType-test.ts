import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import { DerivedType, StringType, Range } from '../';
import { Identities } from '../../model';

describe('Derived Type', () => {
  const typeEl = xmlUtil.toElement(`
    <yin:type ${yinNS} name="t128ext:name-id">
      <yin:typedef name="name-id">
        <yin:description>
          <yin:text>A string identifier.</yin:text>
        </yin:description>
        <yin:type name="string">
          <yin:pattern value="([a-zA-Z0-9]([a-zA-Z0-9\-_]){0,61})?[a-zA-Z0-9]">
            <yin:error-message>
              <yin:value>Must contain only alphanumeric characters or any of the following: _ -</yin:value>
            </yin:error-message>
          </yin:pattern>
          <yin:length value="0..63"/>
        </yin:type>
        <yin:default value="foo" />
        <yin:units name="flips" />
      </yin:typedef>
    </yin:type>
  `);

  const nestedDerivedType = xmlUtil.toElement(`
    <yin:type ${yinNS} name="t128ext:name-id">
      <yin:typedef name="name-id">
        <yin:type name="foo:bar">
          <yin:typedef name="bar">
            <yin:type name="string" />
            <yin:default value="baz" />
          </yin:typedef>
        </yin:type>
      </yin:typedef>
    </yin:type>
  `);

  const nestedDerivedTypeMultipleDefault = xmlUtil.toElement(`
    <yin:type ${yinNS} name="t128ext:name-id">
      <yin:typedef name="name-id">
        <yin:default value="kittens" />
        <yin:type name="foo:bar">
          <yin:typedef name="bar">
            <yin:type name="string" />
            <yin:default value="baz" />
          </yin:typedef>
        </yin:type>
      </yin:typedef>
    </yin:type>
  `);

  const intDerivedType = xmlUtil.toElement(`
    <yin:type ${yinNS} name="t128ext:security-identifier">
      <yin:typedef name="security-identifier">
        <yin:description>
          <yin:text>A unique identifier for security keys.</yin:text>
        </yin:description>
        <yin:type name="uint32"/>
      </yin:typedef>
    </yin:type>
  `);

  const restrictedTypeEl = xmlUtil.toElement(`
    <yin:type ${yinNS} name="t128ext:hex-string">
      <yin:length value="8 | 16 | 20 | 32 | 64"/>
      <yin:typedef name="hex-string">
        <yin:description>
          <yin:text>A hexadecimal string with octets represented as hex digits.</yin:text>
        </yin:description>
        <yin:type name="string">
          <yin:pattern value="[0-9a-fA-F]{2}([0-9a-fA-F]{2})*"/>
        </yin:type>
      </yin:typedef>
    </yin:type>
  `);

  const extendedTypeEl = xmlUtil.toElement(`
    <yin:type ${yinNS}  xmlns:t128ext="http://128technology.com/t128-extensions" name="some-extended-type">
      <yin:typedef name="some-extended-type">
        <yin:description>
          <yin:text>This field allows a free-form string or a security name</yin:text>
        </yin:description>
        <yin:type name="string">
          <yin:pattern value="[0-9a-fA-F]{2}([0-9a-fA-F]{2})*"/>
        </yin:type>
        <t128ext:suggestionref>/t128:config/authy:authority/svc:security/svc:name</t128ext:suggestionref>
      </yin:typedef>
    </yin:type>
  `);

  it('should match a derived type', () => {
    const name = typeEl.attr('name')!.value();

    expect(DerivedType.matches(name)).to.equal(true);
  });

  it('should not match a built-in type', () => {
    expect(DerivedType.matches('enumeration')).to.equal(false);
  });

  it('should parse', () => {
    const type = new DerivedType(typeEl, {} as Identities);

    expect(type.type).to.equal('t128ext:name-id');
  });

  it('should parse description', () => {
    const type = new DerivedType(typeEl, {} as Identities);

    expect(type.description).to.equal('A string identifier.');
  });

  it('should parse no description', () => {
    const type = new DerivedType(nestedDerivedTypeMultipleDefault, {} as Identities);

    expect(type.description).to.equal(undefined);
  });

  it('should parse default', () => {
    const type = new DerivedType(typeEl, {} as Identities);

    expect(type.default).to.equal('foo');
  });

  it('should parse no default', () => {
    const type = new DerivedType(intDerivedType, {} as Identities);

    expect(type.default).to.equal(undefined);
  });

  it('should parse a nested default', () => {
    const type = new DerivedType(nestedDerivedType, {} as Identities);

    expect(type.default).to.equal('baz');
  });

  it('should parse a nested built in type', () => {
    const type = new DerivedType(nestedDerivedType, {} as Identities);

    expect(type.builtInType.type).to.equal('string');
  });

  it('should make the outer most default win', () => {
    const type = new DerivedType(nestedDerivedTypeMultipleDefault, {} as Identities);

    expect(type.default).to.equal('kittens');
  });

  it('should parse units', () => {
    const type = new DerivedType(typeEl, {} as Identities);

    expect(type.units).to.equal('flips');
  });

  it('should contain a child type', () => {
    const type = new DerivedType(restrictedTypeEl, {} as Identities);

    expect(type.baseType).to.be.an.instanceof(StringType);
  });

  it('should propagate restrictions to the child', () => {
    const type = new DerivedType(restrictedTypeEl, {} as Identities);

    expect((type.baseType as StringType).length).to.be.an.instanceof(Range);
  });

  it('should serialize as the base type', () => {
    const type = new DerivedType(intDerivedType, {} as Identities);

    expect(type.serialize('5')).to.equal(5);
  });

  it('should parse suggestion reference', () => {
    const type = new DerivedType(extendedTypeEl, {} as Identities);

    expect(type.suggestionRefs).to.deep.equal(['/t128:config/authy:authority/svc:security/svc:name']);
  });
});
