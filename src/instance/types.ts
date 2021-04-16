import * as _ from 'lodash';

import ContainerInstance from './ContainerInstance';
import ListChildInstance from './ListChildInstance';
import ListInstance from './ListInstance';
import LeafListInstance from './LeafListInstance';
import LeafInstance from './LeafInstance';
import LeafListChildInstance from './LeafListChildInstance';
import Path, { ISegmentKeys } from './Path';

export type Instance = ContainerInstance | ListInstance | ListChildInstance | LeafListInstance | LeafInstance;

export type WithAttributes<T> = Attributes &
  Readonly<{
    _value: T;
  }>;

type CanHaveAttributes<T> = T | WithAttributes<T>;

export type ContainerJSONValue = Readonly<{
  [childName: string]: LeafJSON | LeafListJSON | ListJSON | ContainerJSON;
}>;
export type ContainerJSON = CanHaveAttributes<ContainerJSONValue>;

export type ListChildJSONValue = Readonly<{
  [childName: string]: LeafJSON | LeafListJSON | ListJSON | ContainerJSON;
}>;
export type ListChildJSON = CanHaveAttributes<ListChildJSONValue>;

export type ListJSONValue = ListChildJSONValue[];
export type ListJSON = ListChildJSON[];

export type LeafListJSONValue = LeafJSONValue[];
export type LeafListJSON = LeafJSON[];

export type LeafJSONValue = Readonly<string | number | boolean | null>;
export type LeafJSON = CanHaveAttributes<LeafJSONValue>;

export type JSONConfigNode = ContainerJSON | ListChildJSON | ListJSON | LeafListJSON | LeafJSON;
export type JSONConfigNodeWithAttributes =
  | WithAttributes<LeafJSONValue>
  | WithAttributes<ListChildJSONValue>
  | WithAttributes<ContainerJSONValue>;

export function hasAttributes(x: object): x is JSONConfigNodeWithAttributes {
  return '_value' in x || '_operation' in x || '_position' in x || '_attributes' in x;
}

export type NetconfOperation = 'merge' | 'create' | 'replace' | 'delete' | 'remove';

export type Position = Readonly<{
  insert: 'first' | 'last' | 'before' | 'after';
  value?: string;
  keys?: ISegmentKeys[];
}>;

export type Attributes = Readonly<{
  _attributes?: IAttribute[];
  _operation?: NetconfOperation;
  _position?: Position;
}>;

export interface IAttribute {
  name: string;
  value: string;
  prefix?: string;
  href?: string;
}

export interface IJSONModeEvaluators {
  evaluateWhenCondition: (path: Path, context?: unknown) => Promise<boolean>;
  evaluateLeafRef: (path: Path, context?: unknown) => Promise<string[]>;
  evaluateSuggestionRef: (path: Path, context?: unknown) => Promise<string[]>;
  resolveLeafRefPath: (path: Path, context?: unknown) => Promise<Path>;
}

export interface IInstanceOptions {
  jsonMode?: IJSONModeEvaluators;
}

export type Visitor = (instance: Instance | LeafListChildInstance) => void;
export type NoMatchHandler = (instance: Instance, remainingPath: Path) => any;
export type Parent = ListChildInstance | ContainerInstance;
export type ShouldSkip = (instance: Instance) => boolean;
export type XMLSerializationOptions = Readonly<{ includeAttributes: boolean }>;
export type Authorized = (instance: Instance | LeafListChildInstance) => boolean;
export type MapToJSONOptions = Readonly<{ overrideOnKeyMap: boolean }>;
export type JSONMapper = (
  x: LeafInstance | LeafListInstance | ListChildInstance
) => Record<string, LeafJSON | LeafListJSON> | ListChildJSON[] | undefined;
