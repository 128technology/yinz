import { Document } from 'libxmljs2';
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import { List, Container } from '../../model';
import { ListChildInstance, LeafInstance, ListInstance } from '../';
import { allow } from '../util';

describe('List Child Instance', () => {
  const modelText = fs.readFileSync(path.join(__dirname, '../../model/__tests__/data/testList.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);
  const listModel = new List(model, {} as Container);

  const mockConfig = `
    <test:peer xmlns:test="http://foo.bar" >
      <test:name>foo</test:name>
    </test:peer>
  `;
  const mockConfigXML = xmlUtil.toElement(mockConfig);

  it('should get initialized with a value', () => {
    const instance = new ListChildInstance(listModel, mockConfigXML, {} as any, {} as ListInstance);

    const child = instance.getChildren(allow).get('name');

    if (child instanceof LeafInstance) {
      expect(child.getValue(allow)).to.equal('foo');
    } else {
      throw new Error('Child is not a leaf!');
    }
  });

  it('should consider a case active if it sees a child from it', () => {
    const modelWithChoiceText = fs.readFileSync(
      path.join(__dirname, '../../model/__tests__/data/testListWithChoice.xml'),
      'utf-8'
    );
    const listModelWithChoice = new List(xmlUtil.toElement(modelWithChoiceText), {} as Container);

    const choiceConfig = xmlUtil.toElement(`
      <svc:service-route xmlns:svc="http://128technology.com/t128/config/service-config">
        <svc:name>baz</svc:name>
        <svc:peer>per1</svc:peer>
      </svc:service-route>
    `);

    const instance = new ListChildInstance(listModelWithChoice, choiceConfig, {} as any, {} as ListInstance);

    const activeChoice = instance.activeChoices.get('type');

    expect(activeChoice).to.equal('peer-service-route');
  });

  it('should serialize to JSON', () => {
    const instance = new ListChildInstance(listModel, mockConfigXML, {} as any, {} as ListInstance);

    expect(instance.toJSON(allow)).to.deep.equal({ name: 'foo' });
  });

  it('should serialize to XML', () => {
    const document = new Document();
    const el = document.node('mockEl');
    const instance = new ListChildInstance(listModel, mockConfigXML, {} as any, {} as ListInstance);
    instance.toXML(el);

    expect(document.toString()).xml.to.equal(`
      <?xml version="1.0" encoding="UTF-8"?>
      <mockEl xmlns:test="http://foo.bar">
        <test:peer>
          <test:name>foo</test:name> 
        </test:peer>
      </mockEl>
    `);
  });

  it('should get keys', () => {
    const instance = new ListChildInstance(listModel, mockConfigXML, {} as any, {} as ListInstance);

    expect(instance.keys).to.deep.equal({ name: 'foo' });
  });

  it('should delete a child that exists', () => {
    const instance = new ListChildInstance(
      listModel,
      xmlUtil.toElement(`
        <test:peer xmlns:test="http://foo.bar" >
          <test:name>foo</test:name>
          <test:service-filter>foo</test:service-filter>
        </test:peer>
     `),
      {} as any,
      {} as ListInstance
    );
    instance.delete('service-filter');
    expect(instance.toJSON(allow)).to.deep.equal({ name: 'foo' });
  });

  it('should throw if child does not exist', () => {
    const instance = new ListChildInstance(listModel, mockConfigXML, {} as any, {} as ListInstance);
    expect(() => instance.delete('foo')).to.throw();
  });

  it('should throw if key', () => {
    const instance = new ListChildInstance(listModel, mockConfigXML, {} as any, {} as ListInstance);
    expect(() => instance.delete('name')).to.throw();
  });
});
