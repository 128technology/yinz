import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import { Leaf } from '../../model';

import { LeafInstance } from '../';

describe('Leaf Instance', () => {
  const modelText = fs.readFileSync(path.join(__dirname, '../../model/__tests__/data/testLeaf.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);
  const leafModel = new Leaf(model);

  const mockConfig = `
    <if:qp-value xmlns:if="http://128technology.com/t128/config/interface-config">5</if:qp-value>
  `;
  const mockConfigXML = xmlUtil.toElement(mockConfig);

  it('should get initialized with a value', () => {
    const instance = new LeafInstance(leafModel, mockConfigXML);

    expect(instance.value).to.equal('5');
  });

  it('should get a value with the converted type', () => {
    const instance = new LeafInstance(leafModel, mockConfigXML);

    expect(instance.getConvertedValue()).to.equal(5);
  });

  it('should serialize to JSON', () => {
    const instance = new LeafInstance(leafModel, mockConfigXML);

    expect(instance.toJSON()).to.deep.equal({
      'qp-value': 5
    });
  });
});
