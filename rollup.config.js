const { nodeResolve } = require('@rollup/plugin-node-resolve')

module.exports = {
  input: 'src/module/demonlord.js',
  output: {
    dir: '/Users/bokehlet/Library/Application Support/FoundryVTT/Data/systems/demonlord/module',
    format: 'es',
    sourcemap: true,
  },
  plugins: [nodeResolve()],
}
