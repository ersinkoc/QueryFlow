import type { Plugin } from '../../types.js';
import type { Kernel } from '../../kernel.js';
import { StateMachine, type StateSnapshot } from '../../core/state-machine.js';

interface StateManagerContext {
  stateManager: StateManager;
}

export class StateManager {
  private queries = new Map<string, StateMachine>();
  private mutations = new Map<string, StateMachine>();

  getQueryState(key: string): StateSnapshot | undefined {
    const sm = this.queries.get(key);
    return sm?.getHistory().at(-1);
  }

  setQueryState(key: string, snapshot: StateSnapshot): void {
    let sm = this.queries.get(key);
    if (!sm) {
      sm = new StateMachine();
      this.queries.set(key, sm);
    }
    sm.transition(snapshot.state, snapshot.data, snapshot.error ?? undefined);
  }

  subscribeToQuery(key: string, listener: (snapshot: StateSnapshot) => void): () => void {
    let sm = this.queries.get(key);
    if (!sm) {
      sm = new StateMachine();
      this.queries.set(key, sm);
    }
    return sm.subscribe(listener);
  }

  getMutationState(key: string): StateSnapshot | undefined {
    const sm = this.mutations.get(key);
    return sm?.getHistory().at(-1);
  }

  setMutationState(key: string, snapshot: StateSnapshot): void {
    let sm = this.mutations.get(key);
    if (!sm) {
      sm = new StateMachine();
      this.mutations.set(key, sm);
    }
    sm.transition(snapshot.state, snapshot.data, snapshot.error ?? undefined);
  }

  subscribeToMutation(key: string, listener: (snapshot: StateSnapshot) => void): () => void {
    let sm = this.mutations.get(key);
    if (!sm) {
      sm = new StateMachine();
      this.mutations.set(key, sm);
    }
    return sm.subscribe(listener);
  }

  removeQuery(key: string): void {
    this.queries.delete(key);
  }

  removeMutation(key: string): void {
    this.mutations.delete(key);
  }

  clearQueries(): void {
    this.queries.clear();
  }

  clearMutations(): void {
    this.mutations.clear();
  }

  clear(): void {
    this.clearQueries();
    this.clearMutations();
  }

  getQueryKeys(): string[] {
    return Array.from(this.queries.keys());
  }

  getMutationKeys(): string[] {
    return Array.from(this.mutations.keys());
  }
}

export const stateManagerPlugin: Plugin<StateManagerContext> = {
  name: 'state-manager',
  version: '1.0.0',

  install(kernel: Kernel<StateManagerContext>): void {
    const stateManager = new StateManager();
    const context = kernel.getContext();

    context.stateManager = stateManager;

    kernel.on('query:state', ({ key, snapshot }) => {
      stateManager.setQueryState(key, snapshot);
    });

    kernel.on('mutation:state', ({ key, snapshot }) => {
      stateManager.setMutationState(key, snapshot);
    });
  },
};

export type { StateManagerContext };
