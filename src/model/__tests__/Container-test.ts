import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';

import { Container, Leaf } from '../';

describe('Container Model', () => {
  const modelText = fs.readFileSync(path.join(__dirname, './data/testContainer.xml'), 'utf-8');
  const model = xmlUtil.toElement(modelText);

  const presenceModelText = fs.readFileSync(path.join(__dirname, './data/testPresenceContainer.xml'), 'utf-8');
  const presenceModel = xmlUtil.toElement(presenceModelText);

  it('should get initalized', () => {
    const container = new Container(model);

    expect(container.name).to.equal('bfd');
  });

  it('should build children', () => {
    const container = new Container(model);

    expect(container.children.size).to.equal(2);
    expect(container.children.get('state')).to.be.an.instanceof(Leaf);
    expect(container.children.get('desired-tx-interval')).to.be.an.instanceof(Leaf);
  });

  it('should build an instance of itself', () => {
    const config = xmlUtil.toElement(`
      <authy:bfd xmlns:authy="http://128technology.com/t128/config/authority-config">
        <authy:state>enabled</authy:state>
      </authy:bfd>
    `);

    const container = new Container(model);

    const instance = container.buildInstance(config);
    expect(instance.model).to.equal(container);
  });

  it('should determine if it has a child', () => {
    const container = new Container(model);

    expect(container.hasChild('state')).to.equal(true);
  });

  it('should determine if it does not have a child', () => {
    const container = new Container(model);

    expect(container.hasChild('foo')).to.equal(false);
  });

  it('should determine if it is not a presence container', () => {
    const container = new Container(model);

    expect(container.isPresenceContainer()).to.equal(false);
  });

  it('should determine if it is a presence container', () => {
    const container = new Container(presenceModel);

    expect(container.isPresenceContainer()).to.equal(true);
  });

  it('should get presence description if it is a presence container', () => {
    const container = new Container(presenceModel);

    expect(container.getPresenceDescription()).to.equal('A really good reason');
  });

  it('should get a child', () => {
    const container = new Container(model);

    expect(container.getChild('state').name).to.equal('state');
  });

  it('should get children', () => {
    const container = new Container(model);

    expect([...container.getChildren().keys()]).to.deep.equal(['state', 'desired-tx-interval']);
  });
});
