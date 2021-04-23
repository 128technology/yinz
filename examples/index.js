const util = require('util');

const libXML = require('libxmljs2');
const fs = require('fs');
const path = require('path');

const { DataModel, DataModelInstance, allow } = require('../dist');

const ns = {
  't128-internal': 'http://128technology.com/t128-internal-extensions',
  yin: 'urn:ietf:params:xml:ns:yang:yin:1'
};

const NS_PER_SEC = 1e9;

/* Config Model */
const configModelText = fs.readFileSync(path.join(__dirname, 'consolidatedT128Model.xml'), 'utf-8');
const configModelElement = libXML.parseXmlString(configModelText);

const configModelOptions = {
  modelElement: configModelElement,
  rootPath: '//yin:container[@name="authority"]'
};

const configModel = new DataModel(configModelOptions);

const reply = fs.readFileSync(path.join(__dirname, 'small.xml'), 'utf-8');
const replyXMLDoc = libXML.parseXmlString(reply);
const config = replyXMLDoc.get('//t128:config', { t128: 'http://128technology.com/t128' });

const timeStart = process.hrtime();
const instance = new DataModelInstance(configModel, config);
const instanceJSON = instance.toJSON(allow);
const diff = process.hrtime(timeStart);

console.log(`JSON serialization took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
console.log('Config Model', util.inspect(instanceJSON, { depth: null }));

/* Stats Model */
const statsModelText = fs.readFileSync(path.join(__dirname, 'consolidatedStatsModel.xml'), 'utf-8');
const statsModelElement = libXML.parseXmlString(statsModelText);

const statsModelOptions = {
  modelElement: statsModelElement,
  rootPath: '//yin:container[@name="stats"]'
};

const statsModel = new DataModel(statsModelOptions);

console.log('Stats Model', statsModel);
