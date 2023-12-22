import type { Context } from '$xstate/context';
import type { z } from 'zod';
import { assign, type AssignAction, type EventObject } from 'xstate';
import type { Submit } from '$xstate/events/submit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isSubmitEvent = <TContext extends Context>(event: any): event is Submit<TContext> =>
  event.type === 'Submit';

export const handleSubmit = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schemaGenerator: (context: any, event: any) => z.Schema
): AssignAction<unknown, EventObject> =>
  assign({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    persistent: (context: any, event: any) =>
      isSubmitEvent(event) ? event.context.persistent : context.persistent,
    volatile: (context, event) =>
      isSubmitEvent(event) ? event.context.volatile : context.volatile,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errors: (context: any, event: any) => {
      if (!isSubmitEvent(event)) {
        throw new Error('Invalid event type. Expected Submit.');
      }
      const validationSpace = {
        ...event.context.volatile,
        ...event.context.persistent
      };

      const schema = schemaGenerator(context, event);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- wrong types
      const result: any = schema.safeParse(validationSpace);
      if (!result.success) {
        return result.error.issues.reduce(
          (acc, issue) => {
            acc[issue.path[0]?.toString() ?? ''] = issue.message;
            return acc;
          },
          <Record<string, string>>{}
        );
      }

      return {};
    }
  });
