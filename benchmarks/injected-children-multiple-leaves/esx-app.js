'use strict'

const esx = require('../..')()
const Cmp4 = ({ children }) => {
  return esx`<p>${children}</p>`
}
const Cmp3 = ({ children }) => {
  return esx`<p>${children}</p>`
}
const Cmp2 = ({ children }) => {
  return esx`<p>${children}</p>`
}
esx.register({ Cmp2, Cmp3, Cmp4 })
const Cmp1 = (props) => {
  return esx`
    <div a=${props.a}>
      <Cmp2><div>${props.text}</div></Cmp2>
      <Cmp3><div>${props.text}</div></Cmp3>
      <Cmp4><div>${props.text}</div></Cmp4>
    </div>
  `
}
esx.register({ Cmp1 })
const value = 'hia'

module.exports = () => esx`<Cmp1 a=${value} text='hi'/>`
