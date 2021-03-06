import * as fs from 'fs';
import * as path from 'path';
import { expect } from 'chai';

import xmlUtil from '../../__tests__/xmlUtil';
import DataModel, { Choice, Leaf, Container } from '../';

export const configModel = new DataModel({
  modelElement: xmlUtil.toElement(fs.readFileSync(path.join(__dirname, './data/consolidatedT128Model.xml'), 'utf-8')),
  rootPath: '//yin:container[@name="authority"]'
});

describe('Data Model', () => {
  describe('Config Model', () => {
    it('should parse a data model', () => {
      expect(configModel.root.size).to.equal(1);
    });

    it('should have a global namespace map', () => {
      expect(configModel.namespaces).to.deep.equal({
        al: 'http://128technology.com/t128/analytics',
        alarm: 'http://128technology.com/t128/config/alarm-config',
        as: 'http://128technology.com/t128/state/asset-state',
        authy: 'http://128technology.com/t128/config/authority-config',
        bc: 'http://128technology.com/t128/state/backup-config',
        bgp: 'http://128technology.com/t128/config/bgp-config',
        conn: 'http://128technology.com/t128/state/connection-state',
        dis: 'http://128technology.com/t128/state/device-interface-state',
        ec: 'http://128technology.com/t128/state/export-config',
        er: 'http://128technology.com/t128/event-records',
        if: 'http://128technology.com/t128/config/interface-config',
        is: 'http://128technology.com/t128/state/interface-state',
        ldap: 'http://128technology.com/t128/state/ldap-state',
        nis: 'http://128technology.com/t128/state/network-interface-state',
        ns: 'http://128technology.com/t128/state/node-state',
        pf: 'http://128technology.com/t128/packet-forwarding',
        pps: 'http://128technology.com/t128/state/peer-path-state',
        ps: 'http://128technology.com/t128/state/platform-state',
        rp: 'http://128technology.com/t128/config/routing-policy-config',
        rs: 'http://128technology.com/t128/state/router-state',
        rt: 'http://128technology.com/t128/config/routing-config',
        sks: 'http://128technology.com/t128/state/security-key-state',
        ss: 'http://128technology.com/t128/state/system-state',
        svc: 'http://128technology.com/t128/config/service-config',
        sys: 'http://128technology.com/t128/config/system-config',
        'sys-svcs': 'http://128technology.com/t128/config/system-config/services',
        system: 'http://128technology.com/t128/state/system',
        t128: 'http://128technology.com/t128',
        tunn: 'http://128technology.com/t128/state/tunnel-state'
      });
    });

    it('should get the model for a given path', () => {
      const model = configModel.getModelForPath('authority.router.node.device-interface.target-interface');

      expect(model.name).to.equal('target-interface');
      expect(model).to.be.an.instanceOf(Leaf);
    });

    it('should get the model if it is a choice for a given path', () => {
      expect(configModel.getModelForPath('authority.router.service-route.type')).to.be.an.instanceOf(Choice);
    });

    it('leafs should be marked as unique', () => {
      expect((configModel.getModelForPath('authority.router.id') as Leaf).isUnique).to.equal(true);
    });

    it('leafs should be marked as not unique', () => {
      expect((configModel.getModelForPath('authority.router.location') as Leaf).isUnique).to.equal(false);
    });
  });

  describe('Stats Model', () => {
    const modelText = fs.readFileSync(path.join(__dirname, './data/consolidatedStatsModel.xml'), 'utf-8');
    const modelElement = xmlUtil.toElement(modelText);

    const options = {
      modelElement,
      rootPath: '//yin:container[@name="stats"]'
    };

    const dataModel = new DataModel(options);

    it('should parse a data model', () => {
      expect(dataModel.root.size).to.equal(1);
    });

    it('should get the model for a given path', () => {
      const model = dataModel.getModelForPath('stats.session.flow.add.failure');

      expect(model.name).to.equal('failure');
      expect(model).to.be.an.instanceOf(Container);
    });
  });
});
