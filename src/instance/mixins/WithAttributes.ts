import { Element } from 'libxmljs';
import * as _ from 'lodash';

import { IAttribute, NetconfOperation, Position, JSONConfigNode, hasAttributes } from '../types';
import UnreachableCaseError from '../../util/unreachableCaseError';
import { defineNamespaceSafe } from '../../util/xmlUtil';

function mapOperationToAttribute(operation: NetconfOperation): IAttribute {
  switch (operation) {
    case 'delete':
    case 'merge':
    case 'replace':
    case 'remove':
    case 'create': {
      return {
        href: 'urn:ietf:params:xml:ns:netconf:base:1.0',
        name: 'operation',
        prefix: 'xc',
        value: operation
      };
    }
    default: {
      throw new UnreachableCaseError(operation);
    }
  }
}

function mapPositionToAttributes(position: Position): IAttribute[] {
  const attributes: IAttribute[] = [
    {
      href: 'urn:ietf:params:xml:ns:yang:1',
      name: 'insert',
      prefix: 'yang',
      value: position.insert
    }
  ];

  if (position.value) {
    attributes.push({
      href: 'urn:ietf:params:xml:ns:yang:1',
      name: 'value',
      prefix: 'yang',
      value: position.value
    });
  }

  if (position.keys) {
    const keyString = position.keys
      .map(({ key, value }) => {
        return `[${_.kebabCase(key)}='${value}']`;
      })
      .join('');

    attributes.push({
      href: 'urn:ietf:params:xml:ns:yang:1',
      name: 'key',
      prefix: 'yang',
      value: keyString
    });
  }

  return attributes;
}

export default class WithAttributes {
  public rawAttributes: IAttribute[];

  public parseAttributesFromXML(config: Element) {
    this.rawAttributes = config.attrs().reduce((acc, attr) => {
      acc.push({
        href: attr.namespace()?.href(),
        name: attr.name(),
        prefix: attr.namespace()?.prefix(),
        value: attr.value()
      });

      return acc;
    }, []);
  }

  public parseAttributesFromJSON(config: JSONConfigNode) {
    this.rawAttributes = [];

    if (hasAttributes(config)) {
      if (config._attributes) {
        this.rawAttributes = config._attributes;
      }

      if (config._operation) {
        this.addOperation(config._operation);
      }

      if (config._position) {
        this.addPosition(config._position);
      }
    }
  }

  public getValueFromJSON(config: JSONConfigNode) {
    if (hasAttributes(config)) {
      return config._value;
    } else {
      return config;
    }
  }

  public get customAttributes() {
    return this.rawAttributes.reduce((acc, { name, value }) => (acc.set(name, value), acc), new Map());
  }

  public get hasAttributes() {
    return this.rawAttributes.length > 0;
  }

  public addAttributes(el: Element) {
    this.rawAttributes.forEach(({ name, value, prefix, href }) => {
      if (prefix && href) {
        defineNamespaceSafe(el, prefix, href);
        el.attr({ [`${prefix}:${name}`]: value });
      } else {
        el.attr({ [name]: value });
      }
    });
  }

  public addOperation(operation: NetconfOperation) {
    this.rawAttributes.push(mapOperationToAttribute(operation));
  }

  public addPosition(position: Position) {
    this.rawAttributes = [...this.rawAttributes, ...mapPositionToAttributes(position)];
  }
}
