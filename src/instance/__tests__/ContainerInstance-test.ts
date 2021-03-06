import { Document } from 'libxmljs2';
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import { Container } from '../../model';
import { ContainerInstance, LeafInstance } from '../';
import { allow } from '../util';

describe('Container Instance', () => {
  const modelText = fs.readFileSync(path.join(__dirname, '../../model/__tests__/data/testContainer.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);
  const leafModel = new Container(model);

  const mockConfigXML = xmlUtil.toElement(`
    <test:bfd xmlns:test="http://foo.bar">
      <test:state>enabled</test:state>
    </test:bfd>
  `);

  it('should get initialized with a value', () => {
    const instance = new ContainerInstance(leafModel, mockConfigXML, null);

    const child = instance.getChildren(allow).get('state');
    if (child instanceof LeafInstance) {
      expect(child.getValue(allow)).to.equal('enabled');
    } else {
      throw new Error('Child is not a leaf!');
    }
  });

  it('should serialize to JSON', () => {
    const instance = new ContainerInstance(leafModel, mockConfigXML, null);

    expect(instance.toJSON(allow)).to.deep.equal({
      bfd: {
        state: 'enabled'
      }
    });
  });

  it('should serialize to XML', () => {
    const document = new Document();
    const el = document.node('mockEl');
    const instance = new ContainerInstance(leafModel, mockConfigXML, null);
    instance.toXML(el);

    expect(document.toString()).xml.to.equal(`
      <?xml version="1.0" encoding="UTF-8"?>
      <mockEl xmlns:test="http://foo.bar">
        <test:bfd>
          <test:state>enabled</test:state>
        </test:bfd>
      </mockEl>
    `);
  });

  it('should delete a child that exists', () => {
    const instance = new ContainerInstance(leafModel, mockConfigXML, null);
    instance.delete('state');
    expect(instance.toJSON(allow)).to.deep.equal({
      bfd: {}
    });
  });

  it('should throw if child does not exist', () => {
    const instance = new ContainerInstance(leafModel, mockConfigXML, null);
    expect(() => instance.delete('foo')).to.throw();
  });
});
