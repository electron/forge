# Web Multi Logger

> Display multiple streams of logs in one window

This module allows you to pipe multiple logically separated streams of logs into
multiple visually separated views in a web console. It comes with full ANSI
support so you can pipe anything that would work in a Terminal into this tool
as well.

## Usage

```javascript
import Logger from '@electron-forge/web-multi-logger';

const logger = new Logger();

const serverTab = logger.createTab('server');
const frontEndTab = logger.createTab('front_end');

runServerWithLogger(serverTab);
runFrontEndWithLogger(frontEndTab);

// Navigate to http://localhost:9000 in your browser
```
