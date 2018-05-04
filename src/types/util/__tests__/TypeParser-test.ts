import { expect } from 'chai';

import Identities from '../../../model/Identities';
import TypeParser from '../TypeParser';
import xmlUtil, { yinNS } from '../../../__tests__/xmlUtil';
import { StringType } from '../../';

describe('Type Parser', () => {
  const typeEl = xmlUtil.toElement(`
    <type ${yinNS} name="string">
      <yin:length value="0..253" />
      <yin:pattern value="*" />
    </type>
  `);

  it('should parse and construct a new type', () => {
    const type = TypeParser.parse(typeEl, new Identities());

    expect(type).to.be.an.instanceof(StringType);
  });
});
