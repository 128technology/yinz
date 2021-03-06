import { Document } from 'libxmljs2';
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import { List } from '../../model';
import { ListInstance, ListChildInstance, ContainerInstance } from '../';
import { allow } from '../util';

describe('List Instance', () => {
  const modelText = fs.readFileSync(path.join(__dirname, '../../model/__tests__/data/testList.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);
  const listModel = new List(model, {} as any);

  const mockConfig = `
    <test:peer xmlns:test="http://foo.bar">
      <test:name>foo</test:name>
    </test:peer>
  `;
  const mockConfigXML = xmlUtil.toElement(mockConfig);

  it('should get initialized with a child', () => {
    const instance = new ListInstance(listModel, mockConfigXML, {} as ContainerInstance);

    const child = [...instance.getChildren(allow).values()][0];

    expect(child).to.be.an.instanceOf(ListChildInstance);
  });

  it('should accept new values after initialization', () => {
    const instance = new ListInstance(listModel, mockConfigXML, {} as ContainerInstance);

    const newItemXML = xmlUtil.toElement(`
      <test:peer xmlns:test="http://foo.bar">
        <test:name>bar</test:name>
      </test:peer>
    `);

    instance.add(newItemXML);

    const child = [...instance.getChildren(allow).values()][1];

    expect(child).to.be.an.instanceOf(ListChildInstance);
  });

  it('should be able to delete a child', () => {
    const instance = new ListInstance(listModel, mockConfigXML, {} as ContainerInstance);

    const newItemXML = xmlUtil.toElement(`
      <test:peer xmlns:test="http://foo.bar">
        <test:name>bar</test:name>
      </test:peer>
    `);

    instance.add(newItemXML);
    instance.delete('foo');

    expect(instance.getChildren(allow).size).to.equal(1);
  });

  it('should serialize to JSON', () => {
    const instance = new ListInstance(listModel, mockConfigXML, {} as ContainerInstance);

    expect(instance.toJSON(allow)).to.deep.equal({
      peer: [{ name: 'foo' }]
    });
  });

  it('should serialize to JSON without skipped fields', () => {
    const instance = new ListInstance(listModel, mockConfigXML, {} as ContainerInstance);

    expect(instance.toJSON(allow, false, true, ins => ins instanceof ListChildInstance)).to.deep.equal({});
  });

  it('should serialize to XML', () => {
    const instance = new ListInstance(listModel, mockConfigXML, {} as ContainerInstance);

    const newItemXML = xmlUtil.toElement(`
      <test:peer xmlns:test="http://foo.bar">
        <test:name>bar</test:name>
      </test:peer>
    `);

    instance.add(newItemXML);
    const document = new Document();
    const el = document.node('mockEl');
    instance.toXML(el);

    expect(document.toString()).xml.to.equal(`
      <?xml version="1.0" encoding="UTF-8"?>
      <mockEl xmlns:test="http://foo.bar">
        <test:peer>
          <test:name>foo</test:name>
        </test:peer>
        <test:peer>
          <test:name>bar</test:name>
        </test:peer>
      </mockEl>
    `);
  });
});
