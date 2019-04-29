'use strict'

const esx = require('../..')()
const Cmp2 = (props) => {
  return esx`<p a='1' ...${props} b='1'></p>`
}
esx.register({ Cmp2 })
const Cmp1 = ({ pid, value, text }) => {
  return esx`<div><Cmp2 pid=${pid} value=${value} text=${text}/></div>`
}
esx.register({ Cmp1 })
const value = 'hia'

module.exports = () => esx`<Cmp1 pid=${value} text='hi'/>`
