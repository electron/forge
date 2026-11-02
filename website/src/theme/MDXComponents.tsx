import ApiDeclaration from './ApiDeclaration';
import MDXComponents from '@theme-original/MDXComponents';

// <ApiDeclaration> is emitted into the generated API reference Markdown by
// website/typedoc/declaration-preview.mjs.
export default {
  ...MDXComponents,
  ApiDeclaration,
};
