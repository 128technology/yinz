import * as _ from 'lodash';
import { Element, Namespace } from 'libxmljs2';

import ns from '../../util/ns';
import { OrderedBy, Visibility, Status } from '../../enum';
import { enumValueOf } from '../../enum/ContextNode';
import { tokens } from '../../util/xPathParser';
import { isElement, assertElement } from '../../util/xmlUtil';
export { default as TypeParser } from '../../types/util/TypeParser';

function getLocalName(name: string) {
  return name.split(':').pop();
}

export class VisibilityParser {
  public static parse(el: Element): Visibility | null {
    const visibleElem = el.get('./t128-internal:visibility', ns);
    return visibleElem ? Visibility[assertElement(visibleElem).text() as keyof typeof Visibility] : null;
  }
}

export class StatusParser {
  public static parse(el: Element) {
    const statusElem = el.get('./yin:status', ns);
    return statusElem ? Status[assertElement(statusElem).attr('value')!.value() as keyof typeof Status] : null;
  }
}

export class MaxElementsParser {
  public static parse(el: Element) {
    const maxElemEl = el.get('./yin:max-elements', ns);
    return maxElemEl ? parseInt(assertElement(maxElemEl).attr('value')!.value(), 10) : null;
  }
}

export class MinElementsParser {
  public static parse(el: Element) {
    const minElemEl = el.get('./yin:min-elements', ns);
    return minElemEl ? parseInt(assertElement(minElemEl).attr('value')!.value(), 10) : 0;
  }
}

export class DescriptionParser {
  public static convertNewlinesToSpaces(stringToReplace: string) {
    return stringToReplace.replace(/(\r\n|\n|\r)/gm, ' ');
  }

  public static parse(el: Element) {
    const descriptionEl = el.get('./yin:description/yin:text', ns);
    return descriptionEl ? DescriptionParser.convertNewlinesToSpaces(assertElement(descriptionEl).text()) : null;
  }
}

export class UniqueParser {
  public static parse(el: Element) {
    const uniqueEls = el.find('./yin:unique', ns);
    return uniqueEls
      ? uniqueEls
          .filter(isElement)
          .map(uniqueEl => uniqueEl.attr('tag')!.value())
          .reduce((acc, tag) => {
            const uniqueSet = tag.split(' ');

            uniqueSet.forEach(x => {
              acc.set(
                x,
                uniqueSet.filter(y => y !== x)
              );
            });

            return acc;
          }, new Map<string, string[]>())
      : new Map<string, string[]>();
  }
}

export class ReferenceParser {
  public static convertNewlinesToSpaces(stringToReplace: string) {
    return stringToReplace.replace(/(\r\n|\n|\r)/gm, ' ');
  }

  public static parse(el: Element) {
    const referenceEl = el.get('./yin:reference/yin:text', ns);
    return referenceEl ? ReferenceParser.convertNewlinesToSpaces(assertElement(referenceEl).text()) : null;
  }
}

export class OrderedByParser {
  public static parse(el: Element) {
    const orderedByEl = el.get('./yin:ordered-by', ns);
    return orderedByEl
      ? OrderedBy[assertElement(orderedByEl).attr('value')!.value() as keyof typeof OrderedBy]
      : OrderedBy.system;
  }
}

export class MandatoryParser {
  public static parse(el: Element) {
    const mandatoryEl = el.get('./yin:mandatory', ns);

    return mandatoryEl ? assertElement(mandatoryEl).attr('value')!.value() === 'true' : false;
  }
}

export class UnitsParser {
  public static parse(el: Element) {
    const unitsEl = el.get('./yin:units', ns);

    return unitsEl ? assertElement(unitsEl).attr('name')!.value() : null;
  }
}

export class DefaultParser {
  public static parse(el: Element) {
    const defaultEl = el.get('./yin:default', ns);

    return defaultEl ? assertElement(defaultEl).attr('value')!.value() : null;
  }
}

export class PresenceParser {
  public static parse(el: Element) {
    const presenceEl = el.get('./yin:presence', ns);

    return presenceEl ? assertElement(presenceEl).attr('value')!.value() : null;
  }
}

export class NamespacesParser {
  public static getModulePrefix(el: Element) {
    const [prefix] = NamespacesParser.getNamespace(el);

    return prefix;
  }

  public static getNamespace(el: Element): [string, string] {
    const moduleEl = assertElement(el.get('./ancestor-or-self::yin:*[@module-prefix][1]', ns)!);
    return this.getNamespaceFromModule(moduleEl);
  }

  public static getNamespaceFromModule(el: Element): [string, string] {
    const prefix = el.attr('module-prefix')!.value();
    const href = el
      .namespaces()
      .find((namespace: Namespace) => namespace.prefix() === prefix)!
      .href();

    return [prefix, href];
  }

  public static parse(el: Element) {
    const nsEls = el.find('descendant-or-self::yin:*[@module-prefix]', ns).filter(isElement);

    return nsEls.reduce((acc: { [s: string]: string }, nsEl) => {
      const [prefix, href] = NamespacesParser.getNamespaceFromModule(nsEl);
      acc[prefix] = href;
      return acc;
    }, {});
  }
}

export class WhenParser {
  public static parse(el: Element) {
    const whenEls = el.find('./yin:when', ns).filter(isElement);

    if (whenEls && whenEls.length > 0) {
      return whenEls.map(whenEl => {
        const condition = whenEl.attr('condition')!.value();
        const prefix = NamespacesParser.getModulePrefix(el);
        const prefixed = WhenParser.ensureXPathNamesPrefixed(condition, prefix);

        const contextNode = whenEl.attr('context-node');
        const context = contextNode ? enumValueOf(contextNode.value()) : null;

        return { condition: prefixed, context };
      });
    } else {
      return null;
    }
  }

  public static hasWhenAncestorOrSelf(el: Element) {
    const result = el.get('./ancestor-or-self::yin:*[yin:when][1]', ns);
    return !_.isNil(result);
  }

  public static ensureXPathNamesPrefixed(expression: string, prefix: string) {
    const expressionTokens = tokens(expression);
    const newTokens: string[] = [];

    expressionTokens.forEach(([tokenType, token]) => {
      if (tokenType === 'name' && token.indexOf(':') === -1) {
        newTokens.push(`${prefix}:${token}`);
      } else {
        newTokens.push(token);
      }
    });

    return newTokens.join('');
  }
}

export class PropertiesParser {
  public static isTextProperty(el: Element) {
    const childNodes = el.childNodes();
    return childNodes.length === 1 && childNodes[0].type() === 'text';
  }

  public static isPresenceProperty(el: Element) {
    const childNodes = el.childNodes();
    return childNodes.length === 0 && el.attrs().length === 0;
  }

  public static parse(el: Element, ignoreList: string[]) {
    const children = el.find('./child::*', ns).filter(isElement);

    return children
      .filter(child => {
        if (_.includes(ignoreList, getLocalName(child.name()))) {
          return false;
        }

        if (PropertiesParser.isTextProperty(child) || PropertiesParser.isPresenceProperty(child)) {
          return true;
        }

        return false;
      })
      .reduce((acc, child) => {
        const name = _.camelCase(getLocalName(child.name()));

        if (PropertiesParser.isTextProperty(child)) {
          acc.set(name, child.text());
        } else if (PropertiesParser.isPresenceProperty(child)) {
          acc.set(name, true);
        }

        return acc;
      }, new Map());
  }
}
