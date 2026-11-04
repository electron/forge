/**
 * Lucide icons for Mermaid diagrams, in place of Font Awesome's stylesheet and
 * web fonts. Mermaid only turns `fa:fa-<name>` in a label into an icon, so the
 * pack is registered under the `fa` prefix; the names are Lucide's. Add an
 * icon here (from @iconify-json/lucide) before using it in a diagram.
 *
 * Lucide is ISC licensed: https://github.com/lucide-icons/lucide/blob/main/LICENSE
 */
import React, { useEffect, useState } from 'react';
import Mermaid from '@theme-original/Mermaid';
import type MermaidType from '@theme/Mermaid';
import type { WrapperProps } from '@docusaurus/types';

const ICONS = {
  prefix: 'fa',
  width: 24,
  height: 24,
  icons: {
    'folder-open': {
      body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 14l1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
    },
    package: {
      body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73zm1 .27V12"/><path d="M3.29 7L12 12l8.71-5M7.5 4.27l9 5.15"/></g>',
    },
    'disc-3': {
      body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M6 12c0-1.7.7-3.2 1.8-4.2"/><circle cx="12" cy="12" r="2"/><path d="M18 12c0 1.7-.7 3.2-1.8 4.2"/></g>',
    },
    upload: {
      body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v12m5-7l-5-5l-5 5m14 7v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
    },
    cloud: {
      body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9"/>',
    },
  },
};

let registered: Promise<void> | undefined;
function registerIcons() {
  registered ??= import('mermaid').then(({ default: mermaid }) =>
    mermaid.registerIconPacks([{ name: 'fa', icons: ICONS }]),
  );
  return registered;
}

/** Renders the diagram once the icons are registered, so labels never fall
    back to Font Awesome's empty <i> tags. */
export default function MermaidWrapper(
  props: WrapperProps<typeof MermaidType>,
): React.ReactElement | null {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void registerIcons().then(() => setReady(true));
  }, []);
  return ready ? <Mermaid {...props} /> : null;
}
