import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import applyMixins from '../../../util/applyMixins';
import DataModel, { Identities, Model } from '../../';
import { WithIdentities } from '../';
import xmlUtil from '../../../__tests__/xmlUtil';

describe('With Identities Mixin', () => {
  const modelText = fs.readFileSync(path.join(__dirname, '../../__tests__/data/consolidatedT128Model.xml'), 'utf-8');
  const modelElement = xmlUtil.toElement(modelText);

  const options = {
    modelElement,
    rootPath: '//yin:container[@name="authority"]'
  };

  class Test implements WithIdentities {
    public identities: Identities;
    public addIdentityProps: (parentModel: Model) => void;
  }

  applyMixins(Test, [WithIdentities]);

  it('should walk parents until it finds identities', () => {
    const dataModel = new DataModel(options);
    const parentModel = dataModel.getModelForPath('authority.router.node.device-interface');

    const testModel = new Test();
    testModel.addIdentityProps(parentModel as Model);

    expect(testModel.identities.identities.size).to.be.greaterThan(0);
  });
});
