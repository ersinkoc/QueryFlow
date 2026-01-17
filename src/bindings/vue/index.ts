import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { QueryFlowClient } from '../../client.js';
import type { QueryOptions, QueryState, MutationOptions, MutationState, SubscribeOptions } from '../../types.js';
import { query as queryFn, type QueryInstance } from '../../query.js';
import { mutation as mutationFn, type MutationInstance } from '../../mutation.js';
import { subscribe as subscribeFn, type SubscriptionInstance } from '../../subscribe.js';

let queryFlowClient: QueryFlowClient | null = null;

export function provideQueryFlow(client: QueryFlowClient): void {
  queryFlowClient = client;
}

function getClient(): QueryFlowClient {
  if (!queryFlowClient) {
    throw new Error('QueryFlow client not provided. Use provideQueryFlow() first.');
  }
  return queryFlowClient;
}

export function useQuery<TData = unknown, TError = Error>(
  url: string,
  options: QueryOptions<TData, TError> = {}
): any {
  const queryInstance = ref<QueryInstance<TData, TError> | null>(null);
  const state = ref<QueryState<TData, TError>>({
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

  onMounted(() => {
    const query = queryFn<TData, TError>(url, options);
    queryInstance.value = query;

    const unsubscribe = query.onStateChange(snapshot => {
      state.value = {
        data: snapshot.data as TData | undefined,
        error: snapshot.error as TError | null,
        isLoading: snapshot.state === 'loading' && !query.isSuccess(),
        isFetching: snapshot.state === 'loading',
        isSuccess: snapshot.state === 'success',
        isError: snapshot.state === 'error',
        isIdle: snapshot.state === 'idle',
        isStale: snapshot.state === 'stale',
        refetch: () => query.refetch(),
      };
    });

    if (options.enabled !== false) {
      query.fetch().catch(() => {});
    }

    onUnmounted(unsubscribe);
  });

  return state;
}

export function useMutation<TData = unknown, TVariables = unknown, TError = Error>(
  url: string,
  options: MutationOptions<TData, TVariables, TError> = {}
): any {
  const mutationInstance = ref<MutationInstance<TData, TVariables, TError> | null>(null);
  const state = ref<MutationState<TData, TVariables, TError>>({
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

  onMounted(() => {
    const mutation = mutationFn<TData, TVariables, TError>(url, options);
    mutationInstance.value = mutation;

    const unsubscribe = mutation.onStateChange(snapshot => {
      state.value = {
        ...state.value as any,
        data: snapshot.data as TData | undefined,
        error: snapshot.error as TError | null,
        isPending: snapshot.state === 'loading',
        isSuccess: snapshot.state === 'success',
        isError: snapshot.state === 'error',
        isIdle: snapshot.state === 'idle',
      };
    });

    state.value.mutate = (variables: TVariables) => {
      mutation.mutate(variables);
    };

    state.value.mutateAsync = (variables: TVariables) => {
      return mutation.mutateAsync(variables);
    };

    state.value.reset = () => {
      mutation.reset();
    };

    onUnmounted(unsubscribe);
  });

  return state.value;
}

export function useSubscription<TData = unknown>(
  url: string,
  options: SubscribeOptions<TData>
): any {
  const state = ref({
    data: undefined as TData | undefined,
    isConnected: false,
    error: null as Error | null,
  });

  onMounted(() => {
    const subscription = subscribeFn<TData>(url, options);
    const unsubscribe = subscription.onMessage(data => {
      state.value.data = data;
    });

    subscription.onOpen?.(() => {
      state.value.isConnected = true;
    });

    subscription.onError?.((error: Error) => {
      state.value.error = error;
    });

    subscription.connect().catch(() => {});

    onUnmounted(() => {
      unsubscribe();
      subscription.close();
    });
  });

  return state;
}
