import { Document } from 'libxmljs';
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import { LeafList, Container } from '../../model';
import { LeafListInstance, ContainerInstance } from '../';
import { allow } from '../util';

describe('Leaf List Instance', () => {
  const modelText = fs.readFileSync(path.join(__dirname, '../../model/__tests__/data/testLeafList.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);
  const leafListModel = new LeafList(model, {} as Container);

  const mockConfig = `
    <test:vector xmlns:test="http://foo.bar">foo</test:vector>
  `;
  const mockConfigXML = xmlUtil.toElement(mockConfig);

  it('should get initialized with a value', () => {
    const instance = new LeafListInstance(leafListModel, mockConfigXML, {} as ContainerInstance);

    expect(instance.getValues(allow)).to.deep.equal(['foo']);
  });

  it('should accept new values after initialization', () => {
    const instance = new LeafListInstance(leafListModel, mockConfigXML, {} as ContainerInstance);

    const newItemXML = xmlUtil.toElement(`
      <test:vector xmlns:test="http://foo.bar">bar</test:vector>
    `);

    instance.add(newItemXML);

    expect(instance.getValues(allow)).to.deep.equal(['foo', 'bar']);
  });

  it('should be able to delete', () => {
    const instance = new LeafListInstance(leafListModel, mockConfigXML, {} as ContainerInstance);

    const newItemXML = xmlUtil.toElement(`
      <test:vector xmlns:test="http://foo.bar">bar</test:vector>
    `);

    instance.add(newItemXML);
    instance.delete(allow, 'foo');

    expect(instance.toJSON(allow).vector).to.deep.equal(['bar']);
  });

  it('should serialize to JSON', () => {
    const instance = new LeafListInstance(leafListModel, mockConfigXML, {} as ContainerInstance);

    expect(instance.toJSON(allow)).to.deep.equal({
      vector: ['foo']
    });
  });

  it('should serialize to XML', () => {
    const instance = new LeafListInstance(leafListModel, mockConfigXML, {} as ContainerInstance);

    const newItemXML = xmlUtil.toElement(`
      <test:vector xmlns:test="http://foo.bar">bar</test:vector>
    `);

    instance.add(newItemXML);
    const document = new Document();
    const el = document.node('mockEl');
    instance.toXML(el);

    expect(document.toString()).xml.to.equal(`
      <?xml version="1.0" encoding="UTF-8"?>
      <mockEl xmlns:test="http://foo.bar">
          <test:vector>foo</test:vector>
          <test:vector>bar</test:vector>
      </mockEl>
    `);
  });
});
