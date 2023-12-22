import { ScopedUrlParameterList } from '$xstate/persistence/scopedUrlParameterList';
import type { IFlowSnapshot, IPersistedFlowState } from '$xstate/persistence/persistedFlowState';

/**
 * Uses the ScopedUrlParameterList as a backend to store the flow state in the URL.
 */
export class UrlPersistedFlowState implements IPersistedFlowState {
  private readonly urlParameters: ScopedUrlParameterList;

  constructor(readonly instanceId: string) {
    this.urlParameters = new ScopedUrlParameterList(instanceId);
  }

  restore(): IFlowSnapshot {
    const properties = this.urlParameters.getAllParams();
    const persistentContext = Object.entries(properties).reduce(
      (acc, [key, value]) => {
        acc[key] = JSON.parse(value);
        return acc;
      },
      {} as Record<string, unknown>
    );

    const state = this.urlParameters.getGlobalParam(this.instanceId);
    if (!state) {
      return {
        persistentContext,
        state: undefined
      };
    }

    return {
      persistentContext,
      state: state ? JSON.parse(state) : undefined
    };
  }

  delete(): void {
    const snapshot = this.restore();
    for (const propertiesKey in snapshot.persistentContext) {
      this.urlParameters.deleteKey(propertiesKey);
    }
    this.urlParameters.deleteGlobalKey(this.instanceId);
  }

  deleteKey(key: string): void {
    this.urlParameters.deleteKey(key);
  }

  commit(): void {
    const url = this.urlParameters.toString();
    window.history.pushState({}, '', url);
  }

  store(snapshot: IFlowSnapshot): void {
    this.urlParameters.setGlobalParam(this.instanceId, JSON.stringify(snapshot.state));
    Object.keys(snapshot.persistentContext).forEach((key) => {
      this.urlParameters.setParam(key, JSON.stringify(snapshot.persistentContext[key]));
    });
  }
}
