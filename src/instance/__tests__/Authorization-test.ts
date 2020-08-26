import DataModelInstance from '..';
import * as fs from 'fs';
import { readDataModel } from './DataModelInstance-test';
import { expect } from 'chai';
import * as path from 'path';
import xmlUtil from '../../__tests__/xmlUtil';
import _ = require('lodash');

function accessToRouter(routerName: string) {
  return (i: any) => {
    const instancePath = i.getPath();
    return (
      instancePath.filter((v: any) => _.isEqual(v, { name: 'router', keys: [{ key: 'name', value: routerName }] }))
        .length > 0 || _.isEqual(instancePath, [{ name: 'authority' }])
    );
  };
}

const userModel = readDataModel('../../model/__tests__/data/consolidatedUserModel.xml');

describe('Authorization Test', () => {
  const instanceRawJSON = JSON.parse(fs.readFileSync(path.join(__dirname, './data/userAuthInstance.json'), 'utf8'));
  const instance = xmlUtil.toElement(fs.readFileSync(path.join(__dirname, './data/userAuthInstance.xml'), 'utf8'));
  const config = instance.get('//user:config', { user: 'http://128technology.com/user' })!;
  let dataModelInstance: DataModelInstance;

  beforeEach(() => {
    dataModelInstance = new DataModelInstance(userModel, config);
  });

  it('should be constructable from JSON', () => {
    expect(dataModelInstance.toJSON(() => true)).to.deep.equal(instanceRawJSON);
  });

  it('should restrict return value based on authorization', () => {
    const result = {
      authority: {
        router: [
          {
            name: 'Fabric128',
            user: [
              {
                enabled: true,
                name: 'admin',
                password: '(removed)',
                role: ['admin']
              }
            ]
          }
        ]
      }
    };

    expect(dataModelInstance.toJSON(accessToRouter('Fabric128'))).to.deep.equal(result);

    const resultBase = {
      authority: {
        router: [
          {
            name: 'BasicFabric128',
            user: [
              {
                name: 'admin',
                password: '(removed)',
                role: ['admin'],
                enabled: true
              },
              {
                name: 'baseUser',
                password: '(removed)',
                role: ['user'],
                enabled: true
              }
            ]
          }
        ]
      }
    };

    expect(dataModelInstance.toJSON(accessToRouter('BasicFabric128'))).to.deep.equal(resultBase);
  });

  it('should return empty object when not authorized', () => {
    expect(dataModelInstance.toJSON(() => false)).to.deep.equal({});
  });
});
