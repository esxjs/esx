'use strict'
let test = require('aquatap')
const { renderToString } = require('react-dom/server')
const PropTypes = require('prop-types')
const init = require('..')
const React = require('react')
const { createElement } = React
const { MODE } = process.env
if (!MODE) {
  process.env.MODE = 'development'
  const error = console.error.bind(console)
  console.error = (s, ...args) => {
    if (/Warning:/.test(s)) return
    return error(s, ...args)
  }
  delete require.cache[require.resolve(__filename)]
  require(__filename)
  test = () => {}
  test.only = test
} else {
  process.env.NODE_ENV = MODE
  if (MODE === 'development') {
    process.nextTick(() => {
      process.env.MODE = 'production'
      delete require.cache[require.resolve(__filename)]
      require(__filename)
    })
  }
}

test('blank', async ({ is }) => {
  const esx = init()
  is(esx.renderToString``, renderToString(esx``))
})

test('basic', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div>hi</div>`, renderToString(esx`<div>hi</div>`))
})

test('function component', async ({ is }) => {
  const Component = () => esx`<div>test</div>`
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('class component', async ({ is }) => {
  class Component extends React.Component {
    render () {
      return esx`<div>test</div>`
    }
  }
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('function component and props', async ({ is }) => {
  const Component = (props) => {
    return esx`<div a=${props.a}>${props.text}</div>`
  }
  const esx = init()
  esx.register({ Component })
  const value = 'hia'
  is(esx.renderToString`<Component a=${value} text='hi'/>`, renderToString(esx`<Component a=${value} text='hi'/>`))
})

test('class component and props', async ({ is }) => {
  class Component extends React.Component {
    render () {
      const props = this.props
      return esx`<div a=${props.a}>${props.text}</div>`
    }
  }
  const esx = init()
  esx.register({ Component })
  const value = 'hia'
  is(esx.renderToString`<Component a=${value} text='hi'/>`, renderToString(esx`<Component a=${value} text='hi'/>`))
})

test('class component and state', async ({ is }) => {
  const value = 'hia'
  class Component extends React.Component {
    constructor (props) {
      super(props)
      this.state = {
        a: value,
        text: 'hi'
      }
    }
    render () {
      const state = this.state
      return esx`<div a=${state.a}>${state.text}</div>`
    }
  }
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(esx`<Component/>`))
})

test('component nested in object', async ({ is }) => {
  const esx = init()
  const Component = (props) => {
    return esx`<div a=${props.a}>${props.text}</div>`
  }
  const o = { Component }
  esx.register({ o })
  is(
    esx.renderToString`<o.Component a='test' text='test'/>`,
    renderToString(createElement(Component, { a: 'test', text: 'test' }))
  )
})

test('components with path syntax names', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ text }) => {
    return esx`<p>${text}</p>`
  }
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><o.Cmp2 text=${props.text}/></div>`
  }
  const value = 'hia'
  const Component = () => esx`<o.Cmp1 a=${value} text='hi'/>`
  const o = { Cmp1, Cmp2 }
  esx.register({
    o: o,
    'o.Component': Component,
    'o["Component"]': Component,
    'o[`Component`]': Component,
    'o[\'Component\']': Component,
    'o[Component]': Component
  })
  is(esx.renderToString`<o.Component/>`, renderToString(createElement(Component)))
  is(esx.renderToString`<o["Component"]/>`, renderToString(createElement(Component)))
  is(esx.renderToString`<o['Component']/>`, renderToString(createElement(Component)))
  is(esx.renderToString`<o[\`Component\`]/>`, renderToString(createElement(Component)))
  is(esx.renderToString`<o[Component]/>`, renderToString(createElement(Component)))
})

test('element alias ("string" component)', async ({ is }) => {
  const esx = init()
  esx.register({ Component: 'div' })
  is(
    esx.renderToString`<Component>test</Component>`,
    renderToString(createElement('div', null, 'test'))
  )
  esx.register({ Component: 'img' })
  is(
    esx.renderToString`<Component/>`,
    renderToString(createElement('img'))
  )
  esx.register({ Component: 'div' })
  is(
    esx.renderToString`<div><Component>test</Component></div>`,
    renderToString(createElement('div', null, createElement('div', null, 'test')))
  )
  esx.register({ Component: 'img' })
  is(
    esx.renderToString`<div><Component/></div>`,
    renderToString(createElement('div', null, createElement('img')))
  )
})

test('sibling elements', async ({ is }) => {
  const Component = () => esx`<div><span>test</span><p>test2</p></div>`
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep element-nested children array', async ({ is }) => {
  const Component = () => esx`<div><span>${['dynamic', 'inline']}</span></div>`
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep element-nested children array – all types', async ({ is }) => {
  const Component = () => esx`<div><span>${['dynamic', () => {}, 'inline', Symbol('x'), null, undefined, 1]}</span></div>`
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep element-nested dynamic + inline children', async ({ is }) => {
  const Component = () => esx`<div><span>${'dynamic'} inline</span></div>`
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep element-nested dynamic + inline children with prior interpolated value', async ({ is }) => {
  const Component = () => esx`<div><span a=${'a'}>${'dynamic'} inline</span></div>`
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep inline children + element-nested dynamic', async ({ is }) => {
  const Component = () => esx`<div><span>inline ${'dynamic'}</span></div>`
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('inline children in multiple elements', async ({ is }) => {
  const Component = () => esx`<div><span>a</span><span>b</span></div>`
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('dynamic children in multiple elements', async ({ is }) => {
  const Component = () => esx`<div><span>${'a'}</span><span>${'b'}</span></div>`
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep element-nested dynamic array + inline children', async ({ is }) => {
  const Component = () => esx`<div>${['dynamic']} inline</div>`
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep inline children + element-nested dynamic array', async ({ is }) => {
  const Component = () => esx`<div>inline ${['dynamic']}</div>`
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('class component', async ({ is }) => {
  class Component extends React.Component {
    render () {
      return esx`<div>test</div>`
    }
  }
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('nested function components', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ text }) => {
    return esx`<p>${text}</p>`
  }
  esx.register({ Cmp2 })
  const Component = (props) => {
    return esx`<div a=${props.a}><Cmp2 text=${props.text}/></div>`
  }

  esx.register({ Component })
  const value = 'hia'
  is(esx.renderToString`<Component a=${value} text='hi'/>`, renderToString(esx`<Component a=${value} text='hi'/>`))
})

test('deep nested function components', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ text }) => {
    return esx`<p>${text}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2 text=${props.text}/></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value} text='hi'/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with inline text child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>text</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with dynamic text child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>${props.text}</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value} text='hi'/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with dynamic text + inline text children', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>${'dynamic'} text</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with dynamic text array + inline text children', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>huazz ${['test', 'dynamic']} text</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with dynamic deep nested text array + inline text children', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>huazz ${[['test', 'dynamic']]} text</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with dynamic very deep nested text array + inline text children', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>huazz ${[['test', [[['dynamic']]]]]} text</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with array of text children', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>${['concat me', props.a]}</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value} text='hi'/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('val escaping in deep nested, non-self closing components with array of text children', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>${['concat me', props.a, '>>xy']}</Cmp2></div>`
  }
  esx.register({ Cmp1 })
  const value = '<<\'"&hia'
  const Component = () => esx`<Cmp1 a=${value} text='hi'/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('hard coded attribute value escaping', async ({ is }) => {
  const Component = () => esx`<img x='>>a'/>`
  const esx = init({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with child instance', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>${createElement('a', null, 'child element')}</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with null child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>${null}</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with undefined child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>${undefined}</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with function child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>${() => {}}</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with number child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>${1}</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with symbol child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>${Symbol('foo')}</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('inline esx child', async ({ is }) => {
  const esx = init()
  const EsxComponent = () => esx`<div>${esx`<span>test</span>`}</div>`
  esx.register({ EsxComponent })
  const ReactComponent = createElement('div', null, createElement('span', null, 'test'))
  is(esx.renderToString`<EsxComponent/>`, renderToString(ReactComponent))
})

test('deep nested, non-self closing components with inline esx child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>${esx`<span>child element</span>`}</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with child element + inline text', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>${esx`<a>child element</a>`} text</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('adjacent interpolated children', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<div>${'w'}${'x'}${'y'}z</div>`,
    renderToString(createElement('div', null, 'w', 'x', 'y', 'z'))
  )
})

test('deep nested, non-self closing components with array of child element + inline text', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>${[esx`<a>child element</a>`, 'text']}</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested class components', async ({ is }) => {
  const esx = init()
  class Cmp2 extends React.Component {
    render () {
      return esx`<p>${this.props.text}</p>`
    }
  }
  esx.register({ Cmp2 })
  class Cmp1 extends React.Component {
    render () {
      return esx`<div a=${this.props.a}><Cmp2 text=${this.props.text}/></div>`
    }
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  class Component extends React.Component {
    render () {
      return esx`<Cmp1 a=${value} text='hi'/>`
    }
  }
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, no interpolated attrs', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ theme }) => esx`<button>${theme}</button>`
  esx.register({ Cmp2 })
  const Cmp1 = () => esx`<div><Cmp2 theme='light'/></div>`
  esx.register({ Cmp1 })
  const Component = () => esx`<Cmp1/>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, no interpolated attrs, second level element wrapped', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({ theme }) => esx`<button>${theme}</button>`
  esx.register({ Cmp2 })
  const Cmp1 = () => esx`<div><Cmp2 theme="light"/></div>`
  esx.register({ Cmp1 })
  const Component = () => esx`<div><Cmp1/></div>`
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('self closing element', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<img src="http://example.com"/>`, renderToString(esx`<img src="http://example.com"/>`))
})

test('nested children override children prop on elements', async ({ is }) => {
  const esx = init()
  is(
    renderToString(esx`<div children="test2">test</div>`),
    renderToString(createElement('div', { children: 'test2' }, 'test'))
  )
  is(
    esx.renderToString`<div children="test2">test</div>`,
    renderToString(esx`<div children="test2">test</div>`)
  )
})

