import * as _ from 'lodash';

import { Identities } from '../';
import { Model } from '../';

export default class WithIdentities {
  public identities: Identities;

  public addIdentityProps(parentModel?: Model) {
    if (parentModel) {
      let current = parentModel;

      while (_.isNil(current.identities) && !_.isNil(current.parentModel)) {
        current = current.parentModel;
      }

      const identities = current.identities;
      this.identities = identities || new Identities();
    }
  }
}
