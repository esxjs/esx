'use strict'
const { renderToString } = require('react-dom/server')
const { createElement } = require('react')
const CreateElementApp = require('./createElement-app')

const { createServer } = require('http')

createServer((req, res) => {
  res.end(renderToString(createElement(CreateElementApp)))
}).listen(3000)
