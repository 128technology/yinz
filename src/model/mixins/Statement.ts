import * as _ from 'lodash';
import { Element } from 'libxmljs';

import { isVisible } from '../../enum/Visibility';
import { Visibility, Status } from '../../enum';

import { DescriptionParser, VisibilityParser, PropertiesParser, NamespacesParser, StatusParser } from '../parsers';
import { Model, Case } from '../';

export default class Statement {
  public name: string;
  public ns: [string, string];
  public description: string;
  public otherProps: Map<string, string | boolean>;
  public parentModel: Model;
  public status: Status;
  public visibility: Visibility | null;
  public choiceCase: Case;

  public addStatementProps(el: Element, parentModel?: Model) {
    this.name = el.attr('name').value();
    this.ns = NamespacesParser.getNamespace(el);
    this.parentModel = parentModel;

    this.description = DescriptionParser.parse(el);
    this.visibility = VisibilityParser.parse(el);
    this.status = StatusParser.parse(el);

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

  get isPrototype(): boolean {
    return this.visibility !== null
      ? this.visibility === Visibility.prototype
      : _.get(this, 'parentModel.isPrototype', false);
  }

  get isObsolete(): boolean {
    return this.status !== null ? this.status === Status.obsolete : _.get(this, 'parentModel.isObsolete', false);
  }

  get isDeprecated(): boolean {
    return this.status !== null ? this.status === Status.deprecated : _.get(this, 'parentModel.isDeprecated', false);
  }

  public getName(camelCase = false) {
    return camelCase ? _.camelCase(this.name) : this.name;
  }
}
