import type { Context } from '$xstate/context';

export type Submit<TContext extends Context> = {
  type: 'Submit';
  context: TContext;
};