test('class component context using contextType', async ({ is }) => {
  const esx = init()
  const ThemeContext = React.createContext('light')
  const Button = ({ theme }) => esx`<button>${theme}</button>`
  esx.register({ Button })
  class ThemedButton extends React.Component {
    render () {
      return esx`<Button theme=${this.context}/>`
    }
  }
  ThemedButton.contextType = ThemeContext
  esx.register({ ThemedButton })
  const Toolbar = () => esx`<div><ThemedButton/></div>`
  esx.register({ Toolbar })
  class App extends React.Component {
    render () {
      return esx`<div><Toolbar/></div>`
    }
  }
  esx.register({ App })

  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('class component context using contextType w/ provider override', async ({ is }) => {
  const esx = init()
  const ThemeContext = React.createContext('light')
  const { Provider } = ThemeContext
  const Button = ({ theme }) => esx`<button>${theme}</button>`
  esx.register({ Button })
  class ThemedButton extends React.Component {
    render () {
      return esx`<Button theme=${this.context}/>`
    }
  }
  ThemedButton.contextType = ThemeContext
  esx.register({ ThemedButton })
  const Toolbar = () => esx`<div><ThemedButton/></div>`
  esx.register({ Toolbar, Provider })
  class App extends React.Component {
    render () {
      return esx`<div><Provider value="dark"><Toolbar/></Provider></div>`
    }
  }
  esx.register({ App })

  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('class component context using contextType w/ provider override w/ dynamic value', async ({ is }) => {
  const esx = init()
  const ThemeContext = React.createContext('light')
  const { Provider } = ThemeContext
  const Button = ({ theme }) => esx`<button>${theme}</button>`
  esx.register({ Button })
  class ThemedButton extends React.Component {
    render () {
      return esx`<Button theme=${this.context}/>`
    }
  }
  ThemedButton.contextType = ThemeContext
  esx.register({ ThemedButton })
  const Toolbar = () => {
    return esx`<div><ThemedButton/></div>`
  }
  esx.register({ Toolbar, Provider })
  class App extends React.Component {
    render () {
      return esx`<div><Provider value=${'dark'}><Toolbar/></Provider></div>`
    }
  }
  esx.register({ App })

  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('class component context using contextType w/ provider override w/ dynamic value w/ interpolated child', async ({ is }) => {
  const esx = init()
  const ThemeContext = React.createContext('light')
  const { Provider } = ThemeContext
  const Button = ({ theme }) => esx`<button>${theme}</button>`
  esx.register({ Button })
  class ThemedButton extends React.Component {
    render () {
      return esx`<Button theme=${this.context}/>`
    }
  }
  ThemedButton.contextType = ThemeContext
  esx.register({ ThemedButton })
  const Toolbar = () => {
    return esx`<div><ThemedButton/></div>`
  }
  esx.register({ Toolbar, Provider })
  class App extends React.Component {
    render () {
      return esx`<div><Provider value=${'dark'}>${esx`<Toolbar/>`}</Provider></div>`
    }
  }
  esx.register({ App })

  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('class component context using contextType w/ provider override w/ dynamic value w/ interpolated children attribute', async ({ is }) => {
  const esx = init()
  const ThemeContext = React.createContext('light')
  const { Provider } = ThemeContext
  const Button = ({ theme }) => esx`<button>${theme}</button>`
  esx.register({ Button })
  class ThemedButton extends React.Component {
    render () {
      return esx`<Button theme=${this.context}/>`
    }
  }
  ThemedButton.contextType = ThemeContext
  esx.register({ ThemedButton })
  const Toolbar = () => {
    return esx`<div><ThemedButton/></div>`
  }
  esx.register({ Toolbar, Provider })
  class App extends React.Component {
    render () {
      return esx`<div><Provider value=${'dark'} children=${esx`<Toolbar/>`}/></div>`
    }
  }
  esx.register({ App })

  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('class component context using Consumer', async ({ is }) => {
  const esx = init()
  const { Consumer } = React.createContext('light')
  const Button = ({ theme }) => esx`<button>${theme}</button>`
  esx.register({ Button, Consumer })
  class ThemedButton extends React.Component {
    render () {
      return esx`<Consumer>${(value) => esx`<div>${value}</div>`}</Consumer>`
    }
  }
  esx.register({ ThemedButton })
  const Toolbar = () => esx`<div><ThemedButton/></div>`
  esx.register({ Toolbar })
  class App extends React.Component {
    render () {
      return esx`<div><Toolbar/></div>`
    }
  }
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('class component context using Consumer w/ Provider', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext('light')
  const Button = ({ theme }) => esx`<button>${theme}</button>`
  esx.register({ Button, Consumer, Provider })
  class ThemedButton extends React.Component {
    render () {
      return esx`<Consumer>${(value) => esx`<div>${value}</div>`}</Consumer>`
    }
  }
  esx.register({ ThemedButton })
  const Toolbar = () => esx`<div><ThemedButton/></div>`
  esx.register({ Toolbar })
  class App extends React.Component {
    render () {
      return esx`<div><Provider value="dark"><Toolbar/></Provider></div>`
    }
  }
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('Consumer `this` context', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext('light')
  const Button = ({ theme }) => esx`<button>${theme}</button>`
  esx.register({ Button, Consumer, Provider })
  class ThemedButton extends React.Component {
    render () {
      return esx`
        <Consumer test='test'>
          ${function childFn (value) {
    is(this.test, 'test')
    is(this.children, childFn)
    return esx`<div>${value}</div>`
  }}
        </Consumer>
      `
    }
  }
  esx.register({ ThemedButton })
  const Toolbar = () => esx`<div><ThemedButton/></div>`
  esx.register({ Toolbar })
  class App extends React.Component {
    render () {
      return esx`<div><Provider value="dark"><Toolbar/></Provider></div>`
    }
  }
  esx.register({ App })

  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('children render props', async ({ is }) => {
  const esx = init()
  const Button = ({ children }) => {
    return esx`<button>${children('ok')}</button>`
  }
  esx.register({ Button })
  class RenderButton extends React.Component {
    render () {
      return esx`<Button>${(value) => esx`<div>${value}</div>`}</Button>`
    }
  }
  esx.register({ RenderButton })
  const Toolbar = () => esx`<div><RenderButton/></div>`
  esx.register({ Toolbar })
  class App extends React.Component {
    render () {
      return esx`<div><Toolbar /></div>`
    }
  }
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('dynamic component with static element children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({ value, children }) => {
    childTest.register(children)
    return esx`<div><span>${value}</span>${children}</div>`
  }
  esx.register({ A })
  const App = () => esx`<A value=${'a'}><a>test</a></A>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('dynamic component with static element self closing children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({ value, children }) => {
    childTest.register(children)
    return esx`<div><span>${value}</span>${children}</div>`
  }
  esx.register({ A })
  const App = () => esx`<A value=${'a'}><img/></A>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('dynamic component with dynamic element children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({ value, children }) => {
    childTest.register(children)
    return esx`<div><span>${value}</span>${children}</div>`
  }
  esx.register({ A })
  const App = () => esx`<A value=${'a'}>${createElement('a', null, 'test')}</A>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('dynamic component with component children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({ value, children }) => {
    childTest.register(children)
    return esx`<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx`<a>test</a>`
  esx.register({ A, B })
  const App = () => esx`<A value=${'a'}><B/></A>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('dynamic component with component children nested in static element children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({ value, children }) => {
    childTest.register(children)
    return esx`<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx`<a>test</a>`
  esx.register({ A, B })
  const App = () => esx`<A value=${'a'}><div><B/></div></A>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('dynamic component with multiple static element children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = (props) => {
    childTest.register(props.children)
    return esx`<div><span>${props.value}</span>${props.children}</div>`
  }
  esx.register({ A })
  const App = () => esx`<A value=${'a'}><a>test</a><a>test2</a></A>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('dynamic component with multiple component children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({ value, children }) => {
    childTest.register(children)
    return esx`<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx`<a>test</a>`
  const C = () => esx`<a>test2</a>`
  esx.register({ A, B, C })
  const App = () => esx`<A value=${'a'}><B/><C/></A>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('dynamic component with multiple component children nested in static element children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({ value, children }) => {
    childTest.register(children)
    return esx`<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx`<a>test</a>`
  const C = () => esx`<a>test2</a>`
  esx.register({ A, B, C })
  const App = () => esx`<A value=${'a'}><div><B/><C/></div></A>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('dynamic component with multiple component children nested in multiple static element children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({ value, children }) => {
    childTest.register(children)
    return esx`<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx`<a>test</a>`
  const C = () => esx`<a>test2</a>`
  esx.register({ A, B, C })
  const App = () => esx`<A value=${'a'}><div><B/></div><div><C/></div></A>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('dynamic component with multiple component children peers to multiple static element children at varied nesting depths as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({ value, children }) => {
    childTest.register(children)
    return esx`<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx`<a>test1</a>`
  const C = () => esx`<a>test3</a>`
  esx.register({ A, B, C })
  const App = () => esx`<A value=${'a'}><div>test0</div><B/><a>test2</a><div><C/></div></A>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('child values injected into child elements which are children of components which are injected in as children of elements', async ({ is }) => {
  const esx = init()
  const A = ({ children }) => esx`<a>${children}</a>`
  const B = ({ children }) => esx`<b>${children}</b>`
  const C = ({ children }) => esx`<c>${children}</c>`
  esx.register({ A, B, C })
  const App = ({ text }) => esx`
    <div>
      <A><div>${text}</div></A>
      <B><div>${text}</div></B>
      <C><div>${text}</div></C>
    </div>
  `
  esx.register({ App })
  is(esx.renderToString`<App text='test'/>`, renderToString(createElement(App, { text: 'test' })))
})

test('dynamic component with multiple component children peers to multiple static element children at varied nesting depths as prop with interpolated expression children', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({ value, children }) => {
    childTest.register(children)
    return esx`<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx`<a>test1</a>`
  const C = () => esx`<a>test3</a>`
  esx.register({ A, B, C })
  const App = () => esx`<A value=${'a'}><p><div>${'test0'}</div><B/><a href=${'interpolatedprop'}>${'test2'}</a><div><C/></div></p></A>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test(' interpolated properties after component', async ({ is }) => {
  const esx = init({
    A: () => esx`<a>foo</a>`
  })
  is(
    esx.renderToString`<p><A/><a x=${'a'}>${'b'}</a><div>ok</div></p>`,
    renderToString(esx`<p><A/><a x=${'a'}>${'b'}</a><div>ok</div></p>`)
  )
})

test('multiple component children peers', async ({ is }) => {
  const esx = init()
  const A = () => esx`<a>test1</a>`
  const B = () => esx`<a>test2</a>`
  const C = () => esx`<a>test3</a>`
  esx.register({ A, B, C })
  const App = () => esx`<div><A/><B/><C/></div>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('multiple component and element children peers', async ({ is }) => {
  const esx = init()
  const A = () => esx`<a>test1</a>`
  const B = () => esx`<a>test2</a>`
  const C = () => esx`<a>test3</a>`
  esx.register({ A, B, C })
  const App = () => esx`<div><A/><p></p><B/><a></a><C/></div>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('multiple component and element children peers with one interpolated component prop', async ({ is }) => {
  const esx = init()
  const A = () => esx`<a>test1</a>`
  const B = () => esx`<a>test2</a>`
  const C = () => esx`<a>test3</a>`
  esx.register({ A, B, C })
  const App = () => esx`<div><A x=${'1'}/><p></p><B/><a></a><C/></div>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('multiple component and element children peers with multiple interpolated component props', async ({ is }) => {
  const esx = init()
  const A = () => esx`<a>test1</a>`
  const B = () => esx`<a>test2</a>`
  const C = () => esx`<a>test3</a>`
  esx.register({ A, B, C })
  const App = () => esx`<div><A x=${'1'} y=${'2'}/><p></p><B/><a></a><C/></div>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('multiple component and element children peers with multiple interpolated component props over multiple components', async ({ is }) => {
  const esx = init()
  const A = () => esx`<a>test1</a>`
  const B = () => esx`<a>test2</a>`
  const C = () => esx`<a>test3</a>`
  esx.register({ A, B, C })
  const App = () => esx`<div><A x=${'1'} y=${'2'}/><p></p><B z=${'3'}/><a></a><C/></div>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('multiple component and element children peers with multiple interpolated element and component props over multiple elements and components', async ({ is }) => {
  const esx = init()
  const A = () => esx`<a>test1</a>`
  const B = () => esx`<a>test2</a>`
  const C = () => esx`<a>test3</a>`
  esx.register({ A, B, C })
  const App = () => esx`<div><A x=${'1'} y=${'2'}/><p a=${'a'}></p><B z=${'3'}/><a b=${'b'}></a><C/></div>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('dynamic component with multiple component children peers to multiple static element children containing interpolated values within at varied nesting depths as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({ value, children }) => {
    childTest.register(children)
    return esx`<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx`<a>test1</a>`
  const C = () => esx`<a>test3</a>`
  esx.register({ A, B, C })
  const App = () => esx`<A value=${'a'}><div>${'test0'}</div><B/><x href=${'interpolatedprop'}>${'test2'}</x><div><C/></div></A>`
  esx.register({ App })

  is(esx.renderToString`<App/>`, renderToString(createElement(App)))

  childTest.validate()
})

test('conditional rendering', async ({ is }) => {
  const esx = init()
  const Component = (props) => {
    return props.loaded === true
      ? esx`<div>loaded</div>`
      : esx`<span>loading</span>`
  }
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(esx`<Component/>`))
  is(esx.renderToString`<Component loaded/>`, renderToString(esx`<Component loaded/>`))
})

test('default props.children value should be null', async ({ is }) => {
  const esx = init()
  const Component = (props) => {
    is(props.children, null)
    return esx`<div>hi</div>`
  }
  esx.register({ Component })
  esx.renderToString`<Component/>`
})

test('render props', async ({ is }) => {
  const esx = init()
  const Component = ({ render, value }) => {
    return esx`<div>${render({ value })}</div>`
  }
  const render = ({ value }) => {
    return esx`<p>${value}</p>`
  }
  esx.register({ Component })
  is(
    esx.renderToString`<Component value='test' render=${render}/>`,
    renderToString(createElement(Component, { value: 'test', render }))
  )
})

test('child render props – children as attribute', async ({ is }) => {
  const esx = init()
  const Component = ({ children, value }) => {
    return esx`<div>${children({ value })}</div>`
  }
  const render = ({ value }) => esx`<p>${value}</p>`
  esx.register({ Component })
  is(
    esx.renderToString`<Component value='test' children=${render}/>`,
    renderToString(createElement(Component, { value: 'test', children: render }))
  )
})

test('child render props – children as nested value', async ({ is }) => {
  const esx = init()
  const Component = ({ children, value }) => {
    return esx`<div>${children({ value })}</div>`
  }
  const render = ({ value }) => esx`<p>${value}</p>`
  esx.register({ Component })
  is(
    esx.renderToString`<Component value='test'>${render}</Component>`,
    renderToString(createElement(Component, { value: 'test' }, render))
  )
})

test('componentWillMount', async ({ pass, plan }) => {
  const esx = init()
  plan(1)
  class Component extends React.Component {
    componentWillMount () {
      pass('componentWillMount called')
    }
    render () {
      return esx`<div>test</div>`
    }
  }
  esx.register({ Component })
  esx.renderToString`<Component/>`
})

test('UNSAFE_componentWillMount', async ({ pass, plan }) => {
  const esx = init()
  plan(1)
  class Component extends React.Component {
    UNSAFE_componentWillMount () { // eslint-disable-line
      pass('UNSAFE_componentWillMount called')
    }
    render () {
      return esx`<p></p>`
    }
  }
  esx.register({ Component })
  esx.renderToString`<Component/>`
})

test('React.PureComponent', async ({ is }) => {
  const esx = init()
  class Component extends React.PureComponent {
    render () {
      return esx`<div>test</div>`
    }
  }
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(createElement(Component)))
})

test('key prop', async ({ is }) => {
  const esx = init()
  const Component = () => {
    return esx`<li key="1">1</li>`
  }
  esx.register({ Component })
  is(
    esx.renderToString`<Component/>`,
    renderToString(createElement(Component))
  )
})

test('key interpolated prop', async ({ is }) => {
  const esx = init()
  const Component = () => {
    return esx`<li key=${'1'}>1</li>`
  }
  esx.register({ Component })
  is(
    esx.renderToString`<Component/>`,
    renderToString(createElement(Component))
  )
})

test('dynamic ref prop', async ({ is }) => {
  const esx = init()
  const Component = () => {
    const ref = React.createRef()
    return esx`<div><input ref=${ref}/></div>`
  }
  esx.register({ Component })
  is(
    esx.renderToString`<Component/>`,
    renderToString(createElement(Component))
  )
})

test('dynamic ref prop, followed by another dynamic prop', async ({ is }) => {
  const esx = init()
  const Component = () => {
    const ref = React.createRef()
    return esx`<div><input ref=${ref} name=${'test'}/></div>`
  }
  esx.register({ Component })
  is(
    esx.renderToString`<Component/>`,
    renderToString(createElement(Component))
  )
})

test('dynamic ref prop, followed by a static prop', async ({ is }) => {
  const esx = init()
  const Component = () => {
    const ref = React.createRef()
    return esx`<div><input ref=${ref} name="test"/></div>`
  }
  esx.register({ Component })
  is(
    esx.renderToString`<Component/>`,
    renderToString(createElement(Component))
  )
})

test('ref prop', async ({ is }) => {
  const esx = init()
  const Component = () => {
    return esx`<div><input ref="ref"/></div>`
  }
  esx.register({ Component })
  is(
    esx.renderToString`<Component/>`,
    renderToString(createElement(Component))
  )
})

test('rendering object attribute values', async ({ is }) => {
  const esx = init()
  const Component = () => {
    const obj = {}
    return esx`<div><input obj=${obj}/></div>`
  }
  esx.register({ Component })
  is(
    esx.renderToString`<Component/>`,
    renderToString(createElement(Component))
  )
})

test('rendering object children as empty string', async ({ is }) => {
  const esx = init()
  const Component = () => {
    const obj = {}
    return esx`<div><input obj=${obj}/></div>`
  }
  esx.register({ Component })
  is(
    esx.renderToString`<Component/>`,
    renderToString(createElement(Component))
  )
})

test('createElement interopability', async ({ is }) => {
  const esx = init()
  const A = ({ value, children }) => createElement('p', { value }, children)
  esx.register({ A })
  const Component = () => {
    return esx`<div><A value='test'>hi</A></div>`
  }
  esx.register({ Component })
  is(
    esx.renderToString`<Component/>`,
    renderToString(createElement(Component))
  )
})

test('React.memo interopability', async ({ is }) => {
  const esx = init()
  const Component = React.memo(() => {
    return esx`<div>hi</div>`
  })
  esx.register({ Component })
  is(
    esx.renderToString`<div><Component/></div>`,
    renderToString(createElement('div', null, createElement(Component)))
  )
})

test('React.forwardRef interopability', async ({ is }) => {
  const esx = init()
  const ref = React.createRef()
  const Component = React.forwardRef((props, fRef) => {
    is(fRef, ref)
    return esx`<div ref=${ref}>hi</div>`
  })
  esx.register({ Component })
  is(
    esx.renderToString`<div><Component ref=${ref}/></div>`,
    renderToString(createElement('div', null, createElement(Component, { ref })))
  )
})

test('React.Fragment interopability', async ({ is }) => {
  const esx = init()
  const { Fragment } = React
  const EsxCmp = () => esx`
    <Fragment>
      <head><title>hi</title></head>
      <body>woop</body>
    </Fragment>
  `
  const ReactCmp = () => {
    return createElement(Fragment, null, [
      createElement('head', null, createElement('title', null, 'hi')),
      createElement('body', null, 'woop')
    ])
  }
  esx.register({ EsxCmp, Fragment })
  is(
    esx.renderToString`<div><EsxCmp/></div>`,
    renderToString(createElement('div', null, createElement(ReactCmp)))
  )
})

test('React.Fragment as a special-case does not need to be a registered component', async ({ is }) => {
  const esx = init()
  const EsxCmp = () => esx`
    <Fragment>
      <head><title>hi</title></head>
      <body>woop</body>
    </Fragment>
  `
  const ReactCmp = () => {
    return createElement(React.Fragment, null, [
      createElement('head', null, createElement('title', null, 'hi')),
      createElement('body', null, 'woop')
    ])
  }
  esx.register({ EsxCmp })
  is(
    esx.renderToString`<div><EsxCmp/></div>`,
    renderToString(createElement('div', null, createElement(ReactCmp)))
  )
})

test('React.Fragment shorthand syntax support (<></>)', async ({ is }) => {
  const esx = init()
  const EsxCmp = () => esx`
    <>
      <head><title>hi</title></head>
      <body>woop</body>
    </>
  `
  const ReactCmp = () => {
    return createElement(React.Fragment, null, [
      createElement('head', null, createElement('title', null, 'hi')),
      createElement('body', null, 'woop')
    ])
  }
  esx.register({ EsxCmp })
  is(
    esx.renderToString`<div><EsxCmp/></div>`,
    renderToString(createElement('div', null, createElement(ReactCmp)))
  )
})

test('React.Fragment special-case namespace can be overridden', async ({ is }) => {
  const esx = init()
  const Fragment = ({ children }) => esx`<html>${children}</html>`
  const EsxCmp = () => esx`
    <Fragment>
      <head><title>hi</title></head>
      <body>woop</body>
    </Fragment>
  `
  const ReactCmp = () => {
    return createElement(Fragment, null, [
      createElement('head', null, createElement('title', null, 'hi')),
      createElement('body', null, 'woop')
    ])
  }
  esx.register({ EsxCmp, Fragment })
  is(
    esx.renderToString`<EsxCmp/>`,
    renderToString(createElement(ReactCmp))
  )
})

test('defaultProps', async ({ is }) => {
  const esx = init()
  const Component = ({ a, b }) => {
    return esx`<img a=${a} b=${b}/>`
  }
  Component.defaultProps = { a: 'default-a', b: 'default-b' }
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(esx`<Component/>`))
})

test('defaultProps override', async ({ is }) => {
  const esx = init()
  const Component = ({ a, b }) => {
    return esx`<img a=${a} b=${b}/>`
  }
  Component.defaultProps = { a: 'default-a', b: 'default-b' }
  esx.register({ Component })
  is(esx.renderToString`<Component b='test-b'/>`, renderToString(esx`<Component b='test-b'/>`))
})

test('unexpected token, expression in open element', async ({ throws }) => {
  const esx = init()
  const Component = (props) => {
    return esx`<div${props}></div>`
  }
  esx.register({ Component })
  throws(() => esx.renderToString`<Component/>`, SyntaxError('ESX: Unexpected token in element. Expressions may only be spread, embedded in attributes be included as children.'))
})

test('unexpected token, missing attribute name', async ({ throws }) => {
  const esx = init()
  const Component = (props) => {
    return esx`<div =${props}></div>`
  }
  esx.register({ Component })
  throws(() => esx.renderToString`<Component/>`, SyntaxError('Unexpected token. Attributes must have a name.'))
})

test('unexpected token, missing attribute name', async ({ throws }) => {
  const esx = init()
  const Component = (props) => {
    return esx`<div =${props}></div>`
  }
  esx.register({ Component })
  throws(() => esx.renderToString`<Component/>`, SyntaxError('Unexpected token. Attributes must have a name.'))
})

test('unexpected token, quotes around expression', async ({ throws }) => {
  const esx = init()
  const Component1 = (props) => {
    return esx`<div x="${props.a}"></div>`
  }
  const Component2 = (props) => {
    return esx`<div x="${props.a}"></div>`
  }
  esx.register({ Component1, Component2 })
  throws(() => esx.renderToString`<Component1 a="1"/>`, SyntaxError('Unexpected token. Attribute expressions must not be surrounded in quotes.'))
  throws(() => esx.renderToString`<Component2 a="1"/>`, SyntaxError('Unexpected token. Attribute expressions must not be surrounded in quotes.'))
})

test('unexpected token', async ({ throws }) => {
  const esx = init()
  const Component = (props) => {
    return esx`<div .${props}></div>`
  }
  esx.register({ Component })
  throws(() => esx.renderToString`<Component a=1/>`, SyntaxError('ESX: Unexpected token.'))
})

test('spread props', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img ...${{ a: 1, b: 2 }}/>`,
    renderToString(createElement('img', { a: 1, b: 2 }))
  )
})

test('spread props with proto', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img ...${{ a: 1, __proto__: { b: 2 } }}/>`,
    renderToString(createElement('img', { a: 1, __proto__: { b: 2 } }))
  )
  const Cmp = (props) => {
    return esx`<img ...${props}/>`
  }
  esx.register({ Cmp })
  is(
    esx.renderToString`<Cmp ...${{ a: 1, __proto__: { b: 2 } }}/>`,
    renderToString(createElement(Cmp, { a: 1, __proto__: { b: 2 } }))
  )
})

test('spread props do not overwrite prior static props when no collision', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img x='y' ...${{ a: 1, b: 2 }}/>`,
    renderToString(createElement('img', { x: 'y', a: 1, b: 2 }))
  )
})

test('spread props do not overwrite dynamic static props when no collision', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img x=${'y'} ...${{ a: 1, b: 2 }}/>`,
    renderToString(createElement('img', { x: 'y', a: 1, b: 2 }))
  )
})

test('spread props overwrite prior static props when collision', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img x='y' a='overwrite' ...${{ a: 1, b: 2 }}/>`,
    renderToString(createElement('img', { x: 'y', a: 1, b: 2 }))
  )
})

test('spread props overwrite prior dynamic props when collision', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img x='y' a=${'overwrite'} ...${{ a: 1, b: 2 }}/>`,
    renderToString(createElement('img', { x: 'y', a: 1, b: 2 }))
  )
})

test('spread props preserve prior static props when no collision', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img x='keep' ...${{ a: 1, b: 2 }}/>`,
    renderToString(createElement('img', { x: 'keep', a: 1, b: 2 }))
  )
})

test('spread props preserve prior dynamic props when no collision', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img x=${'keep'} ...${{ a: 1, b: 2 }}/>`,
    renderToString(createElement('img', { x: 'keep', a: 1, b: 2 }))
  )
})

test('spread props overwritten with latter static props', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img ...${{ a: 1, b: 2 }} b='x'/>`,
    renderToString(createElement('img', { a: 1, b: 'x' }))
  )
})

test('spread props overwritten with latter dynamic props', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img ...${{ a: 1, b: 2 }} b=${'x'}/>`,
    renderToString(createElement('img', { a: 1, b: 'x' }))
  )
})

test('spread multiple objects', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img ...${{ a: 1, b: 2 }} ...${{ c: 3, d: 4 }}/>`,
    renderToString(createElement('img', { a: 1, b: 2, c: 3, d: 4 }))
  )
})

test('spread multiple objects, later object properties override', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img ...${{ a: 1, b: 2 }} ...${{ a: 3, b: 4 }}/>`,
    renderToString(createElement('img', { a: 3, b: 4 }))
  )
})

test('spread multiple objects, static props between spreads', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img ...${{ a: 1, b: 2 }} x='y' ...${{ a: 3, b: 4 }}/>`,
    renderToString(createElement('img', { x: 'y', a: 3, b: 4 }))
  )
})

test('spread multiple objects, dynamic props between spreads', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img ...${{ a: 1, b: 2 }} x=${'y'} ...${{ a: 3, b: 4 }}/>`,
    renderToString(createElement('img', { x: 'y', a: 3, b: 4 }))
  )
})

test('spread multiple objects, duplicate dynamic props between spreads overriden by last spread', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img ...${{ a: 1, b: 2 }} a=${7} ...${{ a: 3, b: 4 }}/>`,
    renderToString(createElement('img', { a: 3, b: 4 }))
  )
})

test('spread props and defaultProps', async ({ is }) => {
  const esx = init()
  const Component = (props) => {
    return esx`<img ...${props}/>`
  }
  Component.defaultProps = { a: 'default-a', b: 'default-b' }
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(esx`<Component/>`))
})

test('spread props in nested elements', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<div><div ...${{ className: 'a' }}></div></div>`,
    renderToString(esx`<div><div ...${{ className: 'a' }}></div></div>`)
  )
  is(
    esx.renderToString`<a><div></div><div ...${{ className: 'a' }}></div></a>`,
    renderToString(esx`<a><div></div><div ...${{ className: 'a' }}></div></a>`)
  )
})

test('spread props in nested elements that are siblings after dynamic children', async ({ is }) => {
  const esx = init()
  esx.register({ Cmp: ({ children }) => esx`<div>${children}</div>` })
  is(
    esx.renderToString`<Cmp>${[]}<div ...${{ className: 'a' }}></div></Cmp>`,
    renderToString(esx`<Cmp>${[]}<div ...${{ className: 'a' }}></div></Cmp>`)
  )
  is(
    esx.renderToString`<>${[]}<div ...${{ className: 'a' }}></div></>`,
    renderToString(esx`<>${[]}<div ...${{ className: 'a' }}></div></>`)
  )
  is(
    esx.renderToString`<>${[esx`<a>test</a>`, esx`<a>test2</a>`]}<div ...${{ className: 'a' }}></div></>`,
    renderToString(esx`<>${[esx`<a>test</a>`, esx`<a>test2</a>`]}<div ...${{ className: 'a' }}></div></>`)
  )
})

test('spread props nested in fragment', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<><div ...${{ className: 'a' }}></div></>`,
    renderToString(esx`<><div ...${{ className: 'a' }}></div></>`)
  )
})

test('component spread props', async ({ is, plan }) => {
  const esx = init()
  plan(2)
  const Cmp = ({ a, b }) => {
    is(a, 1)
    is(b, 2)
    return null
  }
  esx.register({ Cmp })
  esx.renderToString`<Cmp ...${{ a: 1, b: 2 }}/>`
})

test('element alias ("string" component) spread props', async ({ is }) => {
  const esx = init()
  esx.register({ Component: 'div' })
  is(
    esx.renderToString`<Component ...${{ a: 1, b: 2 }}>test</Component>`,
    renderToString(createElement('div', { a: 1, b: 2 }, 'test'))
  )
})

test('component spread props do not overwrite prior static props when no collision', async ({ is, plan }) => {
  const esx = init()
  plan(3)
  const Cmp = ({ x, a, b }) => {
    is(x, 'y')
    is(a, 1)
    is(b, 2)
    return null
  }
  esx.register({ Cmp })
  esx.renderToString`<Cmp x='y' ...${{ a: 1, b: 2 }}/>`
})

test('component spread props do not overwrite dynamic static props when no collision', async ({ is, plan }) => {
  const esx = init()
  plan(3)
  const Cmp = ({ x, a, b }) => {
    is(x, 'y')
    is(a, 1)
    is(b, 2)
    return null
  }
  esx.register({ Cmp })
  esx.renderToString`<Cmp x=${'y'} ...${{ a: 1, b: 2 }}/>`
})

test('component spread props overwrite prior static props when collision', async ({ is, plan }) => {
  const esx = init()
  plan(3)
  const Cmp = ({ x, a, b }) => {
    is(x, 'y')
    is(a, 1)
    is(b, 2)
    return null
  }
  esx.register({ Cmp })
  esx.renderToString`<Cmp x='y' a='overwrite' ...${{ a: 1, b: 2 }}/>`
})

test('component spread props overwrite prior dynamic props when collision', async ({ is, plan }) => {
  const esx = init()
  plan(3)
  const Cmp = ({ x, a, b }) => {
    is(x, 'y')
    is(a, 1)
    is(b, 2)
    return null
  }
  esx.register({ Cmp })
  esx.renderToString`<Cmp x='y' a=${'overwrite'} ...${{ a: 1, b: 2 }}/>`
})

test('component spread props preserve prior static props when no collision', async ({ is, plan }) => {
  const esx = init()
  plan(3)
  const Cmp = ({ x, a, b }) => {
    is(x, 'keep')
    is(a, 1)
    is(b, 2)
    return null
  }
  esx.register({ Cmp })
  esx.renderToString`<Cmp x='keep' ...${{ a: 1, b: 2 }}/>`
})

test('component spread props preserve prior dynamic props when no collision', async ({ is, plan }) => {
  const esx = init()
  plan(3)
  const Cmp = ({ x, a, b }) => {
    is(x, 'keep')
    is(a, 1)
    is(b, 2)
    return null
  }
  esx.register({ Cmp })
  esx.renderToString`<Cmp x=${'keep'} ...${{ a: 1, b: 2 }}/>`
})

test('component spread props overwritten with latter static props', async ({ is, plan }) => {
  const esx = init()
  plan(2)
  const Cmp = ({ a, b }) => {
    is(a, 1)
    is(b, 'x')
    return null
  }
  esx.register({ Cmp })
  esx.renderToString`<Cmp ...${{ a: 1, b: 2 }} b='x'/>`
})

test('component spread props overwritten with latter dynamic props', async ({ is, plan }) => {
  const esx = init()
  plan(2)
  const Cmp = ({ a, b }) => {
    is(a, 1)
    is(b, 'x')
    return null
  }
  esx.register({ Cmp })
  esx.renderToString`<Cmp ...${{ a: 1, b: 2 }} b=${'x'}/>`
})

test('component spread multiple objects', async ({ is, plan }) => {
  const esx = init()
  plan(4)
  const Cmp = ({ a, b, c, d }) => {
    is(a, 1)
    is(b, 2)
    is(c, 3)
    is(d, 4)
    return null
  }
  esx.register({ Cmp })
  esx.renderToString`<Cmp ...${{ a: 1, b: 2 }} ...${{ c: 3, d: 4 }}/>`
})

test('component spread multiple objects, later object properties override', async ({ is, plan }) => {
  const esx = init()
  plan(2)
  const Cmp = ({ a, b }) => {
    is(a, 3)
    is(b, 4)
    return null
  }
  esx.register({ Cmp })
  esx.renderToString`<Cmp ...${{ a: 1, b: 2 }} ...${{ a: 3, b: 4 }}/>`
})

test('component spread multiple objects, static props between spreads', async ({ is, plan }) => {
  const esx = init()
  plan(3)
  const Cmp = ({ x, a, b }) => {
    is(x, 'y')
    is(a, 3)
    is(b, 4)
    return null
  }
  esx.register({ Cmp })
  esx.renderToString`<Cmp ...${{ a: 1, b: 2 }} x='y' ...${{ a: 3, b: 4 }}/>`
})

test('component spread multiple objects, dynamic props between spreads', async ({ is, plan }) => {
  const esx = init()
  plan(3)
  const Cmp = ({ x, a, b }) => {
    is(x, 'y')
    is(a, 3)
    is(b, 4)
    return null
  }
  esx.register({ Cmp })
  esx.renderToString`<Cmp ...${{ a: 1, b: 2 }} x=${'y'} ...${{ a: 3, b: 4 }}/>`
})

test('component spread multiple objects, duplicate dynamic props between spreads overriden by last spread', async ({ is, plan }) => {
  const esx = init()
  plan(2)
  const Cmp = ({ a, b }) => {
    is(a, 3)
    is(b, 4)
    return null
  }
  esx.register({ Cmp })
  esx.renderToString`<Cmp ...${{ a: 1, b: 2 }} a=${7} ...${{ a: 3, b: 4 }}/>`
})

test('spread props and defaultProps', async ({ is }) => {
  const esx = init()
  const Component = (props) => {
    return esx`<img ...${props}/>`
  }
  Component.defaultProps = { a: 'default-a', b: 'default-b' }
  esx.register({ Component })
  is(esx.renderToString`<Component/>`, renderToString(esx`<Component/>`))
})

test('spread props with children prop', async ({ is }) => {
  const esx = init()
  const Component = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Component })
  const o = { children: 'test' }
  const o2 = { children: 'test2' }
  is(esx.renderToString`<Component ...${o}/>`, renderToString(esx`<Component  ...${o}/>`))
  is(esx.renderToString`<Component ...${o} ...${o2}/>`, renderToString(esx`<Component  ...${o} ...${o2}/>`))
})

test('self closing void elements do not render with closing tag', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<area/>`, renderToString(esx`<area/>`))
  is(esx.renderToString`<base/>`, renderToString(esx`<base/>`))
  is(esx.renderToString`<br/>`, renderToString(esx`<br/>`))
  is(esx.renderToString`<col/>`, renderToString(esx`<col/>`))
  is(esx.renderToString`<embed/>`, renderToString(esx`<embed/>`))
  is(esx.renderToString`<hr/>`, renderToString(esx`<hr/>`))
  is(esx.renderToString`<img/>`, renderToString(esx`<img/>`))
  is(esx.renderToString`<input/>`, renderToString(esx`<input/>`))
  is(esx.renderToString`<link/>`, renderToString(esx`<link/>`))
  is(esx.renderToString`<meta/>`, renderToString(esx`<meta/>`))
  is(esx.renderToString`<param/>`, renderToString(esx`<param/>`))
  is(esx.renderToString`<source/>`, renderToString(esx`<source/>`))
  is(esx.renderToString`<track/>`, renderToString(esx`<track/>`))
  is(esx.renderToString`<wbr/>`, renderToString(esx`<wbr/>`))
  is(esx.renderToString`<img a="1"/>`, renderToString(esx`<img a="1"/>`))
  is(esx.renderToString`<img a=${'1'}/>`, renderToString(esx`<img a=${'1'}/>`))
  is(esx.renderToString`<img ...${{ a: 1 }}/>`, renderToString(esx`<img ...${{ a: 1 }}/>`))
  is(
    esx.renderToString`<img ...${{ a: 1 }} ...${{ a: 3 }}/>`,
    renderToString(esx`<img ...${{ a: 1 }} ...${{ a: 3 }}/>`)
  )
})

test('unclosed void elements render as self closing', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<area>`, renderToString(esx`<area>`))
  is(esx.renderToString`<base>`, renderToString(esx`<base>`))
  is(esx.renderToString`<br>`, renderToString(esx`<br>`))
  is(esx.renderToString`<col>`, renderToString(esx`<col>`))
  is(esx.renderToString`<embed>`, renderToString(esx`<embed>`))
  is(esx.renderToString`<hr>`, renderToString(esx`<hr>`))
  is(esx.renderToString`<img>`, renderToString(esx`<img>`))
  is(esx.renderToString`<input>`, renderToString(esx`<input>`))
  is(esx.renderToString`<link>`, renderToString(esx`<link>`))
  is(esx.renderToString`<meta>`, renderToString(esx`<meta>`))
  is(esx.renderToString`<param>`, renderToString(esx`<param>`))
  is(esx.renderToString`<source>`, renderToString(esx`<source>`))
  is(esx.renderToString`<track>`, renderToString(esx`<track>`))
  is(esx.renderToString`<wbr>`, renderToString(esx`<wbr>`))
})
test('void elements with a closing tag render as self closing, without the closing tag', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<area></area>`, renderToString(esx`<area></area>`))
  is(esx.renderToString`<base></base>`, renderToString(esx`<base></base>`))
  is(esx.renderToString`<br></br>`, renderToString(esx`<br></br>`))
  is(esx.renderToString`<col></col>`, renderToString(esx`<col></col>`))
  is(esx.renderToString`<embed></embed>`, renderToString(esx`<embed></embed>`))
  is(esx.renderToString`<hr></hr>`, renderToString(esx`<hr></hr>`))
  is(esx.renderToString`<img></img>`, renderToString(esx`<img></img>`))
  is(esx.renderToString`<input></input>`, renderToString(esx`<input></input>`))
  is(esx.renderToString`<link></link>`, renderToString(esx`<link></link>`))
  is(esx.renderToString`<meta></meta>`, renderToString(esx`<meta></meta>`))
  is(esx.renderToString`<param></param>`, renderToString(esx`<param></param>`))
  is(esx.renderToString`<source></source>`, renderToString(esx`<source></source>`))
  is(esx.renderToString`<track></track>`, renderToString(esx`<track></track>`))
  is(esx.renderToString`<wbr></wbr>`, renderToString(esx`<wbr></wbr>`))
})

test('self closing normal elements render with closing tag', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div/>`, renderToString(esx`<div/>`))
  is(esx.renderToString`<div><div/><p>hi</p></div>`,
    renderToString(createElement(
      'div',
      null,
      createElement('div', null),
      createElement('p', null, 'hi')
    )
    )
  )
})

test('className', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<img className='x'>`, renderToString(esx`<img className='x'>`))
  is(esx.renderToString`<img className=${'x'}>`, renderToString(esx`<img className=${'x'}>`))
})

test('className in spread props', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<img ...${{ className: 'x' }}>`, renderToString(esx`<img ...${{ className: 'x' }}/>`))
})

test('htmlFor', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<label htmlFor='x'></label>`, renderToString(esx`<label htmlFor='x'></label>`))
  is(esx.renderToString`<label htmlFor=${'x'}></label>`, renderToString(esx`<label htmlFor=${'x'}></label>`))
})

test('htmlFor in spread props', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<label ...${{ htmlFor: 'x' }}></label>`, renderToString(esx`<label ...${{ htmlFor: 'x' }}></label>`))
})

test('httpEquiv', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<meta httpEquiv='content-type'>`, renderToString(esx`<meta httpEquiv='content-type'>`))
  is(esx.renderToString`<meta httpEquiv=${'content-type'}>`, renderToString(esx`<meta httpEquiv=${'content-type'}>`))
})

test('httpEquiv in spread props', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<meta ...${{ httpEquiv: 'content-type' }}>`, renderToString(esx`<meta ...${{ httpEquiv: 'content-type' }}>`))
})

test('acceptCharset', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<form acceptCharset='ISO-8859-1'></form>`, renderToString(esx`<form acceptCharset='ISO-8859-1'></form>`))
  is(esx.renderToString`<form acceptCharset=${'ISO-8859-1'}></form>`, renderToString(esx`<form acceptCharset=${'ISO-8859-1'}></form>`))
})

test('acceptCharset in spread props', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<form ...${{ acceptCharset: 'ISO-8859-1' }}></form>`, renderToString(esx`<form ...${{ acceptCharset: 'ISO-8859-1' }}></form>`))
})

test('innerHTML', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<form innerHTML='<p></p>'></form>`, renderToString(esx`<form innerHTML='<p></p>'></form>`))
  is(esx.renderToString`<form innerHTML=${'<p></p>'}></form>`, renderToString(esx`<form innerHTML=${'<p></p>'}></form>`))
})

test('innerHTML in spread props', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<form ...${{ innerHTML: '<p></p>' }}></form>`, renderToString(esx`<form ...${{ innerHTML: '<p></p>' }}></form>`))
})

