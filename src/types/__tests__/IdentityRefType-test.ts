import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import Identities from '../../model/Identities';
import { IdentityRefType } from '../';

describe('IdentityRef Type', () => {
  const typeEl = xmlUtil.toElement(`
    <type ${yinNS} name="identityref">
      <yin:base name="action-type" />
    </type>
  `);
  const mockIdentitiesEl = xmlUtil.toElement(`
    <mock ${yinNS}>
      <yin:identity name="modify-metric" module-prefix="rp">
        <yin:base name="action-type" />
        <yin:description>
          <yin:text>an action which sets the metric</yin:text>
        </yin:description>
      </yin:identity>
      <yin:identity name="bgp" module-prefix="rt">
        <yin:base name="rt:routing-protocol" />
        <yin:description>
          <yin:text>bgp routing protocol</yin:text>
        </yin:description>
      </yin:identity>
    </mock>
  `);
  const emptyIdentities = new Identities();
  const mockIdentities = new Identities(mockIdentitiesEl);

  it('should match a identityref type', () => {
    const name = typeEl.attr('name')!.value();

    expect(IdentityRefType.matches(name)).to.equal(true);
  });

  it('should fail to parse if base is not specified', () => {
    const badTypeEl = xmlUtil.toElement(`<type ${yinNS} name="identityref" />`);

    expect(() => new IdentityRefType(badTypeEl, emptyIdentities)).to.throw('identityref type must specify base.');
  });

  it('should parse', () => {
    const type = new IdentityRefType(typeEl, emptyIdentities);

    expect(type.type).to.equal('identityref');
  });

  it('should get options from identities', () => {
    const type = new IdentityRefType(typeEl, mockIdentities);

    expect(type.options).to.deep.equal(['rp:modify-metric']);
  });

  it('should get options if identity does not exist', () => {
    const type = new IdentityRefType(typeEl, emptyIdentities);

    expect(type.options).to.deep.equal([]);
  });

  it('should serialize', () => {
    const type = new IdentityRefType(typeEl, emptyIdentities);

    expect(type.serialize('foo')).to.equal('foo');
  });
});
