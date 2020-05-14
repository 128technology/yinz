import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import DataModel from '../../model';
import DataModelInstance, { LeafInstance, LeafListInstance } from '../';
import { allow } from '../util';

export function readDataModel(filepath: string) {
  const modelText = fs.readFileSync(path.join(__dirname, filepath), 'utf-8');

  const options = {
    modelElement: xmlUtil.toElement(modelText),
    rootPath: '//yin:container[@name="authority"]'
  };

  return new DataModel(options);
}

export const dataModel = readDataModel('../../model/__tests__/data/consolidatedT128Model.xml');

describe('Mapping Instance Data to JSON', () => {
  function readConfigFile(filepath: string) {
    const instanceText = fs.readFileSync(path.join(__dirname, filepath), 'utf-8');
    return xmlUtil.toElement(instanceText);
  }

  function getInstance(instancePath: string) {
    const instance = readConfigFile(instancePath);
    const config = instance.get('//t128:config', { t128: 'http://128technology.com/t128' })!;
    return new DataModelInstance(dataModel, config);
  }

  describe('Replacing via Mapping', () => {
    let dataModelInstance: DataModelInstance;

    beforeEach(() => {
      dataModelInstance = getInstance('./data/instance.xml');
    });

    it('should replace enabled with disabled', () => {
      const result = dataModelInstance.mapToJSON(allow, instance => {
        if (instance instanceof LeafInstance) {
          if (instance.getValue(allow) === 'enabled') {
            return { [instance.model.getName()]: 'disabled' };
          } else {
            return {};
          }
        } else {
          return {};
        }
      });

      expect(result).to.deep.equal({
        authority: {
          router: [
            {
              name: 'Fabric128',
              bfd: {
                state: 'disabled'
              }
            }
          ]
        }
      });
    });

    it('should replace top level config', () => {
      const result = dataModelInstance.mapToJSON(allow, instance => {
        if (instance instanceof LeafInstance) {
          if (instance.getValue(allow) === 'Authority128') {
            return { [instance.model.getName()]: 'Authority129' };
          } else {
            return {};
          }
        } else {
          return {};
        }
      });

      expect(result).to.deep.equal({
        authority: {
          name: 'Authority129'
        }
      });
    });

    it('should replace true with false', () => {
      const result = dataModelInstance.mapToJSON(allow, instance => {
        if (instance instanceof LeafInstance) {
          if (instance.getValue(allow) === 'true') {
            return { [instance.model.getName()]: 'false' };
          } else {
            return {};
          }
        } else {
          return {};
        }
      });

      expect(result).to.deep.equal({
        authority: {
          router: [
            {
              name: 'Fabric128',
              node: [
                {
                  enabled: 'false',
                  name: 'TestNode1'
                },
                {
                  enabled: 'false',
                  name: 'TestNode2'
                }
              ],
              system: {
                services: {
                  webserver: {
                    enabled: 'false'
                  }
                }
              }
            }
          ],
          security: [
            {
              'adaptive-encryption': 'false',
              encrypt: 'false',
              hmac: 'false',
              name: 'internal'
            }
          ]
        }
      });
    });

    it('should replace a leaf list item', () => {
      const result = dataModelInstance.mapToJSON(allow, instance => {
        if (instance instanceof LeafListInstance) {
          const matches = instance.getRawValues(allow).includes('group1');
          if (matches) {
            return {
              [instance.model.getName()]: instance.getRawValues(allow).map(v => (v === 'group1' ? 'group100' : v))
            };
          } else {
            return {};
          }
        } else {
          return {};
        }
      });

      expect(result).to.deep.equal({
        authority: {
          router: [{ name: 'Fabric128', group: ['group100', 'group2'] }]
        }
      });
    });
  });
});
