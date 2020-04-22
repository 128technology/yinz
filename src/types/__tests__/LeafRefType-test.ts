import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import { LeafRefType } from '../';
import { Identities } from '../../model';

describe('LeafRef Type', () => {
  const typeEl = xmlUtil.toElement(`
    <type ${yinNS} name="leafref">
      <yin:path value="/t128:config/authy:authority/authy:security/authy:name" />
      <yin:type name="int32" />
    </type>
  `);

  it('should match a leafref type', () => {
    const name = typeEl.attr('name')!.value();

    expect(LeafRefType.matches(name)).to.equal(true);
  });

  it('should fail to parse if no path', () => {
    const badTypeEl = xmlUtil.toElement(`<type ${yinNS} name="leafref" />`);

    expect(() => new LeafRefType(badTypeEl, {} as Identities)).to.throw('leafref');
  });

  it('should parse', () => {
    const type = new LeafRefType(typeEl, {} as Identities);

    expect(type.type).to.equal('leafref');
  });

  it('should serialize to the reference type', () => {
    const type = new LeafRefType(typeEl, {} as Identities);

    expect(type.serialize('5')).to.equal(5);
  });
});
