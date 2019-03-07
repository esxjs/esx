'use strict'


function validate (components) {
  if (typeof components !== 'object' || components === null) {
    throw Error('ESX: supplied components must be an object')
  }
  const keys = Object.keys(components)
  for (var i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key[0].toUpperCase() !== key[0]) {
      throw Error('ESX: all components should use PascalCase')
    }
    // if (typeof components[key] !== 'function') {
    //   console.trace(key, components, components[key])
    //   throw Error('ESX: all components must be functions or classes')
    // }
  }
}

module.exports = validate