import { Element } from 'libxmljs';

import ns from '../../util/ns';

import { Container, Leaf, LeafList, List, Choice, Model } from '../';

export interface IChildren {
  children: Map<string, Model>;
  choices: Map<string, Choice>;
}

export function buildChildren(parentEl: Element, parentModel: Model): IChildren {
  return parentEl
    .childNodes()
    .filter(node => node.type() === 'element')
    .filter(el => {
      const isConfig = el.get('./yin:config', ns);

      return isConfig ? isConfig.attr('value').value() !== 'false' : true;
    })
    .reduce(
      ({ children, choices }, el) => {
        const child = buildChild(el, parentModel);

        if (child) {
          if (child instanceof Choice) {
            [...child.children.entries()].forEach(([k, v]) => {
              children.set(k, v);
            });

            choices.set(child.name, child);
          } else {
            children.set(child.name, child);
          }
        }

        return { children, choices };
      },
      { children: new Map(), choices: new Map() }
    );
}

export function buildChild(el: Element, parentModel: Model) {
  switch (el.name()) {
    case 'leaf': {
      return new Leaf(el, parentModel);
    }
    case 'list': {
      return new List(el, parentModel);
    }
    case 'container': {
      return new Container(el, parentModel);
    }
    case 'leaf-list': {
      return new LeafList(el, parentModel);
    }
    case 'choice': {
      return new Choice(el, parentModel);
    }
    default: {
      return null;
    }
  }
}
