import { Element, Document } from 'libxmljs';

import { ContextNode } from '../enum';

import Path from './Path';
import Instance from './Instance';
import { ContainerInstance, LeafInstance, Visitor } from './';
import {
  addEmptyTree,
  getPathXPath,
  getFieldIdFromParentAxis,
  applyConditionToPath,
  buildAuxiliaryKeyMap,
  findBestCandidate
} from './util';
import { DerivedType, LeafRefType } from '../types';
import DataModel, { Model, List, Leaf, Choice } from '../model';
import { isElement } from '../util/xmlUtil';

export default class DataModelInstance {
  public rawInstance: Element;
  public model: DataModel;
  public root: Map<string, ContainerInstance>;

  constructor(model: DataModel, instance: Element) {
    this.model = model;

    const rootName = [...model.root.keys()][0];

    this.rawInstance = instance;

    this.root = new Map();
    this.root.set(rootName, new ContainerInstance(model.root.get(rootName), instance.get('./*[1]')));
  }

  public toJSON(camelCase = false): object {
    return [...this.root.values()][0].toJSON(camelCase);
  }

  public toXML(rootEl?: Element) {
    if (rootEl) {
      [...this.root.values()][0].toXML(rootEl);
      return rootEl.doc();
    } else {
      const document = new Document();
      const config = document.node('config');
      [...this.root.values()][0].toXML(config);
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

    const xPath = getPathXPath(path);

    let exists = true;
    try {
      this.getInstance(path);
    } catch (e) {
      exists = false;
    }

    let instance = this.rawInstance;
    if (!exists) {
      instance = addEmptyTree(path, this.model, instance);
    }

    let instanceRoot = instance.get(xPath);
    let modelRoot = model;
    while (modelRoot.parentModel) {
      if (modelRoot.when) {
        for (const when of modelRoot.when) {
          const { condition, context } = when;
          const contextNode =
            context === ContextNode.parent || modelRoot instanceof Choice ? instanceRoot.parent() : instanceRoot;
          const result = contextNode.get(condition, this.model.namespaces);

          if (!result) {
            return false;
          }
        }
      }

      modelRoot = modelRoot.parentModel;
      instanceRoot = instanceRoot.parent() as Element;
    }

    return true;
  }

  public evaluateXPath(path: Path, xPath: string) {
    const targetXPath = getPathXPath(path);

    let exists = true;
    try {
      this.getInstance(path);
    } catch (e) {
      exists = false;
    }

    let instance = this.rawInstance;
    if (!exists) {
      instance = addEmptyTree(path, this.model, instance);
    }

    return instance
      .get(targetXPath)
      .find(xPath, this.model.namespaces)
      .filter(isElement);
  }

  public evaluateLeafRef(path: Path) {
    const model = this.model.getModelForPath(path.map(({ name }) => name).join('.'));
    if (model instanceof Leaf && model.getResolvedType() instanceof LeafRefType) {
      const leafRefPath = (model.getResolvedType() as LeafRefType).path;
      const xPath = getPathXPath(path);

      let exists = true;
      try {
        this.getInstance(path);
      } catch (e) {
        exists = false;
      }

      let instance = this.rawInstance;
      if (!exists) {
        instance = addEmptyTree(path, this.model, instance);
      }

      const contextNode = instance.get(xPath);
      return (contextNode.find(leafRefPath, this.model.namespaces) || []).filter(isElement).map(refEl => refEl.text());
    } else {
      throw new Error('Cannot evaluate leaf reference for a path that does not correspond to a leafref.');
    }
  }

  public evaluateSuggestionRef(path: Path) {
    const model = this.model.getModelForPath(path.map(({ name }) => name).join('.'));

    if (model instanceof Leaf) {
      const type = model.type;

      if (type instanceof DerivedType && type.suggestionRefs && type.suggestionRefs.length > 0) {
        const paths = type.suggestionRefs;
        const xPath = getPathXPath(path);

        let exists = true;
        try {
          this.getInstance(path);
        } catch (e) {
          exists = false;
        }

        let instance = this.rawInstance;
        if (!exists) {
          instance = addEmptyTree(path, this.model, instance);
        }
        const contextNode = instance.get(xPath);

        const suggestions = paths.reduce((acc, suggestionPath) => {
          (contextNode.find(suggestionPath, this.model.namespaces) || []).filter(isElement).forEach(refEl => {
            acc.add(refEl.text());
          });

          return acc;
        }, new Set());

        return Array.from(suggestions.values());
      } else {
        throw new Error('Cannot evaluate suggestion reference for a path that does not have suggestion references.');
      }
    } else {
      throw new Error('Cannot evaluate suggestion reference for a path that does not correspond to a leaf.');
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

  public getInstance(path: Path) {
    if (path.length > 0) {
      const firstSegmentName = path[0].name;

      if (this.root.has(firstSegmentName)) {
        return this.root.get(firstSegmentName).getInstance(path);
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
}
