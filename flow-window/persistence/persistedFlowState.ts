import type { StateValue } from 'xstate';

export interface IFlowSnapshot {
  state: StateValue | undefined;
  persistentContext: Record<string, unknown>;
}

export interface IPersistedFlowState {
  readonly instanceId: string;

  /**
   * Restores a snapshot of the flow state.
   */
  restore(): IFlowSnapshot | undefined;

  /**
   * Stores a snapshot of the flow state.
   */
  store(snapshot: IFlowSnapshot): void;

  /**
   * Deletes the complete persisted flow state.
   */
  delete(): void;

  /**
   * Commits 'snapshot' or 'delete' operations.
   */
  commit(): void;
}
