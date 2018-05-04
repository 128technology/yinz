import { Element } from 'libxmljs';

export default class Named {
  public type: string;

  public addNamedProps(el: Element) {
    this.type = el.attr('name').value();
  }
}
