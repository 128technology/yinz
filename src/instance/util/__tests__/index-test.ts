import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import xmlUtil from '../../../__tests__/xmlUtil';
import { getPathXPath, getSegmentXPath, addEmptyTree } from '../';
import DataModel from '../../../model';
import DataModelInstance, { ContainerInstance, ListChildInstance } from '../../';

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
        {
          keys: [
            { key: 'name', value: 'HTTPS' },
            { key: 'foo', value: 'bar' }
          ],
          name: 'session-type'
        },
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
        getSegmentXPath({
          keys: [
            { key: 'name', value: 'HTTPS' },
            { key: 'foo', value: 'bar' }
          ],
          name: 'session-type'
        })
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
    const config = xmlUtil.toElement(instanceText).get('//t128:config', { t128: 'http://128technology.com/t128' })!;
    const instance = new DataModelInstance(dataModel, config);

    it('should build out a tree with keys', () => {
      const testPath = [{ name: 'session-type', keys: [{ key: 'name', value: 'HTTPS' }] }, { name: 'service-class' }];

      const { contextEl, cleanUpHiddenTree } = addEmptyTree(
        testPath,
        dataModel,
        instance.getInstance([{ name: 'authority' }]) as ContainerInstance
      );
      const result = contextEl.doc().toString();
      cleanUpHiddenTree();

      expect(result).xml.to.equal(`
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

    it('should clean up after itself', () => {
      const testPath = [{ name: 'session-type', keys: [{ key: 'name', value: 'HTTPS' }] }, { name: 'service-class' }];

      const { contextEl, cleanUpHiddenTree } = addEmptyTree(
        testPath,
        dataModel,
        instance.getInstance([{ name: 'authority' }]) as ContainerInstance
      );
      cleanUpHiddenTree();
      const result = contextEl.doc().toString();

      expect(result).xml.to.equal(`
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
            </authy:authority>
          </t128:config>
        `);
    });

    it('should not explode if called twice before cleaning up', () => {
      const testPath = [{ name: 'session-type', keys: [{ key: 'name', value: 'HTTPS' }] }, { name: 'service-class' }];

      const { cleanUpHiddenTree: cleanUp1 } = addEmptyTree(
        testPath,
        dataModel,
        instance.getInstance([{ name: 'authority' }]) as ContainerInstance
      );
      const { contextEl, cleanUpHiddenTree: cleanUp2 } = addEmptyTree(
        testPath,
        dataModel,
        instance.getInstance([{ name: 'authority' }]) as ContainerInstance
      );
      cleanUp1();
      cleanUp2();
      const result = contextEl.doc().toString();

      expect(result).xml.to.equal(`
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
            </authy:authority>
          </t128:config>
        `);
    });

    it('should build out a tree without keys', () => {
      const testPath = [{ name: 'rekey-interval' }];

      const { contextEl, cleanUpHiddenTree } = addEmptyTree(
        testPath,
        dataModel,
        instance.getInstance([{ name: 'authority' }]) as ContainerInstance
      );
      const result = contextEl.doc().toString();
      cleanUpHiddenTree();

      expect(result).xml.to.equal(`
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
      const testPath = [{ name: 'description' }];

      const { contextEl, cleanUpHiddenTree } = addEmptyTree(
        testPath,
        dataModel,
        instance.getInstance([
          { name: 'authority' },
          { name: 'router', keys: [{ key: 'name', value: 'Fabric128' }] },
          { name: 'node', keys: [{ key: 'name', value: 'TestNode1' }] }
        ]) as ListChildInstance
      );
      const result = contextEl.doc().toString();
      cleanUpHiddenTree();

      expect(result).xml.to.equal(`
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
