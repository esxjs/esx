'use strict'
process.env.NODE_ENV = 'production'
const bench = require('fastbench')
const { createElement } = require('react')
const { renderToString } = require('react-dom/server')
const esx = require('../..')()
const EsxApp = require('./esx-app')
const CreateElementApp = require('./createElement-app')
const assert = require('assert')

esx.register({ EsxApp })

assert.strict.equal(esx.renderToString`<EsxApp/>`, renderToString(createElement(CreateElementApp)))

const max = 1000
const run = bench([
  function esxRenderToStringAsTag (cb) {
    for (var i = 0; i < max; i++) {
      esx.renderToString`<EsxApp/>`
    }
    setImmediate(cb)
  },
  function esxRenderToStringPassedElement (cb) {
    for (var i = 0; i < max; i++) {
      const element = esx`<EsxApp/>`
      esx.renderToString(element)
    }
    setImmediate(cb)
  },
  function reactRenderToString (cb) {
    for (var i = 0; i < max; i++) {
      renderToString(createElement(CreateElementApp))
    }
    setImmediate(cb)
  }
], 100)

run(run)
