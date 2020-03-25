import ContainerInstance from './ContainerInstance';
import ListChildInstance from './ListChildInstance';
import LeafListChildInstance from './LeafListChildInstance';
import Instance from './Instance';
import Path from './Path';

export interface IContainerJSON {
  [childName: string]: LeafJSON | LeafListJSON | ListJSON | IContainerJSON;
}

export interface IListChildJSON {
  [childName: string]: LeafJSON | LeafListJSON | ListJSON | IContainerJSON;
}

export type ListJSON = IListChildJSON[];
export type LeafListJSON = LeafJSON[];
export type LeafJSON = string | number | boolean;

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

export type JSONWithAttributes =
  | AddAttributes<IContainerJSON>
  | AddAttributes<IListChildJSON>
  | AddAttributes<ListJSON>
  | AddAttributes<LeafJSON>;

export type JSONWithoutAttributes = IContainerJSON | IListChildJSON | ListJSON | LeafJSON;

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
