'use strict'

const { PROPERTIES_RX } = require('./constants')
const { getPrototypeOf, prototype } = Object
const validated = {
  primitives: new Set(),
  objects: new WeakSet()
}
function validateOne (key, cmp, path = '') {
  const primitive = typeof cmp === 'symbol' || typeof cmp === 'string'
  if (primitive && validated.primitives.has(cmp)) return
  else if (validated.objects.has(cmp)) return
  const name = key.match(PROPERTIES_RX).pop()
  if (name[0].toUpperCase() !== name[0]) {
    if (cmp !== null && typeof cmp === 'object') {
      validate(cmp, path + key + '.')
      return
    } else {
      throw Error(`ESX: ${path}${key} is not valid. All components should use PascalCase`)
    }
  }
  if (primitive) {
    validated.primitives.add(cmp)
    return
  }

  const valid = typeof cmp === 'function' || (cmp != null &&
      typeof cmp === 'object' && Array.isArray(cmp) === false && '$$typeof' in cmp)

  if (valid) validated.objects.add(cmp)
  else throw Error(`ESX: ${path}${key} is not a valid component`)
}

function supported (key, cmp, path = '') {
  try { var unsupported = 'contextTypes' in cmp } catch (e) {}
  if (unsupported) {
    throw Error(`ESX: ${path}${key} has a contextTypes property. Legacy context API is not supported – https://reactjs.org/docs/legacy-context.html`)
  }
}

function validate (components, path = '') {
  const invalidType = components === null || getPrototypeOf(components) !== prototype
  if (invalidType) throw Error('ESX: supplied components must be a plain object')
  for (var key in components) {
    const cmp = components[key]
    supported(key, cmp, path)
    validateOne(key, cmp, path)
  }
}

module.exports = { validate, validateOne, supported }
