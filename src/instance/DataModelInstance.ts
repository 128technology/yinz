import { Element, Document } from 'libxmljs2';
import * as _ from 'lodash';

import { ContextNode } from '../enum';
import { DerivedType, LeafRefType } from '../types';
import DataModel, { Model, List, Leaf, Choice, LeafList, Container } from '../model';
import { isElement, assertElement } from '../util/xmlUtil';
import Path from './Path';
import {
  ContainerInstance,
  LeafInstance,
  Visitor,
  LeafListChildInstance,
  ListChildInstance,
  NoMatchHandler,
  ListInstance,
  LeafListInstance,
  ShouldSkip
} from './';
import {
  XMLSerializationOptions,
  ContainerJSON,
  Instance,
  JSONMapper,
  MapToJSONOptions,
  Authorized,
  IInstanceOptions
} from './types';
import {
  getPathXPath,
  getFieldIdFromParentAxis,
  applyConditionToPath,
  buildAuxiliaryKeyMap,
  findBestCandidate,
  addEmptyTree,
  allow,
  getDefaultMapper
} from './util';
import NoDomError from '../util/noDomError';

export default class DataModelInstance {
  public rawInstance: Element;
  public root: Map<string, ContainerInstance> = new Map();

  constructor(
    public model: DataModel,
    instance: Element | { [rootName: string]: ContainerJSON },
    private options?: IInstanceOptions
  ) {
    const rootName = [...model.root.keys()][0];
    const modelRoot = model.root.get(rootName)!;

    if (instance instanceof Element) {
      this.rawInstance = instance;
      this.root.set(rootName, new ContainerInstance(modelRoot, assertElement(instance.get('./*[1]')!), null));
    } else {
      this.root.set(rootName, new ContainerInstance(modelRoot, Object.values(instance)[0], null));

      if (!options?.jsonMode) {
        this.rawInstance = this.toXML().root()!;

        this.visit(instanceToVisit => {
          if (
            instanceToVisit instanceof ListChildInstance ||
            instanceToVisit instanceof LeafListChildInstance ||
            instanceToVisit instanceof LeafInstance ||
            instanceToVisit instanceof ContainerInstance
          ) {
            const xPath = getPathXPath(instanceToVisit.getPath());
            instanceToVisit.setConfig(assertElement(this.rawInstance.get(xPath, this.model.namespaces)!));
          }
        });
      }
    }
  }

  public toJSON(authorized: Authorized, camelCase = false, convert = true, shouldSkip?: ShouldSkip): object {
    return [...this.root.values()][0].toJSON(authorized, camelCase, convert, shouldSkip);
  }

  public mapToJSON(
    authorized: Authorized,
    map: JSONMapper = getDefaultMapper(authorized),
    options: MapToJSONOptions = { overrideOnKeyMap: false }
  ) {
    return [...this.root.values()][0].mapToJSON(authorized, map, options);
  }

  public toXML(rootEl?: Element, options: XMLSerializationOptions = { includeAttributes: false }) {
    if (rootEl) {
      [...this.root.values()][0].toXML(rootEl, options);
      return rootEl.doc();
    } else {
      const document = new Document();
      const config = document.node('config');
      [...this.root.values()][0].toXML(config, options);
      return document;
    }
  }

  public async resolveLeafRefPath(path: Path, context?: unknown) {
    if (this.options?.jsonMode) {
      return this.options?.jsonMode.resolveLeafRefPath(path, context);
    }

    const instance = this.getInstance(path) as LeafInstance;
    const config = instance.getConfig(allow);

    if (!config) {
      throw new NoDomError();
    }

    const { model } = instance;
    const value = instance.getValue(allow);
    const sourceType = model.getResolvedType();

    if (sourceType instanceof LeafRefType) {
      if (!value) {
        throw new Error('Leaf value required for LeafRef evaluation.');
      }

      const leafRefXPath = applyConditionToPath(sourceType.path, value);
      const matchCandidates = config
        .find(leafRefXPath, this.model.namespaces)
        .filter(isElement)
        .map(el => this.getInstanceFromElement(el)) as Instance[];

      if (matchCandidates.length === 0) {
        throw new Error('Referenced entity not found. Has it been deleted?');
      } else if (matchCandidates.length === 1) {
        return matchCandidates[0].getPath();
      } else {
        // Build up auxiliary keys from the input path. These may be needed when the
        // leafRef path evaluates to more than one candidate.
        const auxiliaryKeys = buildAuxiliaryKeyMap(path);
        return findBestCandidate(matchCandidates, auxiliaryKeys);
      }
    } else {
      throw new Error(`Expected a path to a leafRef, instead got ${sourceType.type}.`);
    }
  }

  /*
   * TODO: Currently does not consider ancestral whens on deeply nested choice children, in practice this
   * doesn't matter is almost all cases because if a choice itself has a when which is false, then no case
   * can be set, and thus the children could never be displayed.
   */
  public async evaluateWhenCondition(path: Path, context?: unknown) {
    const model = this.model.getModelForPath(path.map(({ name }) => name).join('.')) as Model;
    if (!model.hasWhenAncestorOrSelf) {
      return true;
    }

    if (this.options?.jsonMode) {
      return this.options?.jsonMode.evaluateWhenCondition(path, context);
    }

    const { element, cleanUp } = this.getElementForPath(path);

    try {
      let modelRoot: Model | null = model;
      let instanceRoot = element;
      while (modelRoot && modelRoot.parentModel) {
        if (modelRoot.when) {
          for (const when of modelRoot.when) {
            const { condition, context: whenContext } = when;
            const contextNode =
              whenContext === ContextNode.parent || modelRoot instanceof Choice ? instanceRoot!.parent() : instanceRoot;
            const result = contextNode!.get(condition, this.model.namespaces);

            if (!result) {
              cleanUp();
              return false;
            }
          }
        }

        modelRoot = modelRoot.parentModel;
        instanceRoot = instanceRoot!.parent() as Element;
      }

      cleanUp();
      return true;
    } catch (e) {
      cleanUp();
      throw e;
    }
  }

