'use strict'
const { createElement } = require('react')
const esx = require('../..')()
const Cmp2 = ({ a, b, pid, text }) => {
  return createElement(
    'p',
    { a: a, b: b, id: pid },
    text
  )
}
esx.register({ Cmp2 })
const Cmp1 = props => {
  return createElement(
    'div',
    null,
    createElement(Cmp2, Object.assign({ a: '1' }, props, { b: '2' }))
  )
}
esx.register({ Cmp1 })
const value = 'hia'

module.exports = () => createElement(Cmp1, { pid: value, text: 'hi' })

/* JSX:
const esx = require('../..')()
const Cmp2 = ({a, b, pid, text}) => {
  return <p a={a} b={b} id={pid}>{text}</p>
}
esx.register({Cmp2})
const Cmp1 = (props) => {
  return <div><Cmp2 a='1' {...props} b='2'/></div>
}
esx.register({Cmp1})
const value = 'hia'

module.exports = () => <Cmp1 pid={value} text='hi'/>

const { createElement } = require('react')
const Cmp2 = ({text}) => {
  return createElement('p', null, text)
}
*/
