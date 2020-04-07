import * as _ from 'lodash';

import DataModel, { Model, List, Container, Leaf, LeafList } from '../model';
import DataModelInstance from './';

export interface ISegmentKeys {
  key: string;
  value: string;
}

export interface IKeyed {
  keys: ISegmentKeys[];
}

export type WithValue<T> = T & { value: string };

export interface ISegment {
  name: string;
}

export type IKeyedSegment = IKeyed & ISegment;

export type PathSegment = ISegment | IKeyedSegment | WithValue<ISegment>;

export function isKeyedSegment(segment: PathSegment): segment is IKeyedSegment {
  return (segment as IKeyedSegment).keys !== undefined;
}

export function isSegmentWithValue(segment: PathSegment): segment is WithValue<ISegment> {
  return 'value' in segment;
}

type Path = PathSegment[];

export function pathToModelPath(path: Path) {
  return path.map(({ name }) => name).join('.');
}

function buildNode(segment: PathSegment, model: Model) {
  if (model instanceof List) {
    if (isKeyedSegment(segment)) {
      const keyObject = segment.keys?.reduce<any>((acc, key) => ((acc[key.key] = key.value), acc), {});
      const keys = [keyObject];
      return [{ [segment.name]: keys }, keyObject];
    } else {
      const keys: any[] = [];
      return [{ [segment.name]: keys }, keys];
    }
  } else if (model instanceof Container) {
    const childContainer = {};
    return [{ [segment.name]: childContainer }, childContainer];
  } else if (model instanceof Leaf) {
    const leafValue = isSegmentWithValue(segment) ? segment.value : '';
    return [{ [segment.name]: leafValue }, leafValue];
  } else if (model instanceof LeafList) {
    const value = isSegmentWithValue(segment) ? segment.value : undefined;
    const values = value ? [value] : [];
    return [{ [segment.name]: values }, value || values];
  } else {
    throw new Error('Can only build lists and containers.');
  }
}

export function pathToJSON(path: Path, dataModel: DataModel) {
  const jsonDoc = {};

  let currPath = path;
  let currPosition = jsonDoc;
  let i = 1;
  while (currPath.length > 0) {
    const model = dataModel.getModelForPath(pathToModelPath(_.take(path, i)));

    const head = _.head(currPath)!;
    const [outer, inner] = buildNode(head, model as Model);
    Object.assign(currPosition, outer);

    currPosition = inner;
    currPath = _.tail(currPath);
    i++;
  }

  return { document: jsonDoc, terminalNode: currPosition };
}

export function pathToInstance(path: Path, dataModel: DataModel) {
  return new DataModelInstance(dataModel, pathToJSON(path, dataModel).document);
}

export default Path;
