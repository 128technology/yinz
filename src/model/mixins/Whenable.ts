import { Element } from 'libxmljs';

import { WhenParser } from '../parsers';
import { ContextNode } from '../../enum';

export interface IWhen {
  condition: string;
  context?: ContextNode;
}

export default class Whenable {
  public when: IWhen[];
  public hasWhenAncestorOrSelf: boolean;

  public addWhenableProps(el: Element) {
    this.when = WhenParser.parse(el);
    this.hasWhenAncestorOrSelf = WhenParser.hasWhenAncestorOrSelf(el);
  }
}
