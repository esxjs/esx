'use strict'

const { postPlugins, prePlugins } = require('./symbols')

module.exports = {
  [prePlugins]: null,
  [postPlugins]: null,
  pre(fn) {
    const plugins = this[prePlugins]
    this[prePlugins] = plugins === null ? fn : (strings, ...values) => {
      const [s, v] = plugins(strings, ...values)
      return fn(s, ...v)
    }
  },
  post(fn) {
    const plugins = this[postPlugins]
    this[postPlugins] = plugins === null ? fn : (string) => {
      const str = plugins(string)
      return fn(str)
    }
  }
}