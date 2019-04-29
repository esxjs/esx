'use strict'
const EsxApp = require('./esx-app')
const esx = require('../..')({ EsxApp })
const { createServer } = require('http')

createServer((req, res) => {
  res.end(esx.renderToString`<EsxApp/>`)
}).listen(3000)
