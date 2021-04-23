import { Element } from 'libxmljs2';

export default class Named {
  public type: string;

  public addNamedProps(el: Element) {
    this.type = el.attr('name')!.value();
  }
}
