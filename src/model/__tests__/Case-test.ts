import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';

import xmlUtil from '../../__tests__/xmlUtil';

import { Choice, Leaf, Case } from '../';

describe('Case', () => {
  const explicitCaseText = fs.readFileSync(path.join(__dirname, './data/testExplicitCase.xml'), 'utf-8');
  const explicitCase = xmlUtil.toElement(explicitCaseText);

  const implicitCaseText = fs.readFileSync(path.join(__dirname, './data/testLeaf.xml'), 'utf-8');
  const implicitCase = xmlUtil.toElement(implicitCaseText);

  const emptyCaseText = fs.readFileSync(path.join(__dirname, './data/testEmptyCase.xml'), 'utf-8');
  const emptyCase = xmlUtil.toElement(emptyCaseText);

  const deprecatedCaseText = fs.readFileSync(path.join(__dirname, './data/testDeprecatedCase.xml'), 'utf-8');
  const deprecatedCase = xmlUtil.toElement(deprecatedCaseText);

  const obsoleteCaseText = fs.readFileSync(path.join(__dirname, './data/testObsoleteCase.xml'), 'utf-8');
  const obsoleteCase = xmlUtil.toElement(obsoleteCaseText);

  const prototypeCaseText = fs.readFileSync(path.join(__dirname, './data/testPrototypeCase.xml'), 'utf-8');
  const prototypeCase = xmlUtil.toElement(prototypeCaseText);

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

  it('should construct children for implicit cases', () => {
    const theCase = new Case(implicitCase, mockChoice);

    expect(theCase.children.get('qp-value')).to.be.an.instanceOf(Leaf);
  });

  it('determine if case is not empty', () => {
    const theCase = new Case(explicitCase, mockChoice);

    expect(theCase.isEmpty()).to.equal(false);
  });

  it('determine if case is empty', () => {
    const theCase = new Case(emptyCase, mockChoice);

    expect(theCase.isEmpty()).to.equal(true);
  });

  it('determine if case is deprecated', () => {
    const theCase = new Case(deprecatedCase, mockChoice);

    expect(theCase.isDeprecated).to.equal(true);
  });

  it('determine if case is obsolete', () => {
    const theCase = new Case(obsoleteCase, mockChoice);

    expect(theCase.isObsolete).to.equal(true);
  });

  it('determine if case is a prototype', () => {
    const theCase = new Case(prototypeCase, mockChoice);

    expect(theCase.isPrototype).to.equal(true);
  });

  it('visits itself', () => {
    const spy = sinon.spy();
    const theCase = new Case(explicitCase, mockChoice);
    theCase.visit(spy);

    expect(spy.firstCall.args[0]).to.equal(theCase);
  });

  it('visits children', () => {
    const spy = sinon.spy();
    const theCase = new Case(explicitCase, mockChoice);
    theCase.visit(spy);

    expect(spy.callCount).to.equal(2);
  });
});
