import { writable, derived, type Readable, type Writable } from 'svelte/store';
import type { QueryFlowClient } from '../../client.js';
import type { QueryOptions, QueryState, MutationOptions, MutationState, SubscribeOptions } from '../../types.js';
import { query as queryFn, type QueryInstance } from '../../query.js';
import { mutation as mutationFn, type MutationInstance } from '../../mutation.js';
import { subscribe as subscribeFn, type SubscriptionInstance } from '../../subscribe.js';

let queryFlowClient: QueryFlowClient | null = null;

export function setQueryFlowContext(client: QueryFlowClient): void {
  queryFlowClient = client;
}

function getClient(): QueryFlowClient {
  if (!queryFlowClient) {
    throw new Error('QueryFlow client not provided. Use setQueryFlowContext() first.');
  }
  return queryFlowClient;
}

export function query<TData = unknown, TError = Error>(
  url: string,
  options: QueryOptions<TData, TError> = {}
): Readable<QueryState<TData, TError>> {
  const state = writable<QueryState<TData, TError>>({
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

  const queryInstance = queryFn<TData, TError>(url, options);
  const unsubscribe = queryInstance.onStateChange(snapshot => {
    state.set({
      data: snapshot.data as TData | undefined,
      error: snapshot.error as TError | null,
      isLoading: snapshot.state === 'loading' && !queryInstance.isSuccess(),
      isFetching: snapshot.state === 'loading',
      isSuccess: snapshot.state === 'success',
      isError: snapshot.state === 'error',
      isIdle: snapshot.state === 'idle',
      isStale: snapshot.state === 'stale',
      refetch: () => queryInstance.refetch(),
    });
  });

  if (options.enabled !== false) {
    queryInstance.fetch().catch(() => {});
  }

  return {
    subscribe: (run: (value: QueryState<TData, TError>) => void, invalidate?: () => void) => {
      const unsub = state.subscribe(run);
      return () => {
        unsub();
        unsubscribe();
      };
    },
  };
}

export function mutation<TData = unknown, TVariables = unknown, TError = Error>(
  url: string,
  options: MutationOptions<TData, TVariables, TError> = {}
): any {
  const state = writable<MutationState<TData, TVariables, TError>>({
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

  const mutationInstance = mutationFn<TData, TVariables, TError>(url, options);

  mutationInstance.onStateChange(snapshot => {
    state.update((s: any) => ({
      ...s,
      data: snapshot.data as TData | undefined,
      error: snapshot.error as TError | null,
      isPending: snapshot.state === 'loading',
      isSuccess: snapshot.state === 'success',
      isError: snapshot.state === 'error',
      isIdle: snapshot.state === 'idle',
    }));
  });

  state.update((s: any) => ({
    ...s,
    mutate: (variables: TVariables) => {
      mutationInstance.mutate(variables);
    },
    mutateAsync: (variables: TVariables) => {
      return mutationInstance.mutateAsync(variables);
    },
    reset: () => {
      mutationInstance.reset();
    },
  }));

  return state;
}

export function subscription<TData = unknown>(
  url: string,
  options: SubscribeOptions<TData>
): any {
  const state = writable({
    data: undefined as TData | undefined,
    isConnected: false,
    error: null as Error | null,
  });

  const subscriptionInstance = subscribeFn<TData>(url, options);
  const unsubscribe = subscriptionInstance.onMessage(data => {
    state.update((s: any) => ({ ...s, data }));
  });

  subscriptionInstance.onOpen?.(() => {
    state.update((s: any) => ({ ...s, isConnected: true }));
  });

  subscriptionInstance.onError?.(error => {
    state.update((s: any) => ({ ...s, error }));
  });

  subscriptionInstance.connect().catch(() => {});

  return {
    subscribe: (run: (value: any) => void) => {
      const unsub = state.subscribe(run);
      return () => {
        unsub();
        unsubscribe();
        subscriptionInstance.close();
      };
    },
  };
}
