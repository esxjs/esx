'use strict'
const {
  // I'll be fine:
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: internals
} = require('react')
const { provider } = require('../symbols')
function noop () {}
var prior = null
const current = {
  renderingItem: null,
  index: 0
}
function rendering (item) {
  current.renderingItem = item
  current.index = 0
}
function after (item) {
  item[3].hooksSetup = true
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
  current.renderingItem = null
  current.index = 0
}
function useStateDispatcher (states) {
  return Function('newState', `this.states[${current.index}] = newState`).bind({ states })
}
function useReducerDispatcher (states, reducer) {
  return Function(
    'action',
    `this.states[${current.index}] = this.reducer(this.states[${current.index}], action)`
  ).bind({ states, reducer })
}
function useMemoDispatcher (states) {
  return Function(
    'fn',
    'deps',
    `
      const lastDeps = this.states[${current.index}]
      if (!('val' in this)) return (this.val = fn())
      if (deps.length !== lastDeps.length) {
        this.states[${current.index}] = deps
        return (this.val = fn())
      }
      
      for (var i = 0; i < deps.length; i++) {
        if (!Object.is(deps[i], lastDeps[i])) {
          this.states[${current.index}] = deps
          return (this.val = fn())
        }
      }
      return this.val
    `
  ).bind({ states })
}
function getState (initialState, makeDispatcher, opts = null) {
  const meta = current.renderingItem[3]
  const { index } = current
  if (meta.hooksSetup === false) {
    meta.hooksUsed = true
    meta.hooks = meta.hooks || {
      states: [],
      dispatchers: []
    }
    meta.hooks.states[index] = initialState
    const dispatch = makeDispatcher(meta.hooks.states, opts)
    meta.hooks.dispatchers[index] = dispatch
    current.index++
    return [initialState, dispatch]
  }
  const state = meta.hooks.states[index]
  const dispatch = meta.hooks.dispatchers[index]
  current.index++
  return [state, dispatch]
}

function useContext (context) {
  return context[provider]
    ? context[provider][1].value
    : context._currentValue2
}
function useMemo (fn, deps) {
  const [ , getVal ] = getState(deps, useMemoDispatcher)
  return getVal(fn, deps)
}
function useReducer (reducer, initialState, init) {
  if (typeof init === 'function') initialState = init(initialState)
  return getState(initialState, useReducerDispatcher, reducer)
}

function useRef (val) {
  return { current: val }
}

function useState (initialState) {
  return getState(initialState, useStateDispatcher)
}

function useCallback (cb, deps) {
  return useMemo(() => cb, deps)
}

module.exports = {
  install, uninstall, rendering, after
}
