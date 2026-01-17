import type { Plugin } from '../../types.js';
import type { Kernel } from '../../kernel.js';
import type { StateSnapshot } from '../../core/state-machine.js';

interface DevToolsContext {
  devtools: DevToolsManager;
}

export class DevToolsManager {
  private history: StateSnapshot[] = [];
  private maxHistory: number;
  private currentState = 0;

  constructor(maxHistory: number = 100) {
    this.maxHistory = maxHistory;
  }

  captureState(snapshot: StateSnapshot): void {
    this.history.push(snapshot);

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.currentState = this.history.length - 1;
  }

  getHistory(): StateSnapshot[] {
    return [...this.history];
  }

  getCurrentStateIndex(): number {
    return this.currentState;
  }

  jumpTo(index: number): StateSnapshot | null {
    if (index < 0 || index >= this.history.length) {
      return null;
    }

    this.currentState = index;
    return this.history[index];
  }

  undo(): StateSnapshot | null {
    return this.jumpTo(this.currentState - 1);
  }

  redo(): StateSnapshot | null {
    return this.jumpTo(this.currentState + 1);
  }

  canUndo(): boolean {
    return this.currentState > 0;
  }

  canRedo(): boolean {
    return this.currentState < this.history.length - 1;
  }

  export(): string {
    return JSON.stringify({
      history: this.history,
      currentState: this.currentState,
    });
  }

  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (!Array.isArray(data.history) || typeof data.currentState !== 'number') {
        return false;
      }

      this.history = data.history;
      this.currentState = data.currentState;
      return true;
    } catch {
      return false;
    }
  }

  clear(): void {
    this.history = [];
    this.currentState = 0;
  }

  setMaxHistory(max: number): void {
    this.maxHistory = max;
    while (this.history.length > max) {
      this.history.shift();
    }
  }
}

export const devtoolsPlugin: Plugin<DevToolsContext> = {
  name: 'devtools',
  version: '1.0.0',

  install(kernel: Kernel<DevToolsContext>): void {
    const devtools = new DevToolsManager();
    const context = kernel.getContext();

    context.devtools = devtools;

    kernel.on('query:state', ({ snapshot }) => {
      devtools.captureState(snapshot);
    });

    kernel.on('mutation:state', ({ snapshot }) => {
      devtools.captureState(snapshot);
    });
  },
};

export type { DevToolsContext };
