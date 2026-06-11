import nextPlugin from '@next/eslint-plugin-next';

// Flat config using the Next plugin's own flat presets. We avoid FlatCompat +
// eslint-config-next here because that combo hits a circular-reference bug under
// ESLint 9. TypeScript type-safety is enforced separately by `next build` / tsc.
const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**'],
  },
  nextPlugin.configs.recommended,
  nextPlugin.configs['core-web-vitals'],
];

export default eslintConfig;
