import { Document } from 'libxmljs';
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import { List } from '../../model';

import { ListChildInstance, LeafInstance } from '../';

describe('List Child Instance', () => {
  const modelText = fs.readFileSync(path.join(__dirname, '../../model/__tests__/data/testList.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);
  const listModel = new List(model);

  const mockConfig = `
    <test:peer xmlns:test="http://foo.bar" >
      <test:name>foo</test:name>
    </test:peer>
  `;
  const mockConfigXML = xmlUtil.toElement(mockConfig);

  it('should get initialized with a value', () => {
    const instance = new ListChildInstance(listModel, mockConfigXML, null);

    const child = instance.instance.get('name');

    if (child instanceof LeafInstance) {
      expect(child.value).to.equal('foo');
    } else {
      throw new Error('Child is not a leaf!');
    }
  });

  it('should consider a case active if it sees a child from it', () => {
    const modelWithChoiceText = fs.readFileSync(
      path.join(__dirname, '../../model/__tests__/data/testListWithChoice.xml'),
      'utf-8'
    );
    const listModelWithChoice = new List(xmlUtil.toElement(modelWithChoiceText));

    const choiceConfig = xmlUtil.toElement(`
      <svc:service-route xmlns:svc="http://128technology.com/t128/config/service-config">
        <svc:name>baz</svc:name>
        <svc:peer>per1</svc:peer>
      </svc:service-route>
    `);

    const instance = new ListChildInstance(listModelWithChoice, choiceConfig, null);

    const activeChoice = instance.activeChoices.get('type');

    expect(activeChoice).to.equal('peer-service-route');
  });

  it('should serialize to JSON', () => {
    const instance = new ListChildInstance(listModel, mockConfigXML, null);

    expect(instance.toJSON()).to.deep.equal({ name: 'foo' });
  });

  it('should serialize to XML', () => {
    const document = new Document();
    const el = document.node('mockEl');
    const instance = new ListChildInstance(listModel, mockConfigXML, null);
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
    const instance = new ListChildInstance(listModel, mockConfigXML, null);

    expect(instance.keys).to.deep.equal({ name: 'foo' });
  });
});
