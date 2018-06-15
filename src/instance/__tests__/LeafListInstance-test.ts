import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import { LeafList } from '../../model';

import { LeafListInstance } from '../';

describe('Leaf List Instance', () => {
  const modelText = fs.readFileSync(path.join(__dirname, '../../model/__tests__/data/testLeafList.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);
  const leafListModel = new LeafList(model);

  const mockConfig = `
    <if:vector xmlns:if="http://128technology.com/t128/config/interface-config">foo</if:vector>
  `;
  const mockConfigXML = xmlUtil.toElement(mockConfig);

  it('should get initialized with a value', () => {
    const instance = new LeafListInstance(leafListModel, mockConfigXML);

    expect(instance.values).to.deep.equal(['foo']);
  });

  it('should accept new values after initialization', () => {
    const instance = new LeafListInstance(leafListModel, mockConfigXML);

    const newItemXML = xmlUtil.toElement(`
      <if:vector xmlns:if="http://128technology.com/t128/config/interface-config">bar</if:vector>
    `);

    instance.add(newItemXML);

    expect(instance.values).to.deep.equal(['foo', 'bar']);
  });

  it('should serialize to JSON', () => {
    const instance = new LeafListInstance(leafListModel, mockConfigXML);

    expect(instance.toJSON()).to.deep.equal({
      vector: ['foo']
    });
  });
});
