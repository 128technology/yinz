import { expect } from 'chai';

import { defineNamespaceOnRoot } from '../xmlUtil';
import xmlUtil from '../../__tests__/xmlUtil';

describe('XML Utility', () => {
  describe('#defineNamespaceOnRoot()', () => {
    it('should define namespace on root element', () => {
      const tree = xmlUtil.toElement(`
        <foo>
          <bar>
            <baz />
          </bar>
        </foo>
      `);
      const innerEl = tree.get('//baz');
      defineNamespaceOnRoot(innerEl, 'foo', 'http://foo.com');

      expect(tree.toString()).xml.to.equal(`
        <foo xmlns:foo="http://foo.com">
          <bar>
            <baz />
          </bar>
        </foo> 
      `);
    });
  });
});
