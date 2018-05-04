import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import { InstanceIdentifierType } from '../';

describe('Instance Identifier Type', () => {
  const typeEl = xmlUtil.toElement(`<type ${yinNS} name="instance-identifier" />`);

  it('should match a instance-identifier type', () => {
    const name = typeEl.attr('name').value();

    expect(InstanceIdentifierType.matches(name)).to.equal(true);
  });

  it('should parse', () => {
    const type = new InstanceIdentifierType(typeEl);

    expect(type.type).to.equal('instance-identifier');
  });
});
