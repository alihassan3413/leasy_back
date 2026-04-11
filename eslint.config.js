// import js from '@eslint/js'
// import ts from 'typescript-eslint'
// import pluginVue from 'eslint-plugin-vue'
// import vueParser from 'vue-eslint-parser'
// import stylistic from '@stylistic/eslint-plugin'
// import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
// import globals from 'globals'

// export default ts.config(
//   // ── Global ignores ─────────────────────────────────────────────────────────
//   {
//     ignores: ['dist/**', 'node_modules/**'],
//   },

//   // ── Base JavaScript rules ──────────────────────────────────────────────────
//   js.configs.recommended,

//   // ── Vue plugin + recommended template/component rules ─────────────────────
//   ...pluginVue.configs['flat/recommended'],

//   // ── Vue files: vue-eslint-parser wraps TypeScript parser for <script setup>
//   //    Type-checked rules are enabled — the project option lets ESLint use the
//   //    real TypeScript language service (catches no-floating-promise etc.)
//   {
//     files: ['src/**/*.vue'],
//     extends: ts.configs.recommendedTypeChecked,
//     languageOptions: {
//       parser: vueParser,
//       parserOptions: {
//         parser: ts.parser,
//         project: './tsconfig.app.json',
//         extraFileExtensions: ['.vue'],
//         ecmaVersion: 'latest',
//         sourceType: 'module',
//         tsconfigRootDir: process.cwd(),
//       },
//       globals: { ...globals.browser },
//     },
//   },

//   // ── TypeScript source files ────────────────────────────────────────────────
//   {
//     files: ['src/**/*.ts'],
//     extends: ts.configs.recommendedTypeChecked,
//     languageOptions: {
//       parser: ts.parser,
//       parserOptions: {
//         project: './tsconfig.app.json',
//         ecmaVersion: 'latest',
//         sourceType: 'module',
//         tsconfigRootDir: process.cwd(),
//       },
//       globals: { ...globals.browser },
//     },
//   },

//   // ── Rules applied to all app source (TS + Vue) ────────────────────────────
//   {
//     files: ['src/**/*.{ts,vue}'],
//     plugins: {
//       '@stylistic': stylistic,
//       'better-tailwindcss': betterTailwindcss,
//     },
//     settings: {
//       'better-tailwindcss': {
//         // Tailwind v4 uses CSS-based config instead of tailwind.config.js
//         entryPoint: 'src/style.css',
//       },
//     },
//     rules: {
//       // ── TypeScript ─────────────────────────────────────────────────────────
//       // Disable the base rule — the TS version handles this correctly
//       'no-unused-vars': 'off',
//       '@typescript-eslint/no-unused-vars': ['error', {
//         argsIgnorePattern: '^_',
//         varsIgnorePattern: '^_',
//       }],

//       // Require `import type` for type-only imports so they are erased at
//       // build time and never accidentally trigger side-effects.
//       '@typescript-eslint/consistent-type-imports': ['error', {
//         prefer: 'type-imports',
//         fixStyle: 'separate-type-imports',
//       }],

//       // Catches unhandled promises — one of the most common async bugs.
//       '@typescript-eslint/no-floating-promises': 'error',

//       // Prevents passing an async function where void is expected.
//       // attributes: false lets @click="asyncHandler" work without complaints.
//       '@typescript-eslint/no-misused-promises': ['error', {
//         checksVoidReturn: { attributes: false },
//       }],

//       '@typescript-eslint/no-explicit-any': 'warn',

//       // Turning this off — it conflicts with conditional checks on nullable
//       // values which are common in Vue templates and store getters.
//       '@typescript-eslint/no-unnecessary-condition': 'off',

//       // ── Vue ────────────────────────────────────────────────────────────────
//       // Single-word names (Dashboard, Login) are fine for page-level views.
//       'vue/multi-word-component-names': 'off',

//       // Enforce <script setup> as the only allowed API style.
//       'vue/component-api-style': ['error', ['script-setup']],

//       // Enforce <script> before <template> before <style>.
//       'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],

//       // Disallow v-html — prevents XSS.
//       'vue/no-v-html': 'error',

//       // Require type-based declarations for emits and props.
//       'vue/define-emits-declaration': ['error', 'type-based'],
//       'vue/define-props-declaration': ['error', 'type-based'],

//       // ── Code quality ───────────────────────────────────────────────────────
//       // Allow console.warn and console.error for intentional logging.
//       'no-console': ['warn', { allow: ['warn', 'error'] }],

//       'prefer-const': 'error',
//       'no-var': 'error',
//       'eqeqeq': ['error', 'always'],

//       // Handled by consistent-type-imports above; turning off base rule to
//       // avoid false positives on `import` + `import type` for the same module.
//       'no-duplicate-imports': 'off',

//       // ── Style (formatting) ─────────────────────────────────────────────────
//       '@stylistic/indent': ['error', 2],
//       '@stylistic/semi': ['error', 'never'],
//       '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
//       '@stylistic/comma-dangle': ['error', 'always-multiline'],
//       '@stylistic/object-curly-spacing': ['error', 'always'],
//       '@stylistic/arrow-parens': ['error', 'always'],
//       '@stylistic/space-before-function-paren': ['error', {
//         anonymous: 'always',
//         named: 'never',
//         asyncArrow: 'always',
//       }],

//       // ── Tailwind ───────────────────────────────────────────────────────────
//       'better-tailwindcss/enforce-consistent-line-wrapping': 'warn',
//       'better-tailwindcss/enforce-shorthand-classes': 'warn',
//     },
//   },

//   // ── Build / config files (no type-checking, Node globals) ─────────────────
//   // These files live outside src/ and are not part of the app tsconfig.
//   {
//     files: ['*.config.ts', '*.config.js'],
//     extends: ts.configs.recommended,
//     languageOptions: {
//       parser: ts.parser,
//       globals: { ...globals.node },
//     },
//   },
// )
