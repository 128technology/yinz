import { expect } from 'chai';

import xmlUtil, { yinNS, t128InternalNS } from '../../../__tests__/xmlUtil';
import { Visibility, OrderedBy, ContextNode, Status } from '../../../enum';
import ns from '../../../util/ns';

import * as Parsers from '../';

describe('Model Parsers', () => {
  describe('Visibility Parser', () => {
    it('should parse hidden nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${t128InternalNS}>
          <t128-internal:visibility>hidden</t128-internal:visibility>
        </mock>
      `);

      expect(Parsers.VisibilityParser.parse(el)).to.equal(Visibility.hidden);
    });

    it('should parse advanced nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${t128InternalNS}>
          <t128-internal:visibility>advanced</t128-internal:visibility>
        </mock>
      `);

      expect(Parsers.VisibilityParser.parse(el)).to.equal(Visibility.advanced);
    });

    it('should parse visible nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${t128InternalNS}>
          <t128-internal:visibility>visible</t128-internal:visibility>
        </mock>
      `);

      expect(Parsers.VisibilityParser.parse(el)).to.equal(Visibility.visible);
    });

    it('should parse nodes with missing visibility', () => {
      const el = xmlUtil.toElement(`
        <mock ${t128InternalNS}></mock>
      `);

      expect(Parsers.VisibilityParser.parse(el)).to.equal(null);
    });
  });

  describe('Status Parser', () => {
    it('should parse current nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}>
          <yin:status>current</yin:status>
        </mock>
      `);

      expect(Parsers.StatusParser.parse(el)).to.equal(Status.current);
    });

    it('should parse deprecated nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}>
          <yin:status>deprecated</yin:status>
        </mock>
      `);

      expect(Parsers.StatusParser.parse(el)).to.equal(Status.deprecated);
    });

    it('should parse obsolete nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}>
          <yin:status>obsolete</yin:status>
        </mock>
      `);

      expect(Parsers.StatusParser.parse(el)).to.equal(Status.obsolete);
    });

    it('should parse nodes with no status', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS} />
      `);

      expect(Parsers.StatusParser.parse(el)).to.equal(null);
    });
  });

  describe('Max Elements Parser', () => {
    it('should parse max elements nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}>
          <yin:max-elements value="10"/>
        </mock>
      `);

      expect(Parsers.MaxElementsParser.parse(el)).to.equal(10);
    });

    it('should parse missing max elements nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}></mock>
      `);

      expect(Parsers.MaxElementsParser.parse(el)).to.equal(null);
    });
  });

  describe('Min Elements Parser', () => {
    it('should parse min elements nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}>
          <yin:min-elements value="3"/>
        </mock>
      `);

      expect(Parsers.MinElementsParser.parse(el)).to.equal(3);
    });

    it('should parse missing min elements nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}></mock>
      `);

      expect(Parsers.MinElementsParser.parse(el)).to.equal(0);
    });
  });

  describe('Description Parser', () => {
    it('should parse min elements nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}>
          <yin:description>
            <yin:text>This cow moos.</yin:text>
          </yin:description>
        </mock>
      `);

      expect(Parsers.DescriptionParser.parse(el)).to.equal('This cow moos.');
    });

    it('should convert newlines to spaces', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}>
          <yin:description>
            <yin:text>This cow\npoos.</yin:text>
          </yin:description>
        </mock>
      `);

      expect(Parsers.DescriptionParser.parse(el)).to.equal('This cow poos.');
    });
  });

  describe('Ordered By Parser', () => {
    it('should parse user nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}>
          <yin:ordered-by value="user"/>
        </mock>
      `);

      expect(Parsers.OrderedByParser.parse(el)).to.equal(OrderedBy.user);
    });

    it('should parse system nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}>
          <yin:ordered-by value="system"/>
        </mock>
      `);

      expect(Parsers.OrderedByParser.parse(el)).to.equal(OrderedBy.system);
    });

    it('should parse nodes with missing ordered by', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}></mock>
      `);

      expect(Parsers.OrderedByParser.parse(el)).to.equal(OrderedBy.system);
    });
  });

  describe('Mandatory Parser', () => {
    it('should parse mandatory true nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}>
          <yin:mandatory value="true"/>
        </mock>
      `);

      expect(Parsers.MandatoryParser.parse(el)).to.equal(true);
    });

    it('should parse mandatory false nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}>
          <yin:mandatory value="false"/>
        </mock>
      `);

      expect(Parsers.MandatoryParser.parse(el)).to.equal(false);
    });

    it('should parse missing mandatory node', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}></mock>
      `);

      expect(Parsers.MandatoryParser.parse(el)).to.equal(false);
    });
  });

  describe('When Parser', () => {
    it('should add prefixes', () => {
      const el = xmlUtil.toElement(`
        <yin:container ${yinNS} xmlns:ps="http://128technology.com/t128/popsickle-sticks" name="popsickle" module-prefix="ps">
          <yin:when condition="count(../type) = 1"/>
        </yin:container>
      `);

      expect(Parsers.WhenParser.parse(el)).to.deep.equal([{ condition: 'count(../ps:type) = 1', context: null }]);
    });

    it('should parse the context node', () => {
      const el = xmlUtil.toElement(`
        <yin:container ${yinNS} xmlns:ps="http://128technology.com/t128/popsickle-sticks" name="popsickle" module-prefix="ps">
          <yin:when condition="count(../type) = 1" context-node="parent"/>
        </yin:container>
      `);

      expect(Parsers.WhenParser.parse(el)).to.deep.equal([
        { condition: 'count(../ps:type) = 1', context: ContextNode.parent }
      ]);
    });

    it('should do nothing if name already has prefix', () => {
      const el = xmlUtil.toElement(`
        <yin:container ${yinNS} xmlns:ps="http://128technology.com/t128/popsickle-sticks" name="popsickle" module-prefix="ps">
          <yin:when condition="count(../sys:type) = 1"/>
        </yin:container>
      `);

      expect(Parsers.WhenParser.parse(el)).to.deep.equal([{ condition: 'count(../sys:type) = 1', context: null }]);
    });

    it('should parse multiple when nodes', () => {
      const el = xmlUtil.toElement(`
        <yin:container ${yinNS} xmlns:ps="http://128technology.com/t128/popsickle-sticks" name="popsickle" module-prefix="ps">
          <yin:when condition="../type = 'foo'"/>
          <yin:when condition="../type = 'bar'"/>
        </yin:container>
      `);

      expect(Parsers.WhenParser.parse(el)).to.deep.equal([
        { condition: "../ps:type = 'foo'", context: null },
        { condition: "../ps:type = 'bar'", context: null }
      ]);
    });

    it('should parse no when nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS} />
      `);

      expect(Parsers.WhenParser.parse(el)).to.equal(null);
    });

    it('should detect if element self has a when statement', () => {
      const el = xmlUtil.toElement(`
        <yin:container ${yinNS} xmlns:ps="http://128technology.com/t128/popsickle-sticks" name="popsickle" module-prefix="ps">
          <yin:when condition="../type = 'foo'"/>
        </yin:container>
      `);

      expect(Parsers.WhenParser.hasWhenAncestorOrSelf(el)).to.equal(true);
    });

    it('should detect if element self has no when statement', () => {
      const el = xmlUtil.toElement(`
        <yin:container ${yinNS} xmlns:ps="http://128technology.com/t128/popsickle-sticks" name="popsickle" module-prefix="ps" />
      `);

      expect(Parsers.WhenParser.hasWhenAncestorOrSelf(el)).to.equal(false);
    });

    it('should detect if element ancestor has a when statement', () => {
      const el = xmlUtil.toElement(`
        <yin:container ${yinNS} xmlns:ps="http://128technology.com/t128/popsickle-sticks" name="popsickle" module-prefix="ps">
          <yin:when condition="../type = 'foo'"/>
          <yin:container name="stout">
            <yin:container name="porter" />
          </yin:container>
        </yin:container>
      `);

      expect(Parsers.WhenParser.hasWhenAncestorOrSelf(el.get('//yin:container[@name="porter"]', ns))).to.equal(true);
    });

    it('should detect if element ancestor has no when statement', () => {
      const el = xmlUtil.toElement(`
        <yin:container ${yinNS} xmlns:ps="http://128technology.com/t128/popsickle-sticks" name="popsickle" module-prefix="ps">
          <yin:container name="stout">
            <yin:container name="porter" />
          </yin:container>
        </yin:container>
      `);

      expect(Parsers.WhenParser.hasWhenAncestorOrSelf(el.get('//yin:container[@name="porter"]', ns))).to.equal(false);
    });
  });

  describe('Presence Parser', () => {
    it('should parse presence true nodes', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}>
          <yin:presence value="The reason."/>
        </mock>
      `);

      expect(Parsers.PresenceParser.parse(el)).to.equal('The reason.');
    });

    it('should parse nodes that have no presence', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS} />
      `);

      expect(Parsers.PresenceParser.parse(el)).to.equal(null);
    });
  });

  describe('Default Parser', () => {
    it('should parse default values if they exist', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}>
          <yin:default value="0"/>
        </mock>
      `);

      expect(Parsers.DefaultParser.parse(el)).to.equal('0');
    });

    it('should return null if default node does not exist', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS} />
      `);

      expect(Parsers.DefaultParser.parse(el)).to.equal(null);
    });
  });

  describe('Namespaces Parser', () => {
    it('should aggregate all namespaces from a model', () => {
      const el = xmlUtil.toElement(`
        <mock ${yinNS}>
          <yin:container xmlns:ps="http://128technology.com/t128/popsickle-sticks" name="popsickle" module-prefix="ps">
            <yin:container xmlns:ss="http://128technology.com/t128/swizzle-sticks" name="swizzle" module-prefix="ss" />
          </yin:container>
          <yin:list xmlns:ws="http://128technology.com/t128/walking-sticks" name="walking" module-prefix="ws" />
        </mock>
      `);

      expect(Parsers.NamespacesParser.parse(el)).to.deep.equal({
        ps: 'http://128technology.com/t128/popsickle-sticks',
        ss: 'http://128technology.com/t128/swizzle-sticks',
        ws: 'http://128technology.com/t128/walking-sticks'
      });
    });

    it('should get namespace from a module', () => {
      const el = xmlUtil.toElement(`
        <yin:container xmlns:ps="http://128technology.com/t128/popsickle-sticks" name="popsickle" module-prefix="ps">
          <yin:container xmlns:ss="http://128technology.com/t128/swizzle-sticks" name="swizzle" module-prefix="ss" />
        </yin:container>
      `);

      expect(Parsers.NamespacesParser.getNamespaceFromModule(el)).to.deep.equal([
        'ps',
        'http://128technology.com/t128/popsickle-sticks'
      ]);
    });

    it('should get namespace for a field in a module', () => {
      const el = xmlUtil.toElement(`
        <yin:container ${yinNS} xmlns:ps="http://128technology.com/t128/popsickle-sticks" name="popsickle" module-prefix="ps">
          <yin:container name="foo">
            <yin:leaf name="bar">test</yin:leaf>
          </yin:container>
        </yin:container>
      `);

      expect(Parsers.NamespacesParser.getNamespace(el.get('//yin:leaf', ns))).to.deep.equal([
        'ps',
        'http://128technology.com/t128/popsickle-sticks'
      ]);
    });

    it('should get prefix for a field in a module', () => {
      const el = xmlUtil.toElement(`
        <yin:container ${yinNS} xmlns:ps="http://128technology.com/t128/popsickle-sticks" name="popsickle" module-prefix="ps">
          <yin:container name="foo">
            <yin:leaf name="bar">test</yin:leaf>
          </yin:container>
        </yin:container>
      `);

      expect(Parsers.NamespacesParser.getModulePrefix(el.get('//yin:leaf', ns))).to.equal('ps');
    });
  });
});
