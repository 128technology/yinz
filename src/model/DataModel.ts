import { Element } from 'libxmljs';

import ns from '../util/ns';

import { NamespacesParser } from './parsers';
import { Container, Model, Choice, Identities } from './';

function parseConsolidatedModel(modelXML: Element, identities: Identities) {
  const rootContainer = new Container(modelXML, undefined, identities);

  const root = new Map();
  root.set(rootContainer.name, rootContainer);

  return root;
}

export interface IOptions {
  modelElement: Element;
  rootPath: string;
}

export default class DataModel {
  public root: Map<string, Container>;
  public identities: Identities;
  public namespaces: { [s: string]: string };

  constructor(options: IOptions) {
    const { modelElement, rootPath } = options;

    const rootEl = rootPath ? modelElement.get(rootPath, ns) : modelElement;

    this.identities = new Identities(modelElement);
    this.namespaces = NamespacesParser.parse(modelElement);
    this.root = parseConsolidatedModel(rootEl, this.identities);
  }

  public getModelForPath(path: string): Model | Choice {
    const segments = path.split('.');

    if (segments.length > 0 && this.root.has(segments[0])) {
      const head = segments.shift();

      return this.root.get(head).getModelForPath(segments);
    } else {
      throw new Error(`Path must have at least one segment and start with ${[...this.root.keys()][0]}.`);
    }
  }
}
