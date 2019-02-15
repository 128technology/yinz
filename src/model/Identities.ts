import { Element } from 'libxmljs';
import * as _ from 'lodash';

import ns from '../util/ns';

interface IMember {
  base: string;
  description: string;
  name: string;
  prefix: string;
}

export interface IIdentity {
  description: string;
  name: string;
  prefix: string;
  label: string;
}

export default class Identities {
  public identities: Map<string, IIdentity[]>;

  constructor(el?: Element) {
    this.identities = new Map();

    if (el) {
      this.parseIdentitiesFromModel(el);
    }
  }

  public parseIdentitiesFromModel(el: Element) {
    const identities = _(el.find('yin:identity', ns))
      .map((identity: Element) => {
        const descriptionEl = identity.get('.//yin:description/yin:text', ns);
        const baseEl = identity.get('./yin:base', ns);

        return {
          base: baseEl
            ? _.last(
                baseEl
                  .attr('name')
                  .value()
                  .split(':')
              )
            : undefined,
          description: descriptionEl ? descriptionEl.text() : undefined,
          name: identity.attr('name').value(),
          prefix: identity.attr('module-prefix').value()
        };
      })
      .groupBy('base')
      .mapValues((group: IMember[]) => {
        return group.map((member: IMember) => {
          const { description, name, prefix } = member;

          return {
            description,
            label: `${prefix}:${name}`,
            name,
            prefix
          };
        });
      })
      .value();

    this.identities = new Map(Object.entries(identities));
  }

  public getOptions(base: string) {
    const hasBase = this.identities.has(base);
    return !hasBase ? [] : this.identities.get(base).map(identity => identity.label);
  }
}
