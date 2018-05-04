import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';

import { Container } from '../../model';

import { ContainerInstance, LeafInstance } from '../';

describe('Container Instance', () => {
  const modelText = fs.readFileSync(path.join(__dirname, '../../model/__tests__/data/testContainer.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);
  const leafModel = new Container(model);

  const mockConfigXML = xmlUtil.toElement(`
    <authy:bfd xmlns:authy="http://128technology.com/t128/config/authority-config">
      <authy:state>enabled</authy:state>
    </authy:bfd>
  `);

  it('should get initialized with a value', () => {
    const instance = new ContainerInstance(leafModel, mockConfigXML);

    const child = instance.children.get('state');
    if (child instanceof LeafInstance) {
      expect(child.value).to.equal('enabled');
    } else {
      throw new Error('Child is not a leaf!');
    }
  });

  it('should serialize to JSON', () => {
    const instance = new ContainerInstance(leafModel, mockConfigXML);

    expect(instance.toJSON()).to.deep.equal({
      bfd: {
        state: 'enabled'
      }
    });
  });
});
