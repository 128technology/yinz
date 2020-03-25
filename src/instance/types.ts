import ContainerInstance from './ContainerInstance';
import ListChildInstance from './ListChildInstance';
import LeafListChildInstance from './LeafListChildInstance';
import Instance from './Instance';
import Path from './Path';

export type ContainerJSONValue = Readonly<{
  [childName: string]: LeafJSON | LeafListJSON | ListJSON | ContainerJSON;
}>;
export type ContainerJSON = ContainerJSONValue | AddAttributes<ContainerJSONValue>;

export type ListChildJSONValue = Readonly<{
  [childName: string]: LeafJSON | LeafListJSON | ListJSON | ContainerJSON;
}>;
export type ListChildJSON = ListChildJSONValue | AddAttributes<ListChildJSONValue>;

export type ListJSONValue = ListChildJSONValue[];
export type ListJSON = ListChildJSON[];

export type LeafListJSONValue = LeafJSONValue[];
export type LeafListJSON = LeafJSON[];

export type LeafJSONValue = Readonly<string | number | boolean>;
export type LeafJSON = LeafJSONValue | AddAttributes<LeafJSONValue>;

export type JSONConfig = ContainerJSON | ListChildJSON | ListJSON | LeafListJSON | LeafJSON;

export type NetconfOperation = 'merge' | 'create' | 'replace' | 'delete' | 'remove';

export type Position = Readonly<{
  insert: 'first' | 'last' | 'before' | 'after';
  value?: string;
}>;

export type AddAttributes<T> = Readonly<{
  _attributes?: IAttribute[];
  _operation?: NetconfOperation;
  _position?: Position;
  _value: T;
}>;

export interface IAttribute {
  name: string;
  value: string;
  prefix?: string;
  href?: string;
}

export type Visitor = (instance: Instance | LeafListChildInstance) => void;
export type NoMatchHandler = (instance: Instance, remainingPath: Path) => any;
export type Parent = ListChildInstance | ContainerInstance;
export type ShouldSkip = (instance: Instance) => boolean;
export type XMLSerializationOptions = Readonly<{ includeAttributes: boolean }>;
