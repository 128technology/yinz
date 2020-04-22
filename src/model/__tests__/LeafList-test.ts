import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';

import xmlUtil from '../../__tests__/xmlUtil';
import { OrderedBy } from '../../enum';
import { LeafList, Container } from '../';
import { ContainerInstance } from '../../instance';

describe('Leaf List Model', () => {
  const modelText = fs.readFileSync(path.join(__dirname, './data/testLeafList.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);

  it('should get initalized', () => {
    const leafList = new LeafList(model, {} as Container);

    expect(leafList.name).to.equal('vector');
  });

  it('should build an instance of itself', () => {
    const config = xmlUtil.toElement(`
      <if:vector xmlns:if="http://128technology.com/t128/config/interface-config">foo</if:vector>
    `);

    const leafList = new LeafList(model, {} as Container);

    const instance = leafList.buildInstance(config, {} as ContainerInstance);
    expect(instance.model).to.equal(leafList);
  });

  it('should get max elements', () => {
    const leafList = new LeafList(model, {} as Container);

    expect(leafList.maxElements).to.equal(5);
  });

  it('should get min elements', () => {
    const leafList = new LeafList(model, {} as Container);

    expect(leafList.minElements).to.equal(2);
  });

  it('should get ordered by', () => {
    const leafList = new LeafList(model, {} as Container);

    expect(leafList.orderedBy).to.equal(OrderedBy.user);
  });

  it('should get units', () => {
    const leafList = new LeafList(model, {} as Container);

    expect(leafList.units).to.equal('kittens');
  });

  it('visits itself', () => {
    const spy = sinon.spy();
    const leafList = new LeafList(model, {} as Container);
    leafList.visit(spy);

    expect(spy.firstCall.args[0]).to.equal(leafList);
  });

  it('should parse derived types', () => {
    const testXML = fs.readFileSync(path.join(__dirname, './data/testLeafListDerivedType.xml'), 'utf-8');
    const testModel = xmlUtil.toElement(testXML);
    const leafList = new LeafList(testModel, {} as Container);
    const expectedType = {
      baseType: {
        type: 'union',
        types: [
          { type: 'uint32', range: { ranges: [{ min: 0, max: 999999999 }] } },
          {
            members: new Map([
              [
                'ordered',
                {
                  description: 'priority value determined by ordinal position'
                }
              ],
              [
                'never',
                {
                  description: 'paths with the vector are not used'
                }
              ]
            ]),
            type: 'enumeration'
          }
        ]
      },
      default: 'ordered',
      description: 'A type for defining priorities for vector use',
      type: 't128ext:vector-priority'
    };

    expect(leafList.type).to.deep.equal(expectedType);
    expect(leafList.getResolvedType()).to.deep.equal(expectedType.baseType);
  });
});
