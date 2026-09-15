import { ipcRenderer } from 'electron';

const helloWorld = require('native-hello-world');
ipcRenderer.send('stdout', `${helloWorld()} from the renderer`);