test('children attribute on element', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<form children></form>`, renderToString(esx`<form children></form>`))
  is(esx.renderToString`<form children='test'></form>`, renderToString(esx`<form children='test'></form>`))
  is(esx.renderToString`<form children='<p></p>'></form>`, renderToString(esx`<form children='<p></p>'></form>`))
  is(esx.renderToString`<form children=${'test'}></form>`, renderToString(esx`<form children=${'test'}></form>`))
  is(esx.renderToString`<form children=${'<p></p>'}></form>`, renderToString(esx`<form children=${'<p></p>'}></form>`))
  is(esx.renderToString`<form children=${esx`<p></p>`}></form>`, renderToString(esx`<form children=${esx`<p></p>`}></form>`))
  is(esx.renderToString`<form children/>`, renderToString(esx`<form children/>`))
  is(esx.renderToString`<form children='test'/>`, renderToString(esx`<form children='test'/>`))
  is(esx.renderToString`<form children='<p></p>'/>`, renderToString(esx`<form children='<p></p>'/>`))
  is(esx.renderToString`<form children=${'test'}/>`, renderToString(esx`<form children=${'test'}/>`))
  is(esx.renderToString`<form children=${'<p></p>'}/>`, renderToString(esx`<form children=${'<p></p>'}/>`))
  is(esx.renderToString`<form children=${esx`<p></p>`}/>`, renderToString(esx`<form children=${esx`<p></p>`}/>`))
})

test('children attribute on element that has children is ignored', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<form children='test'>child</form>`, renderToString(esx`<form children='test'>child</form>`))
  is(esx.renderToString`<form children=${'test'}>child</form>`, renderToString(esx`<form children=${'test'}>child</form>`))
})

test('children in spread props on element', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<form ...${{ children: 'test' }}></form>`, renderToString(esx`<form ...${{ children: 'test' }}></form>`))
  is(esx.renderToString`<form ...${{ children: '<p></p>' }}></form>`, renderToString(esx`<form ...${{ children: '<p></p>' }}></form>`))
  is(esx.renderToString`<form ...${{ children: esx`<p></p>` }}></form>`, renderToString(esx`<form ...${{ children: esx`<p></p>` }}></form>`))
  is(esx.renderToString`<form ...${{ children: 'test' }} ...${{ children: 'test2' }}></form>`, renderToString(esx`<form ...${{ children: 'test' }} ...${{ children: 'test2' }}></form>`))
  is(esx.renderToString`<form children='test' ...${{ children: 'test2' }}></form>`, renderToString(esx`<form children='test' ...${{ children: 'test2' }}></form>`))
  is(esx.renderToString`<form ...${{ children: 'test2' }} children='test'></form>`, renderToString(esx`<form ...${{ children: 'test2' }} children='test'></form>`))
  is(esx.renderToString`<form ...${{ children: 'test' }}/>`, renderToString(esx`<form ...${{ children: 'test' }}></form>`))
  is(esx.renderToString`<form ...${{ children: 'test' }}/>`, renderToString(esx`<form ...${{ children: 'test' }}/>`))
  is(esx.renderToString`<form ...${{ children: '<p></p>' }}/>`, renderToString(esx`<form ...${{ children: '<p></p>' }}/>`))
  is(esx.renderToString`<form ...${{ children: esx`<p></p>` }}/>`, renderToString(esx`<form ...${{ children: esx`<p></p>` }}/>`))
  is(esx.renderToString`<form ...${{ children: 'test' }} ...${{ children: 'test2' }}/>`, renderToString(esx`<form ...${{ children: 'test' }} ...${{ children: 'test2' }}/>`))
  is(esx.renderToString`<form children='test' ...${{ children: 'test2' }}/>`, renderToString(esx`<form children='test' ...${{ children: 'test2' }}/>`))
  is(esx.renderToString`<form ...${{ children: 'test2' }} children='test'/>`, renderToString(esx`<form ...${{ children: 'test2' }} children='test'/>`))
})

test('children in spread props on element that has children is ignored', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<form ...${{ children: 'test' }}>child</form>`, renderToString(esx`<form ...${{ children: 'test' }}>child</form>`))
  is(esx.renderToString`<form ...${{ children: '<p></p>' }}>child</form>`, renderToString(esx`<form ...${{ children: '<p></p>' }}>child</form>`))
  is(esx.renderToString`<form ...${{ children: esx`<p></p>` }}>child</form>`, renderToString(esx`<form ...${{ children: esx`<p></p>` }}>child</form>`))
  is(esx.renderToString`<form ...${{ children: 'test' }} ...${{ children: 'test2' }}>child</form>`, renderToString(esx`<form ...${{ children: 'test' }} ...${{ children: 'test2' }}>child</form>`))
})

test('spread props with children, then re-rendered with spread props without children on element', async ({ is }) => {
  const esx = init()
  const rdr = (props) => esx.renderToString`<form ...${props}></form>`
  is(rdr({ children: 'test' }), renderToString(esx`<form ...${{ children: 'test' }}></form>`))
  is(rdr({}), renderToString(esx`<form></form>`))
  is(rdr({ children: 'test' }), renderToString(esx`<form ...${{ children: 'test' }}></form>`))
})

test('defaultChecked', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<input defaultChecked>`, renderToString(esx`<input defaultChecked>`))
  is(esx.renderToString`<input defaultChecked=${true}>`, renderToString(esx`<input defaultChecked=${true}>`))
  is(esx.renderToString`<input defaultChecked=${false}>`, renderToString(esx`<input defaultChecked=${false}>`))
  // deviation: react re-orders attributes (checked comes after foo), esx preserves attribute order
  is(esx.renderToString`<input defaultChecked foo="1">`, '<input checked="" foo="1" data-reactroot=""/>')
})

test('defaultChecked in spread props', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<input ...${{ defaultChecked: true }}>`, renderToString(esx`<input ...${{ defaultChecked: true }}>`))
  is(esx.renderToString`<input ...${{ defaultChecked: false }}>`, renderToString(esx`<input ...${{ defaultChecked: false }}>`))
})

test('defaultValue on input element', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<input defaultValue="1"/>`, renderToString(esx`<input defaultValue="1"/>`))
  is(esx.renderToString`<input defaultValue="1"></input>`, renderToString(esx`<input defaultValue="1"></input>`))
  is(esx.renderToString`<input defaultValue=${'1'}/>`, renderToString(esx`<input defaultValue=${'1'}/>`))
  is(esx.renderToString`<input defaultValue=${'1'}></input>`, renderToString(esx`<input defaultValue=${'1'}></input>`))
})

test('defaultValue on textarea element', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<textarea defaultValue="1"/>`, renderToString(esx`<textarea defaultValue="1"/>`))
  is(esx.renderToString`<textarea defaultValue="1"></textarea>`, renderToString(esx`<textarea defaultValue="1"></textarea>`))
  is(esx.renderToString`<textarea defaultValue=${'1'}></textarea>`, renderToString(esx`<textarea defaultValue=${'1'}></textarea>`))
  is(esx.renderToString`<textarea defaultValue=${'1'}/>`, renderToString(esx`<textarea defaultValue=${'1'}/>`))
})

test('defaultValue on select element', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<select defaultValue="1"><option value="1"></option><option value="2"></option></select>`,
    renderToString(esx`<select defaultValue="1"><option value="1"></option><option value="2"></option></select>`)
  )
  is(
    esx.renderToString`<select defaultValue="b"><option>a</option><option>b</option></select>`,
    renderToString(esx`<select defaultValue="b"><option>a</option><option>b</option></select>`)
  )
  is(
    esx.renderToString`<select defaultValue="1"><optgroup><option value="1"></option><option value="2"></option></optgroup></select>`,
    renderToString(esx`<select defaultValue="1"><optgroup><option value="1"></option><option value="2"></option></optgroup></select>`)
  )
  is(
    esx.renderToString`<select defaultValue=${'b'}><option>a</option><option>b</option></select>`,
    renderToString(esx`<select defaultValue=${'b'}><option>a</option><option>b</option></select>`)
  )
  is(
    esx.renderToString`<select defaultValue=${'b'}><option>a</option><option value="b">foo</option></select>`,
    renderToString(esx`<select defaultValue=${'b'}><option>a</option><option value="b">foo</option></select>`)
  )
  is(
    esx.renderToString`<select defaultValue="b"><option value="a"></option><option value=${'b'}></option></select>`,
    renderToString(esx`<select defaultValue="b"><option value="a"></option><option value=${'b'}></option></select>`)
  )
  is(
    esx.renderToString`<select defaultValue="b"><option value="a"></option><option>${'b'}</option></select>`,
    renderToString(esx`<select defaultValue="b"><option value="a"></option><option>${'b'}</option></select>`)
  )
  is(
    esx.renderToString`<select defaultValue="b c"><option value="a"></option><option>${'b'} c</option></select>`,
    renderToString(esx`<select defaultValue="b c"><option value="a"></option><option>${'b'} c</option></select>`)
  )
  is(
    esx.renderToString`<select defaultValue=${'b'}><option value="a"></option><option>${'b'}</option></select>`,
    renderToString(esx`<select defaultValue=${'b'}><option value="a"></option><option>${'b'}</option></select>`)
  )
  is(
    esx.renderToString`<select defaultValue=${'b'}><option value="b"></option><option>${'b'}</option></select>`,
    renderToString(esx`<select defaultValue=${'b'}><option value="b"></option><option>${'b'}</option></select>`)
  )
})

test('selected attribute on option element with/without defaultValue on parent select', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<select defaultValue="1"><option value="1"></option><option selected value="2"></option></select>`,
    renderToString(esx`<select defaultValue="1"><option value="1"></option><option selected value="2"></option></select>`)
  )
  is(
    esx.renderToString`<select><option value="1"></option><option selected value="2"></option></select>`,
    renderToString(esx`<select><option value="1"></option><option selected value="2"></option></select>`)
  )
  is(
    esx.renderToString`<select ...${{ defaultValue: '1' }}><option value="1"></option><option selected value="2"></option></select>`,
    renderToString(esx`<select ...${{ defaultValue: '1' }}><option value="1"></option><option selected value="2"></option></select>`)
  )
  is(
    esx.renderToString`<select defaultValue="1"><option value="1"></option><option selected=${false} value="2"></option></select>`,
    renderToString(esx`<select defaultValue="1"><option value="1"></option><option selected=${false} value="2"></option></select>`)
  )
  is(
    esx.renderToString`<select defaultValue="1"><option value="1"></option><option selected=${true} value="2"></option></select>`,
    renderToString(esx`<select defaultValue="1"><option value="1"></option><option selected=${true} value="2"></option></select>`)
  )
  is(
    esx.renderToString`<select><option value="1"></option><option foo=${'x'} selected=${true} value="2"></option></select>`,
    renderToString(esx`<select><option value="1"></option><option foo=${'x'} selected=${true} value="2"></option></select>`)
  )
  is(
    esx.renderToString`<select defaultValue="1"><option value="1"></option><option selected=${false} value="2"></option></select>`,
    renderToString(esx`<select defaultValue="1"><option value="1"></option><option selected=${false} value="2"></option></select>`)
  )
  is(
    esx.renderToString`<select><option value="1"></option><option selected=${true} value="2"></option></select>`,
    renderToString(esx`<select><option value="1"></option><option selected=${true} value="2"></option></select>`)
  )
  is(
    esx.renderToString`<select><option value="1"></option><option selected=${false} value="2"></option></select>`,
    renderToString(esx`<select><option value="1"></option><option selected=${false} value="2"></option></select>`)
  )
  is(
    esx.renderToString`<select defaultValue=${'1'}><option value="1"></option><option selected=${true} value="2"></option></select>`,
    renderToString(esx`<select defaultValue=${'1'}><option value="1"></option><option selected=${true} value="2"></option></select>`)
  )
  is(
    esx.renderToString`<select defaultValue=${'2'}><option value="1"></option><option selected=${false} value="2"></option></select>`,
    renderToString(esx`<select defaultValue=${'2'}><option value="1"></option><option selected=${false} value="2"></option></select>`)
  )
})

test('defaultValue on multi select element', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<select multiple defaultValue=${['a', 'b']}><option value="a"></option><option>${'b'}</option></select>`,
    renderToString(esx`<select multiple defaultValue=${['a', 'b']}><option value="a"></option><option>${'b'}</option></select>`)
  )
  is(
    esx.renderToString`<select defaultValue=${['a', 'b']}><option value="a"></option><option>${'b'}</option></select>`,
    renderToString(esx`<select defaultValue=${['a', 'b']}><option value="a"></option><option>${'b'}</option></select>`)
  )
  is(
    esx.renderToString`<select multiple defaultValue=${['a', 'b']}><option value="a"></option><option value="b"></option><option value="c"></option></select>`,
    renderToString(esx`<select multiple defaultValue=${['a', 'b']}><option value="a"></option><option value="b"></option><option value="c"></option></select>`)
  )
})

test('defaultValue on non-supporting element', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div defaultValue="1"/>`, renderToString(esx`<div defaultValue="1"/>`))
  is(esx.renderToString`<div defaultValue=${'1'}/>`, renderToString(esx`<div defaultValue=${'1'}/>`))
})

test('defaultValue in spread props on input element', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<input ...${{ defaultValue: '1' }}/>`, renderToString(esx`<input ...${{ defaultValue: '1' }}/>`))
  is(esx.renderToString`<input ...${{ defaultValue: '1' }}></input>`, renderToString(esx`<input ...${{ defaultValue: '1' }}></input>`))
  is(esx.renderToString`<input ...${{ defaultValue: '1' }}>`, renderToString(esx`<input ...${{ defaultValue: '1' }}>`))
})

test('defaultValue in spread props on textarea element', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<textarea ...${{ defaultValue: '1' }}/>`, renderToString(esx`<textarea ...${{ defaultValue: '1' }}/>`))
  is(esx.renderToString`<textarea ...${{ defaultValue: '1' }}></textarea>`, renderToString(esx`<textarea ...${{ defaultValue: '1' }}></textarea>`))
})

test('defaultValue in spread props on select element', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<select ...${{ defaultValue: 'b' }}><option value="a"></option><option>${'b'}</option></select>`,
    renderToString(esx`<select ...${{ defaultValue: 'b' }}><option value="a"></option><option>${'b'}</option></select>`)
  )
})

test('defaultValue in spread props on non-supporting element', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div ...${{ defaultValue: '1' }}/>`, renderToString(esx`<div ...${{ defaultValue: '1' }}/>`))
})

test('defaultValue between spread props on non-supporting element', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div ...${{ some: 'attr' }} defaultValue="1" ...${{ some: 'attr' }}/>`, renderToString(esx`<div ...${{ some: 'attr' }} defaultValue="1" ...${{ some: 'attr' }}/>`))
})

test('suppressContentEditableWarning', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div suppressContentEditableWarning=""></div>`, renderToString(esx`<div suppressContentEditableWarning=""></div>`))
  is(esx.renderToString`<div suppressContentEditableWarning=${true}></div>`, renderToString(esx`<div suppressContentEditableWarning=${true}></div>`))
})

test('suppressContentEditableWarning in spread props', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div ...${{ suppressContentEditableWarning: true }}></div>`, renderToString(esx`<div ...${{ suppressContentEditableWarning: true }}></div>`))
})

test('suppressHydrationWarning', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div suppressHydrationWarning=""></div>`, renderToString(esx`<div suppressHydrationWarning=""></div>`))
  is(esx.renderToString`<div suppressHydrationWarning=${true}></div>`, renderToString(esx`<div suppressHydrationWarning=${true}></div>`))
})

test('suppressHydrationWarning in spread props', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div ...${{ suppressHydrationWarning: true }}></div>`, renderToString(esx`<div ...${{ suppressHydrationWarning: true }}></div>`))
})

test('style', async ({ is }) => {
  const esx = init()
  const style = { color: 'red', display: '-ms-grid', '-o-transition': 'all .25s', userSelect: 'none' }
  is(esx.renderToString`<div style=${style}></div>`, renderToString(esx`<div style=${style}></div>`))
  is(esx.renderToString`<div style=${null}></div>`, renderToString(esx`<div style=${null}></div>`))
})

test('style in spread prop', async ({ is }) => {
  const esx = init()
  const style = { color: 'red', display: '-ms-grid', '-o-transition': 'all .25s', userSelect: 'none' }
  is(esx.renderToString`<div ...${{ style }}></div>`, renderToString(esx`<div ...${{ style }}></div>`))
  is(esx.renderToString`<div ...${{ style: null }}></div>`, renderToString(esx`<div ...${{ style: null }}></div>`))
})

test('style throws error when not an object', async ({ throws }) => {
  const esx = init()
  throws(() => esx.renderToString`<div style='color:red'></div>`, TypeError('The `style` prop expects a mapping from style properties to values, not a string.'))
  throws(() => esx.renderToString`<div style=${'color:red'}></div>`, TypeError('The `style` prop expects a mapping from style properties to values, not a string.'))
})

test('dangerouslySetInnerHTML', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`
      <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}></div>
    `, renderToString(esx`
      <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}></div>
    `)
  )
  is(
    esx.renderToString`
      <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }} another='prop'></div>
    `, renderToString(esx`
      <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }} another='prop'></div>
    `)
  )
  is(
    esx.renderToString`
      <div another='prop' dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}></div>
    `, renderToString(esx`
      <div another='prop' dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}></div>
    `)
  )
  is(
    esx.renderToString`
      <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }} another=${'prop'}></div>
    `, renderToString(esx`
      <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }} another=${'prop'}></div>
    `)
  )
  is(
    esx.renderToString`
      <div another=${'prop'} dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}></div>
    `, renderToString(esx`
      <div another=${'prop'} dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}></div>
    `)
  )
  is(
    esx.renderToString`
      <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}/>
    `, renderToString(esx`
      <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}/>
    `)
  )
  is(
    esx.renderToString`
      <div><div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}/><p>hi</p></div>
    `, renderToString(esx`
      <div><div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}/><p>hi</p></div>
    `)
  )
})

test('dangerouslySetInnerHTML', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`
      <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}></div>
    `, renderToString(esx`
      <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}></div>
    `)
  )
  is(
    esx.renderToString`
      <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }} another='prop'></div>
    `, renderToString(esx`
      <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }} another='prop'></div>
    `)
  )
  is(
    esx.renderToString`
      <div another='prop' dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}></div>
    `, renderToString(esx`
      <div another='prop' dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}></div>
    `)
  )
  is(
    esx.renderToString`
      <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }} another=${'prop'}></div>
    `, renderToString(esx`
      <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }} another=${'prop'}></div>
    `)
  )
})

test('dangerouslySetInnerHTML in spread props', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`
      <div ...${{ dangerouslySetInnerHTML: { __html: '<p>test</p>' } }}></div>
    `, renderToString(esx`
      <div ...${{ dangerouslySetInnerHTML: { __html: '<p>test</p>' } }}></div>
    `)
  )
})

test('dangerouslySetInnerHTML and children in spread props throws', async ({ throws }) => {
  const esx = init()
  throws(() => esx.renderToString`
    <div ...${{ children: 'test', dangerouslySetInnerHTML: { __html: '<p>test</p>' } }}></div>
  `, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx.renderToString`
    <div ...${{ dangerouslySetInnerHTML: { __html: '<p>test</p>' }, children: 'test' }}></div>
  `, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx.renderToString`
    <div ...${{ children: 'test' }} ...${{ dangerouslySetInnerHTML: { __html: '<p>test</p>' } }}></div>
  `, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx.renderToString`
    <div ...${{ dangerouslySetInnerHTML: { __html: '<p>test</p>' } }} ...${{ children: 'test' }}></div>
  `, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx.renderToString`
    <div children='test' ...${{ dangerouslySetInnerHTML: { __html: '<p>test</p>' } }}></div>
  `, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx.renderToString`
    <div ...${{ dangerouslySetInnerHTML: { __html: '<p>test</p>' } }} children='test'></div>
  `, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx.renderToString`
    <div ...${{ children: 'test' }} dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }}></div>
  `, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx.renderToString`
    <div dangerouslySetInnerHTML=${{ __html: '<p>test</p>' }} ...${{ children: 'test' }}></div>
  `, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
})

test('attribute names not recognized as boolean attribute names but presented as implicit boolean attributes are not rendered', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<input x/>`, renderToString(esx`<input x/>`))
  is(esx.renderToString`<input x>`, renderToString(esx`<input x>`))
  is(esx.renderToString`<input x foo="1"/>`, renderToString(esx`<input x foo="1"/>`))
})

test('attribute names recognized as booleans presented as implicit boolean attributes are rendered with empty string value', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<input checked/>`, renderToString(esx`<input checked/>`))
  is(esx.renderToString`<input checked>`, renderToString(esx`<input checked>`))
  is(esx.renderToString`<input checked foo="1"/>`, renderToString(esx`<input checked foo="1"/>`))
})

test('attribute names recognized as "booleanish-strings" presented as implicit boolean attributes are rendered with string value of coerced true boolean ("true")', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div contentEditable/>`, renderToString(esx`<div contentEditable/>`))
  is(esx.renderToString`<div contentEditable></div>`, renderToString(esx`<div contentEditable></div>`))
  is(esx.renderToString`<div contentEditable foo="1"/>`, renderToString(esx`<div contentEditable foo="1"/>`))
})

test('attribute names recognized as string types are not rendered when the static value is an empty string', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div id=""/>`, renderToString(esx`<div id=""/>`))
  is(esx.renderToString`<div id=""></div>`, renderToString(esx`<div id=""></div>`))
  is(esx.renderToString`<div id="" foo="1"/>`, renderToString(esx`<div id="" foo="1"/>`))
})

test('attribute names recognized as string types are rendered when the dynamic value is an empty string', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div id=${''}/>`, renderToString(esx`<div id=${''}/>`))
  is(esx.renderToString`<div id=${''}></div>`, renderToString(esx`<div id=${''}></div>`))
  is(esx.renderToString`<div id=${''} foo="1"/>`, renderToString(esx`<div id=${''} foo="1"/>`))
})

test('boolean attributes with string values are rendered with empty strings', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<input readOnly="a string"/>`, renderToString(esx`<input readOnly="a string"/>`))
  is(esx.renderToString`<input readOnly="a string"></input>`, renderToString(esx`<input readOnly="a string"></input>`))
  is(esx.renderToString`<input readOnly="a string" foo="1"/>`, renderToString(esx`<input readOnly="a string" foo="1"/>`))
  is(esx.renderToString`<input readOnly=${'a string'}/>`, renderToString(esx`<input readOnly=${'a string'}/>`))
  is(esx.renderToString`<input readOnly=${'a string'}></input>`, renderToString(esx`<input readOnly=${'a string'}></input>`))
  is(esx.renderToString`<input readOnly=${'a string'} foo="1"/>`, renderToString(esx`<input readOnly=${'a string'} foo="1"/>`))
  is(esx.renderToString`<input ...${{ readOnly: 'a string' }}/>`, renderToString(esx`<input ...${{ readOnly: 'a string' }}/>`))
})

test('booleanish-string attributes dynamic boolean values are coerced to strings', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div draggable=${true}/>`, renderToString(esx`<div draggable=${true}/>`))
  is(esx.renderToString`<div draggable=${true}></div>`, renderToString(esx`<div draggable=${true}></div>`))
  is(esx.renderToString`<div draggable=${true} foo="1"/>`, renderToString(esx`<div draggable=${true} foo="1"/>`))
  is(esx.renderToString`<div draggable=${false}/>`, renderToString(esx`<div draggable=${false}/>`))
  is(esx.renderToString`<div draggable=${false}></div>`, renderToString(esx`<div draggable=${false}></div>`))
  is(esx.renderToString`<div draggable=${false} foo="1"/>`, renderToString(esx`<div draggable=${false} foo="1"/>`))
  is(esx.renderToString`<div ...${{ draggable: false }}></div>`, renderToString(esx`<div ...${{ draggable: false }}></div>`))
  is(esx.renderToString`<div ...${{ draggable: true }}></div>`, renderToString(esx`<div ...${{ draggable: true }}></div>`))
})

test('string attributes with dynamic boolean values are not rendered', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div id=${true}/>`, renderToString(esx`<div id=${true}/>`))
  is(esx.renderToString`<div id=${true}></div>`, renderToString(esx`<div id=${true}></div>`))
  is(esx.renderToString`<div id=${true} foo="1"/>`, renderToString(esx`<div id=${true} foo="1"/>`))
  is(esx.renderToString`<div id=${false}/>`, renderToString(esx`<div id=${false}/>`))
  is(esx.renderToString`<div id=${false}></div>`, renderToString(esx`<div id=${false}></div>`))
  is(esx.renderToString`<div id=${false} foo="1"/>`, renderToString(esx`<div id=${false} foo="1"/>`))
  is(esx.renderToString`<div ...${{ id: true }}/>`, renderToString(esx`<div ...${{ id: true }}/>`))
  is(esx.renderToString`<div ...${{ id: false }}/>`, renderToString(esx`<div ...${{ id: false }}/>`))
})

test('overloaded boolean attributes', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div capture=${true}/>`, renderToString(esx`<div capture=${true}/>`))
  is(esx.renderToString`<div capture/>`, renderToString(esx`<div capture/>`))
  is(esx.renderToString`<div capture=""/>`, renderToString(esx`<div capture=""/>`))
  is(esx.renderToString`<div capture=${false}/>`, renderToString(esx`<div capture=${false}/>`))
  is(esx.renderToString`<div capture="string"/>`, renderToString(esx`<div capture="string"/>`))
})

