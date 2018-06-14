import { Element } from 'libxmljs';

import { Path, Instance, ListChildInstance } from '../';
import { Model } from '../../model';

export default class WithAttributes {
  public config: Element;

  public get customAttributes() {
    return this.config.attrs().reduce((acc, attr) => acc.set(attr.name(), attr.value()), new Map());
  }
}
