import * as _ from 'lodash';
import { Element } from 'libxmljs';

import { isVisible } from '../../enum/Visibility';
import { Visibility } from '../../enum';

import { DescriptionParser, VisibilityParser, PropertiesParser, NamespacesParser } from '../parsers';
import { Model, Case } from '../';

export default class Statement {
  public name: string;
  public ns: [string, string];
  public description: string;
  public otherProps: Map<string, string | boolean>;
  public parentModel: Model;
  public visibility: Visibility | null;
  public choiceCase: Case;

  public addStatementProps(el: Element, parentModel?: Model) {
    this.name = el.attr('name').value();
    this.ns = NamespacesParser.getNamespace(el);
    this.parentModel = parentModel;

    this.description = DescriptionParser.parse(el);
    this.visibility = VisibilityParser.parse(el);

    this.otherProps = PropertiesParser.parse(el);
  }

  get path(): string {
    const parentPath = _.get(this, 'parentModel.path', null);

    return parentPath ? [parentPath, this.name].join('.') : this.name;
  }

  get isVisible(): boolean {
    // If this config node did not define visibility, defer to it's parent.
    return this.visibility !== null ? isVisible(this.visibility) : _.get(this, 'parentModel.isVisible', true);
  }

  public getName(camelCase = false) {
    return camelCase ? _.camelCase(this.name) : this.name;
  }
}
