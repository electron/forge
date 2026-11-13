// Preloaded into every process of a test run (NODE_OPTIONS=--require). Only the
// `make` subcommand's process kills itself with a signal, the way a fatal V8
// out-of-memory error aborts it, so the parent CLI sees a child that ended
// without an exit code.
if (/electron-forge-make\.[cm]?[jt]s$/.test(process.argv[1] ?? '')) {
  process.kill(process.pid, 'SIGKILL');
}
