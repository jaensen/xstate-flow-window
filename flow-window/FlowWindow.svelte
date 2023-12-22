<script lang="ts">
  import { createEventDispatcher, onDestroy, SvelteComponent } from 'svelte';
  import type { EventObject, StateMachine, StateValue } from 'xstate';
  import { interpret, Interpreter, State } from 'xstate';
  import type { Flow } from '$xstate/flow';
  import type { PropertiesOrFactory, StatePageMapEntry } from '$xstate/statePageMap';
  import type { FlowWindowStateTransition } from '$xstate/flowWindowStateTransition';
  import type { IFlowSnapshot, IPersistedFlowState } from '$xstate/persistence/persistedFlowState';
  import type { ContextWithShell } from '$flows/shell/contextWithShell';
  import type { ShellApi } from '$flows/shell/shellApi';
  import type { PageApi } from '$xstate/pageApi';
  import type { Cancel } from '$xstate/events/cancel';
  import type { GoBack } from '$xstate/events/goBack';
  import type { Submit } from '$xstate/events/submit';
  import type { Context } from '$xstate/context';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let flow: Flow<any, any>;
  export let persistence: IPersistedFlowState;
  export let shellApi: ShellApi | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let runningFlow: Interpreter<any, any, any, any, any> | undefined;
  let pageContext: ContextWithShell | undefined;
  let currentPageMapEntry: StatePageMapEntry<ContextWithShell> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentPage: SvelteComponent<Record<string, unknown>, any, any>;

  let currentPageProps: Record<string, unknown>;
  let pageContainer: HTMLDivElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastStateTransition: FlowWindowStateTransition<any, any> | undefined;

  const dispatch = createEventDispatcher();
  const pageApi: PageApi = {
    submit: () => {
      runningFlow?.send(<Submit<ContextWithShell>>{
        type: 'Submit',
        context: pageContext
      });
    },
    goBack: () => {
      runningFlow?.send(<GoBack>{
        type: 'GoBack'
      });
    },
    cancel: () => {
      runningFlow?.send(<Cancel>{
        type: 'Cancel'
      });
    },
    send: (event: EventObject) => {
      runningFlow?.send(event);
    }
  };

  const copyContext = (context: ContextWithShell): ContextWithShell => ({
    ...context,
    persistent: JSON.parse(JSON.stringify(context.persistent)),
    volatile: JSON.parse(JSON.stringify(context.volatile)),
    shell: shellApi
  });

  const stateToString = (state: StateValue): string => {
    if (typeof state === 'string') {
      return state;
    }
    const queue = Object.keys(state);
    const stringRepresentation: string[] = [];

    while (queue.length > 0) {
      const key = queue.shift();
      if (key) {
        stringRepresentation.push(key);
        const value = state[key];
        if (typeof value === 'string') {
          stringRepresentation.push(value);
        } else if (typeof value === 'object') {
          queue.push(...Object.keys(value));
        }
      }
    }

    return stringRepresentation.join('.');
  };

  const onPageSend = (event: CustomEvent<Record<string, unknown> & { type: string }>): void => {
    if (!runningFlow) {
      throw new Error(
        `Flow ${flow.id} is not running but received event ${event.type} from page ${currentPageMapEntry}`
      );
    }
    if (event.detail.type === 'Cancel' && event.detail.flowId === flow.id) {
      runningFlow.stop();
      return;
    }
    runningFlow.send(event.detail);
  };

  const isComplexEntry = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entry: any
  ): entry is StatePageMapEntry<ContextWithShell> & {
    properties?: PropertiesOrFactory<ContextWithShell>;
    component: typeof SvelteComponent;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on?: Record<string, (event: any) => void>;
  } => !!entry.component;

  const subscribeToPageEvents = (
    stateViewMapEntry: StatePageMapEntry<ContextWithShell>,
    page: SvelteComponent,
    context: ContextWithShell
  ): void => {
    if (!isComplexEntry(stateViewMapEntry) || typeof stateViewMapEntry.on !== 'function') {
      page.$on('send', onPageSend);
      return;
    }

    const eventHandlers = stateViewMapEntry.on(context, pageApi, shellApi);
    for (let onKey in eventHandlers) {
      page.$on(onKey, (e) => {
        const handler = eventHandlers[onKey];
        if (handler) {
          handler(e);
        }
      });
    }
    page.$on('send', onPageSend);
  };

  const mountPage = (
    stateViewMapEntry: StatePageMapEntry<ContextWithShell>,
    context: ContextWithShell
  ): SvelteComponent => {
    let nextComponent: SvelteComponent;
    if (isComplexEntry(stateViewMapEntry)) {
      let newPageProps: Record<string, unknown>;
      if (typeof stateViewMapEntry.properties === 'function') {
        newPageProps = {
          ...currentPageProps,
          ...stateViewMapEntry.properties(context, pageApi)
        };
      } else {
        newPageProps = { ...currentPageProps, ...(stateViewMapEntry.properties ?? {}) };
      }

      if (currentPage?.contructor === stateViewMapEntry.component) {
        currentPage.$set(newPageProps);
        return currentPage;
      }

      currentPage?.$destroy();
      nextComponent = new stateViewMapEntry.component({
        target: pageContainer,
        props: newPageProps
      });
    } else if (typeof stateViewMapEntry === 'function') {
      if (currentPage?.contructor === stateViewMapEntry) {
        return currentPage;
      }

      currentPage?.$destroy();
      nextComponent = new stateViewMapEntry({
        target: pageContainer,
        props: currentPageProps
      });
    } else {
      throw new Error('Page container is undefined');
    }

    subscribeToPageEvents(stateViewMapEntry, nextComponent, context);

    return nextComponent;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onStateTransition = (state: State<any, any, any, any, any>): void => {
    const nextContext = copyContext(state.context);
    const nextPageKey = stateToString(state.value);
    const nextPageMapEntry = flow.pages[nextPageKey];

    if (state.done) {
      persistence.delete();
    } else {
      persistence.store({
        state: state.value,
        persistentContext: nextContext.persistent
      });
    }

    persistence.commit();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastStateTransition = <FlowWindowStateTransition<any, any>>{
      final: !!state.done,
      flowId: flow.id,
      state: state.value,
      event: state.event,
      context: state.context
    };
    dispatch('stateTransition', lastStateTransition);

    if (!!state.done && shellApi) {
      shellApi.stoppedFlow(flow.id, lastStateTransition);
    }

    if (!nextPageMapEntry) {
      return;
    }

    currentPageProps = {
      ...currentPageProps,
      context: nextContext,
      api: pageApi
    };

    currentPage = mountPage(nextPageMapEntry, nextContext);
    pageContext = nextContext;
  };

  /**
   * Create the initial context for the state machine by merging the persistent context from the snapshot
   * with the initial configuration of the state machine (see state machine definition). The snapshot takes
   * precedence over the initial configuration.
   */
  const createInitialContext = (
    snapshot: IFlowSnapshot | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stateMachineDefinition: StateMachine<any, any, any>
  ): Context & { shell: ShellApi | undefined } => ({
    persistent: {
      ...(stateMachineDefinition.context?.persistent ?? {}),
      ...snapshot?.persistentContext
    },
    volatile: stateMachineDefinition.context?.volatile ?? {},
    data: stateMachineDefinition.context?.data ?? {},
    errors: stateMachineDefinition.context?.errors ?? {},
    shell: shellApi
  });

  const runFlow = (): void => {
    const snapshot = persistence.restore();
    const initialContext = createInitialContext(snapshot, flow.stateMachine);

    runningFlow = interpret(flow.stateMachine.withContext(initialContext), {
      devTools: true,
      id: flow.id
    })
      .onTransition(onStateTransition)
      .start(snapshot?.state);
  };

  $: {
    if (runningFlow && runningFlow.id !== flow.id) {
      runningFlow.stop();
      runningFlow = undefined;
    }
    if (pageContainer && !runningFlow && flow) {
      runFlow();
    }
  }

  onDestroy(() => {
    if (runningFlow) {
      runningFlow.stop();
    }
    if (currentPage) {
      currentPage.$destroy();
    }
  });
</script>

<div>
  <div bind:this={pageContainer}></div>
</div>
