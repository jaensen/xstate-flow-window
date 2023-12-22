import type { Context } from '$xstate/context';
import type { EventObject } from 'xstate';

export type FlowWindowStateTransition<TContext extends Context, TEvent extends EventObject> = {
  final: boolean;
  flowId: string;
  state: string;
  context: TContext;
  event: TEvent;
};
