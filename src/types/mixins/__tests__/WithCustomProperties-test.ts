import { expect } from 'chai';
import { Element } from 'libxmljs';
import applyMixins from '../../../util/applyMixins';
import xmlUtil, { yinNS } from '../../../__tests__/xmlUtil';
import { WithCustomProperties } from '../';

describe('Custom Properties Mixin', () => {
    const typeEl = xmlUtil.toElement(`
    <type ${yinNS} name="string">
      <foo>bar</foo>
      <moo/>
      <zoo/>
    </type>
  `);
  class Test implements WithCustomProperties {
    public otherProps: Map<string, string | boolean>;;
    public addCustomProperties: (el: Element, ignoreList: string[]) => void;
  }

  applyMixins(Test, [WithCustomProperties]);

  it('should parse the other properties', () => {
    const testOther = new Test();
    testOther.addCustomProperties(typeEl, ['zoo']);
    const map = testOther.otherProps;
    expect(map.get('foo')).to.equal('bar');
    expect(map.get('moo')).to.equal(true);
    expect(map.has('zoo')).to.equal(false);
  });
});