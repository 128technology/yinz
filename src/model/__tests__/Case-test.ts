import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';

import { Choice, Leaf, Case } from '../';

describe('Case', () => {
  const explicitCaseText = fs.readFileSync(path.join(__dirname, './data/testExplicitCase.xml'), 'utf-8');
  const explicitCase = xmlUtil.toElement(explicitCaseText);

  const implicitCaseText = fs.readFileSync(path.join(__dirname, './data/testLeaf.xml'), 'utf-8');
  const implicitCase = xmlUtil.toElement(implicitCaseText);

  const mockChoice = {} as Choice;

  it('should construct explicit cases', () => {
    const theCase = new Case(explicitCase, mockChoice);

    expect(theCase.name).to.equal('peer-service-route');
  });

  it('should construct children for explicit cases', () => {
    const theCase = new Case(explicitCase, mockChoice);

    expect(theCase.children.get('peer')).to.be.an.instanceOf(Leaf);
  });

  it('should construct implicit cases', () => {
    const theCase = new Case(implicitCase, mockChoice);

    expect(theCase.name).to.equal('qp-value');
  });

  it('should constructi children for implicit cases', () => {
    const theCase = new Case(implicitCase, mockChoice);

    expect(theCase.children.get('qp-value')).to.be.an.instanceOf(Leaf);
  });
});
