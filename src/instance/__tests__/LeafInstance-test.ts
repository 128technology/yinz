import { Document } from 'libxmljs';
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import { Leaf, Container } from '../../model';

import { LeafInstance, ContainerInstance } from '../';

describe('Leaf Instance', () => {
  const modelText = fs.readFileSync(path.join(__dirname, '../../model/__tests__/data/testLeaf.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);
  const leafModel = new Leaf(model, {} as Container);

  const mockConfig = `
    <test:qp-value xmlns:test="http://foo.bar">5</test:qp-value>
  `;
  const mockConfigXML = xmlUtil.toElement(mockConfig);

  it('should get initialized with a value', () => {
    const instance = new LeafInstance(leafModel, mockConfigXML, {} as ContainerInstance);

    expect(instance.value).to.equal('5');
  });

  it('should get a value with the converted type', () => {
    const instance = new LeafInstance(leafModel, mockConfigXML, {} as ContainerInstance);

    expect(instance.getConvertedValue()).to.equal(5);
  });

  it('should serialize to JSON', () => {
    const instance = new LeafInstance(leafModel, mockConfigXML, {} as ContainerInstance);

    expect(instance.toJSON()).to.deep.equal({
      'qp-value': 5
    });
  });

  it('should serialize to JSON without converting type', () => {
    const instance = new LeafInstance(leafModel, mockConfigXML, {} as ContainerInstance);

    expect(instance.toJSON(false, false)).to.deep.equal({
      'qp-value': '5'
    });
  });

  it('should serialize to XML', () => {
    const document = new Document();
    const el = document.node('mockEl');
    const instance = new LeafInstance(leafModel, mockConfigXML, {} as ContainerInstance);
    instance.toXML(el);

    expect(document.toString()).xml.to.equal(`
      <?xml version="1.0" encoding="UTF-8"?>
      <mockEl xmlns:test="http://foo.bar">
          <test:qp-value>5</test:qp-value>
      </mockEl>
    `);
  });
});
