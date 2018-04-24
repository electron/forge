declare module 'sudo-prompt' {
  type Exec = (command: string, app: {
    name: string;
  }) => void;
  export const exec: Exec;
}