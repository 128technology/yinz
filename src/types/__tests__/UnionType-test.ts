import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import { UnionType } from '../';
import { Identities } from '../../model';

describe('Union Type', () => {
  const typeEl = xmlUtil.toElement(`
    <type ${yinNS} name="union">
      <yin:type name="string" />
      <yin:type name="boolean" />
    </type>
  `);

  it('should match a union type', () => {
    const name = typeEl.attr('name')!.value();

    expect(UnionType.matches(name)).to.equal(true);
  });

  it('should fail to parse if no subtypes specified', () => {
    const badTypeEl = xmlUtil.toElement(`<type ${yinNS} name="union" />`);

    expect(() => new UnionType(badTypeEl, {} as Identities)).to.throw();
  });

  it('should parse', () => {
    const type = new UnionType(typeEl, {} as Identities);

    expect(type.type).to.equal('union');
  });

  it('should serialize to a string', () => {
    const type = new UnionType(typeEl, {} as Identities);

    expect(type.serialize('foo')).to.equal('foo');
  });

  it('should allow visiting nested types', () => {
    const nestedTypeEl = xmlUtil.toElement(`
      <type ${yinNS} name="union">
        <yin:type name="string" />
        <yin:type name="union">
            <yin:type name="boolean" />
            <yin:type name="uint32" />
        </yin:type>
      </type>
    `);

    const type = new UnionType(nestedTypeEl, {} as Identities);

    let count = 0;
    type.traverse(() => count++);
    expect(count).to.equal(5);
  });
});
