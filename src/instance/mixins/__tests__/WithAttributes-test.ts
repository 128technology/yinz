import { expect } from 'chai';

import applyMixins from '../../../util/applyMixins';
import xmlUtil from '../../../__tests__/xmlUtil';
import { WithAttributes } from '../';
import { configModel } from '../../../model/__tests__/DataModel-test';
import { LeafList, List } from '../../../model';

describe('With Attributes Mixin', () => {
  const mockConfig = `
    <if:qp-value xmlns:if="http://128technology.com/t128/config/interface-config" foo="bar" if:fizz="baz">5</if:qp-value>
  `;
  const mockConfigXML = xmlUtil.toElement(mockConfig);

  class Test extends WithAttributes implements WithAttributes {
    public rawAttributes: WithAttributes['rawAttributes'] = [];
  }

  applyMixins(Test, [WithAttributes]);

  it('should parse attribues and allow getting of them as a Map', () => {
    const testModel = new Test();
    testModel.parseAttributesFromXML(mockConfigXML);

    expect(Array.from(testModel.customAttributes.entries())).to.deep.equal([
      ['foo', 'bar'],
      ['fizz', 'baz']
    ]);
  });

  it('should parse attribues from XML and retain namespaces when adding them', () => {
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

  it('should determine if attributes do not exist', () => {
    const testModel = new Test();
    testModel.parseAttributesFromXML(xmlUtil.toElement('<qp-value />'));

    expect(testModel.hasAttributes).to.equal(false);
  });

  it('should parse attribues from JSON and retain namespaces when adding them', () => {
    const testModel = new Test();
    const el = xmlUtil.toElement('<qp-value />');
    testModel.parseAttributesFromJSON({
      _attributes: [{ name: 'test', value: 'foobar', prefix: 'ab', href: 'http://128' }],
      _value: 'foo'
    });
    testModel.addAttributes(el);

    expect(el.toString()).xml.to.equal('<qp-value xmlns:ab="http://128" ab:test="foobar" />');
  });

  it('should add operations', () => {
    const testModel = new Test();
    const el = xmlUtil.toElement('<qp-value />');
    testModel.parseAttributesFromJSON({
      _operation: 'create',
      _value: 'foo'
    });
    testModel.addAttributes(el);

    expect(el.toString()).xml.to.equal(
      '<qp-value xmlns:xc="urn:ietf:params:xml:ns:netconf:base:1.0" xc:operation="create" />'
    );
  });

  it('should add operations without value', () => {
    const testModel = new Test();
    const el = xmlUtil.toElement('<qp-value />');
    testModel.parseAttributesFromJSON({
      _operation: 'create'
    });
    testModel.addAttributes(el);

    expect(el.toString()).xml.to.equal(
      '<qp-value xmlns:xc="urn:ietf:params:xml:ns:netconf:base:1.0" xc:operation="create" />'
    );
  });

  it('should add list operations without value', () => {
    const testModel = new Test();
    testModel.model = configModel.getModelForPath('authority.router.node.device-interface.capture-filter') as LeafList;
    const el = xmlUtil.toElement('<capture-filter />');
    testModel.parseAttributesFromJSON({
      _operation: 'create',
      _position: { insert: 'first' },
      _value: 'foo'
    });
    testModel.addAttributes(el);

    expect(el.toString()).xml.to.equal(
      '<capture-filter xmlns:yang="urn:ietf:params:xml:ns:yang:1" xmlns:xc="urn:ietf:params:xml:ns:netconf:base:1.0" xc:operation="create" yang:insert="first" />'
    );
  });

  it('should add list operations with value', () => {
    const testModel = new Test();
    testModel.model = configModel.getModelForPath('authority.router.node.device-interface.capture-filter') as LeafList;
    const el = xmlUtil.toElement('<capture-filter />');
    testModel.parseAttributesFromJSON({
      _operation: 'create',
      _position: { insert: 'after', value: 'bar' },
      _value: 'foo'
    });
    testModel.addAttributes(el);

    expect(el.toString()).xml.to.equal(
      '<capture-filter xmlns:yang="urn:ietf:params:xml:ns:yang:1" xmlns:xc="urn:ietf:params:xml:ns:netconf:base:1.0" xc:operation="create" yang:insert="after" yang:value="bar" />'
    );
  });

  it('should add list operations with keys', () => {
    const testModel = new Test();
    testModel.model = configModel.getModelForPath(
      'authority.router.node.device-interface.network-interface.neighborhood'
    ) as List;
    const el = xmlUtil.toElement('<neighborhood />');
    testModel.parseAttributesFromJSON({
      _operation: 'create',
      _position: {
        insert: 'after',
        keys: [{ key: 'name', value: 'bar' }]
      },
      _value: 'foo'
    });
    testModel.addAttributes(el);

    expect(el.toString()).xml.to.equal(
      '<neighborhood xmlns:yang="urn:ietf:params:xml:ns:yang:1" xmlns:xc="urn:ietf:params:xml:ns:netconf:base:1.0" xc:operation="create" yang:insert="after" yang:key="[if:name=\'bar\']" />'
    );
  });
});