  public async evaluateLeafRef(path: Path, context?: unknown) {
    if (this.options?.jsonMode) {
      return this.options?.jsonMode.evaluateLeafRef(path, context);
    }

    const model = this.model.getModelForPath(path.map(({ name }) => name).join('.'));
    if ((model instanceof Leaf || model instanceof LeafList) && model.getResolvedType() instanceof LeafRefType) {
      const leafRefPath = (model.getResolvedType() as LeafRefType).path;

      const { element, cleanUp } = this.getElementForPath(path);

      try {
        const result = (element!.find(leafRefPath, this.model.namespaces) || [])
          .filter(isElement)
          .map(refEl => refEl.text());
        cleanUp();
        return result;
      } catch (e) {
        cleanUp();
        throw e;
      }
    } else {
      throw new Error('Cannot evaluate leaf reference for a path that does not correspond to a leafref.');
    }
  }

  public async evaluateSuggestionRef(path: Path, context?: unknown) {
    if (this.options?.jsonMode) {
      return this.options?.jsonMode.evaluateSuggestionRef(path, context);
    }

    const model = this.model.getModelForPath(path.map(({ name }) => name).join('.'));

    if (model instanceof Leaf || model instanceof LeafList) {
      const type = model.type;

      if (type instanceof DerivedType && type.suggestionRefs && type.suggestionRefs.length > 0) {
        const paths = type.suggestionRefs;
        const { element, cleanUp } = this.getElementForPath(path);

        try {
          const suggestions = paths.reduce<Set<string>>((acc, suggestionPath) => {
            (element!.find(suggestionPath, this.model.namespaces) || []).filter(isElement).forEach(refEl => {
              const text = refEl.text();
              if (text && text.length > 0) {
                acc.add(text);
              }
            });

            return acc;
          }, new Set());

          cleanUp();
          return Array.from(suggestions.values());
        } catch (e) {
          cleanUp();
          throw e;
        }
      } else {
        throw new Error('Cannot evaluate suggestion reference for a path that does not have suggestion references.');
      }
    } else {
      throw new Error(
        'Cannot evaluate suggestion reference for a path that does not correspond to a leaf or leaf list.'
      );
    }
  }

  public getInstanceFromElement(element: Element): Instance | LeafListChildInstance {
    const fieldId = getFieldIdFromParentAxis(element);
    const model = this.model.getModelForPath(fieldId) as Leaf | List | Container | LeafList | null;
    const path: Path = [];

    let currentModel = model;
    let currentElement = element;
    while (currentModel) {
      if (currentModel instanceof List) {
        const keys = Array.from(currentModel.keys).map(key => ({
          key,
          value: assertElement(currentElement.get(`*[local-name()='${key}']`)!).text()
        }));
        path.push({ name: currentModel.name, keys });
      } else {
        path.push({ name: currentModel.name });
      }

      currentModel = currentModel.parentModel;
      currentElement = currentElement.parent() as Element;
    }

    return this.getInstance(path.reverse())!;
  }

  public getInstance(path: Path, noMatchHandler?: NoMatchHandler) {
    if (path.length > 0) {
      const firstSegmentName = path[0].name;

      if (this.root.has(firstSegmentName)) {
        return this.root.get(firstSegmentName)!.getInstance(path, noMatchHandler);
      } else {
        throw new Error(`Path must start with ${[...this.root.keys()][0]}.`);
      }
    } else {
      throw new Error('Path length must be greater than 0.');
    }
  }

  public visit(visitor: Visitor) {
    Array.from(this.root.values()).forEach(child => {
      child.visit(visitor);
    });
  }

  private getElementForPath(path: Path) {
    let requestedElement: Element | undefined;
    let cleanUp = _.noop;
    let closestAncestor: Instance | undefined;
    let remainingPath: Path;

    const foundInstance = this.getInstance(path, (stopInstance, remaining) => {
      closestAncestor = stopInstance;
      remainingPath = remaining;
    });

    if (!closestAncestor) {
      // Found a direct match
      if (
        foundInstance instanceof LeafInstance ||
        foundInstance instanceof ListChildInstance ||
        foundInstance instanceof ContainerInstance
      ) {
        requestedElement = foundInstance.getConfig(allow);
      } else if (foundInstance instanceof ListInstance) {
        requestedElement = foundInstance.getChildren(allow).values().next().value.config;
      } else if (foundInstance instanceof LeafListInstance) {
        requestedElement = foundInstance.getChildren(allow)[0].getConfig(allow);
      }
    } else {
      const { cleanUpHiddenTree, contextEl } = addEmptyTree(remainingPath!, this.model, closestAncestor);
      requestedElement = contextEl;
      cleanUp = cleanUpHiddenTree;
    }

    return { element: requestedElement, cleanUp };
  }
}
