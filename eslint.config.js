import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

/**
 * Deliberately minimal. This config exists for one job: catching references to
 * things that do not exist.
 *
 * A stale `terminalCards.forEach(...)` survived a clean `vite build` and blanked
 * every section of the live page, because a ReferenceError inside a GSAP setup
 * callback is a runtime failure and bundlers do not look for those. `no-undef`
 * catches it in under a second. Style rules are intentionally left out so this
 * never becomes noise that gets skipped.
 */
export default [
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,vue}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Formatting is not this config's business.
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/attributes-order': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/multiline-html-element-content-newline': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'assets-source/**'],
  },
]
