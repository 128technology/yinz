import { Element } from 'libxmljs';

export default class WithAttributes {
  public config: Element;

  public get customAttributes() {
    return this.config.attrs().reduce((acc, attr) => acc.set(attr.name(), attr.value()), new Map());
  }
}