test('undefined attribute value', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<div id=${undefined}/>`, renderToString(createElement('div', { id: undefined })))
  is(esx.renderToString`<div capture=${undefined}/>`, renderToString(createElement('div', { capture: undefined })))
  is(esx.renderToString`<div readOnly=${undefined}/>`, renderToString(createElement('div', { readOnly: undefined })))
})

test('symbol attribute value', async ({ is }) => {
  const esx = init()
  const sym = Symbol('x')
  is(esx.renderToString`<div id=${sym}/>`, renderToString(createElement('div', { id: sym })))
  is(esx.renderToString`<div capture=${sym}/>`, renderToString(createElement('div', { capture: sym })))
  is(esx.renderToString`<div readOnly=${sym}/>`, renderToString(createElement('div', { readOnly: sym })))
})

test('function attribute value', async ({ is }) => {
  const esx = init()
  const fn = () => {}
  is(esx.renderToString`<div id=${fn}/>`, renderToString(createElement('div', { id: fn })))
  is(esx.renderToString`<div capture=${fn}/>`, renderToString(createElement('div', { capture: fn })))
  is(esx.renderToString`<div readOnly=${fn}/>`, renderToString(createElement('div', { readOnly: fn })))
})

test('known camel case attributes are converted to special case equivalents (or not) as neccessary', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<x acceptCharset="1"/>`, renderToString(esx`<x acceptCharset="1"/>`))
  is(esx.renderToString`<x accessKey="1"/>`, renderToString(esx`<x accessKey="1"/>`))
  is(esx.renderToString`<x autoCapitalize="1"/>`, renderToString(esx`<x autoCapitalize="1"/>`))
  is(esx.renderToString`<x autoComplete="1"/>`, renderToString(esx`<x autoComplete="1"/>`))
  is(esx.renderToString`<x autoCorrect="1"/>`, renderToString(esx`<x autoCorrect="1"/>`))
  is(esx.renderToString`<x autoFocus/>`, renderToString(esx`<x autoFocus/>`))
  is(esx.renderToString`<x autoPlay/>`, renderToString(esx`<x autoPlay/>`))
  is(esx.renderToString`<x autoSave="1"/>`, renderToString(esx`<x autoSave="1"/>`))
  is(esx.renderToString`<x cellPadding="1"/>`, renderToString(esx`<x cellPadding="1"/>`))
  is(esx.renderToString`<x cellSpacing="1"/>`, renderToString(esx`<x cellSpacing="1"/>`))
  is(esx.renderToString`<x charSet="1"/>`, renderToString(esx`<x charSet="1"/>`))
  is(esx.renderToString`<x classID="1"/>`, renderToString(esx`<x classID="1"/>`))
  is(esx.renderToString`<x colSpan="1"/>`, renderToString(esx`<x colSpan="1"/>`))
  is(esx.renderToString`<x contentEditable="1"/>`, renderToString(esx`<x contentEditable="1"/>`))
  is(esx.renderToString`<x contextMenu="1"/>`, renderToString(esx`<x contextMenu="1"/>`))
  is(esx.renderToString`<x controlsList="1"/>`, renderToString(esx`<x controlsList="1"/>`))
  is(esx.renderToString`<x crossOrigin="1"/>`, renderToString(esx`<x crossOrigin="1"/>`))
  is(esx.renderToString`<x dateTime="1"/>`, renderToString(esx`<x dateTime="1"/>`))
  is(esx.renderToString`<x encType="1"/>`, renderToString(esx`<x encType="1"/>`))
  is(esx.renderToString`<x formMethod="1"/>`, renderToString(esx`<x formMethod="1"/>`))
  is(esx.renderToString`<x formAction="1"/>`, renderToString(esx`<x formAction="1"/>`))
  is(esx.renderToString`<x formEncType="1"/>`, renderToString(esx`<x formEncType="1"/>`))
  is(esx.renderToString`<x formNoValidate/>`, renderToString(esx`<x formNoValidate/>`))
  is(esx.renderToString`<x formTarget="1"/>`, renderToString(esx`<x formTarget="1"/>`))
  is(esx.renderToString`<x frameBorder="1"/>`, renderToString(esx`<x frameBorder="1"/>`))
  is(esx.renderToString`<x hrefLang="1"/>`, renderToString(esx`<x hrefLang="1"/>`))
  is(esx.renderToString`<x inputMode="1"/>`, renderToString(esx`<x inputMode="1"/>`))
  is(esx.renderToString`<x itemID="1"/>`, renderToString(esx`<x itemID="1"/>`))
  is(esx.renderToString`<x itemProp="1"/>`, renderToString(esx`<x itemProp="1"/>`))
  is(esx.renderToString`<x itemRef="1"/>`, renderToString(esx`<x itemRef="1"/>`))
  is(esx.renderToString`<x itemScope/>`, renderToString(esx`<x itemScope/>`))
  is(esx.renderToString`<x itemType="1"/>`, renderToString(esx`<x itemType="1"/>`))
  is(esx.renderToString`<x keyParams="1"/>`, renderToString(esx`<x keyParams="1"/>`))
  is(esx.renderToString`<x keyType="1"/>`, renderToString(esx`<x keyType="1"/>`))
  is(esx.renderToString`<x marginWidth="1"/>`, renderToString(esx`<x marginWidth="1"/>`))
  is(esx.renderToString`<x marginHeight="1"/>`, renderToString(esx`<x marginHeight="1"/>`))
  is(esx.renderToString`<x maxLength="1"/>`, renderToString(esx`<x maxLength="1"/>`))
  is(esx.renderToString`<x mediaGroup="1"/>`, renderToString(esx`<x mediaGroup="1"/>`))
  is(esx.renderToString`<x minLength="1"/>`, renderToString(esx`<x minLength="1"/>`))
  is(esx.renderToString`<x noModule/>`, renderToString(esx`<x noModule/>`))
  is(esx.renderToString`<x noValidate/>`, renderToString(esx`<x noValidate/>`))
  is(esx.renderToString`<x playsInline/>`, renderToString(esx`<x playsInline/>`))
  is(esx.renderToString`<x radioGroup="1"/>`, renderToString(esx`<x radioGroup="1"/>`))
  is(esx.renderToString`<x readOnly/>`, renderToString(esx`<x readOnly/>`))
  is(esx.renderToString`<x referrerPolicy="1"/>`, renderToString(esx`<x referrerPolicy="1"/>`))
  is(esx.renderToString`<x rowSpan="1"/>`, renderToString(esx`<x rowSpan="1"/>`))
  is(esx.renderToString`<x spellCheck="1"/>`, renderToString(esx`<x spellCheck="1"/>`))
  is(esx.renderToString`<x allowFullScreen="1"/>`, renderToString(esx`<x allowFullScreen="1"/>`))
  is(esx.renderToString`<x srcDoc="1"/>`, renderToString(esx`<x srcDoc="1"/>`))
  is(esx.renderToString`<x srcLang="1"/>`, renderToString(esx`<x srcLang="1"/>`))
  is(esx.renderToString`<x srcSet="1"/>`, renderToString(esx`<x srcSet="1"/>`))
  is(esx.renderToString`<x tabIndex="1"/>`, renderToString(esx`<x tabIndex="1"/>`))
  is(esx.renderToString`<x useMap="1"/>`, renderToString(esx`<x useMap="1"/>`))
  is(esx.renderToString`<x accentHeight="1"/>`, renderToString(esx`<x accentHeight="1"/>`))
  is(esx.renderToString`<x alignmentBaseline="1"/>`, renderToString(esx`<x alignmentBaseline="1"/>`))
  is(esx.renderToString`<x allowReorder="1"/>`, renderToString(esx`<x allowReorder="1"/>`))
  is(esx.renderToString`<x arabicForm="1"/>`, renderToString(esx`<x arabicForm="1"/>`))
  is(esx.renderToString`<x attributeName="1"/>`, renderToString(esx`<x attributeName="1"/>`))
  is(esx.renderToString`<x attributeType="1"/>`, renderToString(esx`<x attributeType="1"/>`))
  is(esx.renderToString`<x autoReverse="1"/>`, renderToString(esx`<x autoReverse="1"/>`))
  is(esx.renderToString`<x baseFrequency="1"/>`, renderToString(esx`<x baseFrequency="1"/>`))
  is(esx.renderToString`<x baselineShift="1"/>`, renderToString(esx`<x baselineShift="1"/>`))
  is(esx.renderToString`<x baseProfile="1"/>`, renderToString(esx`<x baseProfile="1"/>`))
  is(esx.renderToString`<x calcMode="1"/>`, renderToString(esx`<x calcMode="1"/>`))
  is(esx.renderToString`<x capHeight="1"/>`, renderToString(esx`<x capHeight="1"/>`))
  is(esx.renderToString`<x clipPath="1"/>`, renderToString(esx`<x clipPath="1"/>`))
  is(esx.renderToString`<x clipPathUnits="1"/>`, renderToString(esx`<x clipPathUnits="1"/>`))
  is(esx.renderToString`<x clipRule="1"/>`, renderToString(esx`<x clipRule="1"/>`))
  is(esx.renderToString`<x colorInterpolation="1"/>`, renderToString(esx`<x colorInterpolation="1"/>`))
  is(esx.renderToString`<x colorInterpolationFilters="1"/>`, renderToString(esx`<x colorInterpolationFilters="1"/>`))
  is(esx.renderToString`<x colorProfile="1"/>`, renderToString(esx`<x colorProfile="1"/>`))
  is(esx.renderToString`<x colorRendering="1"/>`, renderToString(esx`<x colorRendering="1"/>`))
  is(esx.renderToString`<x contentScriptType="1"/>`, renderToString(esx`<x contentScriptType="1"/>`))
  is(esx.renderToString`<x contentStyleType="1"/>`, renderToString(esx`<x contentStyleType="1"/>`))
  is(esx.renderToString`<x diffuseConstant="1"/>`, renderToString(esx`<x diffuseConstant="1"/>`))
  is(esx.renderToString`<x dominantBaseline="1"/>`, renderToString(esx`<x dominantBaseline="1"/>`))
  is(esx.renderToString`<x edgeMode="1"/>`, renderToString(esx`<x edgeMode="1"/>`))
  is(esx.renderToString`<x enableBackground="1"/>`, renderToString(esx`<x enableBackground="1"/>`))
  is(esx.renderToString`<x externalResourcesRequired="1"/>`, renderToString(esx`<x externalResourcesRequired="1"/>`))
  is(esx.renderToString`<x fillOpacity="1"/>`, renderToString(esx`<x fillOpacity="1"/>`))
  is(esx.renderToString`<x fillRule="1"/>`, renderToString(esx`<x fillRule="1"/>`))
  is(esx.renderToString`<x filterRes="1"/>`, renderToString(esx`<x filterRes="1"/>`))
  is(esx.renderToString`<x filterUnits="1"/>`, renderToString(esx`<x filterUnits="1"/>`))
  is(esx.renderToString`<x floodOpacity="1"/>`, renderToString(esx`<x floodOpacity="1"/>`))
  is(esx.renderToString`<x floodColor="1"/>`, renderToString(esx`<x floodColor="1"/>`))
  is(esx.renderToString`<x fontFamily="1"/>`, renderToString(esx`<x fontFamily="1"/>`))
  is(esx.renderToString`<x fontSize="1"/>`, renderToString(esx`<x fontSize="1"/>`))
  is(esx.renderToString`<x fontSizeAdjust="1"/>`, renderToString(esx`<x fontSizeAdjust="1"/>`))
  is(esx.renderToString`<x fontStretch="1"/>`, renderToString(esx`<x fontStretch="1"/>`))
  is(esx.renderToString`<x fontStyle="1"/>`, renderToString(esx`<x fontStyle="1"/>`))
  is(esx.renderToString`<x fontVariant="1"/>`, renderToString(esx`<x fontVariant="1"/>`))
  is(esx.renderToString`<x fontWeight="1"/>`, renderToString(esx`<x fontWeight="1"/>`))
  is(esx.renderToString`<x glyphName="1"/>`, renderToString(esx`<x glyphName="1"/>`))
  is(esx.renderToString`<x glyphOrientationHorizontal="1"/>`, renderToString(esx`<x glyphOrientationHorizontal="1"/>`))
  is(esx.renderToString`<x glyphOrientationVertical="1"/>`, renderToString(esx`<x glyphOrientationVertical="1"/>`))
  is(esx.renderToString`<x glyphRef="1"/>`, renderToString(esx`<x glyphRef="1"/>`))
  is(esx.renderToString`<x gradientTransform="1"/>`, renderToString(esx`<x gradientTransform="1"/>`))
  is(esx.renderToString`<x gradientUnits="1"/>`, renderToString(esx`<x gradientUnits="1"/>`))
  is(esx.renderToString`<x horizAdvX="1"/>`, renderToString(esx`<x horizAdvX="1"/>`))
  is(esx.renderToString`<x horizOriginX="1"/>`, renderToString(esx`<x horizOriginX="1"/>`))
  is(esx.renderToString`<x imageRendering="1"/>`, renderToString(esx`<x imageRendering="1"/>`))
  is(esx.renderToString`<x kernelMatrix="1"/>`, renderToString(esx`<x kernelMatrix="1"/>`))
  is(esx.renderToString`<x kernelUnitLength="1"/>`, renderToString(esx`<x kernelUnitLength="1"/>`))
  is(esx.renderToString`<x keyPoints="1"/>`, renderToString(esx`<x keyPoints="1"/>`))
  is(esx.renderToString`<x keySplines="1"/>`, renderToString(esx`<x keySplines="1"/>`))
  is(esx.renderToString`<x keyTimes="1"/>`, renderToString(esx`<x keyTimes="1"/>`))
  is(esx.renderToString`<x lengthAdjust="1"/>`, renderToString(esx`<x lengthAdjust="1"/>`))
  is(esx.renderToString`<x letterSpacing="1"/>`, renderToString(esx`<x letterSpacing="1"/>`))
  is(esx.renderToString`<x lightingColor="1"/>`, renderToString(esx`<x lightingColor="1"/>`))
  is(esx.renderToString`<x limitingConeAngle="1"/>`, renderToString(esx`<x limitingConeAngle="1"/>`))
  is(esx.renderToString`<x markerEnd="1"/>`, renderToString(esx`<x markerEnd="1"/>`))
  is(esx.renderToString`<x markerHeight="1"/>`, renderToString(esx`<x markerHeight="1"/>`))
  is(esx.renderToString`<x markerMid="1"/>`, renderToString(esx`<x markerMid="1"/>`))
  is(esx.renderToString`<x markerStart="1"/>`, renderToString(esx`<x markerStart="1"/>`))
  is(esx.renderToString`<x markerUnits="1"/>`, renderToString(esx`<x markerUnits="1"/>`))
  is(esx.renderToString`<x markerWidth="1"/>`, renderToString(esx`<x markerWidth="1"/>`))
  is(esx.renderToString`<x maskContentUnits="1"/>`, renderToString(esx`<x maskContentUnits="1"/>`))
  is(esx.renderToString`<x maskUnits="1"/>`, renderToString(esx`<x maskUnits="1"/>`))
  is(esx.renderToString`<x numOctaves="1"/>`, renderToString(esx`<x numOctaves="1"/>`))
  is(esx.renderToString`<x overlinePosition="1"/>`, renderToString(esx`<x overlinePosition="1"/>`))
  is(esx.renderToString`<x overlineThickness="1"/>`, renderToString(esx`<x overlineThickness="1"/>`))
  is(esx.renderToString`<x paintOrder="1"/>`, renderToString(esx`<x paintOrder="1"/>`))
  is(esx.renderToString`<x panose-1="1"/>`, renderToString(esx`<x panose-1="1"/>`))
  is(esx.renderToString`<x pathLength="1"/>`, renderToString(esx`<x pathLength="1"/>`))
  is(esx.renderToString`<x patternContentUnits="1"/>`, renderToString(esx`<x patternContentUnits="1"/>`))
  is(esx.renderToString`<x patternTransform="1"/>`, renderToString(esx`<x patternTransform="1"/>`))
  is(esx.renderToString`<x patternUnits="1"/>`, renderToString(esx`<x patternUnits="1"/>`))
  is(esx.renderToString`<x pointerEvents="1"/>`, renderToString(esx`<x pointerEvents="1"/>`))
  is(esx.renderToString`<x pointsAtX="1"/>`, renderToString(esx`<x pointsAtX="1"/>`))
  is(esx.renderToString`<x pointsAtY="1"/>`, renderToString(esx`<x pointsAtY="1"/>`))
  is(esx.renderToString`<x pointsAtZ="1"/>`, renderToString(esx`<x pointsAtZ="1"/>`))
  is(esx.renderToString`<x preserveAlpha="1"/>`, renderToString(esx`<x preserveAlpha="1"/>`))
  is(esx.renderToString`<x preserveAspectRatio="1"/>`, renderToString(esx`<x preserveAspectRatio="1"/>`))
  is(esx.renderToString`<x primitiveUnits="1"/>`, renderToString(esx`<x primitiveUnits="1"/>`))
  is(esx.renderToString`<x refX="1"/>`, renderToString(esx`<x refX="1"/>`))
  is(esx.renderToString`<x refY="1"/>`, renderToString(esx`<x refY="1"/>`))
  is(esx.renderToString`<x renderingIntent="1"/>`, renderToString(esx`<x renderingIntent="1"/>`))
  is(esx.renderToString`<x repeatCount="1"/>`, renderToString(esx`<x repeatCount="1"/>`))
  is(esx.renderToString`<x repeatDur="1"/>`, renderToString(esx`<x repeatDur="1"/>`))
  is(esx.renderToString`<x requiredExtensions="1"/>`, renderToString(esx`<x requiredExtensions="1"/>`))
  is(esx.renderToString`<x requiredFeatures="1"/>`, renderToString(esx`<x requiredFeatures="1"/>`))
  is(esx.renderToString`<x shapeRendering="1"/>`, renderToString(esx`<x shapeRendering="1"/>`))
  is(esx.renderToString`<x specularConstant="1"/>`, renderToString(esx`<x specularConstant="1"/>`))
  is(esx.renderToString`<x specularExponent="1"/>`, renderToString(esx`<x specularExponent="1"/>`))
  is(esx.renderToString`<x spreadMethod="1"/>`, renderToString(esx`<x spreadMethod="1"/>`))
  is(esx.renderToString`<x startOffset="1"/>`, renderToString(esx`<x startOffset="1"/>`))
  is(esx.renderToString`<x stdDeviation="1"/>`, renderToString(esx`<x stdDeviation="1"/>`))
  is(esx.renderToString`<x stitchTiles="1"/>`, renderToString(esx`<x stitchTiles="1"/>`))
  is(esx.renderToString`<x stopColor="1"/>`, renderToString(esx`<x stopColor="1"/>`))
  is(esx.renderToString`<x stopOpacity="1"/>`, renderToString(esx`<x stopOpacity="1"/>`))
  is(esx.renderToString`<x strikethroughPosition="1"/>`, renderToString(esx`<x strikethroughPosition="1"/>`))
  is(esx.renderToString`<x strikethroughThickness="1"/>`, renderToString(esx`<x strikethroughThickness="1"/>`))
  is(esx.renderToString`<x strokeDasharray="1"/>`, renderToString(esx`<x strokeDasharray="1"/>`))
  is(esx.renderToString`<x strokeDashoffset="1"/>`, renderToString(esx`<x strokeDashoffset="1"/>`))
  is(esx.renderToString`<x strokeLinecap="1"/>`, renderToString(esx`<x strokeLinecap="1"/>`))
  is(esx.renderToString`<x strokeLinejoin="1"/>`, renderToString(esx`<x strokeLinejoin="1"/>`))
  is(esx.renderToString`<x strokeMiterlimit="1"/>`, renderToString(esx`<x strokeMiterlimit="1"/>`))
  is(esx.renderToString`<x strokeWidth="1"/>`, renderToString(esx`<x strokeWidth="1"/>`))
  is(esx.renderToString`<x strokeOpacity="1"/>`, renderToString(esx`<x strokeOpacity="1"/>`))
  is(esx.renderToString`<x surfaceScale="1"/>`, renderToString(esx`<x surfaceScale="1"/>`))
  is(esx.renderToString`<x systemLanguage="1"/>`, renderToString(esx`<x systemLanguage="1"/>`))
  is(esx.renderToString`<x tableValues="1"/>`, renderToString(esx`<x tableValues="1"/>`))
  is(esx.renderToString`<x targetX="1"/>`, renderToString(esx`<x targetX="1"/>`))
  is(esx.renderToString`<x targetY="1"/>`, renderToString(esx`<x targetY="1"/>`))
  is(esx.renderToString`<x textAnchor="1"/>`, renderToString(esx`<x textAnchor="1"/>`))
  is(esx.renderToString`<x textDecoration="1"/>`, renderToString(esx`<x textDecoration="1"/>`))
  is(esx.renderToString`<x textLength="1"/>`, renderToString(esx`<x textLength="1"/>`))
  is(esx.renderToString`<x textRendering="1"/>`, renderToString(esx`<x textRendering="1"/>`))
  is(esx.renderToString`<x underlinePosition="1"/>`, renderToString(esx`<x underlinePosition="1"/>`))
  is(esx.renderToString`<x underlineThickness="1"/>`, renderToString(esx`<x underlineThickness="1"/>`))
  is(esx.renderToString`<x unicodeBidi="1"/>`, renderToString(esx`<x unicodeBidi="1"/>`))
  is(esx.renderToString`<x unicodeRange="1"/>`, renderToString(esx`<x unicodeRange="1"/>`))
  is(esx.renderToString`<x unitsPerEm="1"/>`, renderToString(esx`<x unitsPerEm="1"/>`))
  is(esx.renderToString`<x vAlphabetic="1"/>`, renderToString(esx`<x vAlphabetic="1"/>`))
  is(esx.renderToString`<x vectorEffect="1"/>`, renderToString(esx`<x vectorEffect="1"/>`))
  is(esx.renderToString`<x vertAdvY="1"/>`, renderToString(esx`<x vertAdvY="1"/>`))
  is(esx.renderToString`<x vertOriginX="1"/>`, renderToString(esx`<x vertOriginX="1"/>`))
  is(esx.renderToString`<x vertOriginY="1"/>`, renderToString(esx`<x vertOriginY="1"/>`))
  is(esx.renderToString`<x vHanging="1"/>`, renderToString(esx`<x vHanging="1"/>`))
  is(esx.renderToString`<x vIdeographic="1"/>`, renderToString(esx`<x vIdeographic="1"/>`))
  is(esx.renderToString`<x viewBox="1"/>`, renderToString(esx`<x viewBox="1"/>`))
  is(esx.renderToString`<x viewTarget="1"/>`, renderToString(esx`<x viewTarget="1"/>`))
  is(esx.renderToString`<x vMathematical="1"/>`, renderToString(esx`<x vMathematical="1"/>`))
  is(esx.renderToString`<x wordSpacing="1"/>`, renderToString(esx`<x wordSpacing="1"/>`))
  is(esx.renderToString`<x writingMode="1"/>`, renderToString(esx`<x writingMode="1"/>`))
  is(esx.renderToString`<x xChannelSelector="1"/>`, renderToString(esx`<x xChannelSelector="1"/>`))
  is(esx.renderToString`<x xHeight="1"/>`, renderToString(esx`<x xHeight="1"/>`))
  is(esx.renderToString`<x xlinkActuate="1"/>`, renderToString(esx`<x xlinkActuate="1"/>`))
  is(esx.renderToString`<x xlinkArcrole="1"/>`, renderToString(esx`<x xlinkArcrole="1"/>`))
  is(esx.renderToString`<x xlinkHref="1"/>`, renderToString(esx`<x xlinkHref="1"/>`))
  is(esx.renderToString`<x xlinkRole="1"/>`, renderToString(esx`<x xlinkRole="1"/>`))
  is(esx.renderToString`<x xlinkShow="1"/>`, renderToString(esx`<x xlinkShow="1"/>`))
  is(esx.renderToString`<x xlinkTitle="1"/>`, renderToString(esx`<x xlinkTitle="1"/>`))
  is(esx.renderToString`<x xlinkType="1"/>`, renderToString(esx`<x xlinkType="1"/>`))
  is(esx.renderToString`<x xmlBase="1"/>`, renderToString(esx`<x xmlBase="1"/>`))
  is(esx.renderToString`<x xmlLang="1"/>`, renderToString(esx`<x xmlLang="1"/>`))
  is(esx.renderToString`<x xmlSpace="1"/>`, renderToString(esx`<x xmlSpace="1"/>`))
  is(esx.renderToString`<x xmlnsXlink="1"/>`, renderToString(esx`<x xmlnsXlink="1"/>`))
  is(esx.renderToString`<x xmlSpace="1"/>`, renderToString(esx`<x xmlSpace="1"/>`))
  is(esx.renderToString`<x yChannelSelector="1"/>`, renderToString(esx`<x yChannelSelector="1"/>`))
  is(esx.renderToString`<x zoomAndPan="1"/>`, renderToString(esx`<x zoomAndPan="1"/>`))
  is(esx.renderToString`<x acceptCharset="1"></x>`, renderToString(esx`<x acceptCharset="1"></x>`))
  is(esx.renderToString`<x accessKey="1"></x>`, renderToString(esx`<x accessKey="1"></x>`))
  is(esx.renderToString`<x autoCapitalize="1"></x>`, renderToString(esx`<x autoCapitalize="1"></x>`))
  is(esx.renderToString`<x autoComplete="1"></x>`, renderToString(esx`<x autoComplete="1"></x>`))
  is(esx.renderToString`<x autoCorrect="1"></x>`, renderToString(esx`<x autoCorrect="1"></x>`))
  is(esx.renderToString`<x autoFocus></x>`, renderToString(esx`<x autoFocus></x>`))
  is(esx.renderToString`<x autoPlay></x>`, renderToString(esx`<x autoPlay></x>`))
  is(esx.renderToString`<x autoSave="1"></x>`, renderToString(esx`<x autoSave="1"></x>`))
  is(esx.renderToString`<x cellPadding="1"></x>`, renderToString(esx`<x cellPadding="1"></x>`))
  is(esx.renderToString`<x cellSpacing="1"></x>`, renderToString(esx`<x cellSpacing="1"></x>`))
  is(esx.renderToString`<x charSet="1"></x>`, renderToString(esx`<x charSet="1"></x>`))
  is(esx.renderToString`<x classID="1"></x>`, renderToString(esx`<x classID="1"></x>`))
  is(esx.renderToString`<x colSpan="1"></x>`, renderToString(esx`<x colSpan="1"></x>`))
  is(esx.renderToString`<x contentEditable="1"></x>`, renderToString(esx`<x contentEditable="1"></x>`))
  is(esx.renderToString`<x contextMenu="1"></x>`, renderToString(esx`<x contextMenu="1"></x>`))
  is(esx.renderToString`<x controlsList="1"></x>`, renderToString(esx`<x controlsList="1"></x>`))
  is(esx.renderToString`<x crossOrigin="1"></x>`, renderToString(esx`<x crossOrigin="1"></x>`))
  is(esx.renderToString`<x dateTime="1"></x>`, renderToString(esx`<x dateTime="1"></x>`))
  is(esx.renderToString`<x encType="1"></x>`, renderToString(esx`<x encType="1"></x>`))
  is(esx.renderToString`<x formMethod="1"></x>`, renderToString(esx`<x formMethod="1"></x>`))
  is(esx.renderToString`<x formAction="1"></x>`, renderToString(esx`<x formAction="1"></x>`))
  is(esx.renderToString`<x formEncType="1"></x>`, renderToString(esx`<x formEncType="1"></x>`))
  is(esx.renderToString`<x formNoValidate></x>`, renderToString(esx`<x formNoValidate></x>`))
  is(esx.renderToString`<x formTarget="1"></x>`, renderToString(esx`<x formTarget="1"></x>`))
  is(esx.renderToString`<x frameBorder="1"></x>`, renderToString(esx`<x frameBorder="1"></x>`))
  is(esx.renderToString`<x hrefLang="1"></x>`, renderToString(esx`<x hrefLang="1"></x>`))
  is(esx.renderToString`<x inputMode="1"></x>`, renderToString(esx`<x inputMode="1"></x>`))
  is(esx.renderToString`<x itemID="1"></x>`, renderToString(esx`<x itemID="1"></x>`))
  is(esx.renderToString`<x itemProp="1"></x>`, renderToString(esx`<x itemProp="1"></x>`))
  is(esx.renderToString`<x itemRef="1"></x>`, renderToString(esx`<x itemRef="1"></x>`))
  is(esx.renderToString`<x itemScope></x>`, renderToString(esx`<x itemScope></x>`))
  is(esx.renderToString`<x itemType="1"></x>`, renderToString(esx`<x itemType="1"></x>`))
  is(esx.renderToString`<x keyParams="1"></x>`, renderToString(esx`<x keyParams="1"></x>`))
  is(esx.renderToString`<x keyType="1"></x>`, renderToString(esx`<x keyType="1"></x>`))
  is(esx.renderToString`<x marginWidth="1"></x>`, renderToString(esx`<x marginWidth="1"></x>`))
  is(esx.renderToString`<x marginHeight="1"></x>`, renderToString(esx`<x marginHeight="1"></x>`))
  is(esx.renderToString`<x maxLength="1"></x>`, renderToString(esx`<x maxLength="1"></x>`))
  is(esx.renderToString`<x mediaGroup="1"></x>`, renderToString(esx`<x mediaGroup="1"></x>`))
  is(esx.renderToString`<x minLength="1"></x>`, renderToString(esx`<x minLength="1"></x>`))
  is(esx.renderToString`<x noModule></x>`, renderToString(esx`<x noModule></x>`))
  is(esx.renderToString`<x noValidate></x>`, renderToString(esx`<x noValidate></x>`))
  is(esx.renderToString`<x playsInline></x>`, renderToString(esx`<x playsInline></x>`))
  is(esx.renderToString`<x radioGroup="1"></x>`, renderToString(esx`<x radioGroup="1"></x>`))
  is(esx.renderToString`<x readOnly></x>`, renderToString(esx`<x readOnly></x>`))
  is(esx.renderToString`<x referrerPolicy="1"></x>`, renderToString(esx`<x referrerPolicy="1"></x>`))
  is(esx.renderToString`<x rowSpan="1"></x>`, renderToString(esx`<x rowSpan="1"></x>`))
  is(esx.renderToString`<x spellCheck="1"></x>`, renderToString(esx`<x spellCheck="1"></x>`))
  is(esx.renderToString`<x srcDoc="1"></x>`, renderToString(esx`<x srcDoc="1"></x>`))
  is(esx.renderToString`<x srcLang="1"></x>`, renderToString(esx`<x srcLang="1"></x>`))
  is(esx.renderToString`<x srcSet="1"></x>`, renderToString(esx`<x srcSet="1"></x>`))
  is(esx.renderToString`<x tabIndex="1"></x>`, renderToString(esx`<x tabIndex="1"></x>`))
  is(esx.renderToString`<x useMap="1"></x>`, renderToString(esx`<x useMap="1"></x>`))
  is(esx.renderToString`<x accentHeight="1"></x>`, renderToString(esx`<x accentHeight="1"></x>`))
  is(esx.renderToString`<x alignmentBaseline="1"></x>`, renderToString(esx`<x alignmentBaseline="1"></x>`))
  is(esx.renderToString`<x allowReorder="1"></x>`, renderToString(esx`<x allowReorder="1"></x>`))
  is(esx.renderToString`<x arabicForm="1"></x>`, renderToString(esx`<x arabicForm="1"></x>`))
  is(esx.renderToString`<x attributeName="1"></x>`, renderToString(esx`<x attributeName="1"></x>`))
  is(esx.renderToString`<x attributeType="1"></x>`, renderToString(esx`<x attributeType="1"></x>`))
  is(esx.renderToString`<x autoReverse="1"></x>`, renderToString(esx`<x autoReverse="1"></x>`))
  is(esx.renderToString`<x baseFrequency="1"></x>`, renderToString(esx`<x baseFrequency="1"></x>`))
  is(esx.renderToString`<x baselineShift="1"></x>`, renderToString(esx`<x baselineShift="1"></x>`))
  is(esx.renderToString`<x baseProfile="1"></x>`, renderToString(esx`<x baseProfile="1"></x>`))
  is(esx.renderToString`<x calcMode="1"></x>`, renderToString(esx`<x calcMode="1"></x>`))
  is(esx.renderToString`<x capHeight="1"></x>`, renderToString(esx`<x capHeight="1"></x>`))
  is(esx.renderToString`<x clipPath="1"></x>`, renderToString(esx`<x clipPath="1"></x>`))
  is(esx.renderToString`<x clipPathUnits="1"></x>`, renderToString(esx`<x clipPathUnits="1"></x>`))
  is(esx.renderToString`<x clipRule="1"></x>`, renderToString(esx`<x clipRule="1"></x>`))
  is(esx.renderToString`<x colorInterpolation="1"></x>`, renderToString(esx`<x colorInterpolation="1"></x>`))
  is(esx.renderToString`<x colorInterpolationFilters="1"></x>`, renderToString(esx`<x colorInterpolationFilters="1"></x>`))
  is(esx.renderToString`<x colorProfile="1"></x>`, renderToString(esx`<x colorProfile="1"></x>`))
  is(esx.renderToString`<x colorRendering="1"></x>`, renderToString(esx`<x colorRendering="1"></x>`))
  is(esx.renderToString`<x contentScriptType="1"></x>`, renderToString(esx`<x contentScriptType="1"></x>`))
  is(esx.renderToString`<x contentStyleType="1"></x>`, renderToString(esx`<x contentStyleType="1"></x>`))
  is(esx.renderToString`<x diffuseConstant="1"></x>`, renderToString(esx`<x diffuseConstant="1"></x>`))
  is(esx.renderToString`<x dominantBaseline="1"></x>`, renderToString(esx`<x dominantBaseline="1"></x>`))
  is(esx.renderToString`<x edgeMode="1"></x>`, renderToString(esx`<x edgeMode="1"></x>`))
  is(esx.renderToString`<x enableBackground="1"></x>`, renderToString(esx`<x enableBackground="1"></x>`))
  is(esx.renderToString`<x externalResourcesRequired="1"></x>`, renderToString(esx`<x externalResourcesRequired="1"></x>`))
  is(esx.renderToString`<x fillOpacity="1"></x>`, renderToString(esx`<x fillOpacity="1"></x>`))
  is(esx.renderToString`<x fillRule="1"></x>`, renderToString(esx`<x fillRule="1"></x>`))
  is(esx.renderToString`<x filterRes="1"></x>`, renderToString(esx`<x filterRes="1"></x>`))
  is(esx.renderToString`<x filterUnits="1"></x>`, renderToString(esx`<x filterUnits="1"></x>`))
  is(esx.renderToString`<x floodOpacity="1"></x>`, renderToString(esx`<x floodOpacity="1"></x>`))
  is(esx.renderToString`<x floodColor="1"></x>`, renderToString(esx`<x floodColor="1"></x>`))
  is(esx.renderToString`<x fontFamily="1"></x>`, renderToString(esx`<x fontFamily="1"></x>`))
  is(esx.renderToString`<x fontSize="1"></x>`, renderToString(esx`<x fontSize="1"></x>`))
  is(esx.renderToString`<x fontSizeAdjust="1"></x>`, renderToString(esx`<x fontSizeAdjust="1"></x>`))
  is(esx.renderToString`<x fontStretch="1"></x>`, renderToString(esx`<x fontStretch="1"></x>`))
  is(esx.renderToString`<x fontStyle="1"></x>`, renderToString(esx`<x fontStyle="1"></x>`))
  is(esx.renderToString`<x fontVariant="1"></x>`, renderToString(esx`<x fontVariant="1"></x>`))
  is(esx.renderToString`<x fontWeight="1"></x>`, renderToString(esx`<x fontWeight="1"></x>`))
  is(esx.renderToString`<x glyphName="1"></x>`, renderToString(esx`<x glyphName="1"></x>`))
  is(esx.renderToString`<x glyphOrientationHorizontal="1"></x>`, renderToString(esx`<x glyphOrientationHorizontal="1"></x>`))
  is(esx.renderToString`<x glyphOrientationVertical="1"></x>`, renderToString(esx`<x glyphOrientationVertical="1"></x>`))
  is(esx.renderToString`<x glyphRef="1"></x>`, renderToString(esx`<x glyphRef="1"></x>`))
  is(esx.renderToString`<x gradientTransform="1"></x>`, renderToString(esx`<x gradientTransform="1"></x>`))
  is(esx.renderToString`<x gradientUnits="1"></x>`, renderToString(esx`<x gradientUnits="1"></x>`))
  is(esx.renderToString`<x horizAdvX="1"></x>`, renderToString(esx`<x horizAdvX="1"></x>`))
  is(esx.renderToString`<x horizOriginX="1"></x>`, renderToString(esx`<x horizOriginX="1"></x>`))
  is(esx.renderToString`<x imageRendering="1"></x>`, renderToString(esx`<x imageRendering="1"></x>`))
  is(esx.renderToString`<x kernelMatrix="1"></x>`, renderToString(esx`<x kernelMatrix="1"></x>`))
  is(esx.renderToString`<x kernelUnitLength="1"></x>`, renderToString(esx`<x kernelUnitLength="1"></x>`))
  is(esx.renderToString`<x keyPoints="1"></x>`, renderToString(esx`<x keyPoints="1"></x>`))
  is(esx.renderToString`<x keySplines="1"></x>`, renderToString(esx`<x keySplines="1"></x>`))
  is(esx.renderToString`<x keyTimes="1"></x>`, renderToString(esx`<x keyTimes="1"></x>`))
  is(esx.renderToString`<x lengthAdjust="1"></x>`, renderToString(esx`<x lengthAdjust="1"></x>`))
  is(esx.renderToString`<x letterSpacing="1"></x>`, renderToString(esx`<x letterSpacing="1"></x>`))
  is(esx.renderToString`<x lightingColor="1"></x>`, renderToString(esx`<x lightingColor="1"></x>`))
  is(esx.renderToString`<x limitingConeAngle="1"></x>`, renderToString(esx`<x limitingConeAngle="1"></x>`))
  is(esx.renderToString`<x markerEnd="1"></x>`, renderToString(esx`<x markerEnd="1"></x>`))
  is(esx.renderToString`<x markerHeight="1"></x>`, renderToString(esx`<x markerHeight="1"></x>`))
  is(esx.renderToString`<x markerMid="1"></x>`, renderToString(esx`<x markerMid="1"></x>`))
  is(esx.renderToString`<x markerStart="1"></x>`, renderToString(esx`<x markerStart="1"></x>`))
  is(esx.renderToString`<x markerUnits="1"></x>`, renderToString(esx`<x markerUnits="1"></x>`))
  is(esx.renderToString`<x markerWidth="1"></x>`, renderToString(esx`<x markerWidth="1"></x>`))
  is(esx.renderToString`<x maskContentUnits="1"></x>`, renderToString(esx`<x maskContentUnits="1"></x>`))
  is(esx.renderToString`<x maskUnits="1"></x>`, renderToString(esx`<x maskUnits="1"></x>`))
  is(esx.renderToString`<x numOctaves="1"></x>`, renderToString(esx`<x numOctaves="1"></x>`))
  is(esx.renderToString`<x overlinePosition="1"></x>`, renderToString(esx`<x overlinePosition="1"></x>`))
  is(esx.renderToString`<x overlineThickness="1"></x>`, renderToString(esx`<x overlineThickness="1"></x>`))
  is(esx.renderToString`<x paintOrder="1"></x>`, renderToString(esx`<x paintOrder="1"></x>`))
  is(esx.renderToString`<x panose1="1"></x>`, renderToString(esx`<x panose1="1"></x>`))
  is(esx.renderToString`<x pathLength="1"></x>`, renderToString(esx`<x pathLength="1"></x>`))
  is(esx.renderToString`<x patternContentUnits="1"></x>`, renderToString(esx`<x patternContentUnits="1"></x>`))
  is(esx.renderToString`<x patternTransform="1"></x>`, renderToString(esx`<x patternTransform="1"></x>`))
  is(esx.renderToString`<x patternUnits="1"></x>`, renderToString(esx`<x patternUnits="1"></x>`))
  is(esx.renderToString`<x pointerEvents="1"></x>`, renderToString(esx`<x pointerEvents="1"></x>`))
  is(esx.renderToString`<x pointsAtX="1"></x>`, renderToString(esx`<x pointsAtX="1"></x>`))
  is(esx.renderToString`<x pointsAtY="1"></x>`, renderToString(esx`<x pointsAtY="1"></x>`))
  is(esx.renderToString`<x pointsAtZ="1"></x>`, renderToString(esx`<x pointsAtZ="1"></x>`))
  is(esx.renderToString`<x preserveAlpha="1"></x>`, renderToString(esx`<x preserveAlpha="1"></x>`))
  is(esx.renderToString`<x preserveAspectRatio="1"></x>`, renderToString(esx`<x preserveAspectRatio="1"></x>`))
  is(esx.renderToString`<x primitiveUnits="1"></x>`, renderToString(esx`<x primitiveUnits="1"></x>`))
  is(esx.renderToString`<x refX="1"></x>`, renderToString(esx`<x refX="1"></x>`))
  is(esx.renderToString`<x refY="1"></x>`, renderToString(esx`<x refY="1"></x>`))
  is(esx.renderToString`<x renderingIntent="1"></x>`, renderToString(esx`<x renderingIntent="1"></x>`))
  is(esx.renderToString`<x repeatCount="1"></x>`, renderToString(esx`<x repeatCount="1"></x>`))
  is(esx.renderToString`<x repeatDur="1"></x>`, renderToString(esx`<x repeatDur="1"></x>`))
  is(esx.renderToString`<x requiredExtensions="1"></x>`, renderToString(esx`<x requiredExtensions="1"></x>`))
  is(esx.renderToString`<x requiredFeatures="1"></x>`, renderToString(esx`<x requiredFeatures="1"></x>`))
  is(esx.renderToString`<x shapeRendering="1"></x>`, renderToString(esx`<x shapeRendering="1"></x>`))
  is(esx.renderToString`<x specularConstant="1"></x>`, renderToString(esx`<x specularConstant="1"></x>`))
  is(esx.renderToString`<x specularExponent="1"></x>`, renderToString(esx`<x specularExponent="1"></x>`))
  is(esx.renderToString`<x spreadMethod="1"></x>`, renderToString(esx`<x spreadMethod="1"></x>`))
  is(esx.renderToString`<x startOffset="1"></x>`, renderToString(esx`<x startOffset="1"></x>`))
  is(esx.renderToString`<x stdDeviation="1"></x>`, renderToString(esx`<x stdDeviation="1"></x>`))
  is(esx.renderToString`<x stitchTiles="1"></x>`, renderToString(esx`<x stitchTiles="1"></x>`))
  is(esx.renderToString`<x stopColor="1"></x>`, renderToString(esx`<x stopColor="1"></x>`))
  is(esx.renderToString`<x stopOpacity="1"></x>`, renderToString(esx`<x stopOpacity="1"></x>`))
  is(esx.renderToString`<x strikethroughPosition="1"></x>`, renderToString(esx`<x strikethroughPosition="1"></x>`))
  is(esx.renderToString`<x strikethroughThickness="1"></x>`, renderToString(esx`<x strikethroughThickness="1"></x>`))
  is(esx.renderToString`<x strokeDasharray="1"></x>`, renderToString(esx`<x strokeDasharray="1"></x>`))
  is(esx.renderToString`<x strokeDashoffset="1"></x>`, renderToString(esx`<x strokeDashoffset="1"></x>`))
  is(esx.renderToString`<x strokeLinecap="1"></x>`, renderToString(esx`<x strokeLinecap="1"></x>`))
  is(esx.renderToString`<x strokeLinejoin="1"></x>`, renderToString(esx`<x strokeLinejoin="1"></x>`))
  is(esx.renderToString`<x strokeMiterlimit="1"></x>`, renderToString(esx`<x strokeMiterlimit="1"></x>`))
  is(esx.renderToString`<x strokeWidth="1"></x>`, renderToString(esx`<x strokeWidth="1"></x>`))
  is(esx.renderToString`<x strokeOpacity="1"></x>`, renderToString(esx`<x strokeOpacity="1"></x>`))
  is(esx.renderToString`<x surfaceScale="1"></x>`, renderToString(esx`<x surfaceScale="1"></x>`))
  is(esx.renderToString`<x systemLanguage="1"></x>`, renderToString(esx`<x systemLanguage="1"></x>`))
  is(esx.renderToString`<x tableValues="1"></x>`, renderToString(esx`<x tableValues="1"></x>`))
  is(esx.renderToString`<x targetX="1"></x>`, renderToString(esx`<x targetX="1"></x>`))
  is(esx.renderToString`<x targetY="1"></x>`, renderToString(esx`<x targetY="1"></x>`))
  is(esx.renderToString`<x textAnchor="1"></x>`, renderToString(esx`<x textAnchor="1"></x>`))
  is(esx.renderToString`<x textDecoration="1"></x>`, renderToString(esx`<x textDecoration="1"></x>`))
  is(esx.renderToString`<x textLength="1"></x>`, renderToString(esx`<x textLength="1"></x>`))
  is(esx.renderToString`<x textRendering="1"></x>`, renderToString(esx`<x textRendering="1"></x>`))
  is(esx.renderToString`<x underlinePosition="1"></x>`, renderToString(esx`<x underlinePosition="1"></x>`))
  is(esx.renderToString`<x underlineThickness="1"></x>`, renderToString(esx`<x underlineThickness="1"></x>`))
  is(esx.renderToString`<x unicodeBidi="1"></x>`, renderToString(esx`<x unicodeBidi="1"></x>`))
  is(esx.renderToString`<x unicodeRange="1"></x>`, renderToString(esx`<x unicodeRange="1"></x>`))
  is(esx.renderToString`<x unitsPerEm="1"></x>`, renderToString(esx`<x unitsPerEm="1"></x>`))
  is(esx.renderToString`<x vAlphabetic="1"></x>`, renderToString(esx`<x vAlphabetic="1"></x>`))
  is(esx.renderToString`<x vectorEffect="1"></x>`, renderToString(esx`<x vectorEffect="1"></x>`))
  is(esx.renderToString`<x vertAdvY="1"></x>`, renderToString(esx`<x vertAdvY="1"></x>`))
  is(esx.renderToString`<x vertOriginX="1"></x>`, renderToString(esx`<x vertOriginX="1"></x>`))
  is(esx.renderToString`<x vertOriginY="1"></x>`, renderToString(esx`<x vertOriginY="1"></x>`))
  is(esx.renderToString`<x vHanging="1"></x>`, renderToString(esx`<x vHanging="1"></x>`))
  is(esx.renderToString`<x vIdeographic="1"></x>`, renderToString(esx`<x vIdeographic="1"></x>`))
  is(esx.renderToString`<x viewBox="1"></x>`, renderToString(esx`<x viewBox="1"></x>`))
  is(esx.renderToString`<x viewTarget="1"></x>`, renderToString(esx`<x viewTarget="1"></x>`))
  is(esx.renderToString`<x vMathematical="1"></x>`, renderToString(esx`<x vMathematical="1"></x>`))
  is(esx.renderToString`<x wordSpacing="1"></x>`, renderToString(esx`<x wordSpacing="1"></x>`))
  is(esx.renderToString`<x writingMode="1"></x>`, renderToString(esx`<x writingMode="1"></x>`))
  is(esx.renderToString`<x xChannelSelector="1"></x>`, renderToString(esx`<x xChannelSelector="1"></x>`))
  is(esx.renderToString`<x xHeight="1"></x>`, renderToString(esx`<x xHeight="1"></x>`))
  is(esx.renderToString`<x xlinkActuate="1"></x>`, renderToString(esx`<x xlinkActuate="1"></x>`))
  is(esx.renderToString`<x xlinkArcrole="1"></x>`, renderToString(esx`<x xlinkArcrole="1"></x>`))
  is(esx.renderToString`<x xlinkHref="1"></x>`, renderToString(esx`<x xlinkHref="1"></x>`))
  is(esx.renderToString`<x xlinkRole="1"></x>`, renderToString(esx`<x xlinkRole="1"></x>`))
  is(esx.renderToString`<x xlinkShow="1"></x>`, renderToString(esx`<x xlinkShow="1"></x>`))
  is(esx.renderToString`<x xlinkTitle="1"></x>`, renderToString(esx`<x xlinkTitle="1"></x>`))
  is(esx.renderToString`<x xlinkType="1"></x>`, renderToString(esx`<x xlinkType="1"></x>`))
  is(esx.renderToString`<x xmlBase="1"></x>`, renderToString(esx`<x xmlBase="1"></x>`))
  is(esx.renderToString`<x xmlLang="1"></x>`, renderToString(esx`<x xmlLang="1"></x>`))
  is(esx.renderToString`<x xmlSpace="1"></x>`, renderToString(esx`<x xmlSpace="1"></x>`))
  is(esx.renderToString`<x xmlnsXlink="1"></x>`, renderToString(esx`<x xmlnsXlink="1"></x>`))
  is(esx.renderToString`<x xmlSpace="1"></x>`, renderToString(esx`<x xmlSpace="1"></x>`))
  is(esx.renderToString`<x yChannelSelector="1"></x>`, renderToString(esx`<x yChannelSelector="1"></x>`))
  is(esx.renderToString`<x zoomAndPan="1"></x>`, renderToString(esx`<x zoomAndPan="1"></x>`))
  is(esx.renderToString`<x acceptCharset="1" foo="1"></x>`, renderToString(esx`<x acceptCharset="1" foo="1"></x>`))
  is(esx.renderToString`<x accessKey="1" foo="1"></x>`, renderToString(esx`<x accessKey="1" foo="1"></x>`))
  is(esx.renderToString`<x autoCapitalize="1" foo="1"></x>`, renderToString(esx`<x autoCapitalize="1" foo="1"></x>`))
  is(esx.renderToString`<x autoComplete="1" foo="1"></x>`, renderToString(esx`<x autoComplete="1" foo="1"></x>`))
  is(esx.renderToString`<x autoCorrect="1" foo="1"></x>`, renderToString(esx`<x autoCorrect="1" foo="1"></x>`))
  is(esx.renderToString`<x autoFocus foo="1"></x>`, renderToString(esx`<x autoFocus foo="1"></x>`))
  is(esx.renderToString`<x autoPlay foo="1"></x>`, renderToString(esx`<x autoPlay foo="1"></x>`))
  is(esx.renderToString`<x autoSave="1" foo="1"></x>`, renderToString(esx`<x autoSave="1" foo="1"></x>`))
  is(esx.renderToString`<x cellPadding="1" foo="1"></x>`, renderToString(esx`<x cellPadding="1" foo="1"></x>`))
  is(esx.renderToString`<x cellSpacing="1" foo="1"></x>`, renderToString(esx`<x cellSpacing="1" foo="1"></x>`))
  is(esx.renderToString`<x charSet="1" foo="1"></x>`, renderToString(esx`<x charSet="1" foo="1"></x>`))
  is(esx.renderToString`<x classID="1" foo="1"></x>`, renderToString(esx`<x classID="1" foo="1"></x>`))
  is(esx.renderToString`<x colSpan="1" foo="1"></x>`, renderToString(esx`<x colSpan="1" foo="1"></x>`))
  is(esx.renderToString`<x contentEditable="1" foo="1"></x>`, renderToString(esx`<x contentEditable="1" foo="1"></x>`))
  is(esx.renderToString`<x contextMenu="1" foo="1"></x>`, renderToString(esx`<x contextMenu="1" foo="1"></x>`))
  is(esx.renderToString`<x controlsList="1" foo="1"></x>`, renderToString(esx`<x controlsList="1" foo="1"></x>`))
  is(esx.renderToString`<x crossOrigin="1" foo="1"></x>`, renderToString(esx`<x crossOrigin="1" foo="1"></x>`))
  is(esx.renderToString`<x dateTime="1" foo="1"></x>`, renderToString(esx`<x dateTime="1" foo="1"></x>`))
  is(esx.renderToString`<x encType="1" foo="1"></x>`, renderToString(esx`<x encType="1" foo="1"></x>`))
  is(esx.renderToString`<x formMethod="1" foo="1"></x>`, renderToString(esx`<x formMethod="1" foo="1"></x>`))
  is(esx.renderToString`<x formAction="1" foo="1"></x>`, renderToString(esx`<x formAction="1" foo="1"></x>`))
  is(esx.renderToString`<x formEncType="1" foo="1"></x>`, renderToString(esx`<x formEncType="1" foo="1"></x>`))
  is(esx.renderToString`<x formNoValidate foo="1"></x>`, renderToString(esx`<x formNoValidate foo="1"></x>`))
  is(esx.renderToString`<x formTarget="1" foo="1"></x>`, renderToString(esx`<x formTarget="1" foo="1"></x>`))
  is(esx.renderToString`<x frameBorder="1" foo="1"></x>`, renderToString(esx`<x frameBorder="1" foo="1"></x>`))
  is(esx.renderToString`<x hrefLang="1" foo="1"></x>`, renderToString(esx`<x hrefLang="1" foo="1"></x>`))
  is(esx.renderToString`<x inputMode="1" foo="1"></x>`, renderToString(esx`<x inputMode="1" foo="1"></x>`))
  is(esx.renderToString`<x itemID="1" foo="1"></x>`, renderToString(esx`<x itemID="1" foo="1"></x>`))
  is(esx.renderToString`<x itemProp="1" foo="1"></x>`, renderToString(esx`<x itemProp="1" foo="1"></x>`))
  is(esx.renderToString`<x itemRef="1" foo="1"></x>`, renderToString(esx`<x itemRef="1" foo="1"></x>`))
  is(esx.renderToString`<x itemScope foo="1"></x>`, renderToString(esx`<x itemScope foo="1"></x>`))
  is(esx.renderToString`<x itemType="1" foo="1"></x>`, renderToString(esx`<x itemType="1" foo="1"></x>`))
  is(esx.renderToString`<x keyParams="1" foo="1"></x>`, renderToString(esx`<x keyParams="1" foo="1"></x>`))
  is(esx.renderToString`<x keyType="1" foo="1"></x>`, renderToString(esx`<x keyType="1" foo="1"></x>`))
  is(esx.renderToString`<x marginWidth="1" foo="1"></x>`, renderToString(esx`<x marginWidth="1" foo="1"></x>`))
  is(esx.renderToString`<x marginHeight="1" foo="1"></x>`, renderToString(esx`<x marginHeight="1" foo="1"></x>`))
  is(esx.renderToString`<x maxLength="1" foo="1"></x>`, renderToString(esx`<x maxLength="1" foo="1"></x>`))
  is(esx.renderToString`<x mediaGroup="1" foo="1"></x>`, renderToString(esx`<x mediaGroup="1" foo="1"></x>`))
  is(esx.renderToString`<x minLength="1" foo="1"></x>`, renderToString(esx`<x minLength="1" foo="1"></x>`))
  is(esx.renderToString`<x noModule foo="1"></x>`, renderToString(esx`<x noModule foo="1"></x>`))
  is(esx.renderToString`<x noValidate foo="1"></x>`, renderToString(esx`<x noValidate foo="1"></x>`))
  is(esx.renderToString`<x playsInline foo="1"></x>`, renderToString(esx`<x playsInline foo="1"></x>`))
  is(esx.renderToString`<x radioGroup="1" foo="1"></x>`, renderToString(esx`<x radioGroup="1" foo="1"></x>`))
  is(esx.renderToString`<x readOnly foo="1"></x>`, renderToString(esx`<x readOnly foo="1"></x>`))
  is(esx.renderToString`<x referrerPolicy="1" foo="1"></x>`, renderToString(esx`<x referrerPolicy="1" foo="1"></x>`))
  is(esx.renderToString`<x rowSpan="1" foo="1"></x>`, renderToString(esx`<x rowSpan="1" foo="1"></x>`))
  is(esx.renderToString`<x spellCheck="1" foo="1"></x>`, renderToString(esx`<x spellCheck="1" foo="1"></x>`))
  is(esx.renderToString`<x srcDoc="1" foo="1"></x>`, renderToString(esx`<x srcDoc="1" foo="1"></x>`))
  is(esx.renderToString`<x srcLang="1" foo="1"></x>`, renderToString(esx`<x srcLang="1" foo="1"></x>`))
  is(esx.renderToString`<x srcSet="1" foo="1"></x>`, renderToString(esx`<x srcSet="1" foo="1"></x>`))
  is(esx.renderToString`<x tabIndex="1" foo="1"></x>`, renderToString(esx`<x tabIndex="1" foo="1"></x>`))
  is(esx.renderToString`<x useMap="1" foo="1"></x>`, renderToString(esx`<x useMap="1" foo="1"></x>`))
  is(esx.renderToString`<x accentHeight="1" foo="1"></x>`, renderToString(esx`<x accentHeight="1" foo="1"></x>`))
  is(esx.renderToString`<x alignmentBaseline="1" foo="1"></x>`, renderToString(esx`<x alignmentBaseline="1" foo="1"></x>`))
  is(esx.renderToString`<x allowReorder="1" foo="1"></x>`, renderToString(esx`<x allowReorder="1" foo="1"></x>`))
  is(esx.renderToString`<x arabicForm="1" foo="1"></x>`, renderToString(esx`<x arabicForm="1" foo="1"></x>`))
  is(esx.renderToString`<x attributeName="1" foo="1"></x>`, renderToString(esx`<x attributeName="1" foo="1"></x>`))
  is(esx.renderToString`<x attributeType="1" foo="1"></x>`, renderToString(esx`<x attributeType="1" foo="1"></x>`))
  is(esx.renderToString`<x autoReverse="1" foo="1"></x>`, renderToString(esx`<x autoReverse="1" foo="1"></x>`))
  is(esx.renderToString`<x baseFrequency="1" foo="1"></x>`, renderToString(esx`<x baseFrequency="1" foo="1"></x>`))
  is(esx.renderToString`<x baselineShift="1" foo="1"></x>`, renderToString(esx`<x baselineShift="1" foo="1"></x>`))
  is(esx.renderToString`<x baseProfile="1" foo="1"></x>`, renderToString(esx`<x baseProfile="1" foo="1"></x>`))
  is(esx.renderToString`<x calcMode="1" foo="1"></x>`, renderToString(esx`<x calcMode="1" foo="1"></x>`))
  is(esx.renderToString`<x capHeight="1" foo="1"></x>`, renderToString(esx`<x capHeight="1" foo="1"></x>`))
  is(esx.renderToString`<x clipPath="1" foo="1"></x>`, renderToString(esx`<x clipPath="1" foo="1"></x>`))
  is(esx.renderToString`<x clipPathUnits="1" foo="1"></x>`, renderToString(esx`<x clipPathUnits="1" foo="1"></x>`))
  is(esx.renderToString`<x clipRule="1" foo="1"></x>`, renderToString(esx`<x clipRule="1" foo="1"></x>`))
  is(esx.renderToString`<x colorInterpolation="1" foo="1"></x>`, renderToString(esx`<x colorInterpolation="1" foo="1"></x>`))
  is(esx.renderToString`<x colorInterpolationFilters="1" foo="1"></x>`, renderToString(esx`<x colorInterpolationFilters="1" foo="1"></x>`))
  is(esx.renderToString`<x colorProfile="1" foo="1"></x>`, renderToString(esx`<x colorProfile="1" foo="1"></x>`))
  is(esx.renderToString`<x colorRendering="1" foo="1"></x>`, renderToString(esx`<x colorRendering="1" foo="1"></x>`))
  is(esx.renderToString`<x contentScriptType="1" foo="1"></x>`, renderToString(esx`<x contentScriptType="1" foo="1"></x>`))
  is(esx.renderToString`<x contentStyleType="1" foo="1"></x>`, renderToString(esx`<x contentStyleType="1" foo="1"></x>`))
  is(esx.renderToString`<x diffuseConstant="1" foo="1"></x>`, renderToString(esx`<x diffuseConstant="1" foo="1"></x>`))
  is(esx.renderToString`<x dominantBaseline="1" foo="1"></x>`, renderToString(esx`<x dominantBaseline="1" foo="1"></x>`))
  is(esx.renderToString`<x edgeMode="1" foo="1"></x>`, renderToString(esx`<x edgeMode="1" foo="1"></x>`))
  is(esx.renderToString`<x enableBackground="1" foo="1"></x>`, renderToString(esx`<x enableBackground="1" foo="1"></x>`))
  is(esx.renderToString`<x externalResourcesRequired="1" foo="1"></x>`, renderToString(esx`<x externalResourcesRequired="1" foo="1"></x>`))
  is(esx.renderToString`<x fillOpacity="1" foo="1"></x>`, renderToString(esx`<x fillOpacity="1" foo="1"></x>`))
  is(esx.renderToString`<x fillRule="1" foo="1"></x>`, renderToString(esx`<x fillRule="1" foo="1"></x>`))
  is(esx.renderToString`<x filterRes="1" foo="1"></x>`, renderToString(esx`<x filterRes="1" foo="1"></x>`))
  is(esx.renderToString`<x filterUnits="1" foo="1"></x>`, renderToString(esx`<x filterUnits="1" foo="1"></x>`))
  is(esx.renderToString`<x floodOpacity="1" foo="1"></x>`, renderToString(esx`<x floodOpacity="1" foo="1"></x>`))
  is(esx.renderToString`<x floodColor="1" foo="1"></x>`, renderToString(esx`<x floodColor="1" foo="1"></x>`))
  is(esx.renderToString`<x fontFamily="1" foo="1"></x>`, renderToString(esx`<x fontFamily="1" foo="1"></x>`))
  is(esx.renderToString`<x fontSize="1" foo="1"></x>`, renderToString(esx`<x fontSize="1" foo="1"></x>`))
  is(esx.renderToString`<x fontSizeAdjust="1" foo="1"></x>`, renderToString(esx`<x fontSizeAdjust="1" foo="1"></x>`))
  is(esx.renderToString`<x fontStretch="1" foo="1"></x>`, renderToString(esx`<x fontStretch="1" foo="1"></x>`))
  is(esx.renderToString`<x fontStyle="1" foo="1"></x>`, renderToString(esx`<x fontStyle="1" foo="1"></x>`))
  is(esx.renderToString`<x fontVariant="1" foo="1"></x>`, renderToString(esx`<x fontVariant="1" foo="1"></x>`))
  is(esx.renderToString`<x fontWeight="1" foo="1"></x>`, renderToString(esx`<x fontWeight="1" foo="1"></x>`))
  is(esx.renderToString`<x glyphName="1" foo="1"></x>`, renderToString(esx`<x glyphName="1" foo="1"></x>`))
  is(esx.renderToString`<x glyphOrientationHorizontal="1" foo="1"></x>`, renderToString(esx`<x glyphOrientationHorizontal="1" foo="1"></x>`))
  is(esx.renderToString`<x glyphOrientationVertical="1" foo="1"></x>`, renderToString(esx`<x glyphOrientationVertical="1" foo="1"></x>`))
  is(esx.renderToString`<x glyphRef="1" foo="1"></x>`, renderToString(esx`<x glyphRef="1" foo="1"></x>`))
  is(esx.renderToString`<x gradientTransform="1" foo="1"></x>`, renderToString(esx`<x gradientTransform="1" foo="1"></x>`))
  is(esx.renderToString`<x gradientUnits="1" foo="1"></x>`, renderToString(esx`<x gradientUnits="1" foo="1"></x>`))
  is(esx.renderToString`<x horizAdvX="1" foo="1"></x>`, renderToString(esx`<x horizAdvX="1" foo="1"></x>`))
  is(esx.renderToString`<x horizOriginX="1" foo="1"></x>`, renderToString(esx`<x horizOriginX="1" foo="1"></x>`))
  is(esx.renderToString`<x imageRendering="1" foo="1"></x>`, renderToString(esx`<x imageRendering="1" foo="1"></x>`))
  is(esx.renderToString`<x kernelMatrix="1" foo="1"></x>`, renderToString(esx`<x kernelMatrix="1" foo="1"></x>`))
  is(esx.renderToString`<x kernelUnitLength="1" foo="1"></x>`, renderToString(esx`<x kernelUnitLength="1" foo="1"></x>`))
  is(esx.renderToString`<x keyPoints="1" foo="1"></x>`, renderToString(esx`<x keyPoints="1" foo="1"></x>`))
  is(esx.renderToString`<x keySplines="1" foo="1"></x>`, renderToString(esx`<x keySplines="1" foo="1"></x>`))
  is(esx.renderToString`<x keyTimes="1" foo="1"></x>`, renderToString(esx`<x keyTimes="1" foo="1"></x>`))
  is(esx.renderToString`<x lengthAdjust="1" foo="1"></x>`, renderToString(esx`<x lengthAdjust="1" foo="1"></x>`))
  is(esx.renderToString`<x letterSpacing="1" foo="1"></x>`, renderToString(esx`<x letterSpacing="1" foo="1"></x>`))
  is(esx.renderToString`<x lightingColor="1" foo="1"></x>`, renderToString(esx`<x lightingColor="1" foo="1"></x>`))
  is(esx.renderToString`<x limitingConeAngle="1" foo="1"></x>`, renderToString(esx`<x limitingConeAngle="1" foo="1"></x>`))
  is(esx.renderToString`<x markerEnd="1" foo="1"></x>`, renderToString(esx`<x markerEnd="1" foo="1"></x>`))
  is(esx.renderToString`<x markerHeight="1" foo="1"></x>`, renderToString(esx`<x markerHeight="1" foo="1"></x>`))
  is(esx.renderToString`<x markerMid="1" foo="1"></x>`, renderToString(esx`<x markerMid="1" foo="1"></x>`))
  is(esx.renderToString`<x markerStart="1" foo="1"></x>`, renderToString(esx`<x markerStart="1" foo="1"></x>`))
  is(esx.renderToString`<x markerUnits="1" foo="1"></x>`, renderToString(esx`<x markerUnits="1" foo="1"></x>`))
  is(esx.renderToString`<x markerWidth="1" foo="1"></x>`, renderToString(esx`<x markerWidth="1" foo="1"></x>`))
  is(esx.renderToString`<x maskContentUnits="1" foo="1"></x>`, renderToString(esx`<x maskContentUnits="1" foo="1"></x>`))
  is(esx.renderToString`<x maskUnits="1" foo="1"></x>`, renderToString(esx`<x maskUnits="1" foo="1"></x>`))
  is(esx.renderToString`<x numOctaves="1" foo="1"></x>`, renderToString(esx`<x numOctaves="1" foo="1"></x>`))
  is(esx.renderToString`<x overlinePosition="1" foo="1"></x>`, renderToString(esx`<x overlinePosition="1" foo="1"></x>`))
  is(esx.renderToString`<x overlineThickness="1" foo="1"></x>`, renderToString(esx`<x overlineThickness="1" foo="1"></x>`))
  is(esx.renderToString`<x paintOrder="1" foo="1"></x>`, renderToString(esx`<x paintOrder="1" foo="1"></x>`))
  is(esx.renderToString`<x panose1="1" foo="1"></x>`, renderToString(esx`<x panose1="1" foo="1"></x>`))
  is(esx.renderToString`<x pathLength="1" foo="1"></x>`, renderToString(esx`<x pathLength="1" foo="1"></x>`))
  is(esx.renderToString`<x patternContentUnits="1" foo="1"></x>`, renderToString(esx`<x patternContentUnits="1" foo="1"></x>`))
  is(esx.renderToString`<x patternTransform="1" foo="1"></x>`, renderToString(esx`<x patternTransform="1" foo="1"></x>`))
  is(esx.renderToString`<x patternUnits="1" foo="1"></x>`, renderToString(esx`<x patternUnits="1" foo="1"></x>`))
  is(esx.renderToString`<x pointerEvents="1" foo="1"></x>`, renderToString(esx`<x pointerEvents="1" foo="1"></x>`))
  is(esx.renderToString`<x pointsAtX="1" foo="1"></x>`, renderToString(esx`<x pointsAtX="1" foo="1"></x>`))
  is(esx.renderToString`<x pointsAtY="1" foo="1"></x>`, renderToString(esx`<x pointsAtY="1" foo="1"></x>`))
  is(esx.renderToString`<x pointsAtZ="1" foo="1"></x>`, renderToString(esx`<x pointsAtZ="1" foo="1"></x>`))
  is(esx.renderToString`<x preserveAlpha="1" foo="1"></x>`, renderToString(esx`<x preserveAlpha="1" foo="1"></x>`))
  is(esx.renderToString`<x preserveAspectRatio="1" foo="1"></x>`, renderToString(esx`<x preserveAspectRatio="1" foo="1"></x>`))
  is(esx.renderToString`<x primitiveUnits="1" foo="1"></x>`, renderToString(esx`<x primitiveUnits="1" foo="1"></x>`))
  is(esx.renderToString`<x refX="1" foo="1"></x>`, renderToString(esx`<x refX="1" foo="1"></x>`))
  is(esx.renderToString`<x refY="1" foo="1"></x>`, renderToString(esx`<x refY="1" foo="1"></x>`))
  is(esx.renderToString`<x renderingIntent="1" foo="1"></x>`, renderToString(esx`<x renderingIntent="1" foo="1"></x>`))
  is(esx.renderToString`<x repeatCount="1" foo="1"></x>`, renderToString(esx`<x repeatCount="1" foo="1"></x>`))
  is(esx.renderToString`<x repeatDur="1" foo="1"></x>`, renderToString(esx`<x repeatDur="1" foo="1"></x>`))
  is(esx.renderToString`<x requiredExtensions="1" foo="1"></x>`, renderToString(esx`<x requiredExtensions="1" foo="1"></x>`))
  is(esx.renderToString`<x requiredFeatures="1" foo="1"></x>`, renderToString(esx`<x requiredFeatures="1" foo="1"></x>`))
  is(esx.renderToString`<x shapeRendering="1" foo="1"></x>`, renderToString(esx`<x shapeRendering="1" foo="1"></x>`))
  is(esx.renderToString`<x specularConstant="1" foo="1"></x>`, renderToString(esx`<x specularConstant="1" foo="1"></x>`))
  is(esx.renderToString`<x specularExponent="1" foo="1"></x>`, renderToString(esx`<x specularExponent="1" foo="1"></x>`))
  is(esx.renderToString`<x spreadMethod="1" foo="1"></x>`, renderToString(esx`<x spreadMethod="1" foo="1"></x>`))
  is(esx.renderToString`<x startOffset="1" foo="1"></x>`, renderToString(esx`<x startOffset="1" foo="1"></x>`))
  is(esx.renderToString`<x stdDeviation="1" foo="1"></x>`, renderToString(esx`<x stdDeviation="1" foo="1"></x>`))
  is(esx.renderToString`<x stitchTiles="1" foo="1"></x>`, renderToString(esx`<x stitchTiles="1" foo="1"></x>`))
  is(esx.renderToString`<x stopColor="1" foo="1"></x>`, renderToString(esx`<x stopColor="1" foo="1"></x>`))
  is(esx.renderToString`<x stopOpacity="1" foo="1"></x>`, renderToString(esx`<x stopOpacity="1" foo="1"></x>`))
  is(esx.renderToString`<x strikethroughPosition="1" foo="1"></x>`, renderToString(esx`<x strikethroughPosition="1" foo="1"></x>`))
  is(esx.renderToString`<x strikethroughThickness="1" foo="1"></x>`, renderToString(esx`<x strikethroughThickness="1" foo="1"></x>`))
  is(esx.renderToString`<x strokeDasharray="1" foo="1"></x>`, renderToString(esx`<x strokeDasharray="1" foo="1"></x>`))
  is(esx.renderToString`<x strokeDashoffset="1" foo="1"></x>`, renderToString(esx`<x strokeDashoffset="1" foo="1"></x>`))
  is(esx.renderToString`<x strokeLinecap="1" foo="1"></x>`, renderToString(esx`<x strokeLinecap="1" foo="1"></x>`))
  is(esx.renderToString`<x strokeLinejoin="1" foo="1"></x>`, renderToString(esx`<x strokeLinejoin="1" foo="1"></x>`))
  is(esx.renderToString`<x strokeMiterlimit="1" foo="1"></x>`, renderToString(esx`<x strokeMiterlimit="1" foo="1"></x>`))
  is(esx.renderToString`<x strokeWidth="1" foo="1"></x>`, renderToString(esx`<x strokeWidth="1" foo="1"></x>`))
  is(esx.renderToString`<x strokeOpacity="1" foo="1"></x>`, renderToString(esx`<x strokeOpacity="1" foo="1"></x>`))
  is(esx.renderToString`<x surfaceScale="1" foo="1"></x>`, renderToString(esx`<x surfaceScale="1" foo="1"></x>`))
  is(esx.renderToString`<x systemLanguage="1" foo="1"></x>`, renderToString(esx`<x systemLanguage="1" foo="1"></x>`))
  is(esx.renderToString`<x tableValues="1" foo="1"></x>`, renderToString(esx`<x tableValues="1" foo="1"></x>`))
  is(esx.renderToString`<x targetX="1" foo="1"></x>`, renderToString(esx`<x targetX="1" foo="1"></x>`))
  is(esx.renderToString`<x targetY="1" foo="1"></x>`, renderToString(esx`<x targetY="1" foo="1"></x>`))
  is(esx.renderToString`<x textAnchor="1" foo="1"></x>`, renderToString(esx`<x textAnchor="1" foo="1"></x>`))
  is(esx.renderToString`<x textDecoration="1" foo="1"></x>`, renderToString(esx`<x textDecoration="1" foo="1"></x>`))
  is(esx.renderToString`<x textLength="1" foo="1"></x>`, renderToString(esx`<x textLength="1" foo="1"></x>`))
  is(esx.renderToString`<x textRendering="1" foo="1"></x>`, renderToString(esx`<x textRendering="1" foo="1"></x>`))
  is(esx.renderToString`<x underlinePosition="1" foo="1"></x>`, renderToString(esx`<x underlinePosition="1" foo="1"></x>`))
  is(esx.renderToString`<x underlineThickness="1" foo="1"></x>`, renderToString(esx`<x underlineThickness="1" foo="1"></x>`))
  is(esx.renderToString`<x unicodeBidi="1" foo="1"></x>`, renderToString(esx`<x unicodeBidi="1" foo="1"></x>`))
  is(esx.renderToString`<x unicodeRange="1" foo="1"></x>`, renderToString(esx`<x unicodeRange="1" foo="1"></x>`))
  is(esx.renderToString`<x unitsPerEm="1" foo="1"></x>`, renderToString(esx`<x unitsPerEm="1" foo="1"></x>`))
  is(esx.renderToString`<x vAlphabetic="1" foo="1"></x>`, renderToString(esx`<x vAlphabetic="1" foo="1"></x>`))
  is(esx.renderToString`<x vectorEffect="1" foo="1"></x>`, renderToString(esx`<x vectorEffect="1" foo="1"></x>`))
  is(esx.renderToString`<x vertAdvY="1" foo="1"></x>`, renderToString(esx`<x vertAdvY="1" foo="1"></x>`))
  is(esx.renderToString`<x vertOriginX="1" foo="1"></x>`, renderToString(esx`<x vertOriginX="1" foo="1"></x>`))
  is(esx.renderToString`<x vertOriginY="1" foo="1"></x>`, renderToString(esx`<x vertOriginY="1" foo="1"></x>`))
  is(esx.renderToString`<x vHanging="1" foo="1"></x>`, renderToString(esx`<x vHanging="1" foo="1"></x>`))
  is(esx.renderToString`<x vIdeographic="1" foo="1"></x>`, renderToString(esx`<x vIdeographic="1" foo="1"></x>`))
  is(esx.renderToString`<x viewBox="1" foo="1"></x>`, renderToString(esx`<x viewBox="1" foo="1"></x>`))
  is(esx.renderToString`<x viewTarget="1" foo="1"></x>`, renderToString(esx`<x viewTarget="1" foo="1"></x>`))
  is(esx.renderToString`<x vMathematical="1" foo="1"></x>`, renderToString(esx`<x vMathematical="1" foo="1"></x>`))
  is(esx.renderToString`<x wordSpacing="1" foo="1"></x>`, renderToString(esx`<x wordSpacing="1" foo="1"></x>`))
  is(esx.renderToString`<x writingMode="1" foo="1"></x>`, renderToString(esx`<x writingMode="1" foo="1"></x>`))
  is(esx.renderToString`<x xChannelSelector="1" foo="1"></x>`, renderToString(esx`<x xChannelSelector="1" foo="1"></x>`))
  is(esx.renderToString`<x xHeight="1" foo="1"></x>`, renderToString(esx`<x xHeight="1" foo="1"></x>`))
  is(esx.renderToString`<x xlinkActuate="1" foo="1"></x>`, renderToString(esx`<x xlinkActuate="1" foo="1"></x>`))
  is(esx.renderToString`<x xlinkArcrole="1" foo="1"></x>`, renderToString(esx`<x xlinkArcrole="1" foo="1"></x>`))
  is(esx.renderToString`<x xlinkHref="1" foo="1"></x>`, renderToString(esx`<x xlinkHref="1" foo="1"></x>`))
  is(esx.renderToString`<x xlinkRole="1" foo="1"></x>`, renderToString(esx`<x xlinkRole="1" foo="1"></x>`))
  is(esx.renderToString`<x xlinkShow="1" foo="1"></x>`, renderToString(esx`<x xlinkShow="1" foo="1"></x>`))
  is(esx.renderToString`<x xlinkTitle="1" foo="1"></x>`, renderToString(esx`<x xlinkTitle="1" foo="1"></x>`))
  is(esx.renderToString`<x xlinkType="1" foo="1"></x>`, renderToString(esx`<x xlinkType="1" foo="1"></x>`))
  is(esx.renderToString`<x xmlBase="1" foo="1"></x>`, renderToString(esx`<x xmlBase="1" foo="1"></x>`))
  is(esx.renderToString`<x xmlLang="1" foo="1"></x>`, renderToString(esx`<x xmlLang="1" foo="1"></x>`))
  is(esx.renderToString`<x xmlSpace="1" foo="1"></x>`, renderToString(esx`<x xmlSpace="1" foo="1"></x>`))
  is(esx.renderToString`<x xmlnsXlink="1" foo="1"></x>`, renderToString(esx`<x xmlnsXlink="1" foo="1"></x>`))
  is(esx.renderToString`<x xmlSpace="1" foo="1"></x>`, renderToString(esx`<x xmlSpace="1" foo="1"></x>`))
  is(esx.renderToString`<x yChannelSelector="1" foo="1"></x>`, renderToString(esx`<x yChannelSelector="1" foo="1"></x>`))
  is(esx.renderToString`<x zoomAndPan="1" foo="1"></x>`, renderToString(esx`<x zoomAndPan="1" foo="1"></x>`))
})

