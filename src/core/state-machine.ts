export type State = 'idle' | 'loading' | 'success' | 'error' | 'stale';

export interface StateSnapshot {
  state: State;
  data: unknown;
  error: Error | null;
  timestamp: number;
}

export class StateMachine {
  private state: State = 'idle';
  private data: unknown = undefined;
  private error: Error | null = null;
  private history: StateSnapshot[] = [];
  private listeners = new Set<(snapshot: StateSnapshot) => void>();

  getState(): State {
    return this.state;
  }

  getData(): unknown {
    return this.data;
  }

  getError(): Error | null {
    return this.error;
  }

  getHistory(): StateSnapshot[] {
    return [...this.history];
  }

  subscribe(listener: (snapshot: StateSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  transition(newState: State, data?: unknown, error?: Error): StateSnapshot {
    if (!this.isValidTransition(this.state, newState)) {
      throw new Error(`Invalid state transition: ${this.state} -> ${newState}`);
    }

    this.state = newState;
    this.data = data ?? this.data;
    this.error = error ?? null;

    const snapshot: StateSnapshot = {
      state: this.state,
      data: this.data,
      error: this.error,
      timestamp: Date.now(),
    };

    this.history.push(snapshot);
    this.notify(snapshot);

    return snapshot;
  }

  private isValidTransition(from: State, to: State): boolean {
    const valid: Record<State, State[]> = {
      idle: ['loading'],
      loading: ['success', 'error'],
      success: ['loading', 'stale'],
      error: ['loading', 'idle'],
      stale: ['loading'],
    };
    return valid[from]?.includes(to) ?? false;
  }

  private notify(snapshot: StateSnapshot): void {
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  reset(): void {
    this.state = 'idle';
    this.data = undefined;
    this.error = null;
    this.history = [];
  }
}
