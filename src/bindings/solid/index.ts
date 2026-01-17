import { createSignal, createEffect, onCleanup, type Accessor, type Setter, type Signal } from 'solid-js';
import type { QueryFlowClient } from '../../client.js';
import type { QueryOptions, QueryState, MutationOptions, MutationState, SubscribeOptions } from '../../types.js';
import { query as queryFn, type QueryInstance } from '../../query.js';
import { mutation as mutationFn, type MutationInstance } from '../../mutation.js';
import { subscribe as subscribeFn, type SubscriptionInstance } from '../../subscribe.js';

const QueryFlowContext = createSignal<QueryFlowClient | null>(null);

export interface QueryFlowProviderProps {
  client: QueryFlowClient;
  children: any;
}

export function QueryFlowProvider(props: QueryFlowProviderProps): any {
  QueryFlowContext[1](() => props.client);
  return props.children;
}

export function createQuery<TData = unknown, TError = Error>(
  url: string,
  options: QueryOptions<TData, TError> = {}
): Accessor<QueryState<TData, TError>> {
  const [state, setState] = createSignal<QueryState<TData, TError>>({
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
    isSuccess: false,
    isError: false,
    isIdle: true,
    isStale: false,
    refetch: () => Promise.resolve(undefined as TData),
  });

  createEffect(() => {
    const query = queryFn<TData, TError>(url, options);
    const unsubscribe = query.onStateChange(snapshot => {
      setState({
        data: snapshot.data as TData | undefined,
        error: snapshot.error as TError | null,
        isLoading: snapshot.state === 'loading' && !query.isSuccess(),
        isFetching: snapshot.state === 'loading',
        isSuccess: snapshot.state === 'success',
        isError: snapshot.state === 'error',
        isIdle: snapshot.state === 'idle',
        isStale: snapshot.state === 'stale',
        refetch: () => query.refetch(),
      });
    });

    if (options.enabled !== false) {
      query.fetch().catch(() => {});
    }

    onCleanup(unsubscribe);
  });

  return state;
}

export function createMutation<TData = unknown, TVariables = unknown, TError = Error>(
  url: string,
  options: MutationOptions<TData, TVariables, TError> = {}
): MutationState<TData, TVariables, TError> {
  const [state, setState] = createSignal<MutationState<TData, TVariables, TError>>({
    data: undefined,
    error: null,
    isPending: false,
    isSuccess: false,
    isError: false,
    isIdle: true,
    variables: undefined,
    mutate: () => {},
    mutateAsync: () => Promise.resolve(undefined as TData),
    reset: () => {},
  });

  createEffect(() => {
    const mutation = mutationFn<TData, TVariables, TError>(url, options);
    const unsubscribe = mutation.onStateChange((snapshot: any) => {
      setState((s: any) => ({
        ...s,
        data: snapshot.data as TData | undefined,
        error: snapshot.error as TError | null,
        isPending: snapshot.state === 'loading',
        isSuccess: snapshot.state === 'success',
        isError: snapshot.state === 'error',
        isIdle: snapshot.state === 'idle',
      }));
    });

    setState((s: any) => ({
      ...s,
      mutate: (variables: TVariables) => {
        mutation.mutate(variables);
      },
      mutateAsync: (variables: TVariables) => {
        return mutation.mutateAsync(variables);
      },
      reset: () => {
        mutation.reset();
      },
    }));

    onCleanup(unsubscribe);
  });

  return state();
}

export function createSubscription<TData = unknown>(
  url: string,
  options: SubscribeOptions<TData>
): Accessor<{ data: TData | undefined; isConnected: boolean; error: Error | null }> {
  const [state, setState] = createSignal({
    data: undefined as TData | undefined,
    isConnected: false,
    error: null as Error | null,
  });

  createEffect(() => {
    const subscription = subscribeFn<TData>(url, options);
    const unsubscribe = subscription.onMessage(data => {
      setState((s: any) => ({ ...s, data }));
    });

    subscription.onOpen?.(() => {
      setState((s: any) => ({ ...s, isConnected: true }));
    });

    subscription.onError?.((error: Error) => {
      setState((s: any) => ({ ...s, error }));
    });

    subscription.connect().catch(() => {});

    onCleanup(() => {
      unsubscribe();
      subscription.close();
    });
  });

  return state;
}
