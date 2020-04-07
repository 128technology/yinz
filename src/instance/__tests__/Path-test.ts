import { expect } from 'chai';

import { pathToJSON } from '../Path';
import { dataModel } from './DataModelInstance-test';

describe('Path', () => {
  describe('Path to JSON', () => {
    it('should handle a path with length of one', () => {
      expect(pathToJSON([{ name: 'authority' }], dataModel)).to.deep.equal({
        document: { authority: {} },
        terminalNode: {}
      });
    });

    it('should handle nested containers', () => {
      expect(
        pathToJSON(
          [
            { name: 'authority' },
            { name: 'router', keys: [{ key: 'name', value: 'foo' }] },
            { name: 'system' },
            { name: 'services' }
          ],
          dataModel
        )
      ).to.deep.equal({
        document: { authority: { router: [{ name: 'foo', system: { services: {} } }] } },
        terminalNode: {}
      });
    });

    it('should handle a leaf with no value', () => {
      expect(pathToJSON([{ name: 'authority' }, { name: 'name' }], dataModel)).to.deep.equal({
        document: { authority: { name: '' } },
        terminalNode: ''
      });
    });

    it('should handle a leaf with a value', () => {
      expect(pathToJSON([{ name: 'authority' }, { name: 'name', value: 'foo' }], dataModel)).to.deep.equal({
        document: { authority: { name: 'foo' } },
        terminalNode: 'foo'
      });
    });

    it('should handle a leaf list with a value', () => {
      expect(
        pathToJSON([{ name: 'authority' }, { name: 'conductor-address', value: '1.1.1.1' }], dataModel)
      ).to.deep.equal({
        document: { authority: { 'conductor-address': ['1.1.1.1'] } },
        terminalNode: '1.1.1.1'
      });
    });

    it('should handle a leaf list with no value', () => {
      expect(pathToJSON([{ name: 'authority' }, { name: 'conductor-address' }], dataModel)).to.deep.equal({
        document: { authority: { 'conductor-address': [] } },
        terminalNode: []
      });
    });
  });
});
