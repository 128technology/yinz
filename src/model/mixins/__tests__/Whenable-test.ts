import { Element } from 'libxmljs';
import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../../__tests__/xmlUtil';
import applyMixins from '../../../util/applyMixins';
import { Whenable } from '../';
import { IWhen } from '../Whenable';

describe('Whenable Mixin', () => {
  class Test implements Whenable {
    public when: IWhen[];
    public hasWhenAncestorOrSelf: boolean;

    public addWhenableProps: (el: Element) => void;
  }

  applyMixins(Test, [Whenable]);

  it('should add when conditions', () => {
    const el = xmlUtil.toElement(`
        <yin:container ${yinNS} xmlns:ps="http://128technology.com/t128/popsickle-sticks" name="popsickle" module-prefix="ps">
          <yin:when condition="count(../sys:type) = 1"/>
        </yin:container>
      `);
    const testModel = new Test();
    testModel.addWhenableProps(el);

    expect(testModel.when).to.deep.equal([{ condition: 'count(../sys:type) = 1', context: null }]);
  });

  it('should add hasWhenAncestorOrSelf', () => {
    const el = xmlUtil.toElement(`
        <yin:container ${yinNS} xmlns:ps="http://128technology.com/t128/popsickle-sticks" name="popsickle" module-prefix="ps">
          <yin:when condition="count(../sys:type) = 1"/>
        </yin:container>
      `);
    const testModel = new Test();
    testModel.addWhenableProps(el);

    expect(testModel.hasWhenAncestorOrSelf).to.equal(true);
  });
});
