'use strict'

const { createElement } = require('react')
const Cmp2 = ({ text }) => {
  return createElement('p', null, text)
}

const Cmp1 = (props) => {
  return createElement('div', { a: props.a }, createElement(Cmp2, { text: props.text }))
}

const value = 'hia'

module.exports = () => createElement(Cmp1, { a: value, text: 'hi' })
