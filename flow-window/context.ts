export interface WritableContext {
  // persistent values are serialized to the URL on every state change.
  persistent: Record<string, unknown>;
  // volatile values are not serialized to the URL.
  volatile: Record<string, unknown>;
}

// Properties in a ReadonlyContext can't be changed by the UI and don't need to be serializable.
export interface ReadonlyContext {
  data: Record<string, unknown>;
  errors: Record<string, string>;
}

export interface Context extends WritableContext, ReadonlyContext {}
