import { Element, Document } from 'libxmljs';
import * as _ from 'lodash';

import { ContextNode } from '../enum';
import { DerivedType, LeafRefType } from '../types';
import DataModel, { Model, List, Leaf, Choice, LeafList } from '../model';
import { isElement } from '../util/xmlUtil';

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
import { XMLSerializationOptions, ContainerJSON, Instance } from './types';
import {
  getPathXPath,
  getFieldIdFromParentAxis,
  applyConditionToPath,
  buildAuxiliaryKeyMap,
  findBestCandidate,
  addEmptyTree
} from './util';

export default class DataModelInstance {
  public rawInstance: Element;
  public model: DataModel;
  public root: Map<string, ContainerInstance>;

  constructor(model: DataModel, instance: Element | { [rootName: string]: ContainerJSON }) {
    this.model = model;
    this.root = new Map();

    const rootName = [...model.root.keys()][0];

    if (instance instanceof Element) {
      this.rawInstance = instance;
      this.root.set(rootName, new ContainerInstance(model.root.get(rootName), instance.get('./*[1]')));
    } else {
      this.root.set(rootName, new ContainerInstance(model.root.get(rootName), Object.values(instance)[0]));
      this.rawInstance = this.toXML().root();

      this.visit(instanceToVisit => {
        if (
          instanceToVisit instanceof ListChildInstance ||
          instanceToVisit instanceof LeafListChildInstance ||
          instanceToVisit instanceof LeafInstance ||
          instanceToVisit instanceof ContainerInstance
        ) {
          const xPath = getPathXPath(instanceToVisit.getPath());
          instanceToVisit.config = this.rawInstance.get(xPath, this.model.namespaces);
        }
      });
    }
  }

  public toJSON(camelCase = false, convert = true, shouldSkip?: ShouldSkip): object {
    return [...this.root.values()][0].toJSON(camelCase, convert, shouldSkip);
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

  public resolveLeafRefPath(path: Path): Path {
    const instance = this.getInstance(path) as LeafInstance;
    const { model, value, config } = instance;
    const sourceType = model.getResolvedType();

    if (sourceType instanceof LeafRefType) {
      const leafRefXPath = applyConditionToPath(sourceType.path, value);
      const matchCandidates = config
        .find(leafRefXPath, this.model.namespaces)
        .filter(isElement)
        .map(el => this.getInstanceFromElement(el));

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
  public evaluateWhenCondition(path: Path) {
    const model = this.model.getModelForPath(path.map(({ name }) => name).join('.'));
    if (!model.hasWhenAncestorOrSelf) {
      return true;
    }

    const { element, cleanUp } = this.getElementForPath(path);

    try {
      let modelRoot = model;
      let instanceRoot = element;
      while (modelRoot.parentModel) {
        if (modelRoot.when) {
          for (const when of modelRoot.when) {
            const { condition, context } = when;
            const contextNode =
              context === ContextNode.parent || modelRoot instanceof Choice ? instanceRoot.parent() : instanceRoot;
            const result = contextNode.get(condition, this.model.namespaces);

            if (!result) {
              cleanUp();
              return false;
            }
          }
        }

        modelRoot = modelRoot.parentModel;
        instanceRoot = instanceRoot.parent() as Element;
      }

      cleanUp();
      return true;
    } catch (e) {
      cleanUp();
      throw e;
    }
  }

  public evaluateXPath(path: Path, xPath: string) {
    const targetXPath = getPathXPath(path);

    const { element, cleanUp } = this.getElementForPath(path);

    try {
      const result = element.get(targetXPath).find(xPath, this.model.namespaces).filter(isElement);

      cleanUp();
      return result;
    } catch (e) {
      cleanUp();
      throw e;
    }
  }

  public evaluateLeafRef(path: Path) {
    const model = this.model.getModelForPath(path.map(({ name }) => name).join('.'));
    if ((model instanceof Leaf || model instanceof LeafList) && model.getResolvedType() instanceof LeafRefType) {
      const leafRefPath = (model.getResolvedType() as LeafRefType).path;

      const { element, cleanUp } = this.getElementForPath(path);

      try {
        const result = (element.find(leafRefPath, this.model.namespaces) || [])
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

  public evaluateSuggestionRef(path: Path) {
    const model = this.model.getModelForPath(path.map(({ name }) => name).join('.'));

    if (model instanceof Leaf || model instanceof LeafList) {
      const type = model.type;

      if (type instanceof DerivedType && type.suggestionRefs && type.suggestionRefs.length > 0) {
        const paths = type.suggestionRefs;
        const { element, cleanUp } = this.getElementForPath(path);

        try {
          const suggestions = paths.reduce((acc, suggestionPath) => {
            (element.find(suggestionPath, this.model.namespaces) || []).filter(isElement).forEach(refEl => {
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

  public getInstanceFromElement(element: Element): Instance {
    const fieldId = getFieldIdFromParentAxis(element);
    const model = this.model.getModelForPath(fieldId) as Model;
    const path: Path = [];

    let currentModel = model;
    let currentElement = element;
    while (currentModel) {
      if (currentModel instanceof List) {
        const keys = Array.from(currentModel.keys).map(key => ({
          key,
          value: currentElement.get(`*[local-name()='${key}']`).text()
        }));
        path.push({ name: currentModel.name, keys });
      } else {
        path.push({ name: currentModel.name });
      }

      currentModel = currentModel.parentModel;
      currentElement = currentElement.parent() as Element;
    }

    return this.getInstance(path.reverse());
  }

  public getInstance(path: Path, noMatchHandler?: NoMatchHandler) {
    if (path.length > 0) {
      const firstSegmentName = path[0].name;

      if (this.root.has(firstSegmentName)) {
        return this.root.get(firstSegmentName).getInstance(path, noMatchHandler);
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
    let remainingPath: Path | undefined;

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
        requestedElement = foundInstance.config;
      } else if (foundInstance instanceof ListInstance) {
        requestedElement = foundInstance.children.values().next().value.config;
      } else if (foundInstance instanceof LeafListInstance) {
        requestedElement = foundInstance.children[0].config;
      }
    } else {
      const { cleanUpHiddenTree, contextEl } = addEmptyTree(remainingPath, this.model, closestAncestor);
      requestedElement = contextEl;
      cleanUp = cleanUpHiddenTree;
    }

    return { element: requestedElement, cleanUp };
  }
}
