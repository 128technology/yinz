import { expect } from 'chai';

import applyMixins from '../../../util/applyMixins';
import xmlUtil from '../../../__tests__/xmlUtil';
import { WithAttributes } from '../';

describe('With Attributes Mixin', () => {
  const mockConfig = `
    <if:qp-value xmlns:if="http://128technology.com/t128/config/interface-config" foo="bar" if:fizz="baz">5</if:qp-value>
  `;
  const mockConfigXML = xmlUtil.toElement(mockConfig);

  class Test extends WithAttributes implements WithAttributes {}

  applyMixins(Test, [WithAttributes]);

  it('should parse arguments', () => {
    const testModel = new Test();
    testModel.parseCustomAttributes(mockConfigXML);

    expect(Array.from(testModel.customAttributes.entries())).to.deep.equal([
      ['foo', 'bar'],
      ['fizz', 'baz']
    ]);
  });
});
