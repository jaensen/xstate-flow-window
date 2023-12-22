import type { StatePageMap } from './statePageMap';
import type { EventObject, StateMachine } from 'xstate';
import type { Context } from '$xstate/context';

export type Flow<TContext extends Context, TEvent extends EventObject> = {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stateMachine: StateMachine<TContext, any, TEvent>;
  pages: StatePageMap<TContext>;
};
