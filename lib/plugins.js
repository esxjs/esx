'use strict'
const { prototype } = require('events')
const { runners } = require('./symbols')
const preState = Symbol('esx.pre-state')
const postState = Symbol('esx.post-state')

function pre (strings, values) {
  this[preState] = [strings, values]
  this.emit('pre')
  return this[preState]
}
function post (string) {
  this[postState] = string
  this.emit('post')
  return this[postState]
}

module.exports = {
  __proto__: prototype,
  [preState]: [],
  [postState]: '',
  [runners]: function () {
    return {
      pre: pre.bind(this),
      post: post.bind(this)
    }
  },
  pre (fn) {
    const listener = () => {
      const [ strings, values ] = this[preState]
      this[preState] = fn(strings, ...values)
    }
    this.on('pre', listener)
    return () => {
      this.removeListener('pre', listener)
    }
  },
  post (fn) {
    const listener = () => {
      const string = this[postState]
      this[postState] = fn(string)
    }
    this.on('post', listener)
    return () => {
      this.removeListener('post', listener)
    }
  }
}
