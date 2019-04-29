'use strict'
const {
  // I'll be fine:
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: internals
} = require('react')
const { provider } = require('../symbols')
function noop () {}
var prior = null

function install () {
  prior = internals.ReactCurrentDispatcher.current
  internals.ReactCurrentDispatcher.current = {
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
}
function uninstall () {
  internals.ReactCurrentDispatcher.current = prior
}

function useContext (context) {
  return context[provider]
    ? context[provider][1].value
    : context._currentValue2
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
