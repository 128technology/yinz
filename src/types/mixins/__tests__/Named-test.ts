import { expect } from 'chai';
import { Element } from 'libxmljs';

import applyMixins from '../../../util/applyMixins';
import xmlUtil, { yinNS } from '../../../__tests__/xmlUtil';
import { Named } from '../';

describe('Named Type Mixin', () => {
  const typeEl = xmlUtil.toElement(`
    <type ${yinNS} name="string">
      <yin:length value="0..253" />
      <yin:pattern value="*" />
    </type>
  `);

  class Test implements Named {
    public type: string;
    public addNamedProps: (el: Element) => void;
  }

  applyMixins(Test, [Named]);

  it('should parse the type name', () => {
    const testType = new Test();
    testType.addNamedProps(typeEl);

    expect(testType.type).to.equal('string');
  });
});
