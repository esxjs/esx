'use strict'
const {
  // I'll be fine:
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: internals
} = require('react')
const NOT_IMPLEMENTED = Error('not implemented')
function noop () {}
var prior = null

function install () {
  prior = internals.ReactCurrentDispatcher.current
  internals.ReactCurrentDispatcher.current = {
    readContext,
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

function readContext () {
  throw NOT_IMPLEMENTED
}
function useContext () {
  throw NOT_IMPLEMENTED
}
function useMemo () {
  throw NOT_IMPLEMENTED
}
function useReducer () {
  throw NOT_IMPLEMENTED
}
function useRef () {
  throw NOT_IMPLEMENTED
}
function useState (initialState) {
  return [initialState, noop]
}
function useCallback (cb) {
  return cb
}

module.exports = {
  install, uninstall
}