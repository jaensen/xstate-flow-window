import type { SvelteComponent } from 'svelte';
import type { Context } from '$xstate/context';
import type { PageApi } from '$xstate/pageApi';
import type { ShellApi } from '$flows/shell/shellApi';

export type PropertiesFactory<TContext extends Context> = (
  context: TContext,
  pageApi: PageApi
) => Record<string, unknown>;
export type PropertiesOrFactory<TContext extends Context> =
  | PropertiesFactory<TContext>
  | Record<string, unknown>;
export interface ComplexPageMapEntry<TContext extends Context> {
  component: typeof SvelteComponent;
  properties?: PropertiesOrFactory<TContext>;
  on?: (
    context: TContext,
    pageApi: PageApi,
    shellApi?: ShellApi | undefined
  ) => Record<string, (e: CustomEvent<unknown>) => void>;
}
export type StatePageMapEntry<TContext extends Context> =
  | ComplexPageMapEntry<TContext>
  | typeof SvelteComponent;

export type StatePageMap<TContext extends Context> = {
  [state: string]: StatePageMapEntry<TContext>;
};
