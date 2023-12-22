import type { EventObject } from 'xstate';

export type PageApi = {
  submit(): void;
  goBack(): void;
  cancel(): void;
  send(event: EventObject): void;
};
