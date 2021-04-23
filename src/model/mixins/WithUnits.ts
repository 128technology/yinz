import { Element } from 'libxmljs2';

import { Type, DerivedType } from '../../types';
import { UnitsParser } from '../parsers';

export default class WithUnits {
  public definedUnits: string | null;
  public type: Type;

  public addDefinedUnits(el: Element) {
    this.definedUnits = UnitsParser.parse(el);
  }

  public get units() {
    return this.definedUnits
      ? this.definedUnits
      : this.type instanceof DerivedType && this.type.units
      ? this.type.units
      : null;
  }
}
