'use strict'
const {
  // I'll be fine:
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: internals
} = require('react')
const NOT_IMPLEMENTED = Error('not implemented')
function noop () {}
var prior = null
var renderingItem = null
var index = 0
function rendering (item) {
  renderingItem = item
  index = 0
}
function after (item) {
  item[3].hooksSetup = true
}
function dispatcher (index, states) {
  return function dispatch (newState) {
    states[index] = newState
  }
}
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
  renderingItem = null 
  index = 0
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
  const meta = renderingItem[3]
  if (meta.hooksSetup === false) {
    meta.hooksUsed = true
    meta.hooks = meta.hooks || {
      states: [],
      dispatchers: []
    }
    const dispatch =  dispatcher(index, meta.hooks.states)
    meta.hooks.states[index] = initialState
    meta.hooks.dispatchers[index] = dispatch
    index++
    return [initialState, dispatch]
  }
  const state = meta.hooks.states[index]
  const dispatch = meta.hooks.dispatchers[index]
  index ++

  return [state, dispatch]
}
function useCallback (cb) {
  return cb
}

module.exports = {
  install, uninstall, rendering, after
}