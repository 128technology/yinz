import * as _ from 'lodash';
import { Element } from 'libxmljs2';

import { isVisible } from '../../enum/Visibility';
import { Visibility, Status } from '../../enum';

import { DescriptionParser, VisibilityParser, PropertiesParser, NamespacesParser, StatusParser } from '../parsers';
import { Model, Case } from '../';

export default class Statement {
  public name: string;
  public ns: [string, string];
  public description: string | null;
  public otherProps: Map<string, string | boolean>;
  public parentModel: Model | null;
  public status: Status | null;
  public visibility: Visibility | null;
  public choiceCase: Case;

  public addStatementProps(el: Element, parentModel: Model | null) {
    this.name = el.attr('name')!.value();
    this.ns = NamespacesParser.getNamespace(el);
    this.parentModel = parentModel;

    this.description = DescriptionParser.parse(el);
    this.visibility = VisibilityParser.parse(el);
    this.status = StatusParser.parse(el);

    this.otherProps = PropertiesParser.parse(el, ['visibility', 'type']);
  }

  get path(): string {
    const parentPath = _.get(this, 'parentModel.path', null);

    return parentPath ? [parentPath, this.name].join('.') : this.name;
  }

  get isVisible(): boolean {
    if (this.visibility !== null) {
      return isVisible(this.visibility);
    } else {
      if (this.choiceCase) {
        return this.choiceCase.isVisible;
      } else {
        return _.get(this, 'parentModel.isVisible', true);
      }
    }
  }

  get isPrototype(): boolean {
    if (this.visibility !== null) {
      return this.visibility === Visibility.prototype;
    } else {
      if (this.choiceCase) {
        return this.choiceCase.isPrototype;
      } else {
        return _.get(this, 'parentModel.isPrototype', false);
      }
    }
  }

  get isObsolete(): boolean {
    if (this.status !== null) {
      return this.status === Status.obsolete;
    } else {
      if (this.choiceCase) {
        return this.choiceCase.isObsolete;
      } else {
        return _.get(this, 'parentModel.isObsolete', false);
      }
    }
  }

  get isDeprecated(): boolean {
    if (this.status !== null) {
      return this.status === Status.deprecated;
    } else {
      if (this.choiceCase) {
        return this.choiceCase.isDeprecated;
      } else {
        return _.get(this, 'parentModel.isDeprecated', false);
      }
    }
  }

  public getName(camelCase = false) {
    return camelCase ? _.camelCase(this.name) : this.name;
  }
}
