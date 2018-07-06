import Case from './Case';
import Choice from './Choice';
import Container from './Container';
import DataModel from './DataModel';
import Identities from './Identities';
import Leaf from './Leaf';
import LeafList from './LeafList';
import List from './List';
import Model from './Model';
import ModelRegistry from './ModelRegistry';

export type Visitor = (toVisit: Choice | Case | Container | Leaf | LeafList | List) => void;

export { Case, Choice, Container, Identities, Leaf, LeafList, List, Model, ModelRegistry };
export default DataModel;
