import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import { OrderedBy } from '../../enum';

import { List, Leaf, LeafList } from '../';

describe('List Model', () => {
  const modelText = fs.readFileSync(path.join(__dirname, './data/testList.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);

  it('should get initalized', () => {
    const list = new List(model);

    expect(list.name).to.equal('peer');
  });

  it('should build children', () => {
    const list = new List(model);

    expect(list.children.size).to.equal(2);
    expect(list.children.get('name')).to.be.an.instanceof(Leaf);
    expect(list.children.get('service-filter')).to.be.an.instanceof(LeafList);
  });

  it('should build an instance of itself', () => {
    const config = xmlUtil.toElement(`
      <authy:peer xmlns:authy="http://128technology.com/t128/config/authority-config" >
        <authy:name>foo</authy:name>
      </authy:peer>
    `);

    const list = new List(model);

    const instance = list.buildInstance(config);
    expect(instance.model).to.equal(list);
  });

  it('should determine if it has a child', () => {
    const list = new List(model);

    expect(list.hasChild('service-filter')).to.equal(true);
  });

  it('should determine if it does not have a child', () => {
    const list = new List(model);

    expect(list.hasChild('foo')).to.equal(false);
  });

  it('should get a child', () => {
    const list = new List(model);

    expect(list.getChild('service-filter').name).to.equal('service-filter');
  });

  it('should get children', () => {
    const list = new List(model);

    expect([...list.getChildren().keys()]).to.deep.equal(['name', 'service-filter']);
  });

  it('should get its keys', () => {
    const list = new List(model);
    const keyNodes = list.getKeyNodes();

    expect(keyNodes.length).to.equal(1);
    expect(keyNodes[0].name).to.equal('name');
  });

  it('should handle multiple keys', () => {
    const modelTextMK = fs.readFileSync(path.join(__dirname, './data/testListMultipleKeys.xml'), 'utf-8');
    const modelMK = xmlUtil.toElement(modelTextMK);

    const list = new List(modelMK);
    const keys = [...list.keys];

    expect(keys).to.deep.equal(['name', 'otherKey']);
  });

  it('should get max elements', () => {
    const list = new List(model);

    expect(list.maxElements).to.equal(5);
  });

  it('should get min elements', () => {
    const list = new List(model);

    expect(list.minElements).to.equal(2);
  });

  it('should get ordered by', () => {
    const list = new List(model);

    expect(list.orderedBy).to.equal(OrderedBy.user);
  });
});
