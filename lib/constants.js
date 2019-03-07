'use strict'

const { createElement, createContext, memo, forwardRef } = require('react')
const { Provider, Consumer } = createContext()
const REACT_PROVIDER_TYPE = Provider.$$typeof
const REACT_CONSUMER_TYPE = Consumer.$$typeof
const REACT_MEMO_TYPE = memo(()=>{}).$$typeof
const REACT_ELEMENT_TYPE = createElement('div').$$typeof
const REACT_FORWARD_REF_TYPE = forwardRef(() => {}).$$typeof

module.exports = {
  REACT_PROVIDER_TYPE,
  REACT_CONSUMER_TYPE,
  REACT_MEMO_TYPE,
  REACT_ELEMENT_TYPE,
  REACT_FORWARD_REF_TYPE
}