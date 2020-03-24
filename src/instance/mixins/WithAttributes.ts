import { Element } from 'libxmljs';

interface IAttribute {
  name: string;
  value: string;
  prefix: string;
  href: string;
}

export default class WithAttributes {
  public customAttributesContainer: IAttribute[];

  public parseCustomAttributes(config: Element) {
    this.customAttributesContainer = config.attrs().reduce((acc, attr) => {
      acc.push({
        name: attr.name(),
        value: attr.value(),
        prefix: attr.namespace()?.prefix(),
        href: attr.namespace()?.href()
      });

      return acc;
    }, []);
  }

  public get customAttributes() {
    return this.customAttributesContainer.reduce((acc, { name, value }) => (acc.set(name, value), acc), new Map());
  }

  public get hasCustomAttributes() {
    return this.customAttributesContainer.length > 0;
  }

  public addCustomAttributes(el: Element) {
    this.customAttributesContainer.forEach(({ name, value, prefix, href }) => {
      if (prefix && href) {
        el.defineNamespace(prefix, href);
        el.attr({ [`${prefix}:${name}`]: value });
      } else {
        el.attr({ [name]: value });
      }
    });
  }
}
