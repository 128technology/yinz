import { Element } from 'libxmljs';

import ns from '../util/ns';

import { NamespacesParser } from './parsers';
import { Container, Model, Choice, Identities, ModelRegistry, Visitor } from './';

function parseConsolidatedModel(modelXML: Element, identities: Identities, modelRegistry: ModelRegistry) {
  const rootContainer = new Container(modelXML, undefined, identities, modelRegistry);

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
  public modelRegistry: ModelRegistry;

  constructor(options: IOptions) {
    const { modelElement, rootPath } = options;

    const rootEl = rootPath ? modelElement.get(rootPath, ns)! : modelElement;

    this.identities = new Identities(modelElement);
    this.namespaces = NamespacesParser.parse(modelElement);
    this.modelRegistry = new ModelRegistry();

    this.root = parseConsolidatedModel(rootEl, this.identities, this.modelRegistry);
  }

  public getModelForPath(path: string): Model | Choice {
    if (this.modelRegistry.registry.has(path)) {
      return this.modelRegistry.registry.get(path)!;
    } else {
      throw new Error(`Model not found for path ${path}`);
    }
  }

  public visit(visitor: Visitor) {
    for (const value of this.root.values()) {
      value.visit(visitor);
    }
  }
}
