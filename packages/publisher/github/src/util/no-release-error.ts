class NoReleaseError extends Error {
  code: number;

  constructor(code: number) {
    super('No GitHub Release found');
    this.code = code;
  }
}

export { NoReleaseError as default };
