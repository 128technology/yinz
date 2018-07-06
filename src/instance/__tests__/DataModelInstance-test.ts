import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../__tests__/xmlUtil';
import DataModel from '../../model';

import {
  ContainerInstance,
  DataModelInstance,
  LeafInstance,
  LeafListInstance,
  ListInstance,
  ListChildInstance
} from '../';

describe('Data Model Instance', () => {
  function readDataModel(filepath: string) {
    const modelText = fs.readFileSync(path.join(__dirname, filepath), 'utf-8');

    const options = {
      modelElement: xmlUtil.toElement(modelText),
      rootPath: '//yin:container[@name="authority"]'
    };

    return new DataModel(options);
  }

  function readConfigFile(filepath: string) {
    const instanceText = fs.readFileSync(path.join(__dirname, filepath), 'utf-8');
    return xmlUtil.toElement(instanceText);
  }

  function readJSON(filepath: string) {
    const instanceJSONText = fs.readFileSync(path.join(__dirname, filepath), 'utf-8');
    return JSON.parse(instanceJSONText);
  }

  const dataModel = readDataModel('../../model/__tests__/data/consolidatedT128Model.xml');
  function getInstance(instancePath: string) {
    const instance = readConfigFile(instancePath);
    const config = instance.get('//t128:config', { t128: 'http://128technology.com/t128' });
    return new DataModelInstance(dataModel, config);
  }

  describe('T128 Model', () => {
    let dataModelInstance: DataModelInstance;

    beforeEach(() => {
      dataModelInstance = getInstance('./data/instance.xml');
    });

    it('should set the root to the authority', () => {
      expect(dataModelInstance.root.get('authority')).to.be.an.instanceOf(ContainerInstance);
    });

    it('should serialize an instance to JSON', () => {
      const instanceJSON = readJSON('./data/instance.json');
      expect(dataModelInstance.toJSON()).to.deep.equal(instanceJSON);
    });

    it('should serialize an instance to JSON with camel case', () => {
      const instanceJSONCamelCase = readJSON('./data/instanceCamelCase.json');
      expect(dataModelInstance.toJSON(true)).to.deep.equal(instanceJSONCamelCase);
    });

    it('should get leaves', () => {
      const searchPath = [{ name: 'authority' }, { name: 'name' }];
      const leaf = dataModelInstance.getInstance(searchPath);

      expect((leaf as LeafInstance).value).to.equal('Authority128');
    });

    it('should traverse lists', () => {
      const searchPath = [
        { name: 'authority' },
        { name: 'session-type', keys: [{ key: 'name', value: 'HTTPS' }] },
        { name: 'service-class' }
      ];
      const leaf = dataModelInstance.getInstance(searchPath);

      expect((leaf as LeafInstance).value).to.equal('Standard');
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

      expect((leaf as LeafInstance).value).to.equal('443');
    });

    it('should get leaf lists', () => {
      const searchPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'group' }
      ];
      const leafList = dataModelInstance.getInstance(searchPath);

      expect((leafList as LeafListInstance).values).to.deep.equal(['group1', 'group2']);
    });

    describe('#getInstanceFromElement()', () => {
      it('should find an instance from the config', () => {
        const targetXML = dataModelInstance.rawInstance.get(
          '/t128:config/authy:authority/svc:session-type[svc:name = "HTTP"]/svc:name',
          dataModelInstance.model.namespaces
        );

        const match = dataModelInstance.getInstanceFromElement(targetXML);

        expect(match.model.name).to.equal('name');
        expect(((match.parent as ListChildInstance).instance.get('name') as LeafInstance).value).to.equal('HTTP');
      });
    });

    describe('#evaluateXPath()', () => {
      it('evaluate an XPath at a Path', () => {
        const result = dataModelInstance.evaluateXPath(
          [{ name: 'authority' }],
          './svc:session-type[svc:name = "HTTP"]/svc:name'
        );

        expect(result[0].text()).to.equal('HTTP');
      });
    });

    describe('#resolveLeafRefPath()', () => {
      describe('absolute leafrefs', () => {
        it('should follow reference to leafref', () => {
          // Example leaf ref:
          // authority::router::inter-node-security -> authority::security
          // <yin:path value="/t128:config/authy:authority/authy:security/authy:name"/>

          const searchPath = [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
            { name: 'inter-node-security', value: 'internal' }
          ];
          const leaf = dataModelInstance.getInstance(searchPath);

          expect((leaf as LeafInstance).toJSON()).to.deep.equal({ 'inter-node-security': 'internal' });

          const expectedLeafRefPath = [
            { name: 'authority' },
            { name: 'security', keys: [{ key: 'name', value: 'internal' }] },
            { name: 'name' }
          ];

          const actualLeafRefPath = dataModelInstance.resolveLeafRefPath(searchPath);
          expect(actualLeafRefPath).to.deep.equal(expectedLeafRefPath);
        });
      });

      describe('simple relative leaf refs', () => {
        it('should follow reference to leafref', () => {
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

          expect((leaf as LeafInstance).toJSON()).to.deep.equal({ 'node-name': 'TestNode2' });

          const expectedLeafRefPath = [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
            { name: 'node', keys: [{ key: 'name', value: 'TestNode2' }] },
            { name: 'name' }
          ];

          const actualLeafRefPath = dataModelInstance.resolveLeafRefPath(searchPath);
          expect(actualLeafRefPath).to.deep.equal(expectedLeafRefPath);
        });

        it('should handle missing leafref instance', () => {
          const ns = {
            authy: 'http://128technology.com/t128/config/authority-config',
            sys: 'http://128technology.com/t128/config/system-config',
            t128: 'http://128technology.com/t128'
          };
          const localInstance = readConfigFile('./data/instance.xml');
          const localConfig = localInstance.get('//t128:config', ns);

          // Drop the leafref item from the tree
          const localNode = localInstance.get(
            "//t128:config/authy:authority/authy:router/sys:node[*[local-name()='name']='TestNode2']",
            ns
          );
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

          expect((leaf as LeafInstance).toJSON()).to.deep.equal({ 'node-name': 'TestNode2' });

          const toTest = dataModelInstance.resolveLeafRefPath.bind(dataModelInstance, searchPath, 'TestNode2');
          expect(toTest).to.throw(Error, 'Referenced entity not found. Has it been deleted?');
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
        const testConfig = testInstance.get('//t128:config', { t128: 'http://128technology.com/t128' });

        beforeEach(() => {
          dataModelInstance = new DataModelInstance(dataModel, testConfig);
        });

        it('finds first list member', () => {
          const searchPath = [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
            { name: 'service-route', keys: [{ key: 'name', value: 'TestServiceRoute' }] },
            {
              keys: [{ key: 'node-name', value: 'TestNode1' }, { key: 'interface', value: 'NetIntf1' }],
              name: 'next-hop'
            },
            { name: 'interface' }
          ];
          const leaf = dataModelInstance.getInstance(searchPath);

          expect((leaf as LeafInstance).toJSON()).to.deep.equal({ interface: 'NetIntf1' });

          const expectedLeafRefPath = [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
            { name: 'node', keys: [{ key: 'name', value: 'TestNode1' }] },
            { name: 'device-interface', keys: [{ key: 'name', value: 'DevIntf1' }] },
            { name: 'network-interface', keys: [{ key: 'name', value: 'NetIntf1' }] },
            { name: 'name' }
          ];

          const actualLeafRefPath = dataModelInstance.resolveLeafRefPath(searchPath);
          expect(actualLeafRefPath).to.deep.equal(expectedLeafRefPath);
        });

        it('finds second list member', () => {
          const searchPath = [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
            { name: 'service-route', keys: [{ key: 'name', value: 'TestServiceRoute2' }] },
            {
              keys: [{ key: 'node-name', value: 'TestNode2' }, { key: 'interface', value: 'NetIntf1' }],
              name: 'next-hop'
            },
            { name: 'interface' }
          ];
          const leaf = dataModelInstance.getInstance(searchPath);

          expect((leaf as LeafInstance).toJSON()).to.deep.equal({ interface: 'NetIntf1' });

          const expectedLeafRefPath = [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
            { name: 'node', keys: [{ key: 'name', value: 'TestNode2' }] },
            { name: 'device-interface', keys: [{ key: 'name', value: 'DevInt2' }] },
            { name: 'network-interface', keys: [{ key: 'name', value: 'NetIntf1' }] },
            { name: 'name' }
          ];

          const actualLeafRefPath = dataModelInstance.resolveLeafRefPath(searchPath);
          expect(actualLeafRefPath).to.deep.equal(expectedLeafRefPath);
        });
      });
    });
  });

  describe('User Model', () => {
    let dataModelInstance: DataModelInstance;

    const userModel = readDataModel('../../model/__tests__/data/consolidatedUserModel.xml');
    const instance = readConfigFile('./data/userInstance.xml');
    const config = instance.get('//user:config', { user: 'http://128technology.com/user' });

    beforeEach(() => {
      dataModelInstance = new DataModelInstance(userModel, config);
    });

    it('should set the root to the authority', () => {
      expect(dataModelInstance.root.get('authority')).to.be.an.instanceOf(ContainerInstance);
    });

    it('should serialize an instance to JSON', () => {
      const instanceJSON = readJSON('./data/userInstance.json');
      expect(dataModelInstance.toJSON()).to.deep.equal(instanceJSON);
    });

    it('should get leaves', () => {
      const searchPath = [{ name: 'authority' }, { name: 'name' }];
      const leaf = dataModelInstance.getInstance(searchPath);

      expect((leaf as LeafInstance).value).to.equal('Authority128');
    });

    it('should get list children', () => {
      const searchPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'user' }
      ];

      const list = dataModelInstance.getInstance(searchPath);

      const children = (list as ListInstance).children;
      expect(children.size).to.equal(1);

      const childUser = children.get('admin'); // children is a map keyed by 'name' values
      expect(childUser).to.be.an.instanceOf(ListChildInstance);

      const childName = (childUser as ListChildInstance).instance.get('name');
      expect(childName).to.be.an.instanceOf(LeafInstance);
      expect((childName as LeafInstance).value).to.equal('admin');
    });
  });

  describe('When Condition Evaluation', () => {
    it('should evaluate a true when condition', () => {
      const dataModelInstance = getInstance('./data/when/interfaceInstanceTrue.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'node', keys: [{ key: 'name', value: 'TestNode1' }] },
        { name: 'device-interface', keys: [{ key: 'name', value: '0' }] },
        { name: 'pppoe' },
        { name: 'user-name' }
      ];

      const result = dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(true);
    });

    it('should evaluate a false when condition', () => {
      const dataModelInstance = getInstance('./data/when/interfaceInstanceFalse.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'node', keys: [{ key: 'name', value: 'TestNode1' }] },
        { name: 'device-interface', keys: [{ key: 'name', value: '0' }] },
        { name: 'pppoe' },
        { name: 'user-name' }
      ];

      const result = dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(false);
    });

    it('should evaluate a false when condition on a list', () => {
      const dataModelInstance = getInstance('./data/when/interfaceListFalse.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'node', keys: [{ key: 'name', value: 'TestNode1' }] },
        { name: 'device-interface' }
      ];

      const result = dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(false);
    });

    it('should evaluate a true when condition on a list', () => {
      const dataModelInstance = getInstance('./data/when/interfaceListTrue.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'node', keys: [{ key: 'name', value: 'TestNode1' }] },
        { name: 'device-interface' }
      ];

      const result = dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(true);
    });

    it('should handle true when statements with a parent context-node', () => {
      const dataModelInstance = getInstance('./data/when/contextNodeTrue.xml');
      const base = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'routing', keys: [{ key: 'type', value: 'rt:default-instance' }] },
        { name: 'routing-protocol', keys: [{ key: 'type', value: 'rt:bgp' }] }
      ];
      const whenPathLocal = [...base, { name: 'local-as' }];
      const whenPathHold = [...base, { name: 'timers' }, { name: 'hold-time' }];

      [whenPathLocal, whenPathHold].forEach(whenPath => {
        const result = dataModelInstance.evaluateWhenCondition(whenPath);
        expect(result).to.equal(true);
      });
    });

    it('should handle false when statements with a parent context-node', () => {
      const dataModelInstance = getInstance('./data/when/contextNodeFalse.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'routing', keys: [{ key: 'type', value: 'rt:default-instance' }] },
        { name: 'routing-protocol', keys: [{ key: 'type', value: 'rt:foo' }] },
        { name: 'local-as' }
      ];

      const result = dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(false);
    });

    it('should handle a true when condition on a choice', () => {
      const dataModelInstance = getInstance('./data/when/choiceWhenTrue.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'routing' },
        { name: 'policy', keys: [{ key: 'name', value: 'foo' }] },
        { name: 'statement', keys: [{ key: 'name', value: 'test' }] },
        { name: 'action', keys: [{ key: 'type', value: 'rp:set-community' }] },
        { name: 'set-community-type' }
      ];

      const result = dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(true);
    });

    it('should handle a false when condition on a choice', () => {
      const dataModelInstance = getInstance('./data/when/choiceWhenFalse.xml');
      const whenPath = [
        { name: 'authority' },
        { name: 'routing' },
        { name: 'policy', keys: [{ key: 'name', value: 'foo' }] },
        { name: 'statement', keys: [{ key: 'name', value: 'test' }] },
        { name: 'action', keys: [{ key: 'type', value: 'rp:call' }] },
        { name: 'set-community-type' }
      ];

      const result = dataModelInstance.evaluateWhenCondition(whenPath);
      expect(result).to.equal(false);
    });
  });

  describe('LeafRef Evaluation', () => {
    it('should evaluate an absolute leafref', () => {
      const dataModelInstance = getInstance('./data/instance.xml');
      const leafRefPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'inter-node-security' }
      ];

      const result = dataModelInstance.evaluateLeafRef(leafRefPath);
      expect(result).to.deep.equal(['internal']);
    });

    it('should evaluate an absolute leafref if no context node in instance', () => {
      const dataModelInstance = getInstance('./data/instance.xml');
      const leafRefPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fiddlesticks' }] },
        { name: 'inter-node-security' }
      ];

      const result = dataModelInstance.evaluateLeafRef(leafRefPath);
      expect(result).to.deep.equal(['internal']);
    });

    it('should evaluate an absolute leafref if no references exist', () => {
      const dataModelInstance = getInstance('./data/instance.xml');
      const leafRefPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fiddlesticks' }] },
        { name: 'node', keys: [{ key: 'name', value: 'Fiddlesticks' }] },
        { name: 'device-interface', keys: [{ key: 'name', value: 'Fiddlesticks' }] },
        { name: 'traffic-engineering' },
        { name: 'traffic-profile' }
      ];

      const result = dataModelInstance.evaluateLeafRef(leafRefPath);
      expect(result).to.deep.equal([]);
    });

    it('should evaluate a relative leafref if no context node in instance', () => {
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

      const result = dataModelInstance.evaluateLeafRef(leafRefPath);
      expect(result).to.deep.equal(['foo']);
    });
  });

  describe('SuggestionRef Evaluation', () => {
    it('should evaluate a suggestionref', () => {
      const dataModelInstance = getInstance('./data/instanceNonUniqueNetworkIntf.xml');
      const leafRefPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'peer', keys: [{ key: 'name', value: 'foo' }] },
        { name: 'authority-name' }
      ];

      const result = dataModelInstance.evaluateSuggestionRef(leafRefPath);
      expect(result).to.deep.equal(['Authority128', 'foreignAuthority']);
    });
  });
});
