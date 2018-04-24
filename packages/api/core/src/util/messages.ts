export function info(interactive: boolean, message: string) {
  if (interactive) {
    console.info(message);
  }
}

export function warn(interactive: boolean, message: string) {
  if (interactive) {
    console.warn(message);
  }
}
