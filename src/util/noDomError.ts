export default class NoDomError extends Error {
  constructor() {
    super(
      `XML DOM not found during evaluation, XML related operations (when, leafref, etc) cannot be processed in JSON only mode.`
    );
  }
}
