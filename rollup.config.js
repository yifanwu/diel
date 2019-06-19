import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import wasm from 'rollup-plugin-wasm';

export function disallowedImports() {
  return {
    resolveId: module => {
      if (module === 'util') {
        throw new Error('Cannot import from Node Util.');
      }
      return null;
    }
  };
}
export default {
  input: 'build/src/index.js',
  output: {
    file: 'build/diel.js',
    format: 'iife',
    name: 'diel'
  },
  plugins: [nodeResolve({browser: true}), commonjs(), globals(), builtins(), wasm()],
  external: ['sql.js'],
  globals: {
    "sql.js": "initSqlJs",
  },
};