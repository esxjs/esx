'use strict'
const React = require('react')
const { createElement } = require('react')
const Cmp2 = ({ children }) => {
  const cloned = React.Children.map(children, (el) => React.cloneElement(el, { new: 'prop' }))
  return createElement('p', null, cloned)
}

const Cmp1 = (props) => {
  return createElement(
    'div',
    { a: props.a },
    createElement(Cmp2, null, createElement('div', { attr: 'hi' }, props.text))
  )
}

const value = 'hia'

module.exports = () => createElement(Cmp1, { a: value, text: 'hi' })
