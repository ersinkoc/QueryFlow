import React, { createContext, useContext, useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { QueryFlowClient } from '../../client.js';
import type { QueryOptions, QueryState, MutationOptions, MutationState, SubscribeOptions } from '../../types.js';
import { query as queryFn, type QueryInstance } from '../../query.js';
import { mutation as mutationFn, type MutationInstance } from '../../mutation.js';
import { subscribe as subscribeFn, type SubscriptionInstance } from '../../subscribe.js';

interface QueryFlowContextValue {
  client: QueryFlowClient;
}

const QueryFlowContext = createContext<QueryFlowContextValue | null>(null);

export interface QueryFlowProviderProps {
  client: QueryFlowClient;
  children: ReactNode;
}

export function QueryFlowProvider({ client, children }: QueryFlowProviderProps): JSX.Element {
  return React.createElement(
    QueryFlowContext.Provider,
    { value: { client } },
    children
  );
}

export function useQueryClient(): QueryFlowClient {
  const context = useContext(QueryFlowContext);
  if (!context) {
    throw new Error('useQueryClient must be used within QueryFlowProvider');
  }
  return context.client;
}

export function useQuery<TData = unknown, TError = Error>(
  url: string,
  options: QueryOptions<TData, TError> = {}
): QueryState<TData, TError> {
  const [state, setState] = useState<QueryState<TData, TError>>({
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

  const queryRef = useRef<QueryInstance<TData, TError> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const query = queryFn<TData, TError>(url, options);
    queryRef.current = query;

    const unsubscribe = query.onStateChange(snapshot => {
      if (isMountedRef.current) {
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
      }
    });

    if (options.enabled !== false) {
      query.fetch().catch(() => {});
    }

    return unsubscribe;
  }, [url, JSON.stringify(options)]);

  return state;
}

export function useMutation<TData = unknown, TVariables = unknown, TError = Error>(
  url: string,
  options: MutationOptions<TData, TVariables, TError> = {}
): MutationState<TData, TVariables, TError> {
  const [state, setState] = useState<MutationState<TData, TVariables, TError>>({
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

  const mutationRef = useRef<MutationInstance<TData, TVariables, TError> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const mutation = mutationFn<TData, TVariables, TError>(url, options);
    mutationRef.current = mutation;

    const unsubscribe = mutation.onStateChange(snapshot => {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          data: snapshot.data as TData | undefined,
          error: snapshot.error as TError | null,
          isPending: snapshot.state === 'loading',
          isSuccess: snapshot.state === 'success',
          isError: snapshot.state === 'error',
          isIdle: snapshot.state === 'idle',
        }));
      }
    });

    return unsubscribe;
  }, [url, JSON.stringify(options)]);

  const mutate = useCallback((variables: TVariables) => {
    if (!mutationRef.current) return;
    mutationRef.current.mutate(variables);
  }, []);

  const mutateAsync = useCallback((variables: TVariables): Promise<TData> => {
    if (!mutationRef.current) return Promise.resolve(undefined as TData);
    return mutationRef.current.mutateAsync(variables);
  }, []);

  const reset = useCallback(() => {
    if (!mutationRef.current) return;
    mutationRef.current.reset();
    setState(prev => ({ ...prev, isIdle: true, error: null, data: undefined }));
  }, []);

  return { ...state, mutate, mutateAsync, reset };
}

export function useSubscription<TData = unknown>(
  url: string,
  options: SubscribeOptions<TData>
): { data: TData | undefined; isConnected: boolean; error: Error | null } {
  const [state, setState] = useState({
    data: undefined as TData | undefined,
    isConnected: false,
    error: null as Error | null,
  });

  useEffect(() => {
    const subscription = subscribeFn<TData>(url, options);
    const unsubscribe = subscription.onMessage(data => {
      setState(prev => ({ ...prev, data }));
    });

    subscription.onOpen?.(() => {
      setState(prev => ({ ...prev, isConnected: true }));
    });

    subscription.onError?.((error: Error) => {
      setState(prev => ({ ...prev, error }));
    });

    subscription.connect().catch(() => {});

    return () => {
      unsubscribe();
      subscription.close();
    };
  }, [url, JSON.stringify(options)]);

  return state;
}

export function useIsFetching(): number {
  return 0;
}

export function useIsMutating(): number {
  return 0;
}
