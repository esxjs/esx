'use strict'
const {
  // I'll be fine:
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: internals
} = require('react')
const { provider, ns } = require('../symbols')
function noop () {}
const esxDispatcher = {
  [ns]: true,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
  useCallback,
  useLayoutEffect: noop,
  useImperativeHandle: noop,
  useEffect: noop,
  useDebugValue: noop
}
var reactDispatcher = null
var dispatcher = null
Object.defineProperty(internals.ReactCurrentDispatcher, 'current', {
  get () {
    return dispatcher
  },
  set (d) {
    if (d !== null && d[ns] !== true) {
      reactDispatcher = Object.assign({}, d)
      Object.assign(d, esxDispatcher)
      Object.defineProperty(internals.ReactCurrentDispatcher, 'current', {
        value: d, configurable: true, writable: true
      })
      return d
    }
    return (dispatcher = d)
  }
}, { configurable: true })

function install () {
  dispatcher = esxDispatcher
  internals.ReactCurrentDispatcher.current = dispatcher
}
function uninstall () {
  dispatcher = esxDispatcher
}

function useContext (context) {
  return context[provider]
    ? context[provider][1].value
    : reactDispatcher.useContext(context)
}
function useMemo (fn, deps) {
  return fn()
}
function useReducer (reducer, initialState, init) {
  if (typeof init === 'function') initialState = init(initialState)
  return [initialState, noop]
}
function useRef (val) {
  return { current: val }
}
function useState (initialState) {
  return [initialState, noop]
}
function useCallback (cb) {
  return cb
}

module.exports = {
  install, uninstall, rendering: noop, after: noop
}
