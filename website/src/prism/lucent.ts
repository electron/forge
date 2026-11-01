import type { PrismTheme } from 'prism-react-renderer';

/**
 * Lucent syntax colours for Prism, from the `--lu-syntax-*` tokens in
 * `src/css/lucent/lucent-tokens.css`. The values are CSS variables, so this one
 * theme follows the light/dark switch without a separate dark theme.
 */
const lucent: PrismTheme = {
  plain: {
    color: 'var(--lu-ink)',
    backgroundColor: 'var(--lu-code-sheet)',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: 'var(--lu-syntax-comment)', fontStyle: 'italic' },
    },
    {
      types: ['keyword', 'tag', 'selector', 'important', 'atrule'],
      style: { color: 'var(--lu-syntax-keyword)' },
    },
    {
      types: [
        'string',
        'char',
        'attr-value',
        'template-string',
        'regex',
        'url',
      ],
      style: { color: 'var(--lu-syntax-string)' },
    },
    {
      types: [
        'function',
        'function-variable',
        'class-name',
        'builtin',
        'maybe-class-name',
      ],
      style: { color: 'var(--lu-syntax-function)' },
    },
    {
      types: ['number', 'boolean', 'constant', 'symbol', 'unit'],
      style: { color: 'var(--lu-syntax-number)' },
    },
    {
      types: ['property', 'attr-name', 'property-access'],
      style: { color: 'var(--lu-ink)' },
    },
    {
      types: ['punctuation', 'operator'],
      style: { color: 'var(--lu-ink-muted)' },
    },
    {
      types: ['inserted'],
      style: { color: 'var(--lu-success)' },
    },
    {
      types: ['deleted'],
      style: { color: 'var(--lu-spark)' },
    },
  ],
};

export default lucent;
