'use strict'
const { createElement } = require('react')
const parse = require('./lib/parse')
const validate = require('./lib/validate')
const { marker } = require('./lib/symbols')

function esx (components = {}) {
  validate(components)
  const cache = new WeakMap()
  const render = (strings, ...values) => {
    const key = strings
    const state = cache.has(key)
      ? cache.get(key)
      : cache.set(key, parse(components, strings, values)).get(key)
    const { tree } = state
    var i = tree.length
    var root = null
    const map = {}
    while (i--) {
      const [tag, props, childMap, meta] = tree[i]
      const children = new Array(childMap.length)
      const { dynAttrs, dynChildren, spread } = meta
      const spreads = spread && Object.keys(spread).map(Number)
      for (var c in childMap) {
        if (typeof childMap[c] === 'number') {
          children[c] = map[childMap[c]]
        } else {
          children[c] = childMap[c]
        }
      }
      if (spread) {
        for (var sp in spread) {
          const keys = Object.keys(values[sp])
          for (var k in keys) {
            if (spread[sp].after.indexOf(keys[k]) > -1) continue
            props[keys[k]] = values[sp][keys[k]]
          }
        }
      }
      if (dynAttrs) {
        for (var p in dynAttrs) {
          const overridden = spread && spreads.filter(n => {
            return dynAttrs[p] < n
          }).some((n) => {
            return p in values[n] && spread[n].before.indexOf(p) > -1
          })
          if (overridden) continue
          if (props[p] !== marker) continue // this means later static property, should override
          props[p] = values[dynAttrs[p]]
        }
      }
      if (dynChildren) {
        for (var n in dynChildren) {
          children[n] = values[dynChildren[n]]
        }
      }
      const reactChildren = children.length === 0 ? (props.children || null) : (children.length === 1 ? children[0] : children)
      root = reactChildren === null ? createElement(tag, props) : createElement(tag, props, reactChildren)
      map[i] = root
    }
    return root
  }

  render.register = (additionalComponents) => {
    validate(additionalComponents)
    Object.assign(components, additionalComponents)
  }
  render.createElement = createElement
  return render
}

module.exports = esx
