import { Element } from 'libxmljs';
import * as _ from 'lodash';

export type IRangeBound = string | number;

export interface IRange {
  max: IRangeBound;
  min: IRangeBound;
}

const MIN_MAX = new Set(['min', 'max']);

function parse(bound: string) {
  return MIN_MAX.has(bound) ? bound : parseInt(bound, 10);
}

export default class Range {
  public ranges: IRange[];

  constructor(el: Element) {
    this.parseRange(el);
  }

  public parseRange(el: Element) {
    const value = el.attr('value').value();
    this.ranges = value
      .split('|')
      .map(range => range.trim())
      .map(range => {
        const [lower, upper] = range.split('..');

        const min = parse(lower);
        const max = _.isNil(upper) ? min : parse(upper);

        return { min, max };
      });
  }
}
