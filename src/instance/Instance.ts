import { ContainerInstance, LeafInstance, ListInstance, ListChildInstance, LeafListInstance } from './';

type Instance = ContainerInstance | ListInstance | ListChildInstance | LeafListInstance | LeafInstance;

export default Instance;
