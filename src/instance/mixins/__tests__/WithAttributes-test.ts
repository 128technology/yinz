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

  it('should parse attribues and allow getting of them as a Map', () => {
    const testModel = new Test();
    testModel.parseAttributesFromXML(mockConfigXML);

    expect(Array.from(testModel.customAttributes.entries())).to.deep.equal([
      ['foo', 'bar'],
      ['fizz', 'baz']
    ]);
  });

  it('should parse attribues and retain namespaces when adding them', () => {
    const testModel = new Test();
    const el = xmlUtil.toElement('<qp-value />');
    testModel.parseAttributesFromXML(mockConfigXML);
    testModel.addAttributes(el);

    expect(el.toString()).xml.to.equal(
      '<qp-value xmlns:if="http://128technology.com/t128/config/interface-config" foo="bar" if:fizz="baz" />'
    );
  });

  it('should determine if attributes exist', () => {
    const testModel = new Test();
    testModel.parseAttributesFromXML(mockConfigXML);

    expect(testModel.hasAttributes).to.equal(true);
  });

  it('should determine if attributes exist', () => {
    const testModel = new Test();
    testModel.parseAttributesFromXML(xmlUtil.toElement('<qp-value />'));

    expect(testModel.hasAttributes).to.equal(false);
  });
});
