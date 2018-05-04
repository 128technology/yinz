import { expect } from 'chai';

import SerializationType, { convert } from '../SerializationType';

describe('Serialization Type', () => {
  describe('Converter For Serialization Types', () => {
    it('should convert integer numbers', () => {
      expect(convert('5', SerializationType.number)).to.equal(5);
    });

    it('should convert decimal numbers', () => {
      expect(convert('5.2', SerializationType.number)).to.equal(5.2);
    });

    it('should convert true booleans', () => {
      expect(convert('true', SerializationType.boolean)).to.equal(true);
    });

    it('should convert false booleans', () => {
      expect(convert('false', SerializationType.boolean)).to.equal(false);
    });

    it('should pass strings through', () => {
      expect(convert('false', SerializationType.string)).to.equal('false');
      expect(convert('5', SerializationType.string)).to.equal('5');
      expect(convert('foo', SerializationType.string)).to.equal('foo');
    });
  });
});
