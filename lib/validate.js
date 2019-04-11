'use strict'

const { PROPERTIES_RX } = require('./constants')
const { getPrototypeOf, prototype } = Object
const validated = new WeakSet()
const validatedSymbols = new Set()
function validate (components, path = '') {
  const invalidType = components === null || getPrototypeOf(components) !== prototype
  if (invalidType) throw Error('ESX: supplied components must be a plain object')
  for (var key in components) {
    const cmp = components[key]
    const symbolCmp = typeof cmp === 'symbol'
    if (symbolCmp && validatedSymbols.has(cmp)) continue
    else if (validated.has(cmp)) continue
    const name = key.match(PROPERTIES_RX).pop()
    if (name[0].toUpperCase() !== name[0]) {
      if (cmp !== null && typeof cmp === 'object') {
        validate(cmp, path + key + '.')
        continue
      } else {
        throw Error(`ESX: ${path}${key} is not valid. All components should use PascalCase`)
      }
    }
    if (symbolCmp) {
      validatedSymbols.add(cmp)
      continue
    }
    const valid = typeof cmp === 'function' || (cmp != null &&
        typeof cmp === 'object' && Array.isArray(cmp) === false && '$$typeof' in cmp)
    
    if (valid) validated.add(cmp)
    else throw Error(`ESX: ${path}${key} is not a valid component`)
  }
}

module.exports = validate