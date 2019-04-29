'use strict'

const esx = require('../..')()
const Cmp2 = ({ a, b, pid, text }) => {
  return esx`<p a=${a} b=${b} id=${pid}>${text}</p>`
}
esx.register({ Cmp2 })
const Cmp1 = (props) => {
  return esx`<div><Cmp2 a='1' ...${props} b='2'/></div>`
}
esx.register({ Cmp1 })
const value = 'hia'

module.exports = () => esx`<Cmp1 pid=${value} text='hi'/>`
