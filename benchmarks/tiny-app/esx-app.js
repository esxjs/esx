'use strict'

const esx = require('../..')()
const Cmp2 = ({text}) => {
  return esx `<p>${text}</p>`
}
esx.register({Cmp2})
const Cmp1 = (props) => {
  return esx `<div a=${props.a}><Cmp2 text=${props.text}/></div>`
}
esx.register({Cmp1})
const value = 'hia'

module.exports = () => esx `<Cmp1 a=${value} text='hi'/>`