import type { Context } from '$xstate/context';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isContext = (context: any): context is Context =>
  'data' in context && 'persistent' in context && 'volatile' in context;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isValidContext = (context: any): boolean => {
  if (!isContext(context)) {
    throw new Error('Invalid event type. Expected Submit.');
  }
  return Object.keys(context.errors).length == 0;
};
