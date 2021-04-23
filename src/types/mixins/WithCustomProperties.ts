import { Element } from 'libxmljs2';
import { PropertiesParser } from '../../model/parsers';

export default class WithCustomProperties {
  public otherProps: Map<string, string | boolean>;

  public addCustomProperties(el: Element, ignoreList: string[] = []) {
    this.otherProps = PropertiesParser.parse(el, ignoreList);
  }
}
