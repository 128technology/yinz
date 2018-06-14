import { expect } from 'chai';
import { Element } from 'libxmljs';

import applyMixins from '../../../util/applyMixins';
import xmlUtil from '../../../__tests__/xmlUtil';
import { WithAttributes } from '../';

describe('With Attributes Mixin', () => {
  const mockConfig = `
    <if:qp-value xmlns:if="http://128technology.com/t128/config/interface-config" foo="bar" if:fizz="baz">5</if:qp-value>
  `;
  const mockConfigXML = xmlUtil.toElement(mockConfig);

  class Test implements WithAttributes {
    public config: Element;
    public customAttributes: Map<string, string>;
  }

  applyMixins(Test, [WithAttributes]);

  it('should walk parents until it finds identities', () => {
    const testModel = new Test();
    testModel.config = mockConfigXML;

    expect(Array.from(testModel.customAttributes.entries())).to.deep.equal([['foo', 'bar'], ['fizz', 'baz']]);
  });
});
