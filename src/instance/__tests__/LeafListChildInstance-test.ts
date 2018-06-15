import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import { LeafList } from '../../model';

import { LeafListChildInstance } from '../';

describe('Leaf List Child Instance', () => {
  function buildLeafList(modelXmlPath: string) {
    const modelText = fs.readFileSync(path.join(__dirname, modelXmlPath), 'utf-8');
    const model = xmlUtil.toElement(modelText);
    return new LeafList(model);
  }
  const leafListModel = buildLeafList('../../model/__tests__/data/testLeafList.xml');
  const numericLeafListModel = buildLeafList('../../model/__tests__/data/testNumericLeafList.xml');

  const mockConfig = `
    <if:vector xmlns:if="http://128technology.com/t128/config/interface-config">foo</if:vector>
  `;
  const mockConfigXML = xmlUtil.toElement(mockConfig);

  it('should get initialized with a value', () => {
    const instance = new LeafListChildInstance(leafListModel, mockConfigXML);

    expect(instance.value).to.equal('foo');
  });

  it('should get a value with the converted type', () => {
    const mockNumericConfig = `
    <if:numbers xmlns:if="http://128technology.com/t128/config/interface-config">5</if:numbers>
  `;
    const mockNumericConfigXML = xmlUtil.toElement(mockNumericConfig);
    const instance = new LeafListChildInstance(numericLeafListModel, mockNumericConfigXML);

    expect(instance.value).to.equal(5);
  });
});
