export default class Searchable {
  public path: string;

  public handleNoMatch() {
    throw new Error(`Model not found for path: ${this.path}.`);
  }

  public isMatch(segments: string[]) {
    return segments.length === 0;
  }
}