test('spread props are converted to special case equivalents (or not) as neccessary', async ({ is }) => {
  const esx = init()
  const props = {
    acceptCharset: 1,
    accessKey: 1,
    autoCapitalize: 1,
    autoComplete: 1,
    autoCorrect: 1,
    autoFocus: true,
    autoPlay: true,
    autoSave: 1,
    cellPadding: 1,
    cellSpacing: 1,
    charSet: 1,
    classID: 1,
    colSpan: 1,
    contentEditable: 1,
    contextMenu: 1,
    controlsList: 1,
    crossOrigin: 1,
    dateTime: 1,
    encType: 1,
    formMethod: 1,
    formAction: 1,
    formEncType: 1,
    formNoValidate: true,
    formTarget: 1,
    frameBorder: 1,
    hrefLang: 1,
    inputMode: 1,
    itemID: 1,
    itemProp: 1,
    itemRef: 1,
    itemScope: true,
    itemType: 1,
    keyParams: 1,
    keyType: 1,
    marginWidth: 1,
    marginHeight: 1,
    maxLength: 1,
    mediaGroup: 1,
    minLength: 1,
    noModule: true,
    noValidate: true,
    playsInline: true,
    radioGroup: 1,
    readOnly: true,
    referrerPolicy: 1,
    rowSpan: 1,
    spellCheck: 1,
    srcDoc: 1,
    srcLang: 1,
    srcSet: 1,
    tabIndex: 1,
    useMap: 1,
    accentHeight: 1,
    alignmentBaseline: 1,
    allowReorder: 1,
    arabicForm: 1,
    attributeName: 1,
    attributeType: 1,
    autoReverse: 1,
    baseFrequency: 1,
    baselineShift: 1,
    baseProfile: 1,
    calcMode: 1,
    capHeight: 1,
    clipPath: 1,
    clipPathUnits: 1,
    clipRule: 1,
    colorInterpolation: 1,
    colorInterpolationFilters: 1,
    colorProfile: 1,
    colorRendering: 1,
    contentScriptType: 1,
    contentStyleType: 1,
    diffuseConstant: 1,
    dominantBaseline: 1,
    edgeMode: 1,
    enableBackground: 1,
    externalResourcesRequired: 1,
    fillOpacity: 1,
    fillRule: 1,
    filterRes: 1,
    filterUnits: 1,
    floodOpacity: 1,
    floodColor: 1,
    fontFamily: 1,
    fontSize: 1,
    fontSizeAdjust: 1,
    fontStretch: 1,
    fontStyle: 1,
    fontVariant: 1,
    fontWeight: 1,
    glyphName: 1,
    glyphOrientationHorizontal: 1,
    glyphOrientationVertical: 1,
    glyphRef: 1,
    gradientTransform: 1,
    gradientUnits: 1,
    horizAdvX: 1,
    horizOriginX: 1,
    imageRendering: 1,
    kernelMatrix: 1,
    kernelUnitLength: 1,
    keyPoints: 1,
    keySplines: 1,
    keyTimes: 1,
    lengthAdjust: 1,
    letterSpacing: 1,
    lightingColor: 1,
    limitingConeAngle: 1,
    markerEnd: 1,
    markerHeight: 1,
    markerMid: 1,
    markerStart: 1,
    markerUnits: 1,
    markerWidth: 1,
    maskContentUnits: 1,
    maskUnits: 1,
    numOctaves: 1,
    overlinePosition: 1,
    overlineThickness: 1,
    paintOrder: 1,
    panose1: 1,
    pathLength: 1,
    patternContentUnits: 1,
    patternTransform: 1,
    patternUnits: 1,
    pointerEvents: 1,
    pointsAtX: 1,
    pointsAtY: 1,
    pointsAtZ: 1,
    preserveAlpha: 1,
    preserveAspectRatio: 1,
    primitiveUnits: 1,
    refX: 1,
    refY: 1,
    renderingIntent: 1,
    repeatCount: 1,
    repeatDur: 1,
    requiredExtensions: 1,
    requiredFeatures: 1,
    shapeRendering: 1,
    specularConstant: 1,
    specularExponent: 1,
    spreadMethod: 1,
    startOffset: 1,
    stdDeviation: 1,
    stitchTiles: 1,
    stopColor: 1,
    stopOpacity: 1,
    strikethroughPosition: 1,
    strikethroughThickness: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1,
    strokeLinecap: 1,
    strokeLinejoin: 1,
    strokeMiterlimit: 1,
    strokeWidth: 1,
    strokeOpacity: 1,
    surfaceScale: 1,
    systemLanguage: 1,
    tableValues: 1,
    targetX: 1,
    targetY: 1,
    textAnchor: 1,
    textDecoration: 1,
    textLength: 1,
    textRendering: 1,
    underlinePosition: 1,
    underlineThickness: 1,
    unicodeBidi: 1,
    unicodeRange: 1,
    unitsPerEm: 1,
    vAlphabetic: 1,
    vectorEffect: 1,
    vertAdvY: 1,
    vertOriginX: 1,
    vertOriginY: 1,
    vHanging: 1,
    vIdeographic: 1,
    viewBox: 1,
    viewTarget: 1,
    vMathematical: 1,
    wordSpacing: 1,
    writingMode: 1,
    xChannelSelector: 1,
    xHeight: 1,
    xlinkActuate: 1,
    xlinkArcrole: 1,
    xlinkHref: 1,
    xlinkRole: 1,
    xlinkShow: 1,
    xlinkTitle: 1,
    xlinkType: 1,
    xmlBase: 1,
    xmlLang: 1,
    xmlSpace: 1,
    xmlnsXlink: 1,
    yChannelSelector: 1,
    zoomAndPan: 1
  }
  is(esx.renderToString`<x ...${props}></x>`, renderToString(esx`<x ...${props}></x>`))
})

