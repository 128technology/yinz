import * as _ from 'lodash';

import { Model, Choice, ModelRegistry } from '../';

export default class WithRegistry {
  public register(parentModel: Model, thisModel: Model | Choice) {
    if (parentModel) {
      let current = parentModel;

      while (!_.isNil(current.parentModel)) {
        current = current.parentModel;
      }

      if ('modelRegistry' in current && current.modelRegistry instanceof ModelRegistry) {
        const modelRegistry = current.modelRegistry;
        modelRegistry.addModel(thisModel);
      }
    }
  }
}
