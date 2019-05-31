import DataModelInstance from './DataModelInstance';
import ContainerInstance, { IContainerJSON } from './ContainerInstance';
import ListInstance, { ListJSON } from './ListInstance';
import ListChildInstance, { IListChildJSON } from './ListChildInstance';
import LeafListInstance, { LeafListJSON } from './LeafListInstance';
import LeafListChildInstance from './LeafListChildInstance';
import LeafInstance, { LeafJSON } from './LeafInstance';
import Instance from './Instance';
import Path from './Path';

export type Visitor = (instance: Instance | LeafListChildInstance) => void;
export type NoMatchHandler = (instance: Instance, remainingPath: Path) => any;
export type Parent = ListChildInstance | ContainerInstance;
export type ShouldSkip = (instance: Instance) => boolean;

export default DataModelInstance;

export {
  DataModelInstance,
  ContainerInstance,
  IContainerJSON,
  ListInstance,
  ListJSON,
  ListChildInstance,
  IListChildJSON,
  LeafListInstance,
  LeafListJSON,
  LeafListChildInstance,
  LeafInstance,
  LeafJSON,
  Instance,
  Path
};
