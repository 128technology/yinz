import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';

import { Leaf, List } from '../';
import { UnionType, DerivedType } from '../../types';

describe('Leaf Model', () => {
  const modelText = fs.readFileSync(path.join(__dirname, './data/testLeaf.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);

  const mandatoryModelText = fs.readFileSync(path.join(__dirname, './data/testMandatoryLeaf.xml'), 'utf-8');
  const mandatoryModel = xmlUtil.toElement(mandatoryModelText);

  const defaultedModelText = fs.readFileSync(path.join(__dirname, './data/testDefaultTypeLeaf.xml'), 'utf-8');
  const defaultedModel = xmlUtil.toElement(defaultedModelText);

  it('should get initalized', () => {
    const leaf = new Leaf(model);

    expect(leaf.name).to.equal('qp-value');
  });

  it('should build an instance of itself', () => {
    const config = xmlUtil.toElement(`
      <if:qp-value xmlns:if="http://128technology.com/t128/config/interface-config">1</if:qp-value>
    `);

    const leaf = new Leaf(model);

    const instance = leaf.buildInstance(config);
    expect(instance.model).to.equal(leaf);
  });

  it('should determine if it is a key', () => {
    const list = new List(xmlUtil.toElement(`<foo name="bar" ${yinNS}><yin:key value="foo"/></foo>`));
    list.keys = new Set(['qp-value']);
    const leaf = new Leaf(model, list);

    expect(leaf.isKey).to.equal(true);
  });

  it('should determine if it is not a key', () => {
    const list = new List(xmlUtil.toElement(`<foo name="bar" ${yinNS}><yin:key value="foo"/></foo>`));
    list.keys = new Set(['yarghhh']);
    const leaf = new Leaf(model, list);

    expect(leaf.isKey).to.equal(false);
  });

  it('should be required if it is a key', () => {
    const list = new List(xmlUtil.toElement(`<foo name="bar" ${yinNS}><yin:key value="foo"/></foo>`));
    list.keys = new Set(['qp-value']);
    const leaf = new Leaf(model, list);

    expect(leaf.required).to.equal(true);
  });

  it('should be required if it is mandatory', () => {
    const leaf = new Leaf(mandatoryModel);

    expect(leaf.required).to.equal(true);
  });

  it('should not be required if it is not mandatory or a key', () => {
    const leaf = new Leaf(model);

    expect(leaf.required).to.equal(false);
  });

  it('should have a default value', () => {
    const leaf = new Leaf(model);

    expect(leaf.default).to.equal('0');
  });

  it('should have a default value from a derived type', () => {
    const leaf = new Leaf(defaultedModel);

    expect(leaf.default).to.equal('moocow');
  });

  it('should have an undefined default when none set', () => {
    const leaf = new Leaf(mandatoryModel);

    expect(leaf.default).to.equal(undefined);
  });

  it('visits itself', () => {
    const spy = sinon.spy();
    const leaf = new Leaf(model);
    leaf.visit(spy);

    expect(spy.firstCall.args[0]).to.equal(leaf);
  });

  describe('type traversal', () => {
    let count: number;

    beforeEach(() => {
      count = 0;
    });

    it('should parse union types', () => {
      const testXML = fs.readFileSync(path.join(__dirname, './data/testLeafUnionType.xml'), 'utf-8');
      const testModel = xmlUtil.toElement(testXML);
      const leaf = new Leaf(testModel);
      expect(leaf.name).to.equal('rekey-interval');
      const expectedType = {
        type: 'union',
        types: [
          { type: 'uint32', range: { ranges: [{ min: 1, max: 720 }] } },
          { type: 'enumeration', options: ['never'] }
        ]
      };
      expect(leaf.type).to.deep.equal(expectedType);

      const unionType = leaf.type as UnionType;
      unionType.traverse(() => count++);
      expect(count).to.equal(3); // union, uint32, and enumeration
    });

    it('should parse derived types', () => {
      const testXML = fs.readFileSync(path.join(__dirname, './data/testLeafDerivedType.xml'), 'utf-8');
      const testModel = xmlUtil.toElement(testXML);
      const leaf = new Leaf(testModel);
      expect(leaf.name).to.equal('priority');
      const expectedType = {
        baseType: {
          type: 'union',
          types: [
            { type: 'uint32', range: { ranges: [{ min: 0, max: 999999999 }] } },
            { type: 'enumeration', options: ['ordered', 'never'] }
          ]
        },
        default: 'ordered',
        type: 't128ext:vector-priority'
      };

      expect(leaf.type).to.deep.equal(expectedType);
      expect(leaf.getResolvedType()).to.deep.equal(expectedType.baseType);

      const unionType = leaf.type as DerivedType;
      unionType.traverse(() => count++);
      expect(count).to.equal(4);
    });

    it('should parse extension types', () => {
      const testXML = fs.readFileSync(path.join(__dirname, './data/testLeafExtensionType.xml'), 'utf-8');
      const testModel = xmlUtil.toElement(testXML);
      const leaf = new Leaf(testModel);
      expect(leaf.name).to.equal('neighborhood');
      const expectedType = {
        baseType: {
          length: {
            ranges: [{ min: 0, max: 63 }]
          },
          pattern: '([a-zA-Z0-9]([a-zA-Z0-9\\-_]){0,61})?[a-zA-Z0-9]',
          type: 'string'
        },
        suggestionRefs: ['/t128:config/authy:authority/authy:security/authy:name'],
        type: 't128ext:neighborhood-id'
      };

      expect(leaf.type).to.deep.equal(expectedType);

      const unionType = leaf.type as DerivedType;
      unionType.traverse(() => count++);
      expect(count).to.equal(2);
    });
  });
});
