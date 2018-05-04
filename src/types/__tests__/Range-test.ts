import { expect } from 'chai';

import xmlUtil, { yinNS } from '../../__tests__/xmlUtil';
import { Range } from '../';

describe('Range', () => {
  it('should parse a single range', () => {
    const rangeEl = xmlUtil.toElement(`<range ${yinNS} value="0..10" />`);
    const range = new Range(rangeEl);

    expect(range.ranges).to.deep.equal([{ min: 0, max: 10 }]);
  });

  it('should parse multiple ranges', () => {
    const rangeEl = xmlUtil.toElement(`<range ${yinNS} value="0..10 | 20..50 | 1000..100000" />`);
    const range = new Range(rangeEl);

    expect(range.ranges).to.deep.equal([{ min: 0, max: 10 }, { min: 20, max: 50 }, { min: 1000, max: 100000 }]);
  });

  it('should handle min and max ranges', () => {
    const rangeEl = xmlUtil.toElement(`<range ${yinNS} value="min..10 | 20..50 | 1000..max" />`);
    const range = new Range(rangeEl);

    expect(range.ranges).to.deep.equal([{ min: 'min', max: 10 }, { min: 20, max: 50 }, { min: 1000, max: 'max' }]);
  });

  it('should handle single values', () => {
    const rangeEl = xmlUtil.toElement(`<range ${yinNS} value="min | 20 | 1000" />`);
    const range = new Range(rangeEl);

    expect(range.ranges).to.deep.equal([{ min: 'min', max: 'min' }, { min: 20, max: 20 }, { min: 1000, max: 1000 }]);
  });
});
