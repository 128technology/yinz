import { expect } from 'chai';
import { Element } from 'libxmljs2';

import xmlUtil, { yinNS } from '../../../__tests__/xmlUtil';
import applyMixins from '../../../util/applyMixins';
import { Type } from '../../../types';

import { WithUnits, Typed } from '../';
import { Identities } from '../../';

describe('With Units Mixin', () => {
  class Test implements WithUnits, Typed {
    public definedUnits: string;
    public type: Type;
    public units: string;

    public addDefinedUnits: (el: Element) => void;
    public addTypeProps: (el: Element, identities: Identities) => void;

    constructor(el: Element) {
      this.addTypeProps(el, new Identities());
      this.addDefinedUnits(el);
    }
  }

  applyMixins(Test, [WithUnits, Typed]);

  const withTypeDefUnits = xmlUtil.toElement(`
    <yin:leaf name="name" ${yinNS}>
      <yin:type name="t128ext:tenant-name">
        <yin:typedef name="tenant-name">
          <yin:units name="floops" />
          <yin:type name="string">
            <yin:length value="0..253"/>
          </yin:type>
        </yin:typedef>
      </yin:type>
    </yin:leaf>
  `);

  const withBothUnits = xmlUtil.toElement(`
    <yin:leaf name="name" ${yinNS}>
      <yin:units name="boops" />
      <yin:type name="t128ext:tenant-name">
        <yin:typedef name="tenant-name">
          <yin:units name="floops" />
          <yin:type name="string">
            <yin:length value="0..253"/>
          </yin:type>
        </yin:typedef>
      </yin:type>
    </yin:leaf>
  `);

  const withLeafUnits = xmlUtil.toElement(`
    <yin:leaf name="name" ${yinNS}>
      <yin:units name="flops" />
      <yin:type name="string" />
    </yin:leaf>
  `);

  const noUnits = xmlUtil.toElement(`
    <yin:leaf name="name" ${yinNS}>
      <yin:type name="string" />
    </yin:leaf>
  `);

  it('should add the defined units to the object', () => {
    const model = new Test(withLeafUnits);

    expect(model.definedUnits).to.equal('flops');
  });

  it('should handle no defined units', () => {
    const model = new Test(noUnits);

    expect(model.definedUnits).to.equal(null);
  });

  it('should make defined units should take precedence', () => {
    const model = new Test(withBothUnits);

    expect(model.units).to.equal('boops');
  });

  it('should get derived type units', () => {
    const model = new Test(withTypeDefUnits);

    expect(model.units).to.equal('floops');
  });

  it('should get defined units', () => {
    const model = new Test(withLeafUnits);

    expect(model.units).to.equal('flops');
  });

  it('should get no units', () => {
    const model = new Test(noUnits);

    expect(model.units).to.equal(null);
  });
});
