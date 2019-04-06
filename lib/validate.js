'use strict'

const { PROPERTIES_RX } = require('./constants')

function validate (components, path = '') {
  if (typeof components !== 'object' || components === null || Array.isArray(components)) {
    throw Error('ESX: supplied components must be an object')
  }
  const keys = Object.keys(components)
  for (var i = 0; i < keys.length; i++) {
    const key = keys[i]
    const name = key.match(PROPERTIES_RX).pop()
    if (name[0].toUpperCase() !== name[0]) {
      if (components[key] !== null && typeof components[key] === 'object') {
        validate(components[key], path + key + '.')
        continue
      } else {
        throw Error(`ESX: ${path}${key} is not valid. All components should use PascalCase`)
      }
    }
    switch (true) {
      case typeof components[key] === 'function': continue 
      case typeof components[key] === 'symbol': continue 
      case components[key] != null &&
        typeof components[key] === 'object' &&
        !Array.isArray(components[key]) &&
        '$$typeof' in components[key]: continue 
      default: throw Error(`ESX: ${path}${key} is not a valid component`)
    }
  }
}

module.exports = validate