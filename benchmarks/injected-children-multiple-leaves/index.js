'use strict'
process.env.NODE_ENV = 'production'
const bench = require('fastbench')
const { createElement } = require('react')
const { renderToString } = require('react-dom/server')
const esx = require('../..')()
const EsxApp = require('./esx-app')
const CreateElementApp = require('./createElement-app')
const assert = require('assert')

esx.register({EsxApp})

console.log(esx.renderToString `<EsxApp/>`)
return
// renderToString(createElement(CreateElementApp)))

const max = 1000
const run = bench([
  function esxRenderToString (cb) {
    for (var i = 0; i < max; i++) {
      esx.renderToString `<EsxApp/>`
    }
    setImmediate(cb)
  },
  function reactRenderToString (cb) {
    for (var i = 0; i < max; i++) {
      renderToString(createElement(CreateElementApp))
    }
    setImmediate(cb)
  },
], 1000)

run(run)