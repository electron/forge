import type { WrapperProps } from '@docusaurus/types';
import Tabs from '@theme-original/Tabs';
import type TabsType from '@theme/Tabs';
import { Children, cloneElement, isValidElement } from 'react';

type Props = WrapperProps<typeof TabsType>;

const FILE_TYPES: Record<string, string> = {
  js: 'js',
  mjs: 'js',
  cjs: 'js',
  ts: 'ts',
  mts: 'ts',
  cts: 'ts',
  jsx: 'jsx',
  tsx: 'tsx',
  json: 'json',
  html: 'html',
  vue: 'vue',
};

/** The file type of a tab named after a file, like `forge.config.js`. */
function fileType(name: unknown): string | undefined {
  if (typeof name !== 'string') return undefined;
  const ext = /\.([a-z]+)$/i.exec(name)?.[1]?.toLowerCase();
  return ext ? FILE_TYPES[ext] : undefined;
}

/**
 * Tabs, with a `data-filetype` attribute on each tab whose value or label is a
 * file name, so custom.css can badge it. TabItem's `attributes` go on the tab
 * in the tab list.
 */
export default function TabsWrapper(props: Props): React.ReactElement {
  const children = Children.map(props.children, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return child;
    const { value, label, attributes } = child.props as {
      value?: unknown;
      label?: unknown;
      attributes?: Record<string, unknown>;
    };
    const type = fileType(label) ?? fileType(value);
    if (!type) return child;
    return cloneElement(child, {
      attributes: { ...attributes, 'data-filetype': type },
    });
  });
  return <Tabs {...props}>{children}</Tabs>;
}
