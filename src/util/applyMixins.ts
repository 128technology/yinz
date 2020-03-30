export default function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach(baseCtor => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      const desc = Object.getOwnPropertyDescriptor(baseCtor.prototype, name);
      Object.defineProperty(derivedCtor.prototype, name, desc);
    });
  });
}
