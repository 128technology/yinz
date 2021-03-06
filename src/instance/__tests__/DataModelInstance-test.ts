import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import DataModel from '../../model';
import DataModelInstance, {
  ContainerInstance,
  LeafInstance,
  LeafListInstance,
  ListInstance,
  ListChildInstance
} from '../';
import { allow } from '../util';
import { IJSONModeEvaluators } from '../types';
import { assertElement } from '../../util/xmlUtil';

export function readDataModel(filepath: string) {
  const modelText = fs.readFileSync(path.join(__dirname, filepath), 'utf-8');

  const options = {
    modelElement: xmlUtil.toElement(modelText),
    rootPath: '//yin:container[@name="authority"]'
  };

  return new DataModel(options);
}

export const dataModel = readDataModel('../../model/__tests__/data/consolidatedT128Model.xml');

describe('Data Model Instance', () => {
  function readConfigFile(filepath: string) {
    const instanceText = fs.readFileSync(path.join(__dirname, filepath), 'utf-8');
    return xmlUtil.toElement(instanceText);
  }

  function readJSON(filepath: string) {
    const instanceJSONText = fs.readFileSync(path.join(__dirname, filepath), 'utf-8');
    return JSON.parse(instanceJSONText);
  }

  function getInstance(instancePath: string) {
    const instance = readConfigFile(instancePath);
    const config = assertElement(instance.get('//t128:config', { t128: 'http://128technology.com/t128' })!);
    return new DataModelInstance(dataModel, config);
  }

  function getInstanceJsonOnlyMode(
    instancePath: string,
    evaluators: IJSONModeEvaluators = {
      evaluateWhenCondition: async () => false,
      evaluateLeafRef: async () => ['testLeafRef'],
      evaluateSuggestionRef: async () => ['testSuggestionRef'],
      resolveLeafRefPath: async () => [{ name: 'goo' }]
    }
  ) {
    const instanceRawJSON = readJSON(instancePath);
    return new DataModelInstance(dataModel, instanceRawJSON, { jsonMode: evaluators });
  }

  describe('T128 Model', () => {
    let dataModelInstance: DataModelInstance;

    beforeEach(() => {
      dataModelInstance = getInstance('./data/instance.xml');
    });

    it('should set the root to the authority', () => {
      expect(dataModelInstance.root.get('authority')).to.be.an.instanceOf(ContainerInstance);
    });

    it('should be constructable from JSON', () => {
      const instanceRawJSON = readJSON('./data/instance.json');
      const instanceFromJSON = new DataModelInstance(dataModel, instanceRawJSON);

      expect(instanceFromJSON.toJSON(allow)).to.deep.equal(instanceRawJSON);
    });

    it('should be constructable from camelCased JSON', () => {
      const instanceRawJSON = readJSON('./data/instanceCamelCase.json');
      const instanceFromJSON = new DataModelInstance(dataModel, instanceRawJSON);

      expect(instanceFromJSON.toJSON(allow, true)).to.deep.equal(instanceRawJSON);
    });

    it('should serialize an instance to JSON', () => {
      const instanceJSON = readJSON('./data/instance.json');
      expect(dataModelInstance.toJSON(allow)).to.deep.equal(instanceJSON);
    });

    it('should serialize an instance to JSON with camel case', () => {
      const instanceJSONCamelCase = readJSON('./data/instanceCamelCase.json');
      expect(dataModelInstance.toJSON(allow, true)).to.deep.equal(instanceJSONCamelCase);
    });

    it('should serialize an instance to JSON without converting types', () => {
      const instanceNotConverted = readJSON('./data/instanceNotConverted.json');
      expect(dataModelInstance.toJSON(allow, true, false)).to.deep.equal(instanceNotConverted);
    });

    it('should serialize an instance to JSON without skipped fields', () => {
      const instanceSkippedFields = readJSON('./data/instanceSkippedFields.json');
      expect(
        dataModelInstance.toJSON(allow, true, false, x => x instanceof ListChildInstance && x.model.name === 'node')
      ).to.deep.equal(instanceSkippedFields);
    });

    it('should serialize an instance to JSON and not skip LeafInstance or LeafListInstance', () => {
      const instanceNotConverted = readJSON('./data/instanceNotConverted.json');
      expect(
        dataModelInstance.toJSON(allow, true, false, x => x instanceof LeafInstance || x instanceof LeafListInstance)
      ).to.deep.equal(instanceNotConverted);
    });

    it('should serialize an instance to XML', () => {
      const expectedXML = readConfigFile('./data/instanceToXML.xml');
      expect(dataModelInstance.toXML().toString()).xml.to.equal(expectedXML.toString());
    });

    it('should get leaves', () => {
      const searchPath = [{ name: 'authority' }, { name: 'name' }];
      const leaf = dataModelInstance.getInstance(searchPath);

      expect((leaf as LeafInstance).getValue(allow)).to.equal('Authority128');
    });

    it('should traverse lists', () => {
      const searchPath = [
        { name: 'authority' },
        { name: 'session-type', keys: [{ key: 'name', value: 'HTTPS' }] },
        { name: 'service-class' }
      ];
      const leaf = dataModelInstance.getInstance(searchPath);

      expect((leaf as LeafInstance).getValue(allow)).to.equal('Standard');
    });

    it('should throw is next segment not found for list', () => {
      const searchPath = [
        { name: 'authority' },
        { name: 'session-type', keys: [{ key: 'name', value: 'HTTPS' }] },
        { name: 'badSegment' }
      ];

      expect(() => dataModelInstance.getInstance(searchPath)).to.throw();
    });

    it('should throw if key names do not match', () => {
      const searchPath = [
        { name: 'authority' },
        { name: 'session-type', keys: [{ key: 'badName', value: 'HTTPS' }] },
        { name: 'service-class' }
      ];

      expect(() => dataModelInstance.getInstance(searchPath)).to.throw();
    });

    it('should throw if key value not found', () => {
      const searchPath = [
        { name: 'authority' },
        { name: 'session-type', keys: [{ key: 'name', value: 'badValue' }] },
        { name: 'service-class' }
      ];

      expect(() => dataModelInstance.getInstance(searchPath)).to.throw();
    });

    it('should throw if keys not provided for list', () => {
      const searchPath = [{ name: 'authority' }, { name: 'session-type' }, { name: 'service-class' }];

      expect(() => dataModelInstance.getInstance(searchPath)).to.throw();
    });

    it('should traverse containers', () => {
      const searchPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'system' },
        { name: 'services' },
        { name: 'webserver' },
        { name: 'port' }
      ];
      const leaf = dataModelInstance.getInstance(searchPath);

      expect((leaf as LeafInstance).getValue(allow)).to.equal('443');
    });

    it('should get leaf lists', () => {
      const searchPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'group' }
      ];
      const leafList = dataModelInstance.getInstance(searchPath);

      expect((leafList as LeafListInstance).getValues(allow)).to.deep.equal(['group1', 'group2']);
    });

    describe('Attributes Handling and Serialization', () => {
      it('should serialize an instance to XML with attributes', () => {
        const instanceWithAttr = getInstance('./data/instanceXMLWithAttributes.xml');
        const result = instanceWithAttr.toXML(undefined, { includeAttributes: true }).toString();
        expect(result).xml.to.equal(`
          <?xml version="1.0" encoding="UTF-8"?>
          <config xmlns:authy="http://128technology.com/t128/config/authority-config">
            <authy:authority>
              <authy:name xmlns:xc="urn:ietf:params:xml:ns:netconf:base:1.0" xc:operation="delete">Authority128</authy:name>
            </authy:authority>
          </config>
        `);
      });

      it('should parse JSON with attributes and serialize to XML with attributes', () => {
        const instance = new DataModelInstance(dataModel, {
          authority: {
            name: {
              _attributes: [
                {
                  href: 'urn:ietf:params:xml:ns:netconf:base:1.0',
                  name: 'operation',
                  prefix: 'xc',
                  value: 'delete'
                }
              ],
              _value: 'Authority128'
            }
          }
        });
        const result = instance.toXML(undefined, { includeAttributes: true }).toString();

        expect(result).xml.to.equal(`
          <?xml version="1.0" encoding="UTF-8"?>
          <config xmlns:authy="http://128technology.com/t128/config/authority-config">
            <authy:authority>
              <authy:name xmlns:xc="urn:ietf:params:xml:ns:netconf:base:1.0" xc:operation="delete">Authority128</authy:name>
            </authy:authority>
          </config>
        `);
      });

      it('should parse JSON with operations and serialize to XML with attributes', () => {
        const instance = new DataModelInstance(dataModel, {
          authority: {
            name: {
              _operation: 'delete',
              _value: 'Authority128'
            }
          }
        });
        const result = instance.toXML(undefined, { includeAttributes: true }).toString();

        expect(result).xml.to.equal(`
          <?xml version="1.0" encoding="UTF-8"?>
          <config xmlns:authy="http://128technology.com/t128/config/authority-config">
            <authy:authority>
              <authy:name xmlns:xc="urn:ietf:params:xml:ns:netconf:base:1.0" xc:operation="delete">Authority128</authy:name>
            </authy:authority>
          </config>
        `);
      });

      it('should parse JSON with operations and serialize to XML with attributes', () => {
        const instanceRawJSON = readJSON('./data/instanceWithOperations.json');
        const instance = new DataModelInstance(dataModel, instanceRawJSON);
        const result = instance.toXML(undefined, { includeAttributes: true }).toString();

        expect(result).xml.to.equal(`
          <?xml version="1.0" encoding="UTF-8"?>
          <config xmlns:authy="http://128technology.com/t128/config/authority-config" xmlns:sys="http://128technology.com/t128/config/system-config">
            <authy:authority>
              <authy:name operation="delete">Authority128</authy:name>
              <authy:router>
                <authy:name>Fabric128</authy:name>
                <authy:inter-node-security xmlns:xc="urn:ietf:params:xml:ns:netconf:base:1.0" xc:operation="remove">internal</authy:inter-node-security>
                <authy:group xmlns:xc="urn:ietf:params:xml:ns:netconf:base:1.0" xc:operation="delete">group1</authy:group>
                <authy:group>group2</authy:group>
                <sys:node xmlns:xc="urn:ietf:params:xml:ns:netconf:base:1.0" xc:operation="delete">
                  <sys:name>TestNode1</sys:name>
                </sys:node>
                <sys:node>
                  <sys:name>TestNode2</sys:name>
                  <sys:role>combo</sys:role>
                  <sys:id>2</sys:id>
                  <sys:enabled>true</sys:enabled>
                </sys:node>
              </authy:router>
            </authy:authority>
          </config>
        `);
      });

      it('should parse JSON with list operations and serialize to XML with attributes', () => {
        const instanceRawJSON = readJSON('./data/instanceWithListOperations.json');
        const instance = new DataModelInstance(dataModel, instanceRawJSON);
        const result = instance.toXML(undefined, { includeAttributes: true }).toString();

        expect(result).xml.to.equal(`
          <?xml version="1.0" encoding="UTF-8"?>
          <config xmlns:authy="http://128technology.com/t128/config/authority-config" xmlns:sys="http://128technology.com/t128/config/system-config">
            <authy:authority>
              <authy:router>
                <authy:name>Fabric128</authy:name>
                <authy:group xmlns:xc="urn:ietf:params:xml:ns:netconf:base:1.0" xmlns:yang="urn:ietf:params:xml:ns:yang:1" xc:operation="create" yang:insert="after" yang:value="group2">group1</authy:group>
                <sys:node xmlns:xc="urn:ietf:params:xml:ns:netconf:base:1.0" xmlns:yang="urn:ietf:params:xml:ns:yang:1" xc:operation="create" yang:insert="after" yang:key="[sys:name='TestNode2']">
                  <sys:name>TestNode1</sys:name>
                </sys:node>
              </authy:router>
            </authy:authority>
          </config>
        `);
      });
    });

    describe('#getInstanceFromElement()', () => {
      it('should find an instance from the config', () => {
        const targetXML = assertElement(
          dataModelInstance.rawInstance.get(
            '/t128:config/authy:authority/svc:session-type[svc:name = "HTTP"]/svc:name',
            dataModelInstance.model.namespaces
          )!
        );

        const match = dataModelInstance.getInstanceFromElement(targetXML);

        expect(match.model.name).to.equal('name');
        expect(
          ((match.parent as ListChildInstance).getChildren(allow).get('name') as LeafInstance).getValue(allow)
        ).to.equal('HTTP');
      });
    });

    describe('#resolveLeafRefPath()', () => {
      describe('absolute leafrefs', () => {
        it('should follow reference to leafref', async () => {
          // Example leaf ref:
          // authority::router::inter-node-security -> authority::security
          // <yin:path value="/t128:config/authy:authority/authy:security/authy:name"/>

          const searchPath = [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
            { name: 'inter-node-security', value: 'internal' }
          ];
          const leaf = dataModelInstance.getInstance(searchPath);

          expect((leaf as LeafInstance).toJSON(allow)).to.deep.equal({ 'inter-node-security': 'internal' });

          const expectedLeafRefPath = [
            { name: 'authority' },
            { name: 'security', keys: [{ key: 'name', value: 'internal' }] },
            { name: 'name' }
          ];

          const actualLeafRefPath = await dataModelInstance.resolveLeafRefPath(searchPath);
          expect(actualLeafRefPath).to.deep.equal(expectedLeafRefPath);
        });
      });

      describe('simple relative leaf refs', () => {
        it('should follow reference to leafref', async () => {
          // Example leaf ref:
          // router::system::services::server::webserver::node-name -> authority::router::node
          // <yin:path value="../../../../../sys:node/sys:name"/>

          const searchPath = [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
            { name: 'system' },
            { name: 'services' },
            { name: 'webserver' },
            { name: 'server', keys: [{ key: 'node-name', value: 'TestNode2' }] },
            { name: 'node-name' }
          ];
          const leaf = dataModelInstance.getInstance(searchPath);

          expect((leaf as LeafInstance).toJSON(allow)).to.deep.equal({ 'node-name': 'TestNode2' });

          const expectedLeafRefPath = [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
            { name: 'node', keys: [{ key: 'name', value: 'TestNode2' }] },
            { name: 'name' }
          ];

          const actualLeafRefPath = await dataModelInstance.resolveLeafRefPath(searchPath);
          expect(actualLeafRefPath).to.deep.equal(expectedLeafRefPath);
        });

        it('should handle missing leafref instance', async () => {
          const ns = {
            authy: 'http://128technology.com/t128/config/authority-config',
            sys: 'http://128technology.com/t128/config/system-config',
            t128: 'http://128technology.com/t128'
          };
          const localInstance = readConfigFile('./data/instance.xml');
          const localConfig = assertElement(localInstance.get('//t128:config', ns)!);

          // Drop the leafref item from the tree
          const localNode = localInstance.get(
            "//t128:config/authy:authority/authy:router/sys:node[*[local-name()='name']='TestNode2']",
            ns
          )!;
          localNode.remove();

          dataModelInstance = new DataModelInstance(dataModel, localConfig);

          // Example leaf ref:
          // router::system::services::server::webserver::node-name -> authority::router::node
          // <yin:path value="../../../../../sys:node/sys:name"/>

          const searchPath = [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
            { name: 'system' },
            { name: 'services' },
            { name: 'webserver' },
            { name: 'server', keys: [{ key: 'node-name', value: 'TestNode2' }] },
            { name: 'node-name' }
          ];
          const leaf = dataModelInstance.getInstance(searchPath);

          expect((leaf as LeafInstance).toJSON(allow)).to.deep.equal({ 'node-name': 'TestNode2' });

          try {
            await dataModelInstance.resolveLeafRefPath(searchPath);
            expect(true).to.equal(false, 'Expected error was not thrown');
          } catch (e) {
            expect(() => {
              throw e;
            }).to.throw(Error, 'Referenced entity not found. Has it been deleted?');
          }
        });
      });

      describe('ambiguous leafrefs', () => {
        // Example leaf ref:
        //
        // authority::router::service-route::next-hop::network-interface ->
        //   authority::router::node::device-interface::network-interface
        // <yin:path value="../../../sys:node/sys:device-interface/if:network-interface/if:name"/>
        //
        // Network interfaces are unique per node but may be duplicated across nodes.
        // To properly follow the reference, we must have information about the node configured
        // as a sibling field within the next-hop itself.
        //

        // This test case sets up two network interfaces with the same name, but each
        // living under a different node. Nodes and device interfaces have unique names.

        const testInstance = readConfigFile('./data/instanceNonUniqueNetworkIntf.xml');
        const testConfig = assertElement(testInstance.get('//t128:config', { t128: 'http://128technology.com/t128' })!);

        beforeEach(() => {
          dataModelInstance = new DataModelInstance(dataModel, testConfig);
        });

        it('finds first list member', async () => {
          const searchPath = [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
            { name: 'service-route', keys: [{ key: 'name', value: 'TestServiceRoute' }] },
            {
              keys: [
                { key: 'node-name', value: 'TestNode1' },
                { key: 'interface', value: 'NetIntf1' }
              ],
              name: 'next-hop'
            },
            { name: 'interface' }
          ];
          const leaf = dataModelInstance.getInstance(searchPath);

          expect((leaf as LeafInstance).toJSON(allow)).to.deep.equal({ interface: 'NetIntf1' });

          const expectedLeafRefPath = [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
            { name: 'node', keys: [{ key: 'name', value: 'TestNode1' }] },
            { name: 'device-interface', keys: [{ key: 'name', value: 'DevIntf1' }] },
            { name: 'network-interface', keys: [{ key: 'name', value: 'NetIntf1' }] },
            { name: 'name' }
          ];

          const actualLeafRefPath = await dataModelInstance.resolveLeafRefPath(searchPath);
          expect(actualLeafRefPath).to.deep.equal(expectedLeafRefPath);
        });

        it('finds second list member', async () => {
          const searchPath = [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
            { name: 'service-route', keys: [{ key: 'name', value: 'TestServiceRoute2' }] },
            {
              keys: [
                { key: 'node-name', value: 'TestNode2' },
                { key: 'interface', value: 'NetIntf1' }
              ],
              name: 'next-hop'
            },
            { name: 'interface' }
          ];
          const leaf = dataModelInstance.getInstance(searchPath);

          expect((leaf as LeafInstance).toJSON(allow)).to.deep.equal({ interface: 'NetIntf1' });

          const expectedLeafRefPath = [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
            { name: 'node', keys: [{ key: 'name', value: 'TestNode2' }] },
            { name: 'device-interface', keys: [{ key: 'name', value: 'DevInt2' }] },
            { name: 'network-interface', keys: [{ key: 'name', value: 'NetIntf1' }] },
            { name: 'name' }
          ];

          const actualLeafRefPath = await dataModelInstance.resolveLeafRefPath(searchPath);
          expect(actualLeafRefPath).to.deep.equal(expectedLeafRefPath);
        });
      });
    });
  });

  describe('User Model', () => {
    let dataModelInstance: DataModelInstance;

    const userModel = readDataModel('../../model/__tests__/data/consolidatedUserModel.xml');
    const instance = readConfigFile('./data/userInstance.xml');
    const config = assertElement(instance.get('//user:config', { user: 'http://128technology.com/user' })!);

    beforeEach(() => {
      dataModelInstance = new DataModelInstance(userModel, config);
    });

    it('should set the root to the authority', () => {
      expect(dataModelInstance.root.get('authority')).to.be.an.instanceOf(ContainerInstance);
    });

    it('should serialize an instance to JSON', () => {
      const instanceJSON = readJSON('./data/userInstance.json');
      expect(dataModelInstance.toJSON(allow)).to.deep.equal(instanceJSON);
    });

    it('should get leaves', () => {
      const searchPath = [{ name: 'authority' }, { name: 'name' }];
      const leaf = dataModelInstance.getInstance(searchPath);

      expect((leaf as LeafInstance).getValue(allow)).to.equal('Authority128');
    });

    it('should get list children', () => {
      const searchPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'user' }
      ];

      const list = dataModelInstance.getInstance(searchPath);

      const children = (list as ListInstance).getChildren(allow);
      expect(children.size).to.equal(1);

      const childUser = children.get('admin'); // children is a map keyed by 'name' values
      expect(childUser).to.be.an.instanceOf(ListChildInstance);

      const childName = (childUser as ListChildInstance).getChildren(allow).get('name');
      expect(childName).to.be.an.instanceOf(LeafInstance);
      expect((childName as LeafInstance).getValue(allow)).to.equal('admin');
    });
  });

  describe('When Condition Evaluation', () => {
    it('should return true if leaf has no applicable whens', async () => {
      const dataModelInstance = getInstance('./data/when/interfaceInstanceTrue.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'name' }
      ];

      const result = await dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(true);
    });

    it('should evaluate a true when condition', async () => {
      const dataModelInstance = getInstance('./data/when/interfaceInstanceTrue.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'node', keys: [{ key: 'name', value: 'TestNode1' }] },
        { name: 'device-interface', keys: [{ key: 'name', value: '0' }] },
        { name: 'pppoe' },
        { name: 'user-name' }
      ];

      const result = await dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(true);
    });

    it('should evaluate a false when condition', async () => {
      const dataModelInstance = getInstance('./data/when/interfaceInstanceFalse.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'node', keys: [{ key: 'name', value: 'TestNode1' }] },
        { name: 'device-interface', keys: [{ key: 'name', value: '0' }] },
        { name: 'pppoe' },
        { name: 'user-name' }
      ];

      const result = await dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(false);
    });

    it('should evaluate a false when condition on a list', async () => {
      const dataModelInstance = getInstance('./data/when/interfaceListFalse.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'node', keys: [{ key: 'name', value: 'TestNode1' }] },
        { name: 'device-interface' }
      ];

      const result = await dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(false);
    });

    it('should evaluate a true when condition on a list', async () => {
      const dataModelInstance = getInstance('./data/when/interfaceListTrue.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'node', keys: [{ key: 'name', value: 'TestNode1' }] },
        { name: 'device-interface' }
      ];

      const result = await dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(true);
    });

    it('should handle true when statements with a parent context-node', async () => {
      const dataModelInstance = getInstance('./data/when/contextNodeTrue.xml');
      const base = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'routing', keys: [{ key: 'type', value: 'rt:default-instance' }] },
        { name: 'routing-protocol', keys: [{ key: 'type', value: 'rt:bgp' }] }
      ];
      const whenPathLocal = [...base, { name: 'local-as' }];
      const whenPathHold = [...base, { name: 'timers' }, { name: 'hold-time' }];

      [whenPathLocal, whenPathHold].forEach(async whenPath => {
        const result = await dataModelInstance.evaluateWhenCondition(whenPath);
        expect(result).to.equal(true);
      });
    });

    it('should handle false when statements with a parent context-node', async () => {
      const dataModelInstance = getInstance('./data/when/contextNodeFalse.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'routing', keys: [{ key: 'type', value: 'rt:default-instance' }] },
        { name: 'routing-protocol', keys: [{ key: 'type', value: 'rt:foo' }] },
        { name: 'local-as' }
      ];

      const result = await dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(false);
    });

    it('should handle a true when condition on a choice', async () => {
      const dataModelInstance = getInstance('./data/when/choiceWhenTrue.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'routing' },
        { name: 'policy', keys: [{ key: 'name', value: 'foo' }] },
        { name: 'statement', keys: [{ key: 'name', value: 'test' }] },
        { name: 'action', keys: [{ key: 'type', value: 'rp:set-community' }] },
        { name: 'set-community-type' }
      ];

      const result = await dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(true);
    });

    it('should handle a false when condition on a choice', async () => {
      const dataModelInstance = getInstance('./data/when/choiceWhenFalse.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'routing' },
        { name: 'policy', keys: [{ key: 'name', value: 'foo' }] },
        { name: 'statement', keys: [{ key: 'name', value: 'test' }] },
        { name: 'action', keys: [{ key: 'type', value: 'rp:call' }] },
        { name: 'set-community-type' }
      ];

      const result = await dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(false);
    });

    it('should handle a choice where a parent node has a true when clause', async () => {
      const dataModelInstance = getInstance('./data/when/choiceWhenParentTrue.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'athens' }] },
        { name: 'routing', keys: [{ key: 'type', value: 'rt:default-instance' }] },
        { name: 'routing-protocol', keys: [{ key: 'type', value: 'rt:bgp' }] },
        { name: 'neighbor', keys: [{ key: 'neighbor-address', value: '1.1.1.1' }] },
        { name: 'transport' },
        { name: 'local-address' },
        { name: 'source' }
      ];

      const result = await dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(true);
    });

    it('should handle a choice where a parent node has a false when clause', async () => {
      const dataModelInstance = getInstance('./data/when/choiceWhenParentFalse.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'athens' }] },
        { name: 'routing', keys: [{ key: 'type', value: 'rt:default-instance' }] },
        { name: 'routing-protocol', keys: [{ key: 'type', value: 'rt:foo' }] },
        { name: 'neighbor', keys: [{ key: 'neighbor-address', value: '1.1.1.1' }] },
        { name: 'transport' },
        { name: 'local-address' },
        { name: 'source' }
      ];

      const result = await dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(false);
    });
  });

  describe('LeafRef Evaluation', () => {
    it('should evaluate an absolute leafref', async () => {
      const dataModelInstance = getInstance('./data/instance.xml');
      const leafRefPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'inter-node-security' }
      ];

      const result = await dataModelInstance.evaluateLeafRef(leafRefPath);
      expect(result).to.deep.equal(['internal']);
    });

    it('should evaluate a leafref on a leaf list', async () => {
      const dataModelInstance = getInstance('./data/instanceLeafListReference.xml');
      const leafRefPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'service-route', keys: [{ key: 'name', value: 'test' }] },
        { name: 'next-peer' }
      ];

      const result = await dataModelInstance.evaluateLeafRef(leafRefPath);
      expect(result).to.deep.equal(['testPeer']);
    });

    it('should evaluate an absolute leafref if no context node in instance', async () => {
      const dataModelInstance = getInstance('./data/instance.xml');
      const leafRefPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fiddlesticks' }] },
        { name: 'inter-node-security' }
      ];

      const result = await dataModelInstance.evaluateLeafRef(leafRefPath);
      expect(result).to.deep.equal(['internal']);
    });

    it('should evaluate an absolute leafref if no references exist', async () => {
      const dataModelInstance = getInstance('./data/instance.xml');
      const leafRefPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fiddlesticks' }] },
        { name: 'node', keys: [{ key: 'name', value: 'Fiddlesticks' }] },
        { name: 'device-interface', keys: [{ key: 'name', value: 'Fiddlesticks' }] },
        { name: 'traffic-engineering' },
        { name: 'traffic-profile' }
      ];

      const result = await dataModelInstance.evaluateLeafRef(leafRefPath);
      expect(result).to.deep.equal([]);
    });

    it('should evaluate a relative leafref if no context node in instance', async () => {
      const dataModelInstance = getInstance('./data/instanceNonUniqueNetworkIntf.xml');
      const leafRefPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'node', keys: [{ key: 'name', value: 'TestNode1' }] },
        { name: 'device-interface', keys: [{ key: 'name', value: 'DevInf1' }] },
        { name: 'network-interface', keys: [{ key: 'name', value: 'NetInf1' }] },
        { name: 'adjacency', keys: [{ key: 'ip-address', value: '0.0.0.0' }] },
        { name: 'peer' }
      ];

      const result = await dataModelInstance.evaluateLeafRef(leafRefPath);
      expect(result).to.deep.equal(['foo']);
    });
  });

  it('should evaluate a relative leafref from a key field', async () => {
    const dataModelInstance = getInstance('./data/instanceNonUniqueNetworkIntf.xml');
    const leafRefPath = [
      { name: 'authority' },
      { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
      { name: 'service-route', keys: [{ key: 'name', value: 'TestServiceRoute' }] },
      {
        keys: [
          { key: 'node-name', value: 'XXX_FAKE_KEY_VALUE_XXX' },
          { key: 'interface', value: 'XXX_FAKE_KEY_VALUE_XXX' }
        ],
        name: 'next-hop'
      },
      { name: 'node-name' }
    ];

    const result = await dataModelInstance.evaluateLeafRef(leafRefPath);
    expect(result).to.deep.equal(['TestNode1', 'TestNode2']);
  });

  describe('SuggestionRef Evaluation', () => {
    it('should evaluate a suggestionref', async () => {
      const dataModelInstance = getInstance('./data/instanceNonUniqueNetworkIntf.xml');
      const leafRefPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'peer', keys: [{ key: 'name', value: 'foo' }] },
        { name: 'authority-name' }
      ];

      const result = await dataModelInstance.evaluateSuggestionRef(leafRefPath);
      expect(result).to.deep.equal(['Authority128', 'foreignAuthority']);
    });

    it('should handle a circular suggestionref', async () => {
      const dataModelInstance = getInstance('./data/instanceCircularSuggestionRef.xml');
      const result = await dataModelInstance.evaluateSuggestionRef([
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'peer', keys: [{ key: 'name', value: 'bar' }] },
        { name: 'authority-name' }
      ]);

      expect(result).to.deep.equal(['Authority128', 'foreignAuthority']);
    });
  });

  describe('JSON Only Mode', () => {
    it('should use provided method for leafref evaluation', async () => {
      const dataModelInstance = getInstanceJsonOnlyMode('./data/instance.json');
      const result = await dataModelInstance.evaluateLeafRef([
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'test' }
      ]);

      expect(result).to.deep.equal(['testLeafRef']);
    });

    it('should use provided method for suggestionref evaluation', async () => {
      const dataModelInstance = getInstanceJsonOnlyMode('./data/instance.json');
      const result = await dataModelInstance.evaluateSuggestionRef([
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'test' }
      ]);

      expect(result).to.deep.equal(['testSuggestionRef']);
    });

    it('should still immediately return true if leaf has no applicable whens', async () => {
      const dataModelInstance = getInstanceJsonOnlyMode('./data/instance.json');
      const result = await dataModelInstance.evaluateWhenCondition([
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'name' }
      ]);

      expect(result).to.equal(true);
    });

    it('should use provided method for when evaluation', async () => {
      const dataModelInstance = getInstanceJsonOnlyMode('./data/instance.json');
      const result = await dataModelInstance.evaluateWhenCondition([
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'node', keys: [{ key: 'name', value: 'TestNode1' }] },
        { name: 'device-interface', keys: [{ key: 'name', value: '0' }] },
        { name: 'pppoe' },
        { name: 'user-name' }
      ]);

      expect(result).to.deep.equal(false);
    });

    it('should use provided method for leafref following', async () => {
      const dataModelInstance = getInstanceJsonOnlyMode('./data/instance.json');
      const result = await dataModelInstance.resolveLeafRefPath([
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'test' }
      ]);

      expect(result).to.deep.equal([{ name: 'goo' }]);
    });
  });
});
