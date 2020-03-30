import { Element } from 'libxmljs';
import * as _ from 'lodash';

import ns from '../../util/ns';

export default class RequiredField {
  public validateRequiredFields(el: Element, fields: string[] = [], type: string) {
    fields.forEach((field) => {
      const fieldEl = el.get(`./yin:${field}`, ns);

      if (_.isNil(fieldEl)) {
        throw new Error(`${type || 'The given'} type must specify ${field}.`);
      }
    });
  }
}
