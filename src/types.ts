export interface ClientConfig {
  baseUrl?: string;
  headers?: Record<string, string> | (() => Record<string, string>);
  timeout?: number;
  staleTime?: number;
  cacheTime?: number;
  retry?: number | boolean;
  fetch?: typeof fetch;
}

export interface QueryOptions<TData = unknown, TError = Error> {
  params?: Record<string, string | number>;
  searchParams?: Record<string, string | number | boolean>;
  key?: string[];
  staleTime?: number;
  cacheTime?: number;
  retry?: number | boolean;
  retryDelay?: number | ((attempt: number) => number);
  enabled?: boolean;
  select?: (data: unknown) => TData;
  placeholderData?: TData | (() => TData);
  keepPreviousData?: boolean;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  onSettled?: (data: TData | undefined, error: TError | null) => void;
}

export interface MutationOptions<TData = unknown, TVariables = unknown, TError = Error> {
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
  optimistic?: (cache: unknown, variables: TVariables) => void;
  invalidates?: string[] | 'auto';
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables, context: unknown) => void;
  onMutate?: (variables: TVariables) => unknown | Promise<unknown>;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
  offlineSupport?: boolean;
}

export interface SubscribeOptions<TData = unknown> {
  transport: 'websocket' | 'sse' | 'polling';
  interval?: number;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (data: TData) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

export interface QueryState<TData = unknown, TError = Error> {
  data: TData | undefined;
  error: TError | null;
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  isStale: boolean;
  refetch: () => Promise<TData>;
}

export interface MutationState<TData = unknown, TVariables = unknown, TError = Error> {
  data: TData | undefined;
  error: TError | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  variables: TVariables | undefined;
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}

export interface SubscriptionState<TData = unknown> {
  data: TData | undefined;
  isConnected: boolean;
  error: Error | null;
}

export interface Plugin<TContext = unknown> {
  name: string;
  version: string;
  dependencies?: string[];
  install: (kernel: unknown) => void;
  onInit?: (context: TContext) => void | Promise<void>;
  onDestroy?: () => void | Promise<void>;
  onError?: (error: Error) => void;
}
