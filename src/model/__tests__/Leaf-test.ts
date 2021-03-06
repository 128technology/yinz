import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';

import xmlUtil from '../../__tests__/xmlUtil';

import { Leaf, List, Container } from '../';
import { UnionType, DerivedType } from '../../types';

describe('Leaf Model', () => {
  const modelText = fs.readFileSync(path.join(__dirname, './data/testLeaf.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);

  const mandatoryModelText = fs.readFileSync(path.join(__dirname, './data/testMandatoryLeaf.xml'), 'utf-8');
  const mandatoryModel = xmlUtil.toElement(mandatoryModelText);

  const defaultedModelText = fs.readFileSync(path.join(__dirname, './data/testDefaultTypeLeaf.xml'), 'utf-8');
  const defaultedModel = xmlUtil.toElement(defaultedModelText);

  function getList() {
    return new List(
      xmlUtil.toElement(
        `<yin:list name="bar" xmlns:yin="urn:ietf:params:xml:ns:yang:yin:1" xmlns:test="http://foo.bar" module-prefix="test"><yin:key value="foo"/></yin:list>`
      ),
      {} as Container
    );
  }

  it('should get initalized', () => {
    const leaf = new Leaf(model, {} as Container);

    expect(leaf.name).to.equal('qp-value');
  });

  it('should build an instance of itself', () => {
    const config = xmlUtil.toElement(`
      <if:qp-value xmlns:if="http://128technology.com/t128/config/interface-config">1</if:qp-value>
    `);

    const leaf = new Leaf(model, {} as Container);

    const instance = leaf.buildInstance(config, {} as any);
    expect(instance.model).to.equal(leaf);
  });

  it('should determine if it is a key', () => {
    const list = getList();
    list.keys = new Set(['qp-value']);
    const leaf = new Leaf(model, list);

    expect(leaf.isKey).to.equal(true);
  });

  it('should determine if it is not a key', () => {
    const list = getList();
    list.keys = new Set(['yarghhh']);
    const leaf = new Leaf(model, list);

    expect(leaf.isKey).to.equal(false);
  });

  it('should be required if it is a key', () => {
    const list = getList();
    list.keys = new Set(['qp-value']);
    const leaf = new Leaf(model, list);

    expect(leaf.required).to.equal(true);
  });

  it('should be required if it is mandatory', () => {
    const leaf = new Leaf(mandatoryModel, {} as Container);

    expect(leaf.required).to.equal(true);
  });

  it('should not be required if it is not mandatory or a key', () => {
    const leaf = new Leaf(model, {} as Container);

    expect(leaf.required).to.equal(false);
  });

  it('should have a default value', () => {
    const leaf = new Leaf(model, {} as Container);

    expect(leaf.default).to.equal('0');
  });

  it('should have units', () => {
    const leaf = new Leaf(model, {} as Container);

    expect(leaf.units).to.equal('points');
  });

  it('should have a default value from a derived type', () => {
    const leaf = new Leaf(defaultedModel, {} as Container);

    expect(leaf.default).to.equal('moocow');
  });

  it('should have an undefined default when none set', () => {
    const leaf = new Leaf(mandatoryModel, {} as Container);

    expect(leaf.default).to.equal(undefined);
  });

  it('visits itself', () => {
    const spy = sinon.spy();
    const leaf = new Leaf(model, {} as Container);
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
      const leaf = new Leaf(testModel, {} as Container);
      expect(leaf.name).to.equal('rekey-interval');
      const expectedType = {
        type: 'union',
        otherProps: new Map(),
        types: [
          { type: 'uint32', range: { ranges: [{ min: 1, max: 720 }] }, otherProps: new Map() },
          {
            members: new Map([
              [
                'never',
                {
                  description: 'Never regenerate security keys'
                }
              ]
            ]),
            type: 'enumeration',
            otherProps: new Map()
          }
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
      const leaf = new Leaf(testModel, {} as Container);
      expect(leaf.name).to.equal('priority');
      const expectedType = {
        baseType: {
          otherProps: new Map(),
          type: 'union',
          types: [
            { type: 'uint32', range: { ranges: [{ min: 0, max: 999999999 }] }, otherProps: new Map() },
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
              type: 'enumeration',
              otherProps: new Map()
            }
          ]
        },
        default: 'ordered',
        description: 'A type for defining priorities for vector use',
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
      const leaf = new Leaf(testModel, {} as Container);
      expect(leaf.name).to.equal('neighborhood');
      const expectedType = {
        baseType: {
          length: {
            ranges: [{ min: 0, max: 63 }]
          },
          otherProps: new Map(),
          pattern: '([a-zA-Z0-9]([a-zA-Z0-9\\-_]){0,61})?[a-zA-Z0-9]',
          type: 'string'
        },
        description: 'A string identifier for network neighborhood.',
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
