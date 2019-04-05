'use strict'

const { createElement, createContext, memo, forwardRef } = require('react')
const { Provider, Consumer } = createContext()
/* istanbul ignore next */
const noop = () => {}
const REACT_PROVIDER_TYPE = Provider.$$typeof
const REACT_CONSUMER_TYPE = Consumer.$$typeof
const REACT_MEMO_TYPE = memo(noop).$$typeof
const REACT_ELEMENT_TYPE = createElement('div').$$typeof
const REACT_FORWARD_REF_TYPE = forwardRef(noop).$$typeof
const VOID_ELEMENTS = new Set([
  'area', 
  'base', 
  'br', 
  'col', 
  'embed', 
  'hr', 
  'img', 
  'input', 
  'link', 
  'meta', 
  'param', 
  'source', 
  'track', 
  'wbr'
])

module.exports = {
  REACT_PROVIDER_TYPE,
  REACT_CONSUMER_TYPE,
  REACT_MEMO_TYPE,
  REACT_ELEMENT_TYPE,
  REACT_FORWARD_REF_TYPE,
  VOID_ELEMENTS
}