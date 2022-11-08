export function info(interactive: boolean, message: string): void {
  if (interactive) {
    console.info(message);
  }
}

export function warn(interactive: boolean, message: string): void {
  if (interactive) {
    console.warn(message);
  }
}
