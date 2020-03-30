import { Document } from 'libxmljs';
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import { List } from '../../model';

import { ListInstance, ListChildInstance } from '../';

describe('List Instance', () => {
  const modelText = fs.readFileSync(path.join(__dirname, '../../model/__tests__/data/testList.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);
  const listModel = new List(model);

  const mockConfig = `
    <test:peer xmlns:test="http://foo.bar">
      <test:name>foo</test:name>
    </test:peer>
  `;
  const mockConfigXML = xmlUtil.toElement(mockConfig);

  it('should get initialized with a child', () => {
    const instance = new ListInstance(listModel, mockConfigXML);

    const child = [...instance.children.values()][0];

    expect(child).to.be.an.instanceOf(ListChildInstance);
  });

  it('should accept new values after initialization', () => {
    const instance = new ListInstance(listModel, mockConfigXML);

    const newItemXML = xmlUtil.toElement(`
      <test:peer xmlns:test="http://foo.bar">
        <test:name>bar</test:name>
      </test:peer>
    `);

    instance.add(newItemXML);

    const child = [...instance.children.values()][1];

    expect(child).to.be.an.instanceOf(ListChildInstance);
  });

  it('should serialize to JSON', () => {
    const instance = new ListInstance(listModel, mockConfigXML);

    expect(instance.toJSON()).to.deep.equal({
      peer: [{ name: 'foo' }]
    });
  });

  it('should serialize to JSON without skipped fields', () => {
    const instance = new ListInstance(listModel, mockConfigXML);

    expect(instance.toJSON(false, true, ins => ins instanceof ListChildInstance)).to.deep.equal({
      peer: []
    });
  });

  it('should serialize to XML', () => {
    const instance = new ListInstance(listModel, mockConfigXML);

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
