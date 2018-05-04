export interface ISegmentKeys {
  key: string;
  value: string;
}

export interface IKeyed {
  keys: ISegmentKeys[];
}

export interface ISegment {
  name: string;
}

export type IKeyedSegment = IKeyed & ISegment;

export type PathSegment = ISegment | IKeyedSegment;

export function isKeyedSegment(segment: PathSegment): segment is IKeyedSegment {
  return (segment as IKeyedSegment).keys !== undefined;
}

type Path = PathSegment[];

export default Path;
