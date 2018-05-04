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
    <authy:peer xmlns:authy="http://128technology.com/t128/config/authority-config" >
      <authy:name>foo</authy:name>
    </authy:peer>
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
      <authy:peer xmlns:authy="http://128technology.com/t128/config/authority-config" >
        <authy:name>bar</authy:name>
      </authy:peer>
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
});
