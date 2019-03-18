'use strict'

const esx = require('../..')()
const React = require('react')
const Cmp2 = ({children}) => {
  const cloned = React.Children.map(children, (el) => React.cloneElement(el, {new: 'prop'}, 'hi'))
  return esx `<p>${cloned}</p>`
}
esx.register({Cmp2})
const Cmp1 = (props) => {
  return esx `<div a=${props.a}><Cmp2><div attr='hi'>${props.text}</div></Cmp2></div>`
}
esx.register({Cmp1})
const value = 'hia'

module.exports = () => esx `<Cmp1 a=${value} text='hi'/>`