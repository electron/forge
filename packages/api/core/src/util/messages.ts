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

export function truncateMiddle(str: string, maxLength: number): string {
  if (typeof str !== 'string' || str.length <= maxLength || maxLength <= 3) {
    return str;
  }
  const charsToShow = Math.ceil((maxLength - 3) / 2);
  const backChars = Math.floor((maxLength - 3) / 2);
  return `${str.slice(0, charsToShow)}...${str.slice(str.length - backChars)}`;
}
