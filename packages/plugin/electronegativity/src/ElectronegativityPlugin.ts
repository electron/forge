import runElectronegativity from '@doyensec/electronegativity';
import { PluginBase } from '@electron-forge/plugin-base';
import { ForgeHookFn, ForgeHookMap } from '@electron-forge/shared-types';

export type Confidence = 'certain' | 'firm' | 'tentative';
export type CustomCheck = 'dangerousfunctionsjscheck' | 'remotemodulejscheck';
export type Severity = 'high' | 'medium' | 'low' | 'informational';

export type ElectronegativityConfig = {
  /**
   * Save the results to a file in CSV or SARIF format.
   */
  output?: string;
  /**
   * Whether to save the output in SARIF or CSV format.
   *
   * Defaults to CSV.
   */
  isSarif?: boolean;
  /**
   * Specified checks to run.
   */
  customScan?: CustomCheck[];
  /**
   * Only return findings with the specified level of severity or above.
   *
   * Defaults to `informational`.
   */
  severitySet?: Severity;
  /**
   * Only return findings with the specified level of confidence or above.
   *
   * Defaults to `tentative`.
   */
  confidenceSet?: Confidence;
  /**
   * Whether to show relative paths for files.
   *
   * Defaults to `false`.
   */
  isRelative?: boolean;
  /**
   * Specify a range to run Electron upgrade checks. For example, `'7..8'` checks an upgrade
   * from Electron 7 to Electron 8.
   */
  electronUpgrade?: string;
  /**
   * Specify additional parser plugins to use. For example, `optionalChaining`.
   *
   * Defaults to empty array (`[]`)
   */
  parserPlugins?: Array<string>;
};

export default class ElectronegativityPlugin extends PluginBase<ElectronegativityConfig> {
  name = 'electronegativity';

  getHooks(): ForgeHookMap {
    return {
      postPackage: this.postPackage,
    };
  }

  postPackage: ForgeHookFn<'postPackage'> = async (_forgeConfig, options): Promise<void> => {
    await runElectronegativity(
      {
        ...this.config,
        isRelative: this.config.isRelative ?? false,
        parserPlugins: this.config.parserPlugins ?? [],
        input: options.outputPaths[0],
      },
      true
    );
  };
}

export { ElectronegativityPlugin };