test('null value attributes', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<img x=${null}/>`, renderToString(esx`<img x=${null}/>`))
})

test('undefined value attributes', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<img x=${undefined}/>`, renderToString(esx`<img x=${undefined}/>`))
})

test('attribute single quotes are converted to double quotes', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<img src='http://example.com'/>`, renderToString(esx`<img src='http://example.com'/>`))
})

test('expects corresponding closing tag, as with JSX compilation', async ({ throws }) => {
  const esx = init()
  const Component = () => {
    return esx`<div>loaded</span>`
  }
  esx.register({ Component })
  throws(() => esx.renderToString`<Component/>`, SyntaxError('Expected corresponding ESX closing tag for <div>'))
})

test('whitespace variations', async ({ is }) => {
  const esx = init()
  is(esx.renderToString`<img  src="http://example.com"/>`, renderToString(esx`<img  src="http://example.com"/>`))
  is(esx.renderToString`<img src="http://example.com" />`, renderToString(esx`<img src="http://example.com" />`))
  is(esx.renderToString`<p><img src="http://example.com" /></p>`, renderToString(esx`<p><img src="http://example.com" /></p>`))
  is(esx.renderToString`<p ><a > <img src="http://example.com"/></a></p>`, renderToString(esx`<p ><a > <img src="http://example.com"/></a></p>`))
  is(esx.renderToString`<p    >     <a     >    <img src="http://example.com"/></a></p>`, renderToString(esx`<p    >     <a     >    <img src="http://example.com"/></a></p>`))
  is(esx.renderToString`<p ><a > <img src="http://example.com"/></ a></p >`, renderToString(esx`<p ><a > <img src="http://example.com"/></ a></p >`))
  is(esx.renderToString`<p ><a > <img src="http://example.com"/></     a></    p     >`, renderToString(esx`<p ><a > <img src="http://example.com"/></     a></    p     >`))
  is(esx.renderToString`<img src="http://example.com"  />`, renderToString(esx`<img src="http://example.com"  />`))
  is(esx.renderToString`<    p    ></p>`, renderToString(esx`<    p    ></p>`))
  is(esx.renderToString`<p>      xyz        </p>`, renderToString(esx`<p>      xyz        </p>`))
  is(esx.renderToString`<p>      <span>   \nxyz    </span>        </p>`, renderToString(esx`<p>      <span>   \nxyz    </span>        </p>`))
  is(
    esx.renderToString`
      <p>
        <span>   xyz    </span>
      </p>
    `,
    renderToString(esx`
      <p>
        <span>   xyz    </span>
      </p>
    `)
  )
  is(esx.renderToString`<img  src=${'http://example.com'}/>`, renderToString(esx`<img  src=${'http://example.com'}/>`))
  is(esx.renderToString`<img src=${'http://example.com'} />`, renderToString(esx`<img src=${'http://example.com'} />`))
  is(esx.renderToString`<p><img src=${'http://example.com'} /></p>`, renderToString(esx`<p><img src=${'http://example.com'} /></p>`))
  is(esx.renderToString`<p ><a > <img src=${'http://example.com'}/></a></p>`, renderToString(esx`<p ><a > <img src=${'http://example.com'}/></a></p>`))
  is(esx.renderToString`<p    >     <a     >    <img src=${'http://example.com'}/></a></p>`, renderToString(esx`<p    >     <a     >    <img src=${'http://example.com'}/></a></p>`))
  is(esx.renderToString`<p ><a > <img src=${'http://example.com'}/></ a></p >`, renderToString(esx`<p ><a > <img src=${'http://example.com'}/></ a></p >`))
  is(esx.renderToString`<p ><a > <img src=${'http://example.com'}/></     a></    p     >`, renderToString(esx`<p ><a > <img src=${'http://example.com'}/></     a></    p     >`))
  is(esx.renderToString`<img src=${'http://example.com'}  />`, renderToString(esx`<img src=${'http://example.com'}  />`))
  is(esx.renderToString`<img   key="1" src=${'http://example.com'}/>`, renderToString(esx`<img   key="1" src=${'http://example.com'}/>`))
  is(esx.renderToString`<img   ref=${'1'} src=${'http://example.com'}/>`, renderToString(esx`<img   ref=${'1'} src=${'http://example.com'}/>`))
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`<p><Toolbar /></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`<p><Toolbar ></Toolbar></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`<p><Toolbar></ Toolbar></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`<p><Toolbar></Toolbar ></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`<p>< Toolbar></Toolbar ></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`<p><Toolbar> </Toolbar ></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`<p>< Toolbar > < /Toolbar ></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`<p><Toolbar></Toolbar></p>`
    })
    is(esx.renderToString`<App />`, renderToString(esx`<App />`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`<p><Toolbar></Toolbar></p>`
    })
    is(esx.renderToString`< App/>`, renderToString(esx`< App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a >hi</a>`,
      App: () => esx`<p><Toolbar></Toolbar></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a >`,
      App: () => esx`<p><Toolbar></Toolbar></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a >hi</ a>`,
      App: () => esx`<p><Toolbar></Toolbar></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`<div><a></ a><p><Toolbar/></p></div>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`<div><a ></a><p><Toolbar/></p></div>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`<div><a></a ><p><Toolbar/></p></div>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>
        hi
      </a>`,
      App: () => esx`<p><Toolbar></Toolbar></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`
        <p>
          <Toolbar>
          </Toolbar>
        </p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`<p>
          <Toolbar>
          </Toolbar>
        </p>
      `
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: () => esx`<a>hi</a>`,
      App: () => esx`
        <p>
          <Toolbar/>
        </p>
      `
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`<p><Toolbar x=${'hi'}/></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`<p><Toolbar x=${'hi'} ></Toolbar></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`<p><Toolbar x=${'hi'}></ Toolbar></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`<p><Toolbar x=${'hi'}></Toolbar ></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`<p>< Toolbar x=${'hi'}></Toolbar ></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`<p><Toolbar x=${'hi'}> </Toolbar ></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`<p>< Toolbar x=${'hi'} > < /Toolbar ></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a >${x}</a>`,
      App: () => esx`<p><Toolbar x=${'hi'}></Toolbar></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a >`,
      App: () => esx`<p><Toolbar x=${'hi'}></Toolbar></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a >${x}</ a>`,
      App: () => esx`<p><Toolbar x=${'hi'}></Toolbar></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`<div><a></ a><p><Toolbar x=${'hi'}/></p></div>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`<div><a ></a><p><Toolbar x=${'hi'}/></p></div>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`<div><a></a ><p><Toolbar x=${'hi'}/></p></div>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>
        ${x}
      </a>`,
      App: () => esx`<p><Toolbar x=${'hi'}></Toolbar></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`
        <p>
          <Toolbar x=${'hi'}>
          </Toolbar>
        </p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`<p>
          <Toolbar x=${'hi'}>
          </Toolbar>
        </p>
      `
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`
        <p>
          <Toolbar x=${'hi'}/>
        </p>
      `
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`<p><Toolbar y="1"   x=${'hi'}></Toolbar></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  {
    const esx = init({
      Toolbar: ({ x }) => esx`<a>${x}</a>`,
      App: () => esx`<p><Toolbar x=${'hi'}  y="1"  ></Toolbar></p>`
    })
    is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  }
  is(esx.renderToString`<img />`, renderToString(esx`<img />`))
  is(esx.renderToString`<img >`, renderToString(esx`<img >`))
  is(esx.renderToString`<img ></img>`, renderToString(esx`<img ></img>`))
  is(esx.renderToString`<div ></div>`, renderToString(esx`<div ></div>`))
  is(esx.renderToString`<div />`, renderToString(esx`<div />`))
})

test('props.children.props.children of dynamic component with multiple component children peers to multiple static element children containing interpolated values within at varied nesting depths as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({ value, children }) => {
    childTest.register(children.props.children)
    return esx`<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx`<a>test1</a>`
  const C = () => esx`<a>test3</a>`
  esx.register({ A, B, C })
  const App = () => esx`<A value=${'a'}><p><div>${'test0'}</div><B/><a href=${'interpolatedprop'}>${'test2'}</a><div><C/></div></p></A>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('clone element', async ({ is }) => {
  const esx = init()
  const Wrap = ({ children }) => React.cloneElement(children)
  esx.register({ Wrap })
  const App = () => esx`<main><Wrap><div path='/'>hi</div></Wrap></main>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('clone cloned element', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  const Wrap = ({ children }) => {
    return React.cloneElement(React.cloneElement(children))
  }
  esx.register({ Wrap })
  const App = () => esx`<main><Wrap><div path='/'>hi</div></Wrap></main>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('clone element extend props', async ({ is }) => {
  const esx = init()
  const Wrap = ({ children }) => React.cloneElement(children, { a: 1, b: true, c: false })
  esx.register({ Wrap })
  const App = () => esx`<main><Wrap><div path='/'>hi</div></Wrap></main>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('clone element replace props', async ({ is }) => {
  const esx = init()
  const Wrap = ({ children }) => React.cloneElement(children, { x: 1, y: 3, path: '/foo', defaultValue: 'blah' })
  esx.register({ Wrap })
  const App = () => esx`<main><Wrap><div path='/' y='2'>hi</div></Wrap></main>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('clone element replace children', async ({ is }) => {
  const esx = init()
  const Wrap = ({ children }) => React.cloneElement(children, null, 'test')
  esx.register({ Wrap })
  const App = () => esx`<main><Wrap><div path='/'>hi</div></Wrap></main>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('clone element extend props and replace children', async ({ is }) => {
  const esx = init()
  const Wrap = ({ children }) => React.cloneElement(children, { a: 1 }, 'test')
  esx.register({ Wrap })
  const App = () => esx`<main><Wrap><div path='/'>hi</div></Wrap></main>`
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('clone element in consumer child renderer', async ({ is }) => {
  const esx = init()
  const { Consumer } = React.createContext()
  esx.register({ Consumer })
  class Wrap extends React.Component {
    render () {
      return esx`
        <Consumer>
          ${() => React.cloneElement(this.props.children)}
        </Consumer>
      `
    }
  }
  esx.register({ Wrap })
  class App extends React.Component {
    render () {
      return esx`<main><Wrap><div path='/'>hi</div></Wrap></main>`
    }
  }
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('clone provider wrapper in consumer child renderer', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  class WrapProvider extends React.Component {
    render () {
      return esx`<Provider>${this.props.children}</Provider>`
    }
  }
  class WrapConsumer extends React.Component {
    render () {
      return esx`
        <Consumer>
          ${() => React.cloneElement(this.props.children)}
        </Consumer>
      `
    }
  }
  esx.register({ WrapConsumer, WrapProvider })
  class App extends React.Component {
    render () {
      return esx`<main><WrapConsumer><WrapProvider path='/'>hi</WrapProvider></WrapConsumer></main>`
    }
  }
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('clone provider wrapper that uses createElement in consumer child renderer', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  class WrapProvider extends React.Component {
    render () {
      return createElement(Provider, null, this.props.children)
    }
  }
  class WrapConsumer extends React.Component {
    render () {
      return esx`
        <Consumer>
          ${() => React.cloneElement(this.props.children)}
        </Consumer>
      `
    }
  }
  esx.register({ WrapConsumer, WrapProvider })
  class App extends React.Component {
    render () {
      return esx`<main><WrapConsumer><WrapProvider path='/'>hi</WrapProvider></WrapConsumer></main>`
    }
  }
  esx.register({ App })
  is(!!esx.renderToString`<App/>`, true)
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('outer provider wraps clone provider wrapper that uses createElement in consumer child renderer', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  class WrapProvider extends React.Component {
    render () {
      return createElement(Provider, null, this.props.children)
    }
  }
  class WrapConsumer extends React.Component {
    render () {
      return esx`
        <Consumer>
          ${() => React.cloneElement(this.props.children)}
        </Consumer>
      `
    }
  }
  esx.register({ WrapConsumer, WrapProvider })
  class App extends React.Component {
    render () {
      return esx`<WrapProvider><WrapConsumer><WrapProvider path='/'>hi</WrapProvider></WrapConsumer></WrapProvider>`
    }
  }
  esx.register({ App })
  is(!!esx.renderToString`<App/>`, true)
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('clone provider wrapper that uses createElement in consumer child renderer whose wrapper uses createElement', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  class WrapProvider extends React.Component {
    render () {
      return createElement(Provider, null, this.props.children)
    }
  }
  class WrapConsumer extends React.Component {
    render () {
      return createElement(Consumer, null, () => {
        return React.cloneElement(this.props.children)
      })
    }
  }
  esx.register({ WrapConsumer, WrapProvider })
  class App extends React.Component {
    render () {
      return esx`<main><WrapConsumer><WrapProvider path='/'>hi</WrapProvider></WrapConsumer></main>`
    }
  }
  esx.register({ App })
  is(!!esx.renderToString`<App/>`, true)
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('clone provider wrapper that uses createElement in consumer child renderer whose wrapper uses createElement', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  class WrapProvider extends React.Component {
    render () {
      return createElement(Provider, null, this.props.children)
    }
  }
  class WrapConsumer extends React.Component {
    render () {
      return createElement(Consumer, null, () => {
        return React.cloneElement(this.props.children)
      })
    }
  }
  esx.register({ WrapConsumer, WrapProvider })
  class App extends React.Component {
    render () {
      return esx`<main><WrapConsumer><WrapProvider path='/'>hi</WrapProvider></WrapConsumer></main>`
    }
  }
  esx.register({ App })
  is(!!esx.renderToString`<App/>`, true)
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('outer provider wraps clone provider wrapper that uses createElement in consumer child renderer whose wrapper uses createElement', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  class WrapProvider extends React.Component {
    render () {
      return createElement(Provider, null, this.props.children)
    }
  }
  class WrapConsumer extends React.Component {
    render () {
      return createElement(Consumer, null, () => {
        return React.cloneElement(this.props.children)
      })
    }
  }
  esx.register({ WrapConsumer, WrapProvider })
  class App extends React.Component {
    render () {
      return esx`<WrapProvider><WrapConsumer><WrapProvider path='/'>hi</WrapProvider></WrapConsumer></WrapProvider>`
    }
  }
  esx.register({ App })
  is(!!esx.renderToString`<App/>`, true)
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('outer provider wraps clone provider wrapper that uses createElement in consumer child renderer whose wrapper uses createElement', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  class WrapProvider extends React.Component {
    render () {
      return createElement(Provider, null, this.props.children)
    }
  }
  class WrapConsumer extends React.Component {
    render () {
      return createElement(Consumer, null, () => {
        return React.cloneElement(this.props.children)
      })
    }
  }
  esx.register({ WrapConsumer, WrapProvider })
  class App extends React.Component {
    render () {
      return esx`<WrapProvider><WrapConsumer><WrapProvider path='/'>hi</WrapProvider></WrapConsumer></WrapProvider>`
    }
  }
  esx.register({ App })
  is(!!esx.renderToString`<App/>`, true)
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('outer provider wraps children, consumer child renderer clones its children, which is a wrapper of a consumer with a child render function that returns a provider that instantiates a component passed via an attribute on the outer provider wraper', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  class Router extends React.Component {
    render () {
      return createElement(Provider, null, this.props.children)
    }
  }
  class Route extends React.Component {
    render () {
      return createElement(Consumer, null, () => {
        const { component } = this.props
        return createElement(Provider, { value: this.props }, createElement(component, this.props))
      })
    }
  }
  class Switch extends React.Component {
    render () {
      return createElement(Consumer, null, () => {
        return React.cloneElement(this.props.children)
      })
    }
  }
  esx.register({ Switch, Router, Route })
  const Cmp = () => esx`<p>test</p>`
  class App extends React.Component {
    render () {
      return esx`<Router><Switch><Route path='/' component=${Cmp}/></Switch></Router>`
    }
  }
  esx.register({ App })
  is(!!esx.renderToString`<App/>`, true)
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('outer provider wraps children, consumer child renderer clones its children, which is a multiple instances of a wrapper of a consumer with a child render function that returns a provider that instantiates a component passed via an attribute on the outer provider wraper using criteria based on the outer providers context and the inner wrapper components properties (this is a react-router simulation)', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  class Router extends React.Component {
    render () {
      return esx`<Provider value=${this.props} children=${this.props.children}/>`
    }
  }
  class Route extends React.Component {
    render () {
      return createElement(Consumer, null, () => {
        const { component } = this.props
        return createElement(Provider, { value: this.props }, createElement(component, this.props))
      })
    }
  }
  class Switch extends React.Component {
    render () {
      return esx`
      <Consumer>
        ${(context) => {
    const { location } = context
    var match = null
    React.Children.forEach(this.props.children, (child) => {
      if (child.props.path === location) match = child
    })
    if (match === null) console.log(this)
    return React.cloneElement(match)
  }}
      </Consumer>
      `
    }
  }
  esx.register({ Switch, Router, Route })
  const Cmp1 = () => esx`<p>test1</p>`
  const Cmp2 = () => esx`<p>test2</p>`
  class App extends React.Component {
    render () {
      const { location } = this.props
      return esx`<Router location=${location}><Switch><Route path='/a' component=${Cmp1}/><Route path='/b' component=${Cmp2}/></Switch></Router>`
    }
  }
  esx.register({ App })
  is(!!esx.renderToString`<App location='/a'/>`, true)
  is(!!esx.renderToString`<App location='/a'/>`, true)
  is(esx.renderToString`<App location='/a'/>`, renderToString(esx`<App location='/a'/>`))
  is(esx.renderToString`<App location='/b'/>`, renderToString(esx`<App location='/b'/>`))
})

test('correct state: children passed through a children of provider are consistent when renderToString and esx.renderToString are called multiple times', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  class Wrap extends React.Component {
    render () {
      return esx`<Provider value=${this.props}>${this.props.children}</Provider>`
    }
  }
  class App extends React.Component {
    render () {
      return esx`<div><Wrap><div>hi</div></Wrap></div>`
    }
  }
  esx.register({ App, Wrap })
  const output = renderToString(esx`<App/>`)
  is(esx.renderToString`<App/>`, output)
  is(renderToString(esx`<App/>`), output)
  is(esx.renderToString`<App/>`, output)
})

test('correct state: children passed through providers children attribute are consistent when renderToString and esx.renderToString are called multiple times', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  class Wrap extends React.Component {
    render () {
      return esx`<Provider value=${this.props} children=${this.props.children}/>`
    }
  }
  class App extends React.Component {
    render () {
      return esx`<div><Wrap><div>hi</div></Wrap></div>`
    }
  }
  esx.register({ App, Wrap })
  const output = renderToString(esx`<App/>`)
  is(esx.renderToString`<App/>`, output)
  is(renderToString(esx`<App/>`), output)
  is(esx.renderToString`<App/>`, output)
})

test('correct state: multiple children passed through providers children attribute are consistent when renderToString and esx.renderToString are called multiple times', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  class Wrap extends React.Component {
    render () {
      return esx`<Provider value=${this.props} children=${this.props.children}/>`
    }
  }
  class App extends React.Component {
    render () {
      return esx`<div><Wrap><div>a</div><div>b</div></Wrap></div>`
    }
  }
  esx.register({ App, Wrap })
  const output = renderToString(esx`<App/>`)
  is(esx.renderToString`<App/>`, output)
  is(renderToString(esx`<App/>`), output)
  is(esx.renderToString`<App/>`, output)
})

test('correct state: children passed through a children of provider instantiatred with createElement are consistent when renderToString and esx.renderToString are called multiple times', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  class Wrap extends React.Component {
    render () {
      return createElement(Provider, { value: this.props, children: this.props.children })
    }
  }
  class App extends React.Component {
    render () {
      return esx`<div><Wrap><div>hi</div></Wrap></div>`
    }
  }
  esx.register({ App, Wrap })
  const output = renderToString(esx`<App/>`)
  is(esx.renderToString`<App/>`, output)
  is(renderToString(esx`<App/>`), output)
  is(esx.renderToString`<App/>`, output)
})

test('implemented with createElement, outer provider wraps children, consumer child renderer clones its children, which is a multiple instances of a wrapper of a consumer with a child render function that returns a provider that instantiates a component passed via an attribute on the outer provider wraper using criteria based on the outer providers context and the inner wrapper components properties (this is a react-router simulation)', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext()
  esx.register({ Consumer, Provider })
  class Router extends React.Component {
    render () {
      return createElement(Provider, { value: this.props }, this.props.children)
    }
  }
  class Route extends React.Component {
    render () {
      return createElement(Consumer, null, () => {
        const { component } = this.props
        return createElement(Provider, { value: this.props }, createElement(component, this.props))
      })
    }
  }
  class Switch extends React.Component {
    render () {
      return createElement(Consumer, null, (context) => {
        const { location } = context
        var match = null
        React.Children.forEach(this.props.children, (child) => {
          if (child.props.path === location) match = child
        })
        return React.cloneElement(match)
      })
    }
  }
  esx.register({ Switch, Router, Route })
  const Cmp1 = () => esx`<p>test1</p>`
  const Cmp2 = () => esx`<p>test2</p>`
  class App extends React.Component {
    render () {
      const { location } = this.props
      return esx`<Router location=${location}><Switch><Route path='/a' component=${Cmp1}/><Route path='/b' component=${Cmp2}/></Switch></Router>`
    }
  }
  esx.register({ App })
  is(!!esx.renderToString`<App location='/a'/>`, true)
  is(!!esx.renderToString`<App location='/b'/>`, true)
  is(esx.renderToString`<App location='/a'/>`, renderToString(esx`<App location='/a'/>`))
  is(esx.renderToString`<App location='/b'/>`, renderToString(esx`<App location='/b'/>`))
})

test('renderToString can accept esx elements', async ({ is, throws }) => {
  const esx = init()
  const app = esx`<div>test</div>`
  is(esx.renderToString(app), renderToString(app))
})

test('renderToString will throw when passed plain React elements', async ({ is, throws }) => {
  const esx = init()
  throws(() => esx.renderToString(createElement('div', null, 'test')), Error('esx.renderToString is either a tag function or can accept esx elements. But not plain React elements.'))
})

test('compatible mode hooks: useState ', async ({ doesNotThrow, is }) => {
  const esx = init()
  const { useState } = React
  var updater = null
  const App = () => {
    const [ state, update ] = useState('initialState')
    is(state, 'initialState')
    is(typeof update, 'function')
    updater = update
    return esx`<main><div>${state}</div></main>`
  }
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  updater('newState') // will do nothing in react ssr
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('compatible mode hooks: useReducer', async ({ is }) => {
  const esx = init()
  const { useReducer } = React
  const initialState = { count: 0 }
  const reducer = (state, action) => {
    var { count } = state
    if (action.type === 'up') return { count: ++count }
    if (action.type === 'down') return { count: --count }
    return state
  }
  var dispatcher = null
  const App = () => {
    const [state, dispatch] = useReducer(reducer, initialState)
    dispatcher = dispatch
    return esx`<main><div>${state.count}</div></main>`
  }
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  dispatcher({ type: 'up' }) // will do nothing in react ssr
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('compatible mode hooks: useReducer, state initializer', async ({ is }) => {
  const esx = init()
  const { useReducer } = React
  function initState (initialState) {
    return { count: initialState.count + 1 }
  }
  const reducer = (state, action) => {
    var { count } = state
    if (action.type === 'up') return { count: ++count }
    if (action.type === 'down') return { count: --count }
    return state
  }
  var dispatcher = null
  const App = () => {
    const [state, dispatch] = useReducer(reducer, { count: -1 }, initState)
    dispatcher = dispatch
    return esx`<main><div>${state.count}</div></main>`
  }
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  dispatcher({ type: 'up' }) // will do nothing in react ssr
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`)) // will contain 0 because of initState func
})

test('compatible mode hooks: useEffect does not throw  (noop)', async ({ doesNotThrow }) => {
  const esx = init()
  const { useEffect } = React
  const App = () => {
    useEffect(() => {})
    return esx`<main><div>hi</div></main>`
  }
  esx.register({ App })

  doesNotThrow(() => esx.renderToString`<App/>`)
  doesNotThrow(() => renderToString(esx`<App/>`))
})

test('compatible mode hooks: useLayoutEffect does not throw  (noop)', async ({ doesNotThrow }) => {
  const esx = init()
  const { useLayoutEffect } = React
  const App = () => {
    useLayoutEffect(() => {})
    return esx`<main><div>hi</div></main>`
  }
  esx.register({ App })

  doesNotThrow(() => esx.renderToString`<App/>`)
  doesNotThrow(() => renderToString(esx`<App/>`))
})

test('compatible mode hooks: useContext', async ({ is }) => {
  const esx = init()
  const { useContext } = require('react')
  const ThemeContext = React.createContext('light')
  const Button = ({ theme }) => esx`<button>${theme}</button>`
  esx.register({ Button })
  const ThemedButton = () => {
    const context = useContext(ThemeContext)
    return esx`<Button theme=${context}/>`
  }
  esx.register({ ThemedButton })
  const Toolbar = () => esx`<div><ThemedButton/></div>`
  esx.register({ Toolbar })
  class App extends React.Component {
    render () {
      return esx`<div><Provider value='dark'><Toolbar/></Provider></div>`
    }
  }
  const { Provider } = ThemeContext
  esx.register({ App, Provider })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('compatible mode hooks: useContext in a plain react element with esx provider', async ({ is }) => {
  const esx = init()
  const { useContext } = require('react')
  const ThemeContext = React.createContext('light')
  const Button = ({ theme }) => createElement('button', null, theme)
  esx.register({ Button })
  const ThemedButton = () => {
    const context = useContext(ThemeContext)
    return createElement(Button, { theme: context })
  }
  esx.register({ ThemedButton })
  const Toolbar = () => createElement('div', null, createElement(ThemedButton))
  esx.register({ Toolbar })
  class App extends React.Component {
    render () {
      return esx`<div><Provider value='dark'><Toolbar/></Provider></div>`
    }
  }
  const { Provider } = ThemeContext
  esx.register({ App, Provider })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('compatible mode hooks: useContext all plain react elements except root', async ({ is }) => {
  const esx = init()
  const { useContext } = require('react')
  const ThemeContext = React.createContext('light')
  const Button = ({ theme }) => createElement('button', null, theme)
  esx.register({ Button })
  const ThemedButton = () => {
    const context = useContext(ThemeContext)
    return createElement(Button, { theme: context })
  }
  esx.register({ ThemedButton })
  const Toolbar = () => createElement('div', null, createElement(ThemedButton))
  esx.register({ Toolbar })
  class App extends React.Component {
    render () {
      return createElement('div', null, createElement(Provider, { value: 'dark' }, createElement(Toolbar)))
    }
  }
  const { Provider } = ThemeContext
  esx.register({ App, Provider })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
})

test('compatible mode hooks: useMemo', async ({ is }) => {
  const esx = init()

  // useMemo react SSR implementation *does not memoize* the result
  // esx compatible mode follows suit

  const { useMemo } = React
  const calc = (a, b) => Number(a) + Number(b)
  const App = ({ a, b }) => {
    const val = useMemo(() => calc(a, b), [a, b])
    return esx`<main><div>${val}</div></main>`
  }
  esx.register({ App })

  is(esx.renderToString`<App a="1" b="2"/>`, renderToString(esx`<App a="1" b="2"/>`))
})

test('compatible mode hooks: useRef', async ({ is }) => {
  const esx = init()
  const { useRef } = React

  // in the browser the ref object is always the same,
  // however on the server it is not the same object,
  // esx is compatible with react ssr, so the object will
  // be different each time.

  const App = () => {
    const ref = useRef(null)
    return esx`<main ref=${ref}><div>hi</div></main>`
  }
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('compatible mode hooks: useCallback', async ({ is }) => {
  const esx = init()
  const { useCallback } = React
  const cb = () => {}
  const App = () => {
    is(useCallback(cb), cb) // react simply returns the cb in ssr
    return esx`<main><p>hi</p></main>`
  }
  esx.register({ App })

  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
})

test('stateful mode hooks: useState ', async ({ doesNotThrow, is }) => {
  init.ssr.option('hooks-mode', 'stateful')
  const esx = init()
  const { useState } = React
  var updater = null
  const App = () => {
    const [ state, update ] = useState('initialState')
    is(typeof update, 'function')
    updater = update
    return esx`<p>${state}</p>`
  }
  esx.register({ App })

  // keep the same callsite:
  const ssr = () => esx.renderToString`<App/>`
  is(ssr(), '<p data-reactroot="">initialState</p>')
  updater('newState')
  is(ssr(), '<p data-reactroot="">newState</p>')
  init.ssr.option('hooks-mode', 'compatible')
})

test('stateful mode hooks: useState multiple ', async ({ doesNotThrow, is }) => {
  init.ssr.option('hooks-mode', 'stateful')
  const esx = init()
  const { useState } = React
  var updater = null
  var updater2 = null
  const App = () => {
    const [ state, update ] = useState('initialState')
    const [ state2, update2 ] = useState('initialState2')
    is(typeof update, 'function')
    is(typeof update2, 'function')
    updater = update
    updater2 = update2
    return esx`<p><a>${state}</a><b>${state2}</b></p>`
  }
  esx.register({ App })

  // keep the same callsite:
  const ssr = () => esx.renderToString`<App/>`
  is(ssr(), '<p data-reactroot=""><a>initialState</a><b>initialState2</b></p>')
  updater('newState')
  is(ssr(), '<p data-reactroot=""><a>newState</a><b>initialState2</b></p>')
  updater('evenNewerState')
  updater2('secondNewState')
  is(ssr(), '<p data-reactroot=""><a>evenNewerState</a><b>secondNewState</b></p>')
  init.ssr.option('hooks-mode', 'compatible')
})

test('stateful mode hooks: useReducer', async ({ is }) => {
  init.ssr.option('hooks-mode', 'stateful')
  const esx = init()
  const { useReducer } = React
  const initialState = { count: 0 }
  const reducer = (state, action) => {
    const { count } = state
    if (action.type === 'up') return { count: count + 1 }
    if (action.type === 'down') return { count: count - 1 }
    return state
  }
  var dispatcher = null
  const App = () => {
    const [state, dispatch] = useReducer(reducer, initialState)
    dispatcher = dispatch
    return esx`<main><div>${state.count}</div></main>`
  }
  esx.register({ App })
  // keep the same callsite:
  const ssr = () => esx.renderToString`<App/>`
  is(ssr(), `<main data-reactroot=""><div>0</div></main>`)
  dispatcher({ type: 'up' })
  is(ssr(), `<main data-reactroot=""><div>1</div></main>`)
  init.ssr.option('hooks-mode', 'compatible')
})

test('stateful mode hooks: useReducer, state initializer', async ({ is }) => {
  init.ssr.option('hooks-mode', 'stateful')
  const esx = init()
  const { useReducer } = React
  function initState (initialState) {
    return { count: initialState.count + 1 }
  }
  const reducer = (state, action) => {
    const { count } = state
    if (action.type === 'up') return { count: count + 1 }
    if (action.type === 'down') return { count: count - 1 }
    return state
  }
  var dispatcher = null
  const App = () => {
    const [state, dispatch] = useReducer(reducer, { count: -1 }, initState)
    dispatcher = dispatch
    return esx`<main><div>${state.count}</div></main>`
  }
  esx.register({ App })
  // keep the same callsite:
  const ssr = () => esx.renderToString`<App/>`
  is(ssr(), `<main data-reactroot=""><div>0</div></main>`) // 0 becausxe initState
  dispatcher({ type: 'up' })
  is(ssr(), `<main data-reactroot=""><div>1</div></main>`)
  init.ssr.option('hooks-mode', 'compatible')
})

test('stateful mode hooks: useEffect does not throw  (noop)', async ({ doesNotThrow }) => {
  init.ssr.option('hooks-mode', 'stateful')
  const esx = init()
  const { useEffect } = React
  const App = () => {
    useEffect(() => {})
    return esx`<main><div>hi</div></main>`
  }
  esx.register({ App })

  doesNotThrow(() => esx.renderToString`<App/>`)
  doesNotThrow(() => renderToString(esx`<App/>`))
  init.ssr.option('hooks-mode', 'compatible')
})

test('stateful mode hooks: useLayoutEffect does not throw  (noop)', async ({ doesNotThrow }) => {
  init.ssr.option('hooks-mode', 'stateful')
  const esx = init()
  const { useLayoutEffect } = React
  const App = () => {
    useLayoutEffect(() => {})
    return esx`<main><div>hi</div></main>`
  }
  esx.register({ App })

  doesNotThrow(() => esx.renderToString`<App/>`)
  doesNotThrow(() => renderToString(esx`<App/>`))
  init.ssr.option('hooks-mode', 'compatible')
})

test('stateful mode hooks: useContext', async ({ is }) => {
  init.ssr.option('hooks-mode', 'stateful')
  const esx = init()
  const { useContext } = require('react')
  const ThemeContext = React.createContext('light')
  const Button = ({ theme }) => esx`<button>${theme}</button>`
  esx.register({ Button })
  const ThemedButton = () => {
    const context = useContext(ThemeContext)
    return esx`<Button theme=${context}/>`
  }
  esx.register({ ThemedButton })
  const Toolbar = () => esx`<div><ThemedButton/></div>`
  esx.register({ Toolbar })
  class App extends React.Component {
    render () {
      return esx`<div><Provider value='dark'><Toolbar/></Provider></div>`
    }
  }
  const { Provider } = ThemeContext
  esx.register({ App, Provider })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
  init.ssr.option('hooks-mode', 'compatible')
})

test('stateful mode hooks: useContext in a plain react element with esx provider', async ({ is }) => {
  init.ssr.option('hooks-mode', 'stateful')
  const esx = init()
  const { useContext } = require('react')
  const ThemeContext = React.createContext('light')
  const Button = ({ theme }) => esx`<button>${theme}</button>`
  esx.register({ Button })
  const ThemedButton = () => {
    const context = useContext(ThemeContext)
    return esx`<Button theme=${context}/>`
  }
  esx.register({ ThemedButton })
  const Toolbar = () => esx`<div><ThemedButton/></div>`
  esx.register({ Toolbar })
  class App extends React.Component {
    render () {
      return esx`<div><Provider value='dark'><Toolbar/></Provider></div>`
    }
  }
  const { Provider } = ThemeContext
  esx.register({ App, Provider })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
  init.ssr.option('hooks-mode', 'compatible')
})

test('stateful mode hooks: useContext all plain react elements except root', async ({ is }) => {
  init.ssr.option('hooks-mode', 'stateful')
  const esx = init()
  const { useContext } = require('react')
  const ThemeContext = React.createContext('light')
  const Button = ({ theme }) => createElement('button', null, theme)
  esx.register({ Button })
  const ThemedButton = () => {
    const context = useContext(ThemeContext)
    return createElement(Button, { theme: context })
  }
  esx.register({ ThemedButton })
  const Toolbar = () => createElement('div', null, createElement(ThemedButton))
  esx.register({ Toolbar })
  class App extends React.Component {
    render () {
      return createElement('div', null, createElement(Provider, { value: 'dark' }, createElement(Toolbar)))
    }
  }
  const { Provider } = ThemeContext
  esx.register({ App, Provider })
  is(esx.renderToString`<App/>`, renderToString(createElement(App)))
  init.ssr.option('hooks-mode', 'compatible')
})

test('stateful mode hooks: useMemo', async ({ is }) => {
  init.ssr.option('hooks-mode', 'stateful')
  const esx = init()
  const { useMemo } = React
  var count = 1
  const calc = (a, b) => {
    const c = count++
    return a + b + c
  }
  const App = ({ a, b }) => {
    const val = useMemo(() => {
      return calc(a, b)
    }, [a, b])
    return esx`<main><div>${val}</div></main>`
  }
  esx.register({ App })
  const ssr = ({ a, b }) => esx.renderToString`<App a=${a} b=${b} />`
  is(ssr({ a: 1, b: 2 }), `<main data-reactroot=""><div>4</div></main>`)
  // 4 both times because the memoized value is returned
  is(ssr({ a: 1, b: 2 }), `<main data-reactroot=""><div>4</div></main>`)
  // 6 because function is called due to different vals, count increases to 2, and 2+2 is 4
  is(ssr({ a: 2, b: 2 }), `<main data-reactroot=""><div>6</div></main>`)
  init.ssr.option('hooks-mode', 'compatible')
})

test('stateful mode hooks: useCallback', async ({ is }) => {
  init.ssr.option('hooks-mode', 'stateful')
  const esx = init()
  const { useCallback } = React
  var cbs = new Set()
  const App = ({ a }) => {
    cbs.add(useCallback(() => {}, [a]))
    return esx`<main><p>hi</p></main>`
  }
  esx.register({ App })
  const ssr = ({ a }) => esx.renderToString`<App a=${a}/>`
  ssr({ a: 1 })
  is(cbs.size, 1) // first function added
  ssr({ a: 1 })
  is(cbs.size, 1) // same function added, Set is unique, remains at 1
  ssr({ a: 2 })
  is(cbs.size, 2) // new function created, size should be 2
  init.ssr.option('hooks-mode', 'compatible')
})

test('stateful mode hooks: useRef', async ({ is }) => {
  init.ssr.option('hooks-mode', 'stateful')
  const esx = init()
  const { useRef } = React

  // in the browser the ref object is always the same,
  // however on the server it is not the same object,
  // even in stateful mode esx just returns a new object
  // as there's no benefit to the overhead of additional
  // state mangement in this case.

  const App = () => {
    const ref = useRef(null)
    return esx`<main ref=${ref}><div>hi</div></main>`
  }
  esx.register({ App })
  is(esx.renderToString`<App/>`, renderToString(esx`<App/>`))
  init.ssr.option('hooks-mode', 'compatible')
})

test('swapping components with register (dynamic registering)', async ({ is }) => {
  const esx = init()
  const A = () => esx`<a>1</a>`
  const B = () => esx`<b>2</b>`
  esx.register({ Component: A })
  // keep the same callsite
  const ssr = () => esx.renderToString`<Component/>`
  is(
    ssr(),
    renderToString(createElement(A))
  )
  esx.register({ Component: B })
  is(
    ssr(),
    renderToString(createElement(B))
  )
})

test('defaultProps when swapping components with register (dynamic registering)', async ({ is }) => {
  const esx = init()
  const A = ({ v }) => esx`<a>${v}</a>`
  const B = ({ v }) => esx`<b>${v}</b>`
  A.defaultProps = { v: 1 }
  B.defaultProps = { v: 2 }
  esx.register({ Component: A })
  // keep the same callsite
  const ssr = () => esx.renderToString`<Component/>`
  is(
    ssr(),
    renderToString(createElement(A))
  )
  esx.register({ Component: B })
  is(
    ssr(),
    renderToString(createElement(B))
  )
})

test('swapping aliases ("string" components) with register (dynamic registering)', async ({ is }) => {
  const esx = init()
  const ssr = () => esx.renderToString`<Component>test</Component>`
  esx.register({ Component: 'div' })
  is(ssr(), renderToString(createElement('div', null, 'test')))
  esx.register({ Component: 'p' })
  is(ssr(), renderToString(createElement('p', null, 'test')))
  const ssr2 = () => esx.renderToString`<Component/>`
  esx.register({ Component: 'img' })
  is(ssr2(), renderToString(createElement('img')))
  esx.register({ Component: 'link' })
  is(ssr2(), renderToString(createElement('link')))
})

test('swapping components of different types with register (dynamic registering)', async ({ is }) => {
  const esx = init()
  const A = () => esx`<a>1</a>`
  const B = 'img'
  esx.register({ Component: A })
  // keep the same callsite
  const ssr = () => esx.renderToString`<Component/>`
  is(
    ssr(),
    renderToString(createElement(A))
  )
  esx.register({ Component: B })
  is(
    ssr(),
    renderToString(createElement(B))
  )
})

test('ssr.option will throw when called during renderToString', async ({ throws }) => {
  throws(() => init.ssr.option('not-supported'), Error('invalid option'))
})

test('ssr.option will throw when hooks-mode ', async ({ throws }) => {
  throws(() => init.ssr.option('hooks-mode', 'not-supported'), Error('invalid option'))
})

test('deviation: object children are rendered as an empty string instead of throwing', async ({ is, throws, doesNotThrow }) => {
  const esx = init()
  throws(() => renderToString(esx`<a>${({ a: 1 })}</a>`))
  throws(() => renderToString(esx`<a>${([{ a: 1 }])}</a>`))
  doesNotThrow(() => esx.renderToString`<a>${({ a: 1 })}</a>`)
  doesNotThrow(() => esx.renderToString`<a>${([{ a: 1 }])}</a>`)
  is(esx.renderToString`<a>${({ a: 1 })}</a>`, '<a data-reactroot=""></a>')
  is(esx.renderToString`<a>${([{ a: 1 }])}</a>`, '<a data-reactroot=""></a>')
})

test('deviation: duplicate props are rendered', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img b='a' b=${'x'} b='y'/>`,
    '<img b="a" b="x" b="y" data-reactroot=""/>'
  )
})

test('deviation:deep nested, non-self closing components with object child', async ({ is, throws, doesNotThrow }) => {
  const esx = init()
  const Cmp2 = ({ children }) => {
    return esx`<p>${children}</p>`
  }
  esx.register({ Cmp2 })
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><Cmp2>${{ a: 1 }}</Cmp2></div>`
  }

  esx.register({ Cmp1 })
  const value = 'hia'
  const Component = () => esx`<Cmp1 a=${value}/>`
  esx.register({ Component })
  // here we deviate from react, instead of throwing we simply don't
  // render objects if passed
  throws(() => renderToString(createElement(Component)))
  doesNotThrow(() => esx.renderToString`<Component/>`)
  is(esx.renderToString`<Component/>`, '<div a="hia" data-reactroot=""><p></p></div>')
})

test('deviation: propTypes invalidation will *not* throw, even in dev mode', async ({ doesNotThrow }) => {
  // esx server side rendering will not validate propTypes in production *or* development mode
  // This allows for lower production server side rendering overhead
  // and in development allows for browser debugging of propTypes invalidation
  // (e.g. the server won't crash before loading the UI)
  const esx = init()
  const Component = ({ a }) => {
    return esx`<img a=${a}/>`
  }
  Component.propTypes = { a: PropTypes.bool }
  esx.register({ Component })
  doesNotThrow(() => esx.renderToString`<Component a='str'/>`)
})

test('deviation: esx.renderToString spread duplicate props are rendered', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`<img b='a' b=${'x'} b='y'/>`,
    '<img b="a" b="x" b="y" data-reactroot=""/>'
  )
})

test('deviation: children in spread props on void element is ignored', async ({ doesNotThrow }) => {
  const esx = init()
  // rather than crashing the server when a dynamically inserted object may, at any point,
  // contain a `children` property that it's spread onto a void element,
  // we ignore and allow it to render without the children. If the props are spread client-side
  // it will be throw there by react, and be much easier to debug.
  // reasons for deviation: Server stays up, easier to debug, less spreading overhead.
  doesNotThrow(() => esx.renderToString`<input ...${{ children: 'test' }}>`)
})

function childValidator (is) {
  const injectedChildren = []
  return {
    register (child) {
      injectedChildren.push(child)
    },
    validate () {
      var [ a, b ] = injectedChildren
      is(Array.isArray(a), Array.isArray(b))
      if (!Array.isArray(a)) {
        a = [a]
        b = [b]
      }
      Object.keys(a).forEach((ix) => {
        is(a[ix].tag, b[ix].tag)
      })
    }
  }
}

test('deviation: children in spread props on void element is ignored', async ({ doesNotThrow }) => {
  const esx = init()
  // rather than crashing the server when a dynamically inserted object may, at any point,
  // contain a `children` property that it's spread onto a void element,
  // we ignore and allow it to render without the children. If the props are spread client-side
  // it will be throw there by react, and be much easier to debug.
  // reasons for deviation: Server stays up, easier to debug, less spreading overhead.
  doesNotThrow(() => esx.renderToString`<input ...${{ children: 'test' }}>`)
})

test('exits process if react-dom is not installed as a peer dep ', async ({ is }) => {
  const { exit } = process
  const { error } = console
  const { exports } = require.cache[require.resolve('react-dom/server')]
  delete require.cache[require.resolve('..')]
  Object.defineProperty(require.cache[require.resolve('react-dom/server')], 'exports', {
    get () {
      const err = Error('Cannot find module \'react\'')
      err.code = 'MODULE_NOT_FOUND'
      throw err
    }
  }, { enumerable: true, configurable: true, writable: true })
  console.error = (s) => {
    is(s.trim().split('\n')[0], `esx depends on react-dom/server as a peer dependency, `)
  }
  process.exit = (code) => {
    is(code, 1)
    Object.defineProperty(require.cache[require.resolve('react-dom/server')], 'exports', {
      value: exports
    }, { enumerable: true, configurable: true, writable: true })
    process.exit = exit
    console.error = error
  }
  try { require('..') } catch (e) {}
})

test('exits process if react is not installed as a peer dep ', async ({ is }) => {
  const { exit } = process
  const { error } = console
  const { exports } = require.cache[require.resolve('react')]
  delete require.cache[require.resolve('..')]
  Object.defineProperty(require.cache[require.resolve('react')], 'exports', {
    get () {
      const err = Error('Cannot find module \'react\'')
      err.code = 'MODULE_NOT_FOUND'
      throw err
    }
  }, { enumerable: true, configurable: true, writable: true })
  console.error = (s) => {
    is(s.trim().split('\n')[0], `esx depends on react as a peer dependency, `)
  }
  process.exit = (code) => {
    is(code, 1)
    Object.defineProperty(require.cache[require.resolve('react')], 'exports', {
      value: exports
    }, { enumerable: true, configurable: true, writable: true })
    process.exit = exit
    console.error = error
  }
  try { require('..') } catch (e) {}
})

test('pre plugin', async ({ is }) => {
  const esx = init()
  const remove = init.plugins.pre((strings, ...values) => {
    return [
      strings.map((s) => s.replace(/(.+)d>/, '$1div>')),
      values.map((v) => v.toUpperCase())
    ]
  })
  is(esx.renderToString`<d>${'hi'}</d>`, renderToString(esx`<div>HI</div>`))
  remove()
})

test('post plugin', async ({ is }) => {
  const esx = init()
  const remove = init.plugins.post((string) => {
    return string.toUpperCase()
  })
  is(esx.renderToString`<div>hi</div>`, `<DIV DATA-REACTROOT="">HI</DIV>`)
  remove()
})

test('renderToString separate esx root instance', async ({ is }) => {
  const esx = init()
  const esx2 = init()
  const Cmp = ({ test }) => esx`<div>${test}</div>`
  esx.register({ Cmp })
  const foo = esx`<Cmp test="test"/>`
  is(esx2.renderToString(foo), `<div data-reactroot="">test</div>`)
})
