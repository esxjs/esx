'use strict'

// React took the escape-html code 
// and included it into their code base
// and then changed the escape code for
// apostrophes to from decimal form to 
// hexadecimal form. In order to provide consistent
// escaping, this does the same without 
// copy/pasting code from the escape-html module

const Module = require('module')
const { wrap } = Module
Module.wrap = (script) => {
  Module.wrap = wrap
  return wrap(script.replace('&#39;', '&#x27;'))
}
module.exports = require('escape-html')