import { Element } from 'libxmljs';

import applyMixins from '../util/applyMixins';
import ns from '../util/ns';
import { enumValueOf } from '../enum/BuiltInType';
import { Identities } from '../model';
import { SerializationReturnType } from '../enum/SerializationType';

import TypeParser from './util/TypeParser';
import { Type, BuiltInType } from './';
import { Named, Traversable } from './mixins';

export default class DerivedType implements Named, Traversable {
  public static matches(typeName: string) {
    return enumValueOf(typeName) === null;
  }

  public type: string;
  public default: string;
  public units: string;
  public baseType: Type;
  public suggestionRefs: string[];

  public addNamedProps: (el: Element) => void;
  public traverse: (action: (type: Type) => void) => void;

  constructor(el: Element, identities?: Identities) {
    this.addNamedProps(el);
    const typeDefEl = el.get('yin:typedef', ns);

    this.parseBaseType(el, typeDefEl, identities);
    this.parseUnits(typeDefEl);
    this.parseDefault(typeDefEl);
    this.parseSuggestionRef(typeDefEl);
  }

  public get builtInType(): BuiltInType {
    return this.baseType instanceof DerivedType ? this.baseType.builtInType : this.baseType;
  }

  public parseDefault(typeDefEl: Element) {
    const defaultEl = typeDefEl.get('./yin:default', ns);

    if (defaultEl) {
      this.default = defaultEl.attr('value').value();
    } else if (this.baseType instanceof DerivedType && this.baseType.default) {
      this.default = this.baseType.default;
    }
  }

  public parseUnits(typeDefEl: Element) {
    const unitsEl = typeDefEl.get('./yin:units', ns);

    if (unitsEl) {
      this.units = unitsEl.attr('name').value();
    }
  }

  public parseBaseType(typeEl: Element, typeDefEl: Element, identities?: Identities) {
    const baseTypeEl = typeDefEl.get('./yin:type', ns);

    // Really you only need to avoid typedef in the XPATH below, but a bug in yinsolidated
    // also copies the child type into the derived type in some cases.
    const restrictionEls = typeEl.find('./*[not(self::yin:typedef) and not(self::yin:type)]', ns);

    restrictionEls.forEach((el: Element) => {
      baseTypeEl.addChild(el);
    });

    this.baseType = TypeParser.parse(baseTypeEl, identities);
  }

  public parseSuggestionRef(typeDefEl: Element) {
    const suggestionEl = typeDefEl.get('./t128ext:suggestionref', ns);

    if (suggestionEl) {
      const text = suggestionEl.text();
      if (text) {
        const trimmed = text.trim();
        if (trimmed.length > 0) {
          this.suggestionRefs = trimmed.split(/\s+/);
        }
      }
    }
  }

  public serialize(val: string): SerializationReturnType {
    return this.baseType.serialize(val);
  }

  public childTypes(): Type[] {
    return [this.baseType];
  }
}

applyMixins(DerivedType, [Named, Traversable]);
