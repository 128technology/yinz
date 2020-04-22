import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import { BooleanType } from '../';

describe('Boolean Type', () => {
  const typeEl = xmlUtil.toElement(`<type ${yinNS} name="boolean" />`);

  it('should match a boolean type', () => {
    const name = typeEl.attr('name')!.value();

    expect(BooleanType.matches(name)).to.equal(true);
  });

  it('should parse', () => {
    const type = new BooleanType(typeEl);

    expect(type.type).to.equal('boolean');
  });

  it('should serialize true to a boolean', () => {
    const type = new BooleanType(typeEl);

    expect(type.serialize('true')).to.equal(true);
  });

  it('should serialize false to a boolean', () => {
    const type = new BooleanType(typeEl);

    expect(type.serialize('false')).to.equal(false);
  });
});
