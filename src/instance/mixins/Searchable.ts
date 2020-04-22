import * as _ from 'lodash';

import { Path, ListChildInstance } from '../';
import { Model } from '../../model';

export default class Searchable {
  public model: Model;
  public parent: any;

  public isTryingToMatchMe(path: Path) {
    return path.length === 1;
  }

  public isMatch(path: Path) {
    const firstSegment = _.head(path);

    return firstSegment && firstSegment.name === this.model.name;
  }

  public handleNoMatch() {
    throw new Error('Instance not found.');
  }

  public getPath(): Path {
    const path = [];

    let current = this;
    while (current) {
      if (current instanceof ListChildInstance) {
        const keys = Object.entries(current.keys).map(([key, value]) => ({ key, value }));
        path.push({ name: current.model.name, keys });
      } else {
        path.push({ name: current.model.name });
      }

      current = current.parent;
    }

    return path.reverse();
  }
}
