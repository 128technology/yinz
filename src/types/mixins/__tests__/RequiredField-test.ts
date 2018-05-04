import { expect } from 'chai';
import { Element } from 'libxmljs';

import applyMixins from '../../../util/applyMixins';
import xmlUtil, { yinNS } from '../../../__tests__/xmlUtil';
import { RequiredField } from '../';

describe('Required Field Mixin', () => {
  const typeEl = xmlUtil.toElement(`<type ${yinNS} name="string" />`);

  class Test implements RequiredField {
    public validateRequiredFields: (el: Element, required: string[]) => void;
  }

  applyMixins(Test, [RequiredField]);

  it('should throw if a required field is not provided', () => {
    const testType = new Test();

    expect(() => testType.validateRequiredFields(typeEl, ['foo'])).to.throw('The given type must specify foo.');
  });
});
