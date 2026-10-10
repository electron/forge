## binary-delta

`@electron-forge/binary-delta` ships the `BinaryDelta` executable from [Sparkle](https://sparkle-project.org) 2.9.5, the Sparkle release that Squirrel.Mac uses to apply delta updates. [`@electron-forge/maker-zip`](https://www.npmjs.com/package/@electron-forge/maker-zip) uses it to create delta updates when `macUpdateDelta` is enabled, and installs it automatically on macOS as an optional dependency.

The package only installs on macOS. The executable is downloaded from the Sparkle GitHub release and checked against a pinned SHA-256 when this package is published, so installing it never downloads anything. Sparkle's license is included as `SPARKLE-LICENSE`.

```javascript
import { binaryDeltaPath } from '@electron-forge/binary-delta';
```
