'use strict'

const esx = require('../..')()
const Cmp2 = ({children}) => {
  return esx `<p>${children}</p>`
}
esx.register({Cmp2})
const Cmp1 = (props) => {
  return esx `<div a=${props.a}><Cmp2><div>${props.text}</div></Cmp2></div>`
}
esx.register({Cmp1})
const value = 'hia'

module.exports = () => esx `<Cmp1 a=${value} text='hi'/>`