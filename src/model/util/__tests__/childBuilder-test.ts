import * as libXML from 'libxmljs';
import * as fs from 'fs';
import * as path from 'path';
import { expect } from 'chai';

import { buildChildren } from '../childBuilder';
import { Container, Leaf, List, LeafList } from '../../';

describe('Child Builder', () => {
  const modelText = fs.readFileSync(path.join(__dirname, './data/testElement.xml'), 'utf-8');
  const modelXMLDoc = libXML.parseXmlString(modelText);
  const { children } = buildChildren(modelXMLDoc.root(), {} as Leaf);

  it('builds an entry for each child', () => {
    expect([...children.keys()]).to.deep.equal([
      'id',
      'name',
      'location',
      'location-coordinates',
      'description',
      'inter-node-security',
      'reverse-flow-enforcement',
      'group',
      'bfd',
      'peer',
      'entitlement',
      'routing',
      'system',
      'node',
      'redundancy-group',
      'priority',
      'service-route',
      'service-route-policy'
    ]);
  });

  it('should build leaf children', () => {
    const leafs = [
      'id',
      'name',
      'location',
      'location-coordinates',
      'description',
      'inter-node-security',
      'reverse-flow-enforcement'
    ];

    leafs.forEach(leaf => {
      expect(children.get(leaf)).to.be.an.instanceof(Leaf);
    });
  });

  it('should build container children', () => {
    const containers = ['bfd', 'entitlement', 'system'];

    containers.forEach(container => {
      expect(children.get(container)).to.be.an.instanceof(Container);
    });
  });

  it('should build leaf-list children', () => {
    const leafLists = ['group'];

    leafLists.forEach(leafList => {
      expect(children.get(leafList)).to.be.an.instanceof(LeafList);
    });
  });

  it('should build list children', () => {
    const lists = ['peer', 'routing', 'node', 'redundancy-group', 'priority', 'service-route', 'service-route-policy'];

    lists.forEach(list => {
      expect(children.get(list)).to.be.an.instanceof(List);
    });
  });
});
