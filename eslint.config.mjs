import {includeIgnoreFile} from '@eslint/compat'
import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')

export default [
  includeIgnoreFile(gitignorePath),
  ...oclif,
  prettier,
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    rules: {
      '@stylistic/object-curly-spacing': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      camelcase: 'off',
      'max-depth': 'off',
      'mocha/consistent-spacing-between-blocks': 'off',
      'n/no-process-exit': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
      'no-await-in-loop': 'off',
      'no-promise-executor-return': 'off',
      'no-unmodified-loop-condition': 'off',
      'no-useless-escape': 'off',
      'unicorn/no-anonymous-default-export': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/prefer-array-some': 'off',
      'unicorn/prefer-spread': 'off',
    },
  },
]
