import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

const extensions = ['.ts', '.tsx', '.js'];

export default {
  input: './index.tsx',
  output: [{
    file: './index.bundle.js',
    format: 'es',
    preferConst: true,
    sourcemap: true
  }],
  plugins: [
    replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
    commonjs(),
    babel({
      babelHelpers: 'runtime',
      extensions,
      // remove all comments except terser annotations
      // https://github.com/terser/terser#annotations
      // https://babeljs.io/docs/en/options#shouldprintcomment
      shouldPrintComment: comment => /^[@#]__.+__$/.test(comment)
    }),
    nodeResolve({ extensions, browser: true })
  ]
};
