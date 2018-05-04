import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../../__tests__/xmlUtil';
import { getPathXPath, getSegmentXPath, addEmptyTree } from '../';
import DataModel from '../../../model';

describe('Instance Util', () => {
  describe('#getPathXPath()', () => {
    it('should get an XPath from a Path without keys', () => {
      const testPath = [{ name: 'authority' }, { name: 'session-type' }, { name: 'service-class' }];

      expect(getPathXPath(testPath)).to.equal(
        "//*[local-name()='config']/*[local-name()='authority']/*[local-name()='session-type']/*[local-name()='service-class']"
      );
    });

    it('should get an XPath from a Path with keys', () => {
      const testPath = [
        { name: 'authority' },
        { name: 'session-type', keys: [{ key: 'name', value: 'HTTPS' }] },
        { name: 'service-class' }
      ];

      expect(getPathXPath(testPath)).to.equal(
        "//*[local-name()='config']/*[local-name()='authority']/*[local-name()='session-type'][*[local-name()='name']='HTTPS']/*[local-name()='service-class']"
      );
    });

    it('should get an XPath from a Path with compound keys', () => {
      const testPath = [
        { name: 'authority' },
        { name: 'session-type', keys: [{ key: 'name', value: 'HTTPS' }, { key: 'foo', value: 'bar' }] },
        { name: 'service-class' }
      ];

      expect(getPathXPath(testPath)).to.equal(
        "//*[local-name()='config']/*[local-name()='authority']/*[local-name()='session-type'][*[local-name()='name']='HTTPS' and *[local-name()='foo']='bar']/*[local-name()='service-class']"
      );
    });
  });

  describe('#getSegmentXPath()', () => {
    it('should get an XPath from a non-keyed segment', () => {
      expect(getSegmentXPath({ name: 'authority' })).to.equal("*[local-name()='authority']");
    });

    it('should get an XPath from a keyed segment', () => {
      expect(getSegmentXPath({ name: 'session-type', keys: [{ key: 'name', value: 'HTTPS' }] })).to.equal(
        "*[local-name()='session-type'][*[local-name()='name']='HTTPS']"
      );
    });

    it('should get an XPath from a compound keyed segment', () => {
      expect(
        getSegmentXPath({ name: 'session-type', keys: [{ key: 'name', value: 'HTTPS' }, { key: 'foo', value: 'bar' }] })
      ).to.equal("*[local-name()='session-type'][*[local-name()='name']='HTTPS' and *[local-name()='foo']='bar']");
    });
  });

  describe('#addEmptyTree()', () => {
    const modelText = fs.readFileSync(
      path.join(__dirname, '../../../model/__tests__/data/consolidatedT128Model.xml'),
      'utf-8'
    );
    const instanceText = fs.readFileSync(path.join(__dirname, 'data/minimalInstance.xml'), 'utf-8');
    const options = {
      modelElement: xmlUtil.toElement(modelText),
      rootPath: '//yin:container[@name="authority"]'
    };
    const dataModel = new DataModel(options);
    const instance = xmlUtil.toElement(instanceText).get('//t128:config', { t128: 'http://128technology.com/t128' });

    it('should build out a tree with keys', () => {
      const testPath = [
        { name: 'authority' },
        { name: 'session-type', keys: [{ key: 'name', value: 'HTTPS' }] },
        { name: 'service-class' }
      ];

      const newXML = addEmptyTree(testPath, dataModel, instance);

      expect(newXML.toString()).xml.to.equal(`
          <t128:config xmlns:t128="http://128technology.com/t128" xmlns:authy="http://128technology.com/t128/config/authority-config" xmlns:svc="http://128technology.com/t128/config/service-config" xmlns:sys="http://128technology.com/t128/config/system-config">
            <authy:authority>
              <authy:name>Authority128</authy:name>
              <authy:router>
                <authy:name>Fabric128</authy:name>
                <sys:node>
                  <sys:name>TestNode1</sys:name>
                  <sys:role>combo</sys:role>
                  <sys:enabled>true</sys:enabled>
                </sys:node>
              </authy:router>
              <svc:session-type>
                <svc:name>HTTPS</svc:name>
                <svc:service-class/>
              </svc:session-type>
            </authy:authority>
          </t128:config>
        `);
    });

    it('should build out a tree without keys', () => {
      const testPath = [{ name: 'authority' }, { name: 'rekey-interval' }];

      const newXML = addEmptyTree(testPath, dataModel, instance);

      expect(newXML.toString()).xml.to.equal(`
          <t128:config xmlns:t128="http://128technology.com/t128" xmlns:authy="http://128technology.com/t128/config/authority-config" xmlns:svc="http://128technology.com/t128/config/service-config" xmlns:sys="http://128technology.com/t128/config/system-config">
            <authy:authority>
              <authy:name>Authority128</authy:name>
              <authy:rekey-interval/>
              <authy:router>
                <authy:name>Fabric128</authy:name>
                <sys:node>
                  <sys:name>TestNode1</sys:name>
                  <sys:role>combo</sys:role>
                  <sys:enabled>true</sys:enabled>
                </sys:node>
              </authy:router>
            </authy:authority>
          </t128:config>
        `);
    });

    it('should traverse already existing objects', () => {
      const testPath = [
        { name: 'authority' },
        { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
        { name: 'node', keys: [{ key: 'name', value: 'TestNode1' }] },
        { name: 'description' }
      ];

      const newXML = addEmptyTree(testPath, dataModel, instance);

      expect(newXML.toString()).xml.to.equal(`
          <t128:config xmlns:t128="http://128technology.com/t128" xmlns:authy="http://128technology.com/t128/config/authority-config" xmlns:svc="http://128technology.com/t128/config/service-config" xmlns:sys="http://128technology.com/t128/config/system-config">
            <authy:authority>
              <authy:name>Authority128</authy:name>
              <authy:router>
                <authy:name>Fabric128</authy:name>
                <sys:node>
                  <sys:name>TestNode1</sys:name>
                  <sys:role>combo</sys:role>
                  <sys:description/>
                  <sys:enabled>true</sys:enabled>
                </sys:node>
              </authy:router>
            </authy:authority>
          </t128:config>
        `);
    });
  });
});
