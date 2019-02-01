'use strict'
const { createElement } = require('react')
const esx = require('../..')()
const Cmp2 = props => {
  return createElement('p', Object.assign({ a: '1' }, props, { b: '1' }))
}
esx.register({ Cmp2 })
const Cmp1 = ({ pid, value, text }) => {
  return createElement(
    'div',
    null,
    createElement(Cmp2, { pid: pid, value: value, text: text })
  )
}
esx.register({ Cmp1 })
const value = 'hia'

module.exports = () => createElement(Cmp1, { pid: value, text: 'hi' })

/* JSX:
const esx = require('../..')()
const Cmp2 = (props) => {
  return<p a='1' {...props} b='1'></p>
}
esx.register({Cmp2})
const Cmp1 = ({pid, value, text}) => {
  return<div><Cmp2 pid={pid} value={value} text={text}/></div>
}
esx.register({Cmp1})
const value = 'hia'

module.exports = () =><Cmp1 pid={value} text='hi'/>
*/