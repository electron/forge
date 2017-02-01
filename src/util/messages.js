function info(interactive, message) {
  if (interactive) {
    console.info(message);
  }
}

function warn(interactive, message) {
  if (interactive) {
    console.warn(message);
  }
}

export { info, warn };
