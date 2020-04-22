import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import { EmptyType } from '../';

describe('Empty Type', () => {
  const typeEl = xmlUtil.toElement(`<type ${yinNS} name="empty" />`);

  it('should match a empty type', () => {
    const name = typeEl.attr('name')!.value();

    expect(EmptyType.matches(name)).to.equal(true);
  });

  it('should parse', () => {
    const type = new EmptyType(typeEl);

    expect(type.type).to.equal('empty');
  });

  it('should serialize', () => {
    const type = new EmptyType(typeEl);

    expect(type.serialize('')).to.equal(true);
  });
});
