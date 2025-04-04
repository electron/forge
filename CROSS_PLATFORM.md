# Cross-Platform Development Notes

## Package.json Scripts

### Postinstall Script
The `postinstall` script in `package.json` has been modified for better cross-platform compatibility:

```json
"postinstall": "ts-node ./tools/gen-tsconfigs.ts && ts-node ./tools/gen-ts-glue.ts"
```

#### Background
- **Windows systems**: PowerShell scripts (`.ps1`) are created in `node_modules/.bin/`
- **Unix systems**: These scripts don't exist, and attempting to remove them causes errors

#### Previous Implementation
The script previously included PowerShell script cleanup:
```json
"postinstall": "rimraf node_modules/.bin/*.ps1 && ts-node ./tools/gen-tsconfigs.ts && ts-node ./tools/gen-ts-glue.ts"
```

This would fail on non-Windows systems where `.ps1` files don't exist.

#### Current Implementation
- Skips `.ps1` cleanup (non-critical for non-Windows systems)
- Runs TypeScript config generation
- Runs TypeScript glue code generation

#### Future Considerations
If PowerShell script cleanup is needed in the future, consider:
1. Checking the OS in a separate script
2. Only running rimraf on Windows
3. Using a cross-platform solution like `cross-env`

Example solution using a separate script:
```js
// scripts/postinstall.js
const os = require('os');
const { execSync } = require('child_process');

if (os.platform() === 'win32') {
  execSync('rimraf node_modules/.bin/*.ps1');
}

// Run the TypeScript tasks
execSync('ts-node ./tools/gen-tsconfigs.ts');
execSync('ts-node ./tools/gen-ts-glue.ts');
```

Then update package.json:
```json
"postinstall": "node scripts/postinstall.js"
``` 