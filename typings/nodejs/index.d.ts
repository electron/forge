declare namespace NodeJS {
  interface Process extends EventEmitter {
    emit(event: 'FORGE_RESTART_APP'): boolean;

    on(event: 'FORGE_RESTART_APP', listener: () => void): NodeJS.Process;
  }
}
