'use strict'


function validate (components) {
  if (typeof components !== 'object' || components === null || Array.isArray(components)) {
    throw Error('ESX: supplied components must be an object')
  }
  const keys = Object.keys(components)
  for (var i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key[0].toUpperCase() !== key[0]) {
      throw Error('ESX: all components should use PascalCase')
    }
    switch (true) {
      case typeof components[key] === 'function': return 
      case typeof components[key] === 'symbol': return 
      case components[key] != null &&
        typeof components[key] === 'object' &&
        !Array.isArray(components[key]) &&
        '$$typeof' in components[key]: return 
      default: throw Error(`ESX: ${key} is not a valid component`)
    }
  }
}

module.exports = validate