const replace = require('@rollup/plugin-replace')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const css = require("rollup-plugin-import-css")
const commonjs = require('@rollup/plugin-commonjs')
module.exports = {
  input: 'src/module/demonlord.js',
  output: {
    dir: 'dist/module',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    replace({
      // If you would like DEV messages, specify 'development'
      // Otherwise use 'production'
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    nodeResolve(),
    css({ output: 'bundle.css' }),
    commonjs(),
  ],
}
