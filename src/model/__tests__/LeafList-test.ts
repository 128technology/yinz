import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import { OrderedBy } from '../../enum';

import { LeafList } from '../';

describe('Leaf List Model', () => {
  const modelText = fs.readFileSync(path.join(__dirname, './data/testLeafList.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);

  it('should get initalized', () => {
    const leafList = new LeafList(model);

    expect(leafList.name).to.equal('vector');
  });

  it('should build an instance of itself', () => {
    const config = xmlUtil.toElement(`
      <if:vector xmlns:if="http://128technology.com/t128/config/interface-config">foo</if:vector>
    `);

    const leafList = new LeafList(model);

    const instance = leafList.buildInstance(config);
    expect(instance.model).to.equal(leafList);
  });

  it('should get max elements', () => {
    const leafList = new LeafList(model);

    expect(leafList.maxElements).to.equal(5);
  });

  it('should get min elements', () => {
    const leafList = new LeafList(model);

    expect(leafList.minElements).to.equal(2);
  });

  it('should get ordered by', () => {
    const leafList = new LeafList(model);

    expect(leafList.orderedBy).to.equal(OrderedBy.user);
  });
});
