import { Model, Choice } from './';

export default class ModelRegistry {
  public registry: Map<string, Model | Choice>;

  constructor() {
    this.registry = new Map();
  }

  public addModel(model: Model | Choice) {
    this.registry.set(model.path, model);
  }
}
