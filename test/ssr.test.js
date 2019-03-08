'use strict'
const { test, only } = require('tap')
process.env.NODE_ENV = 'production' // stop react warnings
const { renderToString } = require('react-dom/server')
const React = require('react')
const PropTypes = require('prop-types')
const { createElement } = React
const init = require('..')

test('basic', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<div>hi</div>`, renderToString(esx `<div>hi</div>`))
})

test('function component', async ({ is }) => {
  const Component = () => esx `<div>test</div>`
  const esx = init({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('class component', async ({ is }) => {
  class Component extends React.Component {
    render () {
      return esx `<div>test</div>`
    }
  }
  const esx = init({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('function component and props', async ({ is }) => {
  const Component = (props) => {
    return esx `<div a=${props.a}>${props.text}</div>`
  }
  const esx = init()
  esx.register({Component})
  const value = 'hia'
  is(esx.renderToString `<Component a=${value} text='hi'/>`, renderToString(esx `<Component a=${value} text='hi'/>`))
})

test('class component and props', async ({ is }) => {
  class Component extends React.Component {
    render () {
      const props = this.props
      return esx `<div a=${props.a}>${props.text}</div>`
    }
  }
  const esx = init()
  esx.register({Component})
  const value = 'hia'
  is(esx.renderToString `<Component a=${value} text='hi'/>`, renderToString(esx `<Component a=${value} text='hi'/>`))
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
      return esx `<div a=${state.a}>${state.text}</div>`
    }
  }
  const esx = init({ Component })
  is(esx.renderToString `<Component/>`, renderToString(esx `<Component/>`))
})

test('sibling elements', async ({ is }) => {
  const Component = () => esx `<div><span>test</span><p>test2</p></div>`
  const esx = init({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep element-nested children array', async ({ is }) => {
  const Component = () => esx `<div><span>${['dynamic', 'inline']}</span></div>`
  const esx = init({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep element-nested dynamic + inline children', async ({ is }) => {
  const Component = () => esx `<div><span>${'dynamic'} inline</span></div>`
  const esx = init({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep element-nested dynamic + inline children with prior interpolated value', async ({ is }) => {
  const Component = () => esx `<div><span a=${'a'}>${'dynamic'} inline</span></div>`
  const esx = init({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep inline children + element-nested dynamic', async ({ is }) => {
  const Component = () => esx `<div><span>inline ${'dynamic'}</span></div>`
  const esx = init({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('inline children in multiple elements', async ({ is }) => {
  const Component = () => esx `<div><span>a</span><span>b</span></div>`
  const esx = init({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('dynamic children in multiple elements', async ({ is }) => {
  const Component = () => esx `<div><span>${'a'}</span><span>${'b'}</span></div>`
  const esx = init({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep element-nested dynamic array + inline children', async ({ is }) => {
  const Component = () => esx `<div>${['dynamic']} inline</div>`
  const esx = init({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep inline children + element-nested dynamic array', async ({ is }) => {
  const Component = () => esx `<div>inline ${['dynamic']}</div>`
  const esx = init({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('class component', async ({ is }) => {
  class Component extends React.Component {
    render () {
      return esx `<div>test</div>`
    }
  }
  const esx = init({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('nested function components', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({text}) => {
    return esx `<p>${text}</p>`
  }
  esx.register({Cmp2})
  const Component = (props) => {
    return esx `<div a=${props.a}><Cmp2 text=${props.text}/></div>`
  }

  esx.register({Component})
  const value = 'hia'
  is(esx.renderToString `<Component a=${value} text='hi'/>`, renderToString(esx `<Component a=${value} text='hi'/>`))
})

test('deep nested function components', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({text}) => {
    return esx `<p>${text}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2 text=${props.text}/></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value} text='hi'/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with inline text child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>text</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value}/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with dynamic text child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>${props.text}</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value} text='hi'/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with dynamic text + inline text children', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>${'dynamic'} text</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value}/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with dynamic text array + inline text children', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>huazz ${['test', 'dynamic']} text</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value}/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with array of text children', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>${['concat me', props.a]}</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value} text='hi'/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('val escaping in deep nested, non-self closing components with array of text children', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>${['concat me', props.a, '>>xy']}</Cmp2></div>`
  }
  esx.register({Cmp1})
  const value = '<<hia'
  const Component = () => esx `<Cmp1 a=${value} text='hi'/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('hard coded attribute value escaping', async ({ is }) => {
  const Component = () => esx `<img x='>>a'/>`
  const esx = init({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with child instance', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>${createElement('a', null, 'child element')}</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value}/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with null child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>${null}</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value}/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with undefined child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>${undefined}</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value}/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with function child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>${() => {}}</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value}/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with number child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>${1}</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value}/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with symbol child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>${Symbol('foo')}</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value}/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('inline esx child', async ({ is }) => {
  const esx = init()
  const EsxComponent = () => esx `<div>${esx `<span>test</span>`}</div>`
  esx.register({EsxComponent})
  const ReactComponent = createElement('div', null, createElement('span', null, 'test'))
  is(esx.renderToString `<EsxComponent/>`, renderToString(ReactComponent))
})

test('deep nested, non-self closing components with inline esx child', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>${esx `<span>child element</span>`}</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value}/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with child element + inline text', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>${esx `<a>child element</a>`} text</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value}/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, non-self closing components with array of child element + inline text', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>${[esx `<a>child element</a>`, 'text']}</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value}/>`
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested class components', async ({ is }) => {
  const esx = init()
  class Cmp2 extends React.Component {
    render () {
      return esx `<p>${this.props.text}</p>`
    }
  }
  esx.register({Cmp2})
  class Cmp1 extends React.Component {
    render () {
      return esx `<div a=${this.props.a}><Cmp2 text=${this.props.text}/></div>`
    }
  }

  esx.register({Cmp1})
  const value = 'hia'
  class Component extends React.Component {
    render () {
      return esx `<Cmp1 a=${value} text='hi'/>`
    }
  } 
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, no interpolated attrs', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({theme}) => esx`<button>${theme}</button>`
  esx.register({ Cmp2 })
  const Cmp1 = () => esx`<div><Cmp2 theme='light'/></div>`
  esx.register({ Cmp1 })
  const Component = () => esx`<Cmp1/>`
  esx.register({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('deep nested, no interpolated attrs, second level element wrapped', async ({ is }) => {
  const esx = init()
  const Cmp2 = ({theme}) => esx`<button>${theme}</button>`
  esx.register({ Cmp2 })
  const Cmp1 = () => esx`<div><Cmp2 theme="light"/></div>`
  esx.register({ Cmp1 })
  const Component = () => esx`<div><Cmp1/></div>`
  esx.register({ Component })
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('self closing element', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<img src="http://example.com"/>`, renderToString(esx `<img src="http://example.com"/>`))
})

test('class component context using contextType', async ({ is }) => {
  const esx = init()
  const ThemeContext = React.createContext('light')
  const Button = ({theme}) => esx`<button>${theme}</button>`
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

  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
})

test('class component context using contextType w/ provider override', async ({ is }) => {
  const esx = init()
  const ThemeContext = React.createContext('light')
  const { Provider } = ThemeContext
  const Button = ({theme}) => esx`<button>${theme}</button>`
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

  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
})

test('class component context using contextType w/ provider override w/ dynamic value', async ({ is }) => {
  const esx = init()
  const ThemeContext = React.createContext('light')
  const { Provider } = ThemeContext
  const Button = ({theme}) => esx`<button>${theme}</button>`
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

  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
})

test('class component context using Consumer', async ({ is }) => {
  const esx = init()
  const { Consumer } = React.createContext('light')
  const Button = ({theme}) => esx`<button>${theme}</button>`
  esx.register({ Button, Consumer })  
  class ThemedButton extends React.Component {
    render () {
      return esx`<Consumer>${(value) => esx `<div>${value}</div>`}</Consumer>`
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
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
})


test('class component context using Consumer w/ Provider', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext('light')
  const Button = ({theme}) => esx`<button>${theme}</button>`
  esx.register({ Button, Consumer, Provider })  
  class ThemedButton extends React.Component {
    render () {
      return esx`<Consumer>${(value) => esx `<div>${value}</div>`}</Consumer>`
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
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
})

test('Consumer `this` context', async ({ is }) => {
  const esx = init()
  const { Consumer, Provider } = React.createContext('light')
  const Button = ({theme}) => esx`<button>${theme}</button>`
  esx.register({ Button, Consumer, Provider })  
  class ThemedButton extends React.Component {
    render () {
      return esx`
        <Consumer test='test'>
          ${function childFn (value) { 
            is(this.test, 'test')
            is(this.children, childFn)
            return esx `<div>${value}</div>`
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

  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
})

test('children render props', async ({ is }) => {
  const esx = init()
  const Button = ({children}) => {
    return esx`<button>${children('ok')}</button>`
  }
  esx.register({ Button })  
  class RenderButton extends React.Component {
    render () {
      return esx`<Button>${(value) => esx `<div>${value}</div>`}</Button>`
    }
  }
  esx.register({ RenderButton })
  const Toolbar = () => esx `<div><RenderButton/></div>`
  esx.register({ Toolbar })
  class App extends React.Component {
    render () {
      return esx`<div><Toolbar /></div>`
    }
  }
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
})

test('dynamic component with static element children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is) 
  const A = ({value, children}) => {
    childTest.register(children)
    return esx `<div><span>${value}</span>${children}</div>`
  }
  esx.register({ A })
  const App = () =>  esx`<A value=${'a'}><a>test</a></A>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
})

test('dynamic component with dynamic element children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is) 
  const A = ({value, children}) => {
    childTest.register(children)
    return esx `<div><span>${value}</span>${children}</div>`
  }
  esx.register({ A })
  const App = () =>  esx`<A value=${'a'}>${createElement('a', null, 'test')}</A>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('dynamic component with component children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({value, children}) => {
    childTest.register(children)
    return esx `<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx `<a>test</a>`
  esx.register({ A, B })
  const App = () =>  esx`<A value=${'a'}><B/></A>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('dynamic component with component children nested in static element children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is) 
  const A = ({value, children}) => {
    childTest.register(children)
    return esx `<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx `<a>test</a>`
  esx.register({ A, B })
  const App = () =>  esx`<A value=${'a'}><div><B/></div></A>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('dynamic component with multiple static element children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = (props) => {
    childTest.register(props.children)
    return esx `<div><span>${props.value}</span>${props.children}</div>`
  }
  esx.register({ A })
  const App = () =>  esx`<A value=${'a'}><a>test</a><a>test2</a></A>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('dynamic component with multiple component children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({value, children}) => {
    childTest.register(children)
    return esx `<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx `<a>test</a>`
  const C = () => esx `<a>test2</a>`
  esx.register({ A, B, C })
  const App = () =>  esx`<A value=${'a'}><B/><C/></A>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('dynamic component with multiple component children nested in static element children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is) 
  const A = ({value, children}) => {
    childTest.register(children)
    return esx `<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx `<a>test</a>`
  const C = () => esx `<a>test2</a>`
  esx.register({ A, B, C })
  const App = () =>  esx`<A value=${'a'}><div><B/><C/></div></A>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('dynamic component with multiple component children nested in multiple static element children as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is) 
  const A = ({value, children}) => {
    childTest.register(children)
    return esx `<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx `<a>test</a>`
  const C = () => esx `<a>test2</a>`
  esx.register({ A, B, C })
  const App = () =>  esx`<A value=${'a'}><div><B/></div><div><C/></div></A>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('dynamic component with multiple component children peers to multiple static element children at varied nesting depths as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is) 
  const A = ({value, children}) => {
    childTest.register(children)
    return esx `<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx `<a>test1</a>`
  const C = () => esx `<a>test3</a>`
  esx.register({ A, B, C })
  const App = () =>  esx`<A value=${'a'}><div>test0</div><B/><a>test2</a><div><C/></div></A>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('child values injected into child elements which are children of components which are injected in as children of elements', async ({ is }) => {
  const esx = init()
  const A = ({children}) => esx `<a>${children}</a>`
  const B = ({children}) => esx `<b>${children}</b>`
  const C = ({children}) => esx `<c>${children}</c>`
  esx.register({ A, B, C })
  const App = ({text}) =>  esx`
    <div>
      <A><div>${text}</div></A>
      <B><div>${text}</div></B>
      <C><div>${text}</div></C>
    </div>
  `
  esx.register({ App })
  is(esx.renderToString `<App text='test'/>`, renderToString(createElement(App, {text: 'test'})))
})

test('dynamic component with multiple component children peers to multiple static element children at varied nesting depths as prop with interpolated expression children', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is) 
  const A = ({value, children}) => {
    childTest.register(children)
    return esx `<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx `<a>test1</a>`
  const C = () => esx `<a>test3</a>`
  esx.register({ A, B, C })
  const App = () =>  esx`<A value=${'a'}><p><div>${'test0'}</div><B/><a href=${'interpolatedprop'}>${'test2'}</a><div><C/></div></p></A>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test(' interpolated properties after component', async ({is}) => {
  const esx = init({
    A: () => esx `<a>foo</a>`
  })
  is(
    esx.renderToString `<p><A/><a x=${'a'}>${'b'}</a><div>ok</div></p>`, 
    renderToString(esx `<p><A/><a x=${'a'}>${'b'}</a><div>ok</div></p>`)
  )
})

test('multiple component children peers', async ({ is }) => {
  const esx = init()
  const A = () => esx `<a>test1</a>`
  const B = () => esx `<a>test2</a>`
  const C = () => esx `<a>test3</a>`
  esx.register({ A, B, C })
  const App = () =>  esx`<div><A/><B/><C/></div>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
})

test('multiple component and element children peers', async ({ is }) => {
  const esx = init()
  const A = () => esx `<a>test1</a>`
  const B = () => esx `<a>test2</a>`
  const C = () => esx `<a>test3</a>`
  esx.register({ A, B, C })
  const App = () =>  esx`<div><A/><p></p><B/><a></a><C/></div>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
})

test('multiple component and element children peers with one interpolated component prop', async ({ is }) => {
  const esx = init()
  const A = () => esx `<a>test1</a>`
  const B = () => esx `<a>test2</a>`
  const C = () => esx `<a>test3</a>`
  esx.register({ A, B, C })
  const App = () =>  esx`<div><A x=${'1'}/><p></p><B/><a></a><C/></div>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
})

test('multiple component and element children peers with multiple interpolated component props', async ({ is }) => {
  const esx = init()
  const A = () => esx `<a>test1</a>`
  const B = () => esx `<a>test2</a>`
  const C = () => esx `<a>test3</a>`
  esx.register({ A, B, C })
  const App = () =>  esx`<div><A x=${'1'} y=${'2'}/><p></p><B/><a></a><C/></div>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
})

test('multiple component and element children peers with multiple interpolated component props over multiple components', async ({ is }) => {
  const esx = init()
  const A = () => esx `<a>test1</a>`
  const B = () => esx `<a>test2</a>`
  const C = () => esx `<a>test3</a>`
  esx.register({ A, B, C })
  const App = () =>  esx`<div><A x=${'1'} y=${'2'}/><p></p><B z=${'3'}/><a></a><C/></div>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
})

test('multiple component and element children peers with multiple interpolated element and component props over multiple elements and components', async ({ is }) => {
  const esx = init()
  const A = () => esx `<a>test1</a>`
  const B = () => esx `<a>test2</a>`
  const C = () => esx `<a>test3</a>`
  esx.register({ A, B, C })
  const App = () =>  esx`<div><A x=${'1'} y=${'2'}/><p a=${'a'}></p><B z=${'3'}/><a b=${'b'}></a><C/></div>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
})

test('dynamic component with multiple component children peers to multiple static element children containing interpolated values within at varied nesting depths as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is) 
  const A = ({value, children}) => {
    childTest.register(children)
    return esx `<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx `<a>test1</a>`
  const C = () => esx `<a>test3</a>`
  esx.register({ A, B, C })
  const App = () =>  esx`<A value=${'a'}><div>${'test0'}</div><B/><x href=${'interpolatedprop'}>${'test2'}</x><div><C/></div></A>`
  esx.register({ App })

  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
  
  childTest.validate()
})

test('conditional rendering', async ({ is }) => {
  const esx = init()
  const Component = (props) => {
    return props.loaded === true ? 
      esx `<div>loaded</div>` :
      esx `<span>loading</span>`
  }
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(esx `<Component/>`))
  is(esx.renderToString `<Component loaded/>`, renderToString(esx `<Component loaded/>`))
})

test('default props.children value should be null', async ({ is }) => {
  const esx = init()
  const Component = (props) => {
    is(props.children, null)
    return  esx `<div>hi</div>`
  }
  esx.register({Component})
  esx.renderToString `<Component/>`
})

test('render props', async ({ is }) => {
  const esx = init()
  const Component = ({render, value}) => {
    return  esx `<div>${render({value})}</div>`
  }
  const render = ({value}) => {
    return esx `<p>${value}</p>`
  }
  esx.register({Component})
  is(
    esx.renderToString `<Component value='test' render=${render}/>`, 
    renderToString(createElement(Component, {value: 'test', render}))
  )
})

test('child render props – children as attribute', async ({ is }) => {
  const esx = init()
  const Component = ({children, value}) => {
    return  esx `<div>${children({value})}</div>`
  }
  const render = ({value}) => esx `<p>${value}</p>`
  esx.register({Component})
  is(
    esx.renderToString `<Component value='test' children=${render}/>`, 
    renderToString(createElement(Component, {value: 'test', children:render}))  
  )
})

test('child render props – children as nested value', async ({ is }) => {
  const esx = init()
  const Component = ({children, value}) => {
    return  esx `<div>${children({value})}</div>`
  }
  const render = ({value}) => esx `<p>${value}</p>`
  esx.register({Component})
  is(
    esx.renderToString `<Component value='test'>${render}</Component>`, 
    renderToString(createElement(Component, {value: 'test'}, render))
  )
})

test('componentWillMount', async ({ pass, plan }) => {
  const esx = init()
  plan(1)
  class Component extends React.Component {
    componentWillMount() {
      pass('componentWillMount called')
    }
    render() {
      return esx `<div>test</div>`
    }
  }
  esx.register({Component})
  esx.renderToString `<Component/>`
})

test('UNSAFE_componentWillMount', async ({ pass, plan }) => {
  const esx = init()
  plan(1)
  class Component extends React.Component {
    UNSAFE_componentWillMount() {
      pass('UNSAFE_componentWillMount called')
    }
    render() {
      return esx `<p></p>`
    }
  }
  esx.register({Component})
  esx.renderToString `<Component/>`
})

test('React.PureComponent', async ({ is }) => {
  const esx = init()
  class Component extends React.PureComponent {
    render() {
      return esx `<div>test</div>`
    }
  }
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(createElement(Component)))
})

test('key prop', async ({ is }) => {
  const esx = init()
  const Component = () => {
    return esx`<li key="1">1</li>`
  }
  esx.register({Component})
  is(
    esx.renderToString `<Component/>`, 
    renderToString(createElement(Component))
  )
})

test('key interpolated prop', async ({ is }) => {
  const esx = init()
  const Component = () => {
    return esx`<li key=${'1'}>1</li>`
  }
  esx.register({Component})
  is(
    esx.renderToString `<Component/>`, 
    renderToString(createElement(Component))
  )
})

test('dynamic ref prop', async ({ is }) => {
  const esx = init()
  const Component = () => {
    const ref = React.createRef()
    return esx`<div><input ref=${ref}/></div>`
  }
  esx.register({Component})
  is(
    esx.renderToString `<Component/>`, 
    renderToString(createElement(Component))
  )
})

test('dynamic ref prop, followed by another dynamic prop', async ({ is }) => {
  const esx = init()
  const Component = () => {
    const ref = React.createRef()
    return esx`<div><input ref=${ref} name=${'test'}/></div>`
  }
  esx.register({Component})
  is(
    esx.renderToString `<Component/>`, 
    renderToString(createElement(Component))
  )
})

test('dynamic ref prop, followed by a static prop', async ({ is }) => {
  const esx = init()
  const Component = () => {
    const ref = React.createRef()
    return esx`<div><input ref=${ref} name="test"/></div>`
  }
  esx.register({Component})
  is(
    esx.renderToString `<Component/>`, 
    renderToString(createElement(Component))
  )
})

test('ref prop', async ({ is }) => {
  const esx = init()
  const Component = () => {
    return esx`<div><input ref="ref"/></div>`
  }
  esx.register({Component})
  is(
    esx.renderToString `<Component/>`, 
    renderToString(createElement(Component))
  )
})

test('rendering object attribute values', async ({ is }) => {
  const esx = init()
  const Component = () => {
    const obj = {}
    return esx`<div><input obj=${obj}/></div>`
  }
  esx.register({Component})
  is(
    esx.renderToString `<Component/>`, 
    renderToString(createElement(Component))
  )
})

test('createElement interopability', async ({ is }) => {
  const esx = init()
  const A = ({value, children}) => createElement('p', {value}, children)
  esx.register({A})
  const Component = () => {
    return esx`<div><A value='test'>hi</A></div>`
  }
  esx.register({Component})
  is(
    esx.renderToString `<Component/>`, 
    renderToString(createElement(Component))
  )
})

test('React.memo interopability', async ({is}) => {
  const esx = init()
  const Component = React.memo(() => {
    return esx`<div>hi</div>`
  })
  esx.register({Component})
  is(
    esx.renderToString `<div><Component/></div>`, 
    renderToString(createElement('div', null, createElement(Component)))
  )
})

test('React.forwardRef interopability', async ({is}) => {
  const esx = init()
  const ref = React.createRef()
  const Component = React.forwardRef((props, fRef) => {
    is(fRef, ref)
    return esx`<div ref=${ref}>hi</div>`
  })
  esx.register({Component})
  is(
    esx.renderToString `<div><Component ref=${ref}/></div>`,
    renderToString(createElement('div', null, createElement(Component, {ref})))
  )
})


test('React.Fragment interopability', async ({is}) => {
  const esx = init()
  const { Fragment } = React
  const EsxCmp = () => esx `
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
  esx.register({EsxCmp, Fragment})
  is(
    esx.renderToString `<div><EsxCmp/></div>`, 
    renderToString(createElement('div', null, createElement(ReactCmp)))
  )
})

test('React.Fragment as a special-case does not need to be a registered component', async ({is}) => {
  const esx = init()
  const EsxCmp = () => esx `
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
  esx.register({EsxCmp})
  is(
    esx.renderToString `<div><EsxCmp/></div>`, 
    renderToString(createElement('div', null, createElement(ReactCmp)))
  )
})

test('React.Fragment shorthand syntax support (<></>)', async ({is}) => {
  const esx = init()
  const EsxCmp = () => esx `
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
  esx.register({EsxCmp})
  is(
    esx.renderToString `<div><EsxCmp/></div>`, 
    renderToString(createElement('div', null, createElement(ReactCmp)))
  )
})

test('React.Fragment special-case namespace can be overridden', async ({is}) => {
  const esx = init()
  const Fragment = ({children}) => esx `<html>${children}</html>`
  const EsxCmp = () => esx `
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
  esx.register({EsxCmp, Fragment})
  is(
    esx.renderToString `<EsxCmp/>`, 
    renderToString(createElement(ReactCmp))
  )
})

test('defaultProps', async ({is}) => {
  const esx = init()
  const Component = ({a, b}) => {
    return esx `<img a=${a} b=${b}/>`
  }
  Component.defaultProps = {a: 'default-a', b: 'default-b'}
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(esx `<Component/>`))
})

test('defaultProps override', async ({is}) => {
  const esx = init()
  const Component = ({a, b}) => {
    return esx `<img a=${a} b=${b}/>`
  }
  Component.defaultProps = {a: 'default-a', b: 'default-b'}
  esx.register({Component})
  is(esx.renderToString `<Component b='test-b'/>`, renderToString(esx `<Component b='test-b'/>`))
})

test('unexpected token, expression in open element', async ({throws}) => {
  const esx = init()
  const Component = (props) => {
    return esx `<div${props}></div>`
  }
  esx.register({Component})
  throws(() => esx.renderToString `<Component/>`, SyntaxError('ESX: Unexpected token in element. Expressions may only be spread, embedded in attributes be included as children.'))
})

test('unexpected token, missing attribute name', async ({throws}) => {
  const esx = init()
  const Component = (props) => {
    return esx `<div =${props}></div>`
  }
  esx.register({Component})
  throws(() => esx.renderToString `<Component/>`, SyntaxError('Unexpected token. Attributes must have a name.'))
})

test('unexpected token, missing attribute name', async ({throws}) => {
  const esx = init()
  const Component = (props) => {
    return esx `<div =${props}></div>`
  }
  esx.register({Component})
  throws(() => esx.renderToString `<Component/>`, SyntaxError('Unexpected token. Attributes must have a name.'))
})

test('unexpected token, quotes around expression', async ({throws}) => {
  const esx = init()
  const Component1 = (props) => {
    return esx `<div x="${props.a}"></div>`
  }
  const Component2 = (props) => {
    return esx `<div x="${props.a}"></div>`
  }
  esx.register({Component1, Component2})
  throws(() => esx.renderToString `<Component1 a="1"/>`, SyntaxError('Unexpected token. Attribute expressions must not be surrounded in quotes.'))
  throws(() => esx.renderToString `<Component2 a="1"/>`, SyntaxError('Unexpected token. Attribute expressions must not be surrounded in quotes.'))
})

test('unexpected token', async ({throws}) => {
  const esx = init()
  const Component = (props) => {
    return esx `<div .${props}></div>`
  }
  esx.register({Component})
  throws(() => esx.renderToString `<Component a=1/>`, SyntaxError('ESX: Unexpected token.'))
})

test('spread props', async ({is}) => {
  const esx = init()
  is(
    esx.renderToString `<img ...${{a: 1, b: 2}}/>`,
    renderToString(createElement('img', {a: 1, b: 2}))
  )
})

test('spread props do not overwrite prior static props when no collision', async ({is}) => {
  const esx = init()
  is(
    esx.renderToString `<img x='y' ...${{a: 1, b: 2}}/>`,
    renderToString(createElement('img', {x: 'y', a: 1, b: 2}))
  )
})

test('spread props do not overwrite dynamic static props when no collision', async ({is}) => {
  const esx = init()
  is(
    esx.renderToString `<img x=${'y'} ...${{a: 1, b: 2}}/>`,
    renderToString(createElement('img', {x: 'y', a: 1, b: 2}))
  )
})

test('spread props overwrite prior static props when collision', async ({is}) => {
  const esx = init()
  is(
    esx.renderToString `<img x='y' a='overwrite' ...${{a: 1, b: 2}}/>`,
    renderToString(createElement('img', {x: 'y', a: 1, b: 2}))
  )
})

test('spread props overwrite prior dynamic props when collision', async ({is}) => {
  const esx = init()
  is(
    esx.renderToString `<img x='y' a=${'overwrite'} ...${{a: 1, b: 2}}/>`,
    renderToString(createElement('img', {x: 'y', a: 1, b: 2}))
  )
})

test('spread props preserve prior static props when no collision', async ({is}) => {
  const esx = init()
  is(
    esx.renderToString `<img x='keep' ...${{a: 1, b: 2}}/>`,
    renderToString(createElement('img', {x: 'keep', a: 1, b: 2}))
  )
})

test('spread props preserve prior dynamic props when no collision', async ({is}) => {
  const esx = init()
  is(
    esx.renderToString `<img x=${'keep'} ...${{a: 1, b: 2}}/>`,
    renderToString(createElement('img', {x: 'keep', a: 1, b: 2}))
  )
})

test('spread props overwritten with latter static props', async ({is}) => {
  const esx = init()
  is(
    esx.renderToString `<img ...${{a: 1, b: 2}} b='x'/>`,
    renderToString(createElement('img', { a: 1, b: 'x'}))
  )
})

test('spread props overwritten with latter dynamic props', async ({is}) => {
  const esx = init()
  const out = esx.renderToString `<img ...${{a: 1, b: 2}} b=${'x'}/>`
  is(
    esx.renderToString `<img ...${{a: 1, b: 2}} b=${'x'}/>`,
    renderToString(createElement('img', { a: 1, b: 'x'}))
  )
})

test('spread multiple objects', async ({is}) => {
  const esx = init() 
  is(
    esx.renderToString `<img ...${{a: 1, b: 2}} ...${{c: 3, d: 4}}/>`,
    renderToString(createElement('img', {a: 1, b: 2, c: 3, d: 4}))
  )
})

test('spread multiple objects, later object properties override', async ({is}) => {
  const esx = init()
  is(
    esx.renderToString `<img ...${{a: 1, b: 2}} ...${{a: 3, b: 4}}/>`,
    renderToString(createElement('img', {a: 3, b: 4}))
  )
})

test('spread multiple objects, static props between spreads', async ({is}) => {
  const esx = init()
  is(
    esx.renderToString `<img ...${{a: 1, b: 2}} x='y' ...${{a: 3, b: 4}}/>`,
    renderToString(createElement('img', {x: 'y', a: 3, b: 4}))
  )
})

test('spread multiple objects, dynamic props between spreads', async ({is}) => {
  const esx = init()
  is(
    esx.renderToString `<img ...${{a: 1, b: 2}} x=${'y'} ...${{a: 3, b: 4}}/>`,
    renderToString(createElement('img', {x: 'y', a: 3, b: 4}))
  )
})

test('spread multiple objects, duplicate dynamic props between spreads overriden by last spread', async ({is}) => {
  const esx = init()
  is(
    esx.renderToString `<img ...${{a: 1, b: 2}} a=${7} ...${{a: 3, b: 4}}/>`,
    renderToString(createElement('img', {a: 3, b: 4}))
  )
})

test('spread props and defaultProps', async ({is}) => {
  const esx = init()
  const Component = (props) => {
    return esx `<img ...${props}/>`
  }
  Component.defaultProps = {a: 'default-a', b: 'default-b'}
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(esx `<Component/>`))
})

test('component spread props', async ({is, plan}) => {
  const esx = init()
  plan(2)
  const Cmp = ({a, b}) => {
    is(a, 1)
    is(b, 2)
    return null
  }
  esx.register({Cmp})
  esx.renderToString `<Cmp ...${{a: 1, b: 2}}/>`
})


test('component spread props do not overwrite prior static props when no collision', async ({is, plan}) => {
  const esx = init()
  plan(3)
  const Cmp = ({x, a, b}) => {
    is(x, 'y')
    is(a, 1)
    is(b, 2)
    return null
  }
  esx.register({Cmp})
  esx.renderToString `<Cmp x='y' ...${{a: 1, b: 2}}/>`
})

test('component spread props do not overwrite dynamic static props when no collision', async ({is, plan}) => {
  const esx = init()
  plan(3)
  const Cmp = ({x, a, b}) => {
    is(x, 'y')
    is(a, 1)
    is(b, 2)
    return null
  }
  esx.register({Cmp})
  esx.renderToString `<Cmp x=${'y'} ...${{a: 1, b: 2}}/>`
})

test('component spread props overwrite prior static props when collision', async ({is, plan}) => {
  const esx = init()
  plan(3)
  const Cmp = ({x, a, b}) => {
    is(x, 'y')
    is(a, 1)
    is(b, 2)
    return null
  }
  esx.register({Cmp})
  esx.renderToString `<Cmp x='y' a='overwrite' ...${{a: 1, b: 2}}/>`
})

test('component spread props overwrite prior dynamic props when collision', async ({is, plan}) => {
  const esx = init()
  plan(3)
  const Cmp = ({x, a, b}) => {
    is(x, 'y')
    is(a, 1)
    is(b, 2)
    return null
  }
  esx.register({Cmp})
  esx.renderToString `<Cmp x='y' a=${'overwrite'} ...${{a: 1, b: 2}}/>`
})

test('component spread props preserve prior static props when no collision', async ({is, plan}) => {
  const esx = init()
  plan(3)
  const Cmp = ({x, a, b}) => {
    is(x, 'keep')
    is(a, 1)
    is(b, 2)
    return null
  }
  esx.register({Cmp})
  esx.renderToString `<Cmp x='keep' ...${{a: 1, b: 2}}/>`
})

test('component spread props preserve prior dynamic props when no collision', async ({is, plan}) => {
  const esx = init()
  plan(3)
  const Cmp = ({x, a, b}) => {
    is(x, 'keep')
    is(a, 1)
    is(b, 2)
    return null
  }
  esx.register({Cmp})
  esx.renderToString `<Cmp x=${'keep'} ...${{a: 1, b: 2}}/>`
})

test('component spread props overwritten with latter static props', async ({is, plan}) => {
  const esx = init()
  plan(2)
  const Cmp = ({a, b}) => {
    is(a, 1)
    is(b, 'x')
    return null
  }
  esx.register({Cmp})
  esx.renderToString `<Cmp ...${{a: 1, b: 2}} b='x'/>`
})

test('component spread props overwritten with latter dynamic props', async ({is, plan}) => {
  const esx = init()
  plan(2)
  const Cmp = ({a, b}) => {
    is(a, 1)
    is(b, 'x')
    return null
  }
  esx.register({Cmp})
  esx.renderToString `<Cmp ...${{a: 1, b: 2}} b=${'x'}/>`
})

test('component spread multiple objects', async ({is, plan}) => {
  const esx = init()
  plan(4)
  const Cmp = ({a, b, c, d}) => {
    is(a, 1)
    is(b, 2)
    is(c, 3)
    is(d, 4)
    return null
  }
  esx.register({Cmp})
  esx.renderToString `<Cmp ...${{a: 1, b: 2}} ...${{c: 3, d: 4}}/>`
})

test('component spread multiple objects, later object properties override', async ({is, plan}) => {
  const esx = init()
  plan(2)
  const Cmp = ({a, b}) => {
    is(a, 3)
    is(b, 4)
    return null
  }
  esx.register({Cmp})
  esx.renderToString `<Cmp ...${{a: 1, b: 2}} ...${{a: 3, b: 4}}/>`
})

test('component spread multiple objects, static props between spreads', async ({is, plan}) => {
  const esx = init()
  plan(3)
  const Cmp = ({x, a, b}) => {
    is(x, 'y')
    is(a, 3)
    is(b, 4)
    return null
  }
  esx.register({Cmp})
  esx.renderToString `<Cmp ...${{a: 1, b: 2}} x='y' ...${{a: 3, b: 4}}/>`
})

test('component spread multiple objects, dynamic props between spreads', async ({is, plan}) => {
  const esx = init()
  plan(3)
  const Cmp = ({x, a, b}) => {
    is(x, 'y')
    is(a, 3)
    is(b, 4)
    return null
  }
  esx.register({Cmp})
  esx.renderToString `<Cmp ...${{a: 1, b: 2}} x=${'y'} ...${{a: 3, b: 4}}/>`
})

test('component spread multiple objects, duplicate dynamic props between spreads overriden by last spread', async ({is, plan}) => {
  const esx = init()
  plan(2)
  const Cmp = ({a, b}) => {
    is(a, 3)
    is(b, 4)
    return null
  }
  esx.register({Cmp})
  esx.renderToString `<Cmp ...${{a: 1, b: 2}} a=${7} ...${{a: 3, b: 4}}/>`
})

test('spread props and defaultProps', async ({is}) => {
  const esx = init()
  const Component = (props) => {
    return esx `<img ...${props}/>`
  }
  Component.defaultProps = {a: 'default-a', b: 'default-b'}
  esx.register({Component})
  is(esx.renderToString `<Component/>`, renderToString(esx `<Component/>`))
})

// fail fast when Cmp not registered
// benchmark for props spread
// cloneElement (+ benchmark)
// react lazy/suspense -- fallback + lazy load (how?)
// legacy context api
// hocs
// hooks
// no root el scenario (insert fragments?)
// special attr - also special attr in spread props

test('self closing void elements do not render with closing tag', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<area/>`, renderToString(esx`<area/>`))
  is(esx.renderToString `<base/>`, renderToString(esx`<base/>`))
  is(esx.renderToString `<br/>`, renderToString(esx`<br/>`))
  is(esx.renderToString `<col/>`, renderToString(esx`<col/>`))
  is(esx.renderToString `<embed/>`, renderToString(esx`<embed/>`))
  is(esx.renderToString `<hr/>`, renderToString(esx`<hr/>`))
  is(esx.renderToString `<img/>`, renderToString(esx`<img/>`))
  is(esx.renderToString `<input/>`, renderToString(esx`<input/>`))
  is(esx.renderToString `<link/>`, renderToString(esx`<link/>`))
  is(esx.renderToString `<meta/>`, renderToString(esx`<meta/>`))
  is(esx.renderToString `<param/>`, renderToString(esx`<param/>`))
  is(esx.renderToString `<source/>`, renderToString(esx`<source/>`))
  is(esx.renderToString `<track/>`, renderToString(esx`<track/>`))
  is(esx.renderToString `<wbr/>`, renderToString(esx`<wbr/>`))
})
test('unclosed void elements render as self closing', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<area>`, renderToString(esx`<area>`))
  is(esx.renderToString `<base>`, renderToString(esx`<base>`))
  is(esx.renderToString `<br>`, renderToString(esx`<br>`))
  is(esx.renderToString `<col>`, renderToString(esx`<col>`))
  is(esx.renderToString `<embed>`, renderToString(esx`<embed>`))
  is(esx.renderToString `<hr>`, renderToString(esx`<hr>`))
  is(esx.renderToString `<img>`, renderToString(esx`<img>`))
  is(esx.renderToString `<input>`, renderToString(esx`<input>`))
  is(esx.renderToString `<link>`, renderToString(esx`<link>`))
  is(esx.renderToString `<meta>`, renderToString(esx`<meta>`))
  is(esx.renderToString `<param>`, renderToString(esx`<param>`))
  is(esx.renderToString `<source>`, renderToString(esx`<source>`))
  is(esx.renderToString `<track>`, renderToString(esx`<track>`))
  is(esx.renderToString `<wbr>`, renderToString(esx`<wbr>`))
})
test('void elements with a closing tag render as self closing, without the closing tag', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<area></area>`, renderToString(esx`<area></area>`))
  is(esx.renderToString `<base></base>`, renderToString(esx`<base></base>`))
  is(esx.renderToString `<br></br>`, renderToString(esx`<br></br>`))
  is(esx.renderToString `<col></col>`, renderToString(esx`<col></col>`))
  is(esx.renderToString `<embed></embed>`, renderToString(esx`<embed></embed>`))
  is(esx.renderToString `<hr></hr>`, renderToString(esx`<hr></hr>`))
  is(esx.renderToString `<img></img>`, renderToString(esx`<img></img>`))
  is(esx.renderToString `<input></input>`, renderToString(esx`<input></input>`))
  is(esx.renderToString `<link></link>`, renderToString(esx`<link></link>`))
  is(esx.renderToString `<meta></meta>`, renderToString(esx`<meta></meta>`))
  is(esx.renderToString `<param></param>`, renderToString(esx`<param></param>`))
  is(esx.renderToString `<source></source>`, renderToString(esx`<source></source>`))
  is(esx.renderToString `<track></track>`, renderToString(esx`<track></track>`))
  is(esx.renderToString `<wbr></wbr>`, renderToString(esx`<wbr></wbr>`))
})

test('self closing normal elements render with closing tag', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<div/>`, renderToString(esx `<div/>`))
  is(esx.renderToString `<div><div/><p>hi</p></div>`, 
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
  is(esx.renderToString `<img className='x'>`, renderToString(esx `<img className='x'>`))
  is(esx.renderToString `<img className=${'x'}>`, renderToString(esx `<img className=${'x'}>`))
})

test('htmlFor', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<label htmlFor='x'></label>`, renderToString(esx `<label htmlFor='x'></label>`))
  is(esx.renderToString `<label htmlFor=${'x'}></label>`, renderToString(esx `<label htmlFor=${'x'}></label>`))
})

test('httpEquiv', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<meta httpEquiv='content-type'>`, renderToString(esx `<meta httpEquiv='content-type'>`))
  is(esx.renderToString `<meta httpEquiv=${'content-type'}>`, renderToString(esx `<meta httpEquiv=${'content-type'}>`))
})

test('acceptCharset', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<form acceptCharset='ISO-8859-1'></form>`, renderToString(esx `<form acceptCharset='ISO-8859-1'></form>`))
  is(esx.renderToString `<form acceptCharset=${'ISO-8859-1'}></form>`, renderToString(esx `<form acceptCharset=${'ISO-8859-1'}></form>`))
})

test('innerHTML', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<form innerHTML='<p></p>'></form>`, renderToString(esx `<form innerHTML='<p></p>'></form>`))
  is(esx.renderToString `<form innerHTML=${'<p></p>'}></form>`, renderToString(esx `<form innerHTML=${'<p></p>'}></form>`))
})


test('children attribute on element', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<form children='test'></form>`, renderToString(esx `<form children='test'></form>`))
  is(esx.renderToString `<form children=${'test'}></form>`, renderToString(esx `<form innerHTML=${'test'}></form>`))
})

test('defaultChecked', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<input defaultChecked foo="1">`, renderToString(esx`<input defaultChecked foo="1">`))
  // is(esx.renderToString `<input defaultChecked>`,z renderToString(esx `<input defaultChecked>`))
  // is(esx.renderToString `<input defaultChecked=${true}>`, renderToString(esx `<input defaultChecked=${true}>`))
  // is(esx.renderToString `<input defaultChecked=${false}>`, renderToString(esx `<input defaultChecked=${false}>`))
})

test('defaultValue', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<input defaultValue="1"/>`, renderToString(esx`<input defaultValue="1"/>`))
  is(esx.renderToString `<input defaultValue=${'1'}/>`, renderToString(esx`<input defaultValue=${'1'}/>`))
  // is(esx.renderToString `<textarea defaultValue="1"/>`, renderToString(esx`<textarea defaultValue="1"/>`))
  // is(
  //   esx.renderToString `<select defaultValue="1"><option value="1"></option><option value="2"></option></select>`, 
  //   renderToString(esx`<select defaultValue="1"><option value="1"></option><option value="2"></option></select>`)
  // )
  is(esx.renderToString `<div defaultValue="1"/>`, renderToString(esx`<div defaultValue="1"/>`))
  is(esx.renderToString `<div defaultValue=${'1'}/>`, renderToString(esx`<div defaultValue=${'1'}/>`))
})

test('suppressContentEditableWarning', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<div suppressContentEditableWarning=""></div>`, renderToString(esx `<div suppressContentEditableWarning=""></div>`))
  is(esx.renderToString `<div suppressContentEditableWarning=${true}></div>`, renderToString(esx `<div suppressContentEditableWarning=${true}></div>`))
})

test('suppressHydrationWarning', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<div suppressHydrationWarning=""></div>`, renderToString(esx `<div suppressHydrationWarning=""></div>`))
  is(esx.renderToString `<div suppressHydrationWarning=${true}></div>`, renderToString(esx `<div suppressHydrationWarning=${true}></div>`))
})

test('style', async ({ is }) => {
  const esx = init()
  const style = {color: 'red',display: '-ms-grid', '-o-transition': 'all .25s', userSelect: 'none'}
  is(esx.renderToString `<div style=${style}></div>`, renderToString(esx `<div style=${style}></div>`))
  is(esx.renderToString `<div style=${null}></div>`, renderToString(esx `<div style=${null}></div>`))
})

test('style throws error when not an object', async ({ throws }) => {
  const esx = init()
  throws(() => esx.renderToString `<div style='color:red'></div>`, TypeError('The `style` prop expects a mapping from style properties to values, not a string.'))
  throws(() => esx.renderToString `<div style=${'color:red'}></div>`, TypeError('The `style` prop expects a mapping from style properties to values, not a string.'))
})

test('dangerouslySetInnerHTML', async ({ is }) => {
  const esx = init()
  is(
    esx.renderToString`
      <div dangerouslySetInnerHTML=${{__html: '<p>test</p>'}}></div>
    `, renderToString(esx`
      <div dangerouslySetInnerHTML=${{__html: '<p>test</p>'}}></div>
    `)
  )
  is(
    esx.renderToString`
      <div dangerouslySetInnerHTML=${{__html: '<p>test</p>'}} another='prop'></div>
    `, renderToString(esx`
      <div dangerouslySetInnerHTML=${{__html: '<p>test</p>'}} another='prop'></div>
    `)
  )
  is(
    esx.renderToString`
      <div another='prop' dangerouslySetInnerHTML=${{__html: '<p>test</p>'}}></div>
    `, renderToString(esx`
      <div another='prop' dangerouslySetInnerHTML=${{__html: '<p>test</p>'}}></div>
    `)
  )
  is(
    esx.renderToString`
      <div dangerouslySetInnerHTML=${{__html: '<p>test</p>'}} another=${'prop'}></div>
    `, renderToString(esx`
      <div dangerouslySetInnerHTML=${{__html: '<p>test</p>'}} another=${'prop'}></div>
    `)
  )
  is(
    esx.renderToString`
      <div another=${'prop'} dangerouslySetInnerHTML=${{__html: '<p>test</p>'}}></div>
    `, renderToString(esx`
      <div another=${'prop'} dangerouslySetInnerHTML=${{__html: '<p>test</p>'}}></div>
    `)
  )
  is(
    esx.renderToString`
      <div dangerouslySetInnerHTML=${{__html: '<p>test</p>'}}/>
    `, renderToString(esx`
      <div dangerouslySetInnerHTML=${{__html: '<p>test</p>'}}/>
    `)
  )
  is(
    esx.renderToString`
      <div><div dangerouslySetInnerHTML=${{__html: '<p>test</p>'}}/><p>hi</p></div>
    `, renderToString(esx`
      <div><div dangerouslySetInnerHTML=${{__html: '<p>test</p>'}}/><p>hi</p></div>
    `)
  )
})

test('attribute names not recognized as boolean attribute names but presented as implicit boolean attributes are not rendered', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<input x/>`, renderToString(esx `<input x/>`))
  is(esx.renderToString `<input x>`, renderToString(esx `<input x>`))
  is(esx.renderToString `<input x foo="1"/>`, renderToString(esx `<input x foo="1"/>`))
})

test('attribute names recognized as booleans presented as implicit boolean attributes are rendered with empty string value', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<input checked/>`, renderToString(esx `<input checked/>`))
  is(esx.renderToString `<input checked>`, renderToString(esx `<input checked>`))
  is(esx.renderToString `<input checked foo="1"/>`, renderToString(esx `<input checked foo="1"/>`))
})

test('attribute names recognized as "booleanish-strings" presented as implicit boolean attributes are rendered with string value of coerced true boolean ("true")', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<div contentEditable/>`, renderToString(esx `<div contentEditable/>`))
  is(esx.renderToString `<div contentEditable></div>`, renderToString(esx `<div contentEditable></div>`))
  is(esx.renderToString `<div contentEditable foo="1"/>`, renderToString(esx `<div contentEditable foo="1"/>`))
})

test('attribute names recognized as string types are not rendered when the static value is an empty string', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<div id=""/>`, renderToString(esx `<div id=""/>`))
  is(esx.renderToString `<div id=""></div>`, renderToString(esx `<div id=""></div>`))
  is(esx.renderToString `<div id="" foo="1"/>`, renderToString(esx `<div id="" foo="1"/>`))
})

only('attribute names recognized as string types are rendered when the dynamic value is an empty string', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<div id=${''}/>`, renderToString(esx `<div id=${''}/>`))
  is(esx.renderToString `<div id=${''}></div>`, renderToString(esx `<div id=${''}></div>`))
  is(esx.renderToString `<div id=${''} foo="1"/>`, renderToString(esx `<div id=${''} foo="1"/>`))
})

test('boolean attributes with string values are rendered with empty strings', async ({ is }) => {
  
})

test('known camel case attributes are converted to special case equivlents (or not) as neccessary', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<x acceptCharset="1"/>`, renderToString(esx`<x acceptCharset="1"/>`))
  is(esx.renderToString `<x accessKey="1"/>`, renderToString(esx`<x accessKey="1"/>`))
  is(esx.renderToString `<x autoCapitalize="1"/>`, renderToString(esx`<x autoCapitalize="1"/>`))
  is(esx.renderToString `<x autoComplete="1"/>`, renderToString(esx`<x autoComplete="1"/>`))
  is(esx.renderToString `<x autoCorrect="1"/>`, renderToString(esx`<x autoCorrect="1"/>`))
  is(esx.renderToString `<x autoFocus/>`, renderToString(esx`<x autoFocus/>`))
  is(esx.renderToString `<x autoPlay/>`, renderToString(esx`<x autoPlay/>`))
  is(esx.renderToString `<x autoSave="1"/>`, renderToString(esx`<x autoSave="1"/>`))
  is(esx.renderToString `<x cellPadding="1"/>`, renderToString(esx`<x cellPadding="1"/>`))
  is(esx.renderToString `<x cellSpacing="1"/>`, renderToString(esx`<x cellSpacing="1"/>`))
  is(esx.renderToString `<x charSet="1"/>`, renderToString(esx`<x charSet="1"/>`))
  is(esx.renderToString `<x classID="1"/>`, renderToString(esx`<x classID="1"/>`))
  is(esx.renderToString `<x colSpan="1"/>`, renderToString(esx`<x colSpan="1"/>`))
  is(esx.renderToString `<x contentEditable="1"/>`, renderToString(esx`<x contentEditable="1"/>`))
  is(esx.renderToString `<x contextMenu="1"/>`, renderToString(esx`<x contextMenu="1"/>`))
  is(esx.renderToString `<x controlsList="1"/>`, renderToString(esx`<x controlsList="1"/>`))
  is(esx.renderToString `<x crossOrigin="1"/>`, renderToString(esx`<x crossOrigin="1"/>`))
  is(esx.renderToString `<x dateTime="1"/>`, renderToString(esx`<x dateTime="1"/>`))
  is(esx.renderToString `<x encType="1"/>`, renderToString(esx`<x encType="1"/>`))
  is(esx.renderToString `<x formMethod="1"/>`, renderToString(esx`<x formMethod="1"/>`))
  is(esx.renderToString `<x formAction="1"/>`, renderToString(esx`<x formAction="1"/>`))
  is(esx.renderToString `<x formEncType="1"/>`, renderToString(esx`<x formEncType="1"/>`))
  is(esx.renderToString `<x formNoValidate/>`, renderToString(esx`<x formNoValidate/>`))
  is(esx.renderToString `<x formTarget="1"/>`, renderToString(esx`<x formTarget="1"/>`))
  is(esx.renderToString `<x frameBorder="1"/>`, renderToString(esx`<x frameBorder="1"/>`))
  is(esx.renderToString `<x hrefLang="1"/>`, renderToString(esx`<x hrefLang="1"/>`))
  is(esx.renderToString `<x inputMode="1"/>`, renderToString(esx`<x inputMode="1"/>`))
  is(esx.renderToString `<x itemID="1"/>`, renderToString(esx`<x itemID="1"/>`))
  is(esx.renderToString `<x itemProp="1"/>`, renderToString(esx`<x itemProp="1"/>`))
  is(esx.renderToString `<x itemRef="1"/>`, renderToString(esx`<x itemRef="1"/>`))
  is(esx.renderToString `<x itemScope/>`, renderToString(esx`<x itemScope/>`))
  is(esx.renderToString `<x itemType="1"/>`, renderToString(esx`<x itemType="1"/>`))
  is(esx.renderToString `<x keyParams="1"/>`, renderToString(esx`<x keyParams="1"/>`))
  is(esx.renderToString `<x keyType="1"/>`, renderToString(esx`<x keyType="1"/>`))
  is(esx.renderToString `<x marginWidth="1"/>`, renderToString(esx`<x marginWidth="1"/>`))
  is(esx.renderToString `<x marginHeight="1"/>`, renderToString(esx`<x marginHeight="1"/>`))
  is(esx.renderToString `<x maxLength="1"/>`, renderToString(esx`<x maxLength="1"/>`))
  is(esx.renderToString `<x mediaGroup="1"/>`, renderToString(esx`<x mediaGroup="1"/>`))
  is(esx.renderToString `<x minLength="1"/>`, renderToString(esx`<x minLength="1"/>`))
  is(esx.renderToString `<x noModule/>`, renderToString(esx`<x noModule/>`))
  is(esx.renderToString `<x noValidate/>`, renderToString(esx`<x noValidate/>`))
  is(esx.renderToString `<x playsInline/>`, renderToString(esx`<x playsInline/>`))
  is(esx.renderToString `<x radioGroup="1"/>`, renderToString(esx`<x radioGroup="1"/>`))
  is(esx.renderToString `<x readOnly/>`, renderToString(esx`<x readOnly/>`))
  is(esx.renderToString `<x referrerPolicy="1"/>`, renderToString(esx`<x referrerPolicy="1"/>`))
  is(esx.renderToString `<x rowSpan="1"/>`, renderToString(esx`<x rowSpan="1"/>`))
  is(esx.renderToString `<x spellCheck="1"/>`, renderToString(esx`<x spellCheck="1"/>`))
  is(esx.renderToString `<x srcDoc="1"/>`, renderToString(esx`<x srcDoc="1"/>`))
  is(esx.renderToString `<x srcLang="1"/>`, renderToString(esx`<x srcLang="1"/>`))
  is(esx.renderToString `<x srcSet="1"/>`, renderToString(esx`<x srcSet="1"/>`))
  is(esx.renderToString `<x tabIndex="1"/>`, renderToString(esx`<x tabIndex="1"/>`))
  is(esx.renderToString `<x useMap="1"/>`, renderToString(esx`<x useMap="1"/>`))
  is(esx.renderToString `<x accentHeight="1"/>`, renderToString(esx`<x accentHeight="1"/>`))
  is(esx.renderToString `<x alignmentBaseline="1"/>`, renderToString(esx`<x alignmentBaseline="1"/>`))
  is(esx.renderToString `<x allowReorder="1"/>`, renderToString(esx`<x allowReorder="1"/>`))
  is(esx.renderToString `<x arabicForm="1"/>`, renderToString(esx`<x arabicForm="1"/>`))
  is(esx.renderToString `<x attributeName="1"/>`, renderToString(esx`<x attributeName="1"/>`))
  is(esx.renderToString `<x attributeType="1"/>`, renderToString(esx`<x attributeType="1"/>`))
  is(esx.renderToString `<x autoReverse="1"/>`, renderToString(esx`<x autoReverse="1"/>`))
  is(esx.renderToString `<x baseFrequency="1"/>`, renderToString(esx`<x baseFrequency="1"/>`))
  is(esx.renderToString `<x baselineShift="1"/>`, renderToString(esx`<x baselineShift="1"/>`))
  is(esx.renderToString `<x baseProfile="1"/>`, renderToString(esx`<x baseProfile="1"/>`))
  is(esx.renderToString `<x calcMode="1"/>`, renderToString(esx`<x calcMode="1"/>`))
  is(esx.renderToString `<x capHeight="1"/>`, renderToString(esx`<x capHeight="1"/>`))
  is(esx.renderToString `<x clipPath="1"/>`, renderToString(esx`<x clipPath="1"/>`))
  is(esx.renderToString `<x clipPathUnits="1"/>`, renderToString(esx`<x clipPathUnits="1"/>`))
  is(esx.renderToString `<x clipRule="1"/>`, renderToString(esx`<x clipRule="1"/>`))
  is(esx.renderToString `<x colorInterpolation="1"/>`, renderToString(esx`<x colorInterpolation="1"/>`))
  is(esx.renderToString `<x colorInterpolationFilters="1"/>`, renderToString(esx`<x colorInterpolationFilters="1"/>`))
  is(esx.renderToString `<x colorProfile="1"/>`, renderToString(esx`<x colorProfile="1"/>`))
  is(esx.renderToString `<x colorRendering="1"/>`, renderToString(esx`<x colorRendering="1"/>`))
  is(esx.renderToString `<x contentScriptType="1"/>`, renderToString(esx`<x contentScriptType="1"/>`))
  is(esx.renderToString `<x contentStyleType="1"/>`, renderToString(esx`<x contentStyleType="1"/>`))
  is(esx.renderToString `<x diffuseConstant="1"/>`, renderToString(esx`<x diffuseConstant="1"/>`))
  is(esx.renderToString `<x dominantBaseline="1"/>`, renderToString(esx`<x dominantBaseline="1"/>`))
  is(esx.renderToString `<x edgeMode="1"/>`, renderToString(esx`<x edgeMode="1"/>`))
  is(esx.renderToString `<x enableBackground="1"/>`, renderToString(esx`<x enableBackground="1"/>`))
  is(esx.renderToString `<x externalResourcesRequired="1"/>`, renderToString(esx`<x externalResourcesRequired="1"/>`))
  is(esx.renderToString `<x fillOpacity="1"/>`, renderToString(esx`<x fillOpacity="1"/>`))
  is(esx.renderToString `<x fillRule="1"/>`, renderToString(esx`<x fillRule="1"/>`))
  is(esx.renderToString `<x filterRes="1"/>`, renderToString(esx`<x filterRes="1"/>`))
  is(esx.renderToString `<x filterUnits="1"/>`, renderToString(esx`<x filterUnits="1"/>`))
  is(esx.renderToString `<x floodOpacity="1"/>`, renderToString(esx`<x floodOpacity="1"/>`))
  is(esx.renderToString `<x floodColor="1"/>`, renderToString(esx`<x floodColor="1"/>`))
  is(esx.renderToString `<x fontFamily="1"/>`, renderToString(esx`<x fontFamily="1"/>`))
  is(esx.renderToString `<x fontSize="1"/>`, renderToString(esx`<x fontSize="1"/>`))
  is(esx.renderToString `<x fontSizeAdjust="1"/>`, renderToString(esx`<x fontSizeAdjust="1"/>`))
  is(esx.renderToString `<x fontStretch="1"/>`, renderToString(esx`<x fontStretch="1"/>`))
  is(esx.renderToString `<x fontStyle="1"/>`, renderToString(esx`<x fontStyle="1"/>`))
  is(esx.renderToString `<x fontVariant="1"/>`, renderToString(esx`<x fontVariant="1"/>`))
  is(esx.renderToString `<x fontWeight="1"/>`, renderToString(esx`<x fontWeight="1"/>`))
  is(esx.renderToString `<x glyphName="1"/>`, renderToString(esx`<x glyphName="1"/>`))
  is(esx.renderToString `<x glyphOrientationHorizontal="1"/>`, renderToString(esx`<x glyphOrientationHorizontal="1"/>`))
  is(esx.renderToString `<x glyphOrientationVertical="1"/>`, renderToString(esx`<x glyphOrientationVertical="1"/>`))
  is(esx.renderToString `<x glyphRef="1"/>`, renderToString(esx`<x glyphRef="1"/>`))
  is(esx.renderToString `<x gradientTransform="1"/>`, renderToString(esx`<x gradientTransform="1"/>`))
  is(esx.renderToString `<x gradientUnits="1"/>`, renderToString(esx`<x gradientUnits="1"/>`))
  is(esx.renderToString `<x horizAdvX="1"/>`, renderToString(esx`<x horizAdvX="1"/>`))
  is(esx.renderToString `<x horizOriginX="1"/>`, renderToString(esx`<x horizOriginX="1"/>`))
  is(esx.renderToString `<x imageRendering="1"/>`, renderToString(esx`<x imageRendering="1"/>`))
  is(esx.renderToString `<x kernelMatrix="1"/>`, renderToString(esx`<x kernelMatrix="1"/>`))
  is(esx.renderToString `<x kernelUnitLength="1"/>`, renderToString(esx`<x kernelUnitLength="1"/>`))
  is(esx.renderToString `<x keyPoints="1"/>`, renderToString(esx`<x keyPoints="1"/>`))
  is(esx.renderToString `<x keySplines="1"/>`, renderToString(esx`<x keySplines="1"/>`))
  is(esx.renderToString `<x keyTimes="1"/>`, renderToString(esx`<x keyTimes="1"/>`))
  is(esx.renderToString `<x lengthAdjust="1"/>`, renderToString(esx`<x lengthAdjust="1"/>`))
  is(esx.renderToString `<x letterSpacing="1"/>`, renderToString(esx`<x letterSpacing="1"/>`))
  is(esx.renderToString `<x lightingColor="1"/>`, renderToString(esx`<x lightingColor="1"/>`))
  is(esx.renderToString `<x limitingConeAngle="1"/>`, renderToString(esx`<x limitingConeAngle="1"/>`))
  is(esx.renderToString `<x markerEnd="1"/>`, renderToString(esx`<x markerEnd="1"/>`))
  is(esx.renderToString `<x markerHeight="1"/>`, renderToString(esx`<x markerHeight="1"/>`))
  is(esx.renderToString `<x markerMid="1"/>`, renderToString(esx`<x markerMid="1"/>`))
  is(esx.renderToString `<x markerStart="1"/>`, renderToString(esx`<x markerStart="1"/>`))
  is(esx.renderToString `<x markerUnits="1"/>`, renderToString(esx`<x markerUnits="1"/>`))
  is(esx.renderToString `<x markerWidth="1"/>`, renderToString(esx`<x markerWidth="1"/>`))
  is(esx.renderToString `<x maskContentUnits="1"/>`, renderToString(esx`<x maskContentUnits="1"/>`))
  is(esx.renderToString `<x maskUnits="1"/>`, renderToString(esx`<x maskUnits="1"/>`))
  is(esx.renderToString `<x numOctaves="1"/>`, renderToString(esx`<x numOctaves="1"/>`))
  is(esx.renderToString `<x overlinePosition="1"/>`, renderToString(esx`<x overlinePosition="1"/>`))
  is(esx.renderToString `<x overlineThickness="1"/>`, renderToString(esx`<x overlineThickness="1"/>`))
  is(esx.renderToString `<x paintOrder="1"/>`, renderToString(esx`<x paintOrder="1"/>`))
  is(esx.renderToString `<x panose1="1"/>`, renderToString(esx`<x panose1="1"/>`))
  is(esx.renderToString `<x pathLength="1"/>`, renderToString(esx`<x pathLength="1"/>`))
  is(esx.renderToString `<x patternContentUnits="1"/>`, renderToString(esx`<x patternContentUnits="1"/>`))
  is(esx.renderToString `<x patternTransform="1"/>`, renderToString(esx`<x patternTransform="1"/>`))
  is(esx.renderToString `<x patternUnits="1"/>`, renderToString(esx`<x patternUnits="1"/>`))
  is(esx.renderToString `<x pointerEvents="1"/>`, renderToString(esx`<x pointerEvents="1"/>`))
  is(esx.renderToString `<x pointsAtX="1"/>`, renderToString(esx`<x pointsAtX="1"/>`))
  is(esx.renderToString `<x pointsAtY="1"/>`, renderToString(esx`<x pointsAtY="1"/>`))
  is(esx.renderToString `<x pointsAtZ="1"/>`, renderToString(esx`<x pointsAtZ="1"/>`))
  is(esx.renderToString `<x preserveAlpha="1"/>`, renderToString(esx`<x preserveAlpha="1"/>`))
  is(esx.renderToString `<x preserveAspectRatio="1"/>`, renderToString(esx`<x preserveAspectRatio="1"/>`))
  is(esx.renderToString `<x primitiveUnits="1"/>`, renderToString(esx`<x primitiveUnits="1"/>`))
  is(esx.renderToString `<x refX="1"/>`, renderToString(esx`<x refX="1"/>`))
  is(esx.renderToString `<x refY="1"/>`, renderToString(esx`<x refY="1"/>`))
  is(esx.renderToString `<x renderingIntent="1"/>`, renderToString(esx`<x renderingIntent="1"/>`))
  is(esx.renderToString `<x repeatCount="1"/>`, renderToString(esx`<x repeatCount="1"/>`))
  is(esx.renderToString `<x repeatDur="1"/>`, renderToString(esx`<x repeatDur="1"/>`))
  is(esx.renderToString `<x requiredExtensions="1"/>`, renderToString(esx`<x requiredExtensions="1"/>`))
  is(esx.renderToString `<x requiredFeatures="1"/>`, renderToString(esx`<x requiredFeatures="1"/>`))
  is(esx.renderToString `<x shapeRendering="1"/>`, renderToString(esx`<x shapeRendering="1"/>`))
  is(esx.renderToString `<x specularConstant="1"/>`, renderToString(esx`<x specularConstant="1"/>`))
  is(esx.renderToString `<x specularExponent="1"/>`, renderToString(esx`<x specularExponent="1"/>`))
  is(esx.renderToString `<x spreadMethod="1"/>`, renderToString(esx`<x spreadMethod="1"/>`))
  is(esx.renderToString `<x startOffset="1"/>`, renderToString(esx`<x startOffset="1"/>`))
  is(esx.renderToString `<x stdDeviation="1"/>`, renderToString(esx`<x stdDeviation="1"/>`))
  is(esx.renderToString `<x stitchTiles="1"/>`, renderToString(esx`<x stitchTiles="1"/>`))
  is(esx.renderToString `<x stopColor="1"/>`, renderToString(esx`<x stopColor="1"/>`))
  is(esx.renderToString `<x stopOpacity="1"/>`, renderToString(esx`<x stopOpacity="1"/>`))
  is(esx.renderToString `<x strikethroughPosition="1"/>`, renderToString(esx`<x strikethroughPosition="1"/>`))
  is(esx.renderToString `<x strikethroughThickness="1"/>`, renderToString(esx`<x strikethroughThickness="1"/>`))
  is(esx.renderToString `<x strokeDasharray="1"/>`, renderToString(esx`<x strokeDasharray="1"/>`))
  is(esx.renderToString `<x strokeDashoffset="1"/>`, renderToString(esx`<x strokeDashoffset="1"/>`))
  is(esx.renderToString `<x strokeLinecap="1"/>`, renderToString(esx`<x strokeLinecap="1"/>`))
  is(esx.renderToString `<x strokeLinejoin="1"/>`, renderToString(esx`<x strokeLinejoin="1"/>`))
  is(esx.renderToString `<x strokeMiterlimit="1"/>`, renderToString(esx`<x strokeMiterlimit="1"/>`))
  is(esx.renderToString `<x strokeWidth="1"/>`, renderToString(esx`<x strokeWidth="1"/>`))
  is(esx.renderToString `<x strokeOpacity="1"/>`, renderToString(esx`<x strokeOpacity="1"/>`))
  is(esx.renderToString `<x surfaceScale="1"/>`, renderToString(esx`<x surfaceScale="1"/>`))
  is(esx.renderToString `<x systemLanguage="1"/>`, renderToString(esx`<x systemLanguage="1"/>`))
  is(esx.renderToString `<x tableValues="1"/>`, renderToString(esx`<x tableValues="1"/>`))
  is(esx.renderToString `<x targetX="1"/>`, renderToString(esx`<x targetX="1"/>`))
  is(esx.renderToString `<x targetY="1"/>`, renderToString(esx`<x targetY="1"/>`))
  is(esx.renderToString `<x textAnchor="1"/>`, renderToString(esx`<x textAnchor="1"/>`))
  is(esx.renderToString `<x textDecoration="1"/>`, renderToString(esx`<x textDecoration="1"/>`))
  is(esx.renderToString `<x textLength="1"/>`, renderToString(esx`<x textLength="1"/>`))
  is(esx.renderToString `<x textRendering="1"/>`, renderToString(esx`<x textRendering="1"/>`))
  is(esx.renderToString `<x underlinePosition="1"/>`, renderToString(esx`<x underlinePosition="1"/>`))
  is(esx.renderToString `<x underlineThickness="1"/>`, renderToString(esx`<x underlineThickness="1"/>`))
  is(esx.renderToString `<x unicodeBidi="1"/>`, renderToString(esx`<x unicodeBidi="1"/>`))
  is(esx.renderToString `<x unicodeRange="1"/>`, renderToString(esx`<x unicodeRange="1"/>`))
  is(esx.renderToString `<x unitsPerEm="1"/>`, renderToString(esx`<x unitsPerEm="1"/>`))
  is(esx.renderToString `<x vAlphabetic="1"/>`, renderToString(esx`<x vAlphabetic="1"/>`))
  is(esx.renderToString `<x vectorEffect="1"/>`, renderToString(esx`<x vectorEffect="1"/>`))
  is(esx.renderToString `<x vertAdvY="1"/>`, renderToString(esx`<x vertAdvY="1"/>`))
  is(esx.renderToString `<x vertOriginX="1"/>`, renderToString(esx`<x vertOriginX="1"/>`))
  is(esx.renderToString `<x vertOriginY="1"/>`, renderToString(esx`<x vertOriginY="1"/>`))
  is(esx.renderToString `<x vHanging="1"/>`, renderToString(esx`<x vHanging="1"/>`))
  is(esx.renderToString `<x vIdeographic="1"/>`, renderToString(esx`<x vIdeographic="1"/>`))
  is(esx.renderToString `<x viewBox="1"/>`, renderToString(esx`<x viewBox="1"/>`))
  is(esx.renderToString `<x viewTarget="1"/>`, renderToString(esx`<x viewTarget="1"/>`))
  is(esx.renderToString `<x vMathematical="1"/>`, renderToString(esx`<x vMathematical="1"/>`))
  is(esx.renderToString `<x wordSpacing="1"/>`, renderToString(esx`<x wordSpacing="1"/>`))
  is(esx.renderToString `<x writingMode="1"/>`, renderToString(esx`<x writingMode="1"/>`))
  is(esx.renderToString `<x xChannelSelector="1"/>`, renderToString(esx`<x xChannelSelector="1"/>`))
  is(esx.renderToString `<x xHeight="1"/>`, renderToString(esx`<x xHeight="1"/>`))
  is(esx.renderToString `<x xlinkActuate="1"/>`, renderToString(esx`<x xlinkActuate="1"/>`))
  is(esx.renderToString `<x xlinkArcrole="1"/>`, renderToString(esx`<x xlinkArcrole="1"/>`))
  is(esx.renderToString `<x xlinkHref="1"/>`, renderToString(esx`<x xlinkHref="1"/>`))
  is(esx.renderToString `<x xlinkRole="1"/>`, renderToString(esx`<x xlinkRole="1"/>`))
  is(esx.renderToString `<x xlinkShow="1"/>`, renderToString(esx`<x xlinkShow="1"/>`))
  is(esx.renderToString `<x xlinkTitle="1"/>`, renderToString(esx`<x xlinkTitle="1"/>`))
  is(esx.renderToString `<x xlinkType="1"/>`, renderToString(esx`<x xlinkType="1"/>`))
  is(esx.renderToString `<x xmlBase="1"/>`, renderToString(esx`<x xmlBase="1"/>`))
  is(esx.renderToString `<x xmlLang="1"/>`, renderToString(esx`<x xmlLang="1"/>`))
  is(esx.renderToString `<x xmlSpace="1"/>`, renderToString(esx`<x xmlSpace="1"/>`))
  is(esx.renderToString `<x xmlnsXlink="1"/>`, renderToString(esx`<x xmlnsXlink="1"/>`))
  is(esx.renderToString `<x xmlSpace="1"/>`, renderToString(esx`<x xmlSpace="1"/>`))
  is(esx.renderToString `<x yChannelSelector="1"/>`, renderToString(esx`<x yChannelSelector="1"/>`))
  is(esx.renderToString `<x zoomAndPan="1"/>`, renderToString(esx`<x zoomAndPan="1"/>`))
  is(esx.renderToString `<x acceptCharset="1"></x>`, renderToString(esx`<x acceptCharset="1"></x>`))
  is(esx.renderToString `<x accessKey="1"></x>`, renderToString(esx`<x accessKey="1"></x>`))
  is(esx.renderToString `<x autoCapitalize="1"></x>`, renderToString(esx`<x autoCapitalize="1"></x>`))
  is(esx.renderToString `<x autoComplete="1"></x>`, renderToString(esx`<x autoComplete="1"></x>`))
  is(esx.renderToString `<x autoCorrect="1"></x>`, renderToString(esx`<x autoCorrect="1"></x>`))
  is(esx.renderToString `<x autoFocus></x>`, renderToString(esx`<x autoFocus></x>`))
  is(esx.renderToString `<x autoPlay></x>`, renderToString(esx`<x autoPlay></x>`))
  is(esx.renderToString `<x autoSave="1"></x>`, renderToString(esx`<x autoSave="1"></x>`))
  is(esx.renderToString `<x cellPadding="1"></x>`, renderToString(esx`<x cellPadding="1"></x>`))
  is(esx.renderToString `<x cellSpacing="1"></x>`, renderToString(esx`<x cellSpacing="1"></x>`))
  is(esx.renderToString `<x charSet="1"></x>`, renderToString(esx`<x charSet="1"></x>`))
  is(esx.renderToString `<x classID="1"></x>`, renderToString(esx`<x classID="1"></x>`))
  is(esx.renderToString `<x colSpan="1"></x>`, renderToString(esx`<x colSpan="1"></x>`))
  is(esx.renderToString `<x contentEditable="1"></x>`, renderToString(esx`<x contentEditable="1"></x>`))
  is(esx.renderToString `<x contextMenu="1"></x>`, renderToString(esx`<x contextMenu="1"></x>`))
  is(esx.renderToString `<x controlsList="1"></x>`, renderToString(esx`<x controlsList="1"></x>`))
  is(esx.renderToString `<x crossOrigin="1"></x>`, renderToString(esx`<x crossOrigin="1"></x>`))
  is(esx.renderToString `<x dateTime="1"></x>`, renderToString(esx`<x dateTime="1"></x>`))
  is(esx.renderToString `<x encType="1"></x>`, renderToString(esx`<x encType="1"></x>`))
  is(esx.renderToString `<x formMethod="1"></x>`, renderToString(esx`<x formMethod="1"></x>`))
  is(esx.renderToString `<x formAction="1"></x>`, renderToString(esx`<x formAction="1"></x>`))
  is(esx.renderToString `<x formEncType="1"></x>`, renderToString(esx`<x formEncType="1"></x>`))
  is(esx.renderToString `<x formNoValidate></x>`, renderToString(esx`<x formNoValidate></x>`))
  is(esx.renderToString `<x formTarget="1"></x>`, renderToString(esx`<x formTarget="1"></x>`))
  is(esx.renderToString `<x frameBorder="1"></x>`, renderToString(esx`<x frameBorder="1"></x>`))
  is(esx.renderToString `<x hrefLang="1"></x>`, renderToString(esx`<x hrefLang="1"></x>`))
  is(esx.renderToString `<x inputMode="1"></x>`, renderToString(esx`<x inputMode="1"></x>`))
  is(esx.renderToString `<x itemID="1"></x>`, renderToString(esx`<x itemID="1"></x>`))
  is(esx.renderToString `<x itemProp="1"></x>`, renderToString(esx`<x itemProp="1"></x>`))
  is(esx.renderToString `<x itemRef="1"></x>`, renderToString(esx`<x itemRef="1"></x>`))
  is(esx.renderToString `<x itemScope></x>`, renderToString(esx`<x itemScope></x>`))
  is(esx.renderToString `<x itemType="1"></x>`, renderToString(esx`<x itemType="1"></x>`))
  is(esx.renderToString `<x keyParams="1"></x>`, renderToString(esx`<x keyParams="1"></x>`))
  is(esx.renderToString `<x keyType="1"></x>`, renderToString(esx`<x keyType="1"></x>`))
  is(esx.renderToString `<x marginWidth="1"></x>`, renderToString(esx`<x marginWidth="1"></x>`))
  is(esx.renderToString `<x marginHeight="1"></x>`, renderToString(esx`<x marginHeight="1"></x>`))
  is(esx.renderToString `<x maxLength="1"></x>`, renderToString(esx`<x maxLength="1"></x>`))
  is(esx.renderToString `<x mediaGroup="1"></x>`, renderToString(esx`<x mediaGroup="1"></x>`))
  is(esx.renderToString `<x minLength="1"></x>`, renderToString(esx`<x minLength="1"></x>`))
  is(esx.renderToString `<x noModule></x>`, renderToString(esx`<x noModule></x>`))
  is(esx.renderToString `<x noValidate></x>`, renderToString(esx`<x noValidate></x>`))
  is(esx.renderToString `<x playsInline></x>`, renderToString(esx`<x playsInline></x>`))
  is(esx.renderToString `<x radioGroup="1"></x>`, renderToString(esx`<x radioGroup="1"></x>`))
  is(esx.renderToString `<x readOnly></x>`, renderToString(esx`<x readOnly></x>`))
  is(esx.renderToString `<x referrerPolicy="1"></x>`, renderToString(esx`<x referrerPolicy="1"></x>`))
  is(esx.renderToString `<x rowSpan="1"></x>`, renderToString(esx`<x rowSpan="1"></x>`))
  is(esx.renderToString `<x spellCheck="1"></x>`, renderToString(esx`<x spellCheck="1"></x>`))
  is(esx.renderToString `<x srcDoc="1"></x>`, renderToString(esx`<x srcDoc="1"></x>`))
  is(esx.renderToString `<x srcLang="1"></x>`, renderToString(esx`<x srcLang="1"></x>`))
  is(esx.renderToString `<x srcSet="1"></x>`, renderToString(esx`<x srcSet="1"></x>`))
  is(esx.renderToString `<x tabIndex="1"></x>`, renderToString(esx`<x tabIndex="1"></x>`))
  is(esx.renderToString `<x useMap="1"></x>`, renderToString(esx`<x useMap="1"></x>`))
  is(esx.renderToString `<x accentHeight="1"></x>`, renderToString(esx`<x accentHeight="1"></x>`))
  is(esx.renderToString `<x alignmentBaseline="1"></x>`, renderToString(esx`<x alignmentBaseline="1"></x>`))
  is(esx.renderToString `<x allowReorder="1"></x>`, renderToString(esx`<x allowReorder="1"></x>`))
  is(esx.renderToString `<x arabicForm="1"></x>`, renderToString(esx`<x arabicForm="1"></x>`))
  is(esx.renderToString `<x attributeName="1"></x>`, renderToString(esx`<x attributeName="1"></x>`))
  is(esx.renderToString `<x attributeType="1"></x>`, renderToString(esx`<x attributeType="1"></x>`))
  is(esx.renderToString `<x autoReverse="1"></x>`, renderToString(esx`<x autoReverse="1"></x>`))
  is(esx.renderToString `<x baseFrequency="1"></x>`, renderToString(esx`<x baseFrequency="1"></x>`))
  is(esx.renderToString `<x baselineShift="1"></x>`, renderToString(esx`<x baselineShift="1"></x>`))
  is(esx.renderToString `<x baseProfile="1"></x>`, renderToString(esx`<x baseProfile="1"></x>`))
  is(esx.renderToString `<x calcMode="1"></x>`, renderToString(esx`<x calcMode="1"></x>`))
  is(esx.renderToString `<x capHeight="1"></x>`, renderToString(esx`<x capHeight="1"></x>`))
  is(esx.renderToString `<x clipPath="1"></x>`, renderToString(esx`<x clipPath="1"></x>`))
  is(esx.renderToString `<x clipPathUnits="1"></x>`, renderToString(esx`<x clipPathUnits="1"></x>`))
  is(esx.renderToString `<x clipRule="1"></x>`, renderToString(esx`<x clipRule="1"></x>`))
  is(esx.renderToString `<x colorInterpolation="1"></x>`, renderToString(esx`<x colorInterpolation="1"></x>`))
  is(esx.renderToString `<x colorInterpolationFilters="1"></x>`, renderToString(esx`<x colorInterpolationFilters="1"></x>`))
  is(esx.renderToString `<x colorProfile="1"></x>`, renderToString(esx`<x colorProfile="1"></x>`))
  is(esx.renderToString `<x colorRendering="1"></x>`, renderToString(esx`<x colorRendering="1"></x>`))
  is(esx.renderToString `<x contentScriptType="1"></x>`, renderToString(esx`<x contentScriptType="1"></x>`))
  is(esx.renderToString `<x contentStyleType="1"></x>`, renderToString(esx`<x contentStyleType="1"></x>`))
  is(esx.renderToString `<x diffuseConstant="1"></x>`, renderToString(esx`<x diffuseConstant="1"></x>`))
  is(esx.renderToString `<x dominantBaseline="1"></x>`, renderToString(esx`<x dominantBaseline="1"></x>`))
  is(esx.renderToString `<x edgeMode="1"></x>`, renderToString(esx`<x edgeMode="1"></x>`))
  is(esx.renderToString `<x enableBackground="1"></x>`, renderToString(esx`<x enableBackground="1"></x>`))
  is(esx.renderToString `<x externalResourcesRequired="1"></x>`, renderToString(esx`<x externalResourcesRequired="1"></x>`))
  is(esx.renderToString `<x fillOpacity="1"></x>`, renderToString(esx`<x fillOpacity="1"></x>`))
  is(esx.renderToString `<x fillRule="1"></x>`, renderToString(esx`<x fillRule="1"></x>`))
  is(esx.renderToString `<x filterRes="1"></x>`, renderToString(esx`<x filterRes="1"></x>`))
  is(esx.renderToString `<x filterUnits="1"></x>`, renderToString(esx`<x filterUnits="1"></x>`))
  is(esx.renderToString `<x floodOpacity="1"></x>`, renderToString(esx`<x floodOpacity="1"></x>`))
  is(esx.renderToString `<x floodColor="1"></x>`, renderToString(esx`<x floodColor="1"></x>`))
  is(esx.renderToString `<x fontFamily="1"></x>`, renderToString(esx`<x fontFamily="1"></x>`))
  is(esx.renderToString `<x fontSize="1"></x>`, renderToString(esx`<x fontSize="1"></x>`))
  is(esx.renderToString `<x fontSizeAdjust="1"></x>`, renderToString(esx`<x fontSizeAdjust="1"></x>`))
  is(esx.renderToString `<x fontStretch="1"></x>`, renderToString(esx`<x fontStretch="1"></x>`))
  is(esx.renderToString `<x fontStyle="1"></x>`, renderToString(esx`<x fontStyle="1"></x>`))
  is(esx.renderToString `<x fontVariant="1"></x>`, renderToString(esx`<x fontVariant="1"></x>`))
  is(esx.renderToString `<x fontWeight="1"></x>`, renderToString(esx`<x fontWeight="1"></x>`))
  is(esx.renderToString `<x glyphName="1"></x>`, renderToString(esx`<x glyphName="1"></x>`))
  is(esx.renderToString `<x glyphOrientationHorizontal="1"></x>`, renderToString(esx`<x glyphOrientationHorizontal="1"></x>`))
  is(esx.renderToString `<x glyphOrientationVertical="1"></x>`, renderToString(esx`<x glyphOrientationVertical="1"></x>`))
  is(esx.renderToString `<x glyphRef="1"></x>`, renderToString(esx`<x glyphRef="1"></x>`))
  is(esx.renderToString `<x gradientTransform="1"></x>`, renderToString(esx`<x gradientTransform="1"></x>`))
  is(esx.renderToString `<x gradientUnits="1"></x>`, renderToString(esx`<x gradientUnits="1"></x>`))
  is(esx.renderToString `<x horizAdvX="1"></x>`, renderToString(esx`<x horizAdvX="1"></x>`))
  is(esx.renderToString `<x horizOriginX="1"></x>`, renderToString(esx`<x horizOriginX="1"></x>`))
  is(esx.renderToString `<x imageRendering="1"></x>`, renderToString(esx`<x imageRendering="1"></x>`))
  is(esx.renderToString `<x kernelMatrix="1"></x>`, renderToString(esx`<x kernelMatrix="1"></x>`))
  is(esx.renderToString `<x kernelUnitLength="1"></x>`, renderToString(esx`<x kernelUnitLength="1"></x>`))
  is(esx.renderToString `<x keyPoints="1"></x>`, renderToString(esx`<x keyPoints="1"></x>`))
  is(esx.renderToString `<x keySplines="1"></x>`, renderToString(esx`<x keySplines="1"></x>`))
  is(esx.renderToString `<x keyTimes="1"></x>`, renderToString(esx`<x keyTimes="1"></x>`))
  is(esx.renderToString `<x lengthAdjust="1"></x>`, renderToString(esx`<x lengthAdjust="1"></x>`))
  is(esx.renderToString `<x letterSpacing="1"></x>`, renderToString(esx`<x letterSpacing="1"></x>`))
  is(esx.renderToString `<x lightingColor="1"></x>`, renderToString(esx`<x lightingColor="1"></x>`))
  is(esx.renderToString `<x limitingConeAngle="1"></x>`, renderToString(esx`<x limitingConeAngle="1"></x>`))
  is(esx.renderToString `<x markerEnd="1"></x>`, renderToString(esx`<x markerEnd="1"></x>`))
  is(esx.renderToString `<x markerHeight="1"></x>`, renderToString(esx`<x markerHeight="1"></x>`))
  is(esx.renderToString `<x markerMid="1"></x>`, renderToString(esx`<x markerMid="1"></x>`))
  is(esx.renderToString `<x markerStart="1"></x>`, renderToString(esx`<x markerStart="1"></x>`))
  is(esx.renderToString `<x markerUnits="1"></x>`, renderToString(esx`<x markerUnits="1"></x>`))
  is(esx.renderToString `<x markerWidth="1"></x>`, renderToString(esx`<x markerWidth="1"></x>`))
  is(esx.renderToString `<x maskContentUnits="1"></x>`, renderToString(esx`<x maskContentUnits="1"></x>`))
  is(esx.renderToString `<x maskUnits="1"></x>`, renderToString(esx`<x maskUnits="1"></x>`))
  is(esx.renderToString `<x numOctaves="1"></x>`, renderToString(esx`<x numOctaves="1"></x>`))
  is(esx.renderToString `<x overlinePosition="1"></x>`, renderToString(esx`<x overlinePosition="1"></x>`))
  is(esx.renderToString `<x overlineThickness="1"></x>`, renderToString(esx`<x overlineThickness="1"></x>`))
  is(esx.renderToString `<x paintOrder="1"></x>`, renderToString(esx`<x paintOrder="1"></x>`))
  is(esx.renderToString `<x panose1="1"></x>`, renderToString(esx`<x panose1="1"></x>`))
  is(esx.renderToString `<x pathLength="1"></x>`, renderToString(esx`<x pathLength="1"></x>`))
  is(esx.renderToString `<x patternContentUnits="1"></x>`, renderToString(esx`<x patternContentUnits="1"></x>`))
  is(esx.renderToString `<x patternTransform="1"></x>`, renderToString(esx`<x patternTransform="1"></x>`))
  is(esx.renderToString `<x patternUnits="1"></x>`, renderToString(esx`<x patternUnits="1"></x>`))
  is(esx.renderToString `<x pointerEvents="1"></x>`, renderToString(esx`<x pointerEvents="1"></x>`))
  is(esx.renderToString `<x pointsAtX="1"></x>`, renderToString(esx`<x pointsAtX="1"></x>`))
  is(esx.renderToString `<x pointsAtY="1"></x>`, renderToString(esx`<x pointsAtY="1"></x>`))
  is(esx.renderToString `<x pointsAtZ="1"></x>`, renderToString(esx`<x pointsAtZ="1"></x>`))
  is(esx.renderToString `<x preserveAlpha="1"></x>`, renderToString(esx`<x preserveAlpha="1"></x>`))
  is(esx.renderToString `<x preserveAspectRatio="1"></x>`, renderToString(esx`<x preserveAspectRatio="1"></x>`))
  is(esx.renderToString `<x primitiveUnits="1"></x>`, renderToString(esx`<x primitiveUnits="1"></x>`))
  is(esx.renderToString `<x refX="1"></x>`, renderToString(esx`<x refX="1"></x>`))
  is(esx.renderToString `<x refY="1"></x>`, renderToString(esx`<x refY="1"></x>`))
  is(esx.renderToString `<x renderingIntent="1"></x>`, renderToString(esx`<x renderingIntent="1"></x>`))
  is(esx.renderToString `<x repeatCount="1"></x>`, renderToString(esx`<x repeatCount="1"></x>`))
  is(esx.renderToString `<x repeatDur="1"></x>`, renderToString(esx`<x repeatDur="1"></x>`))
  is(esx.renderToString `<x requiredExtensions="1"></x>`, renderToString(esx`<x requiredExtensions="1"></x>`))
  is(esx.renderToString `<x requiredFeatures="1"></x>`, renderToString(esx`<x requiredFeatures="1"></x>`))
  is(esx.renderToString `<x shapeRendering="1"></x>`, renderToString(esx`<x shapeRendering="1"></x>`))
  is(esx.renderToString `<x specularConstant="1"></x>`, renderToString(esx`<x specularConstant="1"></x>`))
  is(esx.renderToString `<x specularExponent="1"></x>`, renderToString(esx`<x specularExponent="1"></x>`))
  is(esx.renderToString `<x spreadMethod="1"></x>`, renderToString(esx`<x spreadMethod="1"></x>`))
  is(esx.renderToString `<x startOffset="1"></x>`, renderToString(esx`<x startOffset="1"></x>`))
  is(esx.renderToString `<x stdDeviation="1"></x>`, renderToString(esx`<x stdDeviation="1"></x>`))
  is(esx.renderToString `<x stitchTiles="1"></x>`, renderToString(esx`<x stitchTiles="1"></x>`))
  is(esx.renderToString `<x stopColor="1"></x>`, renderToString(esx`<x stopColor="1"></x>`))
  is(esx.renderToString `<x stopOpacity="1"></x>`, renderToString(esx`<x stopOpacity="1"></x>`))
  is(esx.renderToString `<x strikethroughPosition="1"></x>`, renderToString(esx`<x strikethroughPosition="1"></x>`))
  is(esx.renderToString `<x strikethroughThickness="1"></x>`, renderToString(esx`<x strikethroughThickness="1"></x>`))
  is(esx.renderToString `<x strokeDasharray="1"></x>`, renderToString(esx`<x strokeDasharray="1"></x>`))
  is(esx.renderToString `<x strokeDashoffset="1"></x>`, renderToString(esx`<x strokeDashoffset="1"></x>`))
  is(esx.renderToString `<x strokeLinecap="1"></x>`, renderToString(esx`<x strokeLinecap="1"></x>`))
  is(esx.renderToString `<x strokeLinejoin="1"></x>`, renderToString(esx`<x strokeLinejoin="1"></x>`))
  is(esx.renderToString `<x strokeMiterlimit="1"></x>`, renderToString(esx`<x strokeMiterlimit="1"></x>`))
  is(esx.renderToString `<x strokeWidth="1"></x>`, renderToString(esx`<x strokeWidth="1"></x>`))
  is(esx.renderToString `<x strokeOpacity="1"></x>`, renderToString(esx`<x strokeOpacity="1"></x>`))
  is(esx.renderToString `<x surfaceScale="1"></x>`, renderToString(esx`<x surfaceScale="1"></x>`))
  is(esx.renderToString `<x systemLanguage="1"></x>`, renderToString(esx`<x systemLanguage="1"></x>`))
  is(esx.renderToString `<x tableValues="1"></x>`, renderToString(esx`<x tableValues="1"></x>`))
  is(esx.renderToString `<x targetX="1"></x>`, renderToString(esx`<x targetX="1"></x>`))
  is(esx.renderToString `<x targetY="1"></x>`, renderToString(esx`<x targetY="1"></x>`))
  is(esx.renderToString `<x textAnchor="1"></x>`, renderToString(esx`<x textAnchor="1"></x>`))
  is(esx.renderToString `<x textDecoration="1"></x>`, renderToString(esx`<x textDecoration="1"></x>`))
  is(esx.renderToString `<x textLength="1"></x>`, renderToString(esx`<x textLength="1"></x>`))
  is(esx.renderToString `<x textRendering="1"></x>`, renderToString(esx`<x textRendering="1"></x>`))
  is(esx.renderToString `<x underlinePosition="1"></x>`, renderToString(esx`<x underlinePosition="1"></x>`))
  is(esx.renderToString `<x underlineThickness="1"></x>`, renderToString(esx`<x underlineThickness="1"></x>`))
  is(esx.renderToString `<x unicodeBidi="1"></x>`, renderToString(esx`<x unicodeBidi="1"></x>`))
  is(esx.renderToString `<x unicodeRange="1"></x>`, renderToString(esx`<x unicodeRange="1"></x>`))
  is(esx.renderToString `<x unitsPerEm="1"></x>`, renderToString(esx`<x unitsPerEm="1"></x>`))
  is(esx.renderToString `<x vAlphabetic="1"></x>`, renderToString(esx`<x vAlphabetic="1"></x>`))
  is(esx.renderToString `<x vectorEffect="1"></x>`, renderToString(esx`<x vectorEffect="1"></x>`))
  is(esx.renderToString `<x vertAdvY="1"></x>`, renderToString(esx`<x vertAdvY="1"></x>`))
  is(esx.renderToString `<x vertOriginX="1"></x>`, renderToString(esx`<x vertOriginX="1"></x>`))
  is(esx.renderToString `<x vertOriginY="1"></x>`, renderToString(esx`<x vertOriginY="1"></x>`))
  is(esx.renderToString `<x vHanging="1"></x>`, renderToString(esx`<x vHanging="1"></x>`))
  is(esx.renderToString `<x vIdeographic="1"></x>`, renderToString(esx`<x vIdeographic="1"></x>`))
  is(esx.renderToString `<x viewBox="1"></x>`, renderToString(esx`<x viewBox="1"></x>`))
  is(esx.renderToString `<x viewTarget="1"></x>`, renderToString(esx`<x viewTarget="1"></x>`))
  is(esx.renderToString `<x vMathematical="1"></x>`, renderToString(esx`<x vMathematical="1"></x>`))
  is(esx.renderToString `<x wordSpacing="1"></x>`, renderToString(esx`<x wordSpacing="1"></x>`))
  is(esx.renderToString `<x writingMode="1"></x>`, renderToString(esx`<x writingMode="1"></x>`))
  is(esx.renderToString `<x xChannelSelector="1"></x>`, renderToString(esx`<x xChannelSelector="1"></x>`))
  is(esx.renderToString `<x xHeight="1"></x>`, renderToString(esx`<x xHeight="1"></x>`))
  is(esx.renderToString `<x xlinkActuate="1"></x>`, renderToString(esx`<x xlinkActuate="1"></x>`))
  is(esx.renderToString `<x xlinkArcrole="1"></x>`, renderToString(esx`<x xlinkArcrole="1"></x>`))
  is(esx.renderToString `<x xlinkHref="1"></x>`, renderToString(esx`<x xlinkHref="1"></x>`))
  is(esx.renderToString `<x xlinkRole="1"></x>`, renderToString(esx`<x xlinkRole="1"></x>`))
  is(esx.renderToString `<x xlinkShow="1"></x>`, renderToString(esx`<x xlinkShow="1"></x>`))
  is(esx.renderToString `<x xlinkTitle="1"></x>`, renderToString(esx`<x xlinkTitle="1"></x>`))
  is(esx.renderToString `<x xlinkType="1"></x>`, renderToString(esx`<x xlinkType="1"></x>`))
  is(esx.renderToString `<x xmlBase="1"></x>`, renderToString(esx`<x xmlBase="1"></x>`))
  is(esx.renderToString `<x xmlLang="1"></x>`, renderToString(esx`<x xmlLang="1"></x>`))
  is(esx.renderToString `<x xmlSpace="1"></x>`, renderToString(esx`<x xmlSpace="1"></x>`))
  is(esx.renderToString `<x xmlnsXlink="1"></x>`, renderToString(esx`<x xmlnsXlink="1"></x>`))
  is(esx.renderToString `<x xmlSpace="1"></x>`, renderToString(esx`<x xmlSpace="1"></x>`))
  is(esx.renderToString `<x yChannelSelector="1"></x>`, renderToString(esx`<x yChannelSelector="1"></x>`))
  is(esx.renderToString `<x zoomAndPan="1"></x>`, renderToString(esx`<x zoomAndPan="1"></x>`))
  is(esx.renderToString `<x acceptCharset="1" foo="1"></x>`, renderToString(esx`<x acceptCharset="1" foo="1"></x>`))
  is(esx.renderToString `<x accessKey="1" foo="1"></x>`, renderToString(esx`<x accessKey="1" foo="1"></x>`))
  is(esx.renderToString `<x autoCapitalize="1" foo="1"></x>`, renderToString(esx`<x autoCapitalize="1" foo="1"></x>`))
  is(esx.renderToString `<x autoComplete="1" foo="1"></x>`, renderToString(esx`<x autoComplete="1" foo="1"></x>`))
  is(esx.renderToString `<x autoCorrect="1" foo="1"></x>`, renderToString(esx`<x autoCorrect="1" foo="1"></x>`))
  is(esx.renderToString `<x autoFocus foo="1"></x>`, renderToString(esx`<x autoFocus foo="1"></x>`))
  is(esx.renderToString `<x autoPlay foo="1"></x>`, renderToString(esx`<x autoPlay foo="1"></x>`))
  is(esx.renderToString `<x autoSave="1" foo="1"></x>`, renderToString(esx`<x autoSave="1" foo="1"></x>`))
  is(esx.renderToString `<x cellPadding="1" foo="1"></x>`, renderToString(esx`<x cellPadding="1" foo="1"></x>`))
  is(esx.renderToString `<x cellSpacing="1" foo="1"></x>`, renderToString(esx`<x cellSpacing="1" foo="1"></x>`))
  is(esx.renderToString `<x charSet="1" foo="1"></x>`, renderToString(esx`<x charSet="1" foo="1"></x>`))
  is(esx.renderToString `<x classID="1" foo="1"></x>`, renderToString(esx`<x classID="1" foo="1"></x>`))
  is(esx.renderToString `<x colSpan="1" foo="1"></x>`, renderToString(esx`<x colSpan="1" foo="1"></x>`))
  is(esx.renderToString `<x contentEditable="1" foo="1"></x>`, renderToString(esx`<x contentEditable="1" foo="1"></x>`))
  is(esx.renderToString `<x contextMenu="1" foo="1"></x>`, renderToString(esx`<x contextMenu="1" foo="1"></x>`))
  is(esx.renderToString `<x controlsList="1" foo="1"></x>`, renderToString(esx`<x controlsList="1" foo="1"></x>`))
  is(esx.renderToString `<x crossOrigin="1" foo="1"></x>`, renderToString(esx`<x crossOrigin="1" foo="1"></x>`))
  is(esx.renderToString `<x dateTime="1" foo="1"></x>`, renderToString(esx`<x dateTime="1" foo="1"></x>`))
  is(esx.renderToString `<x encType="1" foo="1"></x>`, renderToString(esx`<x encType="1" foo="1"></x>`))
  is(esx.renderToString `<x formMethod="1" foo="1"></x>`, renderToString(esx`<x formMethod="1" foo="1"></x>`))
  is(esx.renderToString `<x formAction="1" foo="1"></x>`, renderToString(esx`<x formAction="1" foo="1"></x>`))
  is(esx.renderToString `<x formEncType="1" foo="1"></x>`, renderToString(esx`<x formEncType="1" foo="1"></x>`))
  is(esx.renderToString `<x formNoValidate foo="1"></x>`, renderToString(esx`<x formNoValidate foo="1"></x>`))
  is(esx.renderToString `<x formTarget="1" foo="1"></x>`, renderToString(esx`<x formTarget="1" foo="1"></x>`))
  is(esx.renderToString `<x frameBorder="1" foo="1"></x>`, renderToString(esx`<x frameBorder="1" foo="1"></x>`))
  is(esx.renderToString `<x hrefLang="1" foo="1"></x>`, renderToString(esx`<x hrefLang="1" foo="1"></x>`))
  is(esx.renderToString `<x inputMode="1" foo="1"></x>`, renderToString(esx`<x inputMode="1" foo="1"></x>`))
  is(esx.renderToString `<x itemID="1" foo="1"></x>`, renderToString(esx`<x itemID="1" foo="1"></x>`))
  is(esx.renderToString `<x itemProp="1" foo="1"></x>`, renderToString(esx`<x itemProp="1" foo="1"></x>`))
  is(esx.renderToString `<x itemRef="1" foo="1"></x>`, renderToString(esx`<x itemRef="1" foo="1"></x>`))
  is(esx.renderToString `<x itemScope foo="1"></x>`, renderToString(esx`<x itemScope foo="1"></x>`))
  is(esx.renderToString `<x itemType="1" foo="1"></x>`, renderToString(esx`<x itemType="1" foo="1"></x>`))
  is(esx.renderToString `<x keyParams="1" foo="1"></x>`, renderToString(esx`<x keyParams="1" foo="1"></x>`))
  is(esx.renderToString `<x keyType="1" foo="1"></x>`, renderToString(esx`<x keyType="1" foo="1"></x>`))
  is(esx.renderToString `<x marginWidth="1" foo="1"></x>`, renderToString(esx`<x marginWidth="1" foo="1"></x>`))
  is(esx.renderToString `<x marginHeight="1" foo="1"></x>`, renderToString(esx`<x marginHeight="1" foo="1"></x>`))
  is(esx.renderToString `<x maxLength="1" foo="1"></x>`, renderToString(esx`<x maxLength="1" foo="1"></x>`))
  is(esx.renderToString `<x mediaGroup="1" foo="1"></x>`, renderToString(esx`<x mediaGroup="1" foo="1"></x>`))
  is(esx.renderToString `<x minLength="1" foo="1"></x>`, renderToString(esx`<x minLength="1" foo="1"></x>`))
  is(esx.renderToString `<x noModule foo="1"></x>`, renderToString(esx`<x noModule foo="1"></x>`))
  is(esx.renderToString `<x noValidate foo="1"></x>`, renderToString(esx`<x noValidate foo="1"></x>`))
  is(esx.renderToString `<x playsInline foo="1"></x>`, renderToString(esx`<x playsInline foo="1"></x>`))
  is(esx.renderToString `<x radioGroup="1" foo="1"></x>`, renderToString(esx`<x radioGroup="1" foo="1"></x>`))
  is(esx.renderToString `<x readOnly foo="1"></x>`, renderToString(esx`<x readOnly foo="1"></x>`))
  is(esx.renderToString `<x referrerPolicy="1" foo="1"></x>`, renderToString(esx`<x referrerPolicy="1" foo="1"></x>`))
  is(esx.renderToString `<x rowSpan="1" foo="1"></x>`, renderToString(esx`<x rowSpan="1" foo="1"></x>`))
  is(esx.renderToString `<x spellCheck="1" foo="1"></x>`, renderToString(esx`<x spellCheck="1" foo="1"></x>`))
  is(esx.renderToString `<x srcDoc="1" foo="1"></x>`, renderToString(esx`<x srcDoc="1" foo="1"></x>`))
  is(esx.renderToString `<x srcLang="1" foo="1"></x>`, renderToString(esx`<x srcLang="1" foo="1"></x>`))
  is(esx.renderToString `<x srcSet="1" foo="1"></x>`, renderToString(esx`<x srcSet="1" foo="1"></x>`))
  is(esx.renderToString `<x tabIndex="1" foo="1"></x>`, renderToString(esx`<x tabIndex="1" foo="1"></x>`))
  is(esx.renderToString `<x useMap="1" foo="1"></x>`, renderToString(esx`<x useMap="1" foo="1"></x>`))
  is(esx.renderToString `<x accentHeight="1" foo="1"></x>`, renderToString(esx`<x accentHeight="1" foo="1"></x>`))
  is(esx.renderToString `<x alignmentBaseline="1" foo="1"></x>`, renderToString(esx`<x alignmentBaseline="1" foo="1"></x>`))
  is(esx.renderToString `<x allowReorder="1" foo="1"></x>`, renderToString(esx`<x allowReorder="1" foo="1"></x>`))
  is(esx.renderToString `<x arabicForm="1" foo="1"></x>`, renderToString(esx`<x arabicForm="1" foo="1"></x>`))
  is(esx.renderToString `<x attributeName="1" foo="1"></x>`, renderToString(esx`<x attributeName="1" foo="1"></x>`))
  is(esx.renderToString `<x attributeType="1" foo="1"></x>`, renderToString(esx`<x attributeType="1" foo="1"></x>`))
  is(esx.renderToString `<x autoReverse="1" foo="1"></x>`, renderToString(esx`<x autoReverse="1" foo="1"></x>`))
  is(esx.renderToString `<x baseFrequency="1" foo="1"></x>`, renderToString(esx`<x baseFrequency="1" foo="1"></x>`))
  is(esx.renderToString `<x baselineShift="1" foo="1"></x>`, renderToString(esx`<x baselineShift="1" foo="1"></x>`))
  is(esx.renderToString `<x baseProfile="1" foo="1"></x>`, renderToString(esx`<x baseProfile="1" foo="1"></x>`))
  is(esx.renderToString `<x calcMode="1" foo="1"></x>`, renderToString(esx`<x calcMode="1" foo="1"></x>`))
  is(esx.renderToString `<x capHeight="1" foo="1"></x>`, renderToString(esx`<x capHeight="1" foo="1"></x>`))
  is(esx.renderToString `<x clipPath="1" foo="1"></x>`, renderToString(esx`<x clipPath="1" foo="1"></x>`))
  is(esx.renderToString `<x clipPathUnits="1" foo="1"></x>`, renderToString(esx`<x clipPathUnits="1" foo="1"></x>`))
  is(esx.renderToString `<x clipRule="1" foo="1"></x>`, renderToString(esx`<x clipRule="1" foo="1"></x>`))
  is(esx.renderToString `<x colorInterpolation="1" foo="1"></x>`, renderToString(esx`<x colorInterpolation="1" foo="1"></x>`))
  is(esx.renderToString `<x colorInterpolationFilters="1" foo="1"></x>`, renderToString(esx`<x colorInterpolationFilters="1" foo="1"></x>`))
  is(esx.renderToString `<x colorProfile="1" foo="1"></x>`, renderToString(esx`<x colorProfile="1" foo="1"></x>`))
  is(esx.renderToString `<x colorRendering="1" foo="1"></x>`, renderToString(esx`<x colorRendering="1" foo="1"></x>`))
  is(esx.renderToString `<x contentScriptType="1" foo="1"></x>`, renderToString(esx`<x contentScriptType="1" foo="1"></x>`))
  is(esx.renderToString `<x contentStyleType="1" foo="1"></x>`, renderToString(esx`<x contentStyleType="1" foo="1"></x>`))
  is(esx.renderToString `<x diffuseConstant="1" foo="1"></x>`, renderToString(esx`<x diffuseConstant="1" foo="1"></x>`))
  is(esx.renderToString `<x dominantBaseline="1" foo="1"></x>`, renderToString(esx`<x dominantBaseline="1" foo="1"></x>`))
  is(esx.renderToString `<x edgeMode="1" foo="1"></x>`, renderToString(esx`<x edgeMode="1" foo="1"></x>`))
  is(esx.renderToString `<x enableBackground="1" foo="1"></x>`, renderToString(esx`<x enableBackground="1" foo="1"></x>`))
  is(esx.renderToString `<x externalResourcesRequired="1" foo="1"></x>`, renderToString(esx`<x externalResourcesRequired="1" foo="1"></x>`))
  is(esx.renderToString `<x fillOpacity="1" foo="1"></x>`, renderToString(esx`<x fillOpacity="1" foo="1"></x>`))
  is(esx.renderToString `<x fillRule="1" foo="1"></x>`, renderToString(esx`<x fillRule="1" foo="1"></x>`))
  is(esx.renderToString `<x filterRes="1" foo="1"></x>`, renderToString(esx`<x filterRes="1" foo="1"></x>`))
  is(esx.renderToString `<x filterUnits="1" foo="1"></x>`, renderToString(esx`<x filterUnits="1" foo="1"></x>`))
  is(esx.renderToString `<x floodOpacity="1" foo="1"></x>`, renderToString(esx`<x floodOpacity="1" foo="1"></x>`))
  is(esx.renderToString `<x floodColor="1" foo="1"></x>`, renderToString(esx`<x floodColor="1" foo="1"></x>`))
  is(esx.renderToString `<x fontFamily="1" foo="1"></x>`, renderToString(esx`<x fontFamily="1" foo="1"></x>`))
  is(esx.renderToString `<x fontSize="1" foo="1"></x>`, renderToString(esx`<x fontSize="1" foo="1"></x>`))
  is(esx.renderToString `<x fontSizeAdjust="1" foo="1"></x>`, renderToString(esx`<x fontSizeAdjust="1" foo="1"></x>`))
  is(esx.renderToString `<x fontStretch="1" foo="1"></x>`, renderToString(esx`<x fontStretch="1" foo="1"></x>`))
  is(esx.renderToString `<x fontStyle="1" foo="1"></x>`, renderToString(esx`<x fontStyle="1" foo="1"></x>`))
  is(esx.renderToString `<x fontVariant="1" foo="1"></x>`, renderToString(esx`<x fontVariant="1" foo="1"></x>`))
  is(esx.renderToString `<x fontWeight="1" foo="1"></x>`, renderToString(esx`<x fontWeight="1" foo="1"></x>`))
  is(esx.renderToString `<x glyphName="1" foo="1"></x>`, renderToString(esx`<x glyphName="1" foo="1"></x>`))
  is(esx.renderToString `<x glyphOrientationHorizontal="1" foo="1"></x>`, renderToString(esx`<x glyphOrientationHorizontal="1" foo="1"></x>`))
  is(esx.renderToString `<x glyphOrientationVertical="1" foo="1"></x>`, renderToString(esx`<x glyphOrientationVertical="1" foo="1"></x>`))
  is(esx.renderToString `<x glyphRef="1" foo="1"></x>`, renderToString(esx`<x glyphRef="1" foo="1"></x>`))
  is(esx.renderToString `<x gradientTransform="1" foo="1"></x>`, renderToString(esx`<x gradientTransform="1" foo="1"></x>`))
  is(esx.renderToString `<x gradientUnits="1" foo="1"></x>`, renderToString(esx`<x gradientUnits="1" foo="1"></x>`))
  is(esx.renderToString `<x horizAdvX="1" foo="1"></x>`, renderToString(esx`<x horizAdvX="1" foo="1"></x>`))
  is(esx.renderToString `<x horizOriginX="1" foo="1"></x>`, renderToString(esx`<x horizOriginX="1" foo="1"></x>`))
  is(esx.renderToString `<x imageRendering="1" foo="1"></x>`, renderToString(esx`<x imageRendering="1" foo="1"></x>`))
  is(esx.renderToString `<x kernelMatrix="1" foo="1"></x>`, renderToString(esx`<x kernelMatrix="1" foo="1"></x>`))
  is(esx.renderToString `<x kernelUnitLength="1" foo="1"></x>`, renderToString(esx`<x kernelUnitLength="1" foo="1"></x>`))
  is(esx.renderToString `<x keyPoints="1" foo="1"></x>`, renderToString(esx`<x keyPoints="1" foo="1"></x>`))
  is(esx.renderToString `<x keySplines="1" foo="1"></x>`, renderToString(esx`<x keySplines="1" foo="1"></x>`))
  is(esx.renderToString `<x keyTimes="1" foo="1"></x>`, renderToString(esx`<x keyTimes="1" foo="1"></x>`))
  is(esx.renderToString `<x lengthAdjust="1" foo="1"></x>`, renderToString(esx`<x lengthAdjust="1" foo="1"></x>`))
  is(esx.renderToString `<x letterSpacing="1" foo="1"></x>`, renderToString(esx`<x letterSpacing="1" foo="1"></x>`))
  is(esx.renderToString `<x lightingColor="1" foo="1"></x>`, renderToString(esx`<x lightingColor="1" foo="1"></x>`))
  is(esx.renderToString `<x limitingConeAngle="1" foo="1"></x>`, renderToString(esx`<x limitingConeAngle="1" foo="1"></x>`))
  is(esx.renderToString `<x markerEnd="1" foo="1"></x>`, renderToString(esx`<x markerEnd="1" foo="1"></x>`))
  is(esx.renderToString `<x markerHeight="1" foo="1"></x>`, renderToString(esx`<x markerHeight="1" foo="1"></x>`))
  is(esx.renderToString `<x markerMid="1" foo="1"></x>`, renderToString(esx`<x markerMid="1" foo="1"></x>`))
  is(esx.renderToString `<x markerStart="1" foo="1"></x>`, renderToString(esx`<x markerStart="1" foo="1"></x>`))
  is(esx.renderToString `<x markerUnits="1" foo="1"></x>`, renderToString(esx`<x markerUnits="1" foo="1"></x>`))
  is(esx.renderToString `<x markerWidth="1" foo="1"></x>`, renderToString(esx`<x markerWidth="1" foo="1"></x>`))
  is(esx.renderToString `<x maskContentUnits="1" foo="1"></x>`, renderToString(esx`<x maskContentUnits="1" foo="1"></x>`))
  is(esx.renderToString `<x maskUnits="1" foo="1"></x>`, renderToString(esx`<x maskUnits="1" foo="1"></x>`))
  is(esx.renderToString `<x numOctaves="1" foo="1"></x>`, renderToString(esx`<x numOctaves="1" foo="1"></x>`))
  is(esx.renderToString `<x overlinePosition="1" foo="1"></x>`, renderToString(esx`<x overlinePosition="1" foo="1"></x>`))
  is(esx.renderToString `<x overlineThickness="1" foo="1"></x>`, renderToString(esx`<x overlineThickness="1" foo="1"></x>`))
  is(esx.renderToString `<x paintOrder="1" foo="1"></x>`, renderToString(esx`<x paintOrder="1" foo="1"></x>`))
  is(esx.renderToString `<x panose1="1" foo="1"></x>`, renderToString(esx`<x panose1="1" foo="1"></x>`))
  is(esx.renderToString `<x pathLength="1" foo="1"></x>`, renderToString(esx`<x pathLength="1" foo="1"></x>`))
  is(esx.renderToString `<x patternContentUnits="1" foo="1"></x>`, renderToString(esx`<x patternContentUnits="1" foo="1"></x>`))
  is(esx.renderToString `<x patternTransform="1" foo="1"></x>`, renderToString(esx`<x patternTransform="1" foo="1"></x>`))
  is(esx.renderToString `<x patternUnits="1" foo="1"></x>`, renderToString(esx`<x patternUnits="1" foo="1"></x>`))
  is(esx.renderToString `<x pointerEvents="1" foo="1"></x>`, renderToString(esx`<x pointerEvents="1" foo="1"></x>`))
  is(esx.renderToString `<x pointsAtX="1" foo="1"></x>`, renderToString(esx`<x pointsAtX="1" foo="1"></x>`))
  is(esx.renderToString `<x pointsAtY="1" foo="1"></x>`, renderToString(esx`<x pointsAtY="1" foo="1"></x>`))
  is(esx.renderToString `<x pointsAtZ="1" foo="1"></x>`, renderToString(esx`<x pointsAtZ="1" foo="1"></x>`))
  is(esx.renderToString `<x preserveAlpha="1" foo="1"></x>`, renderToString(esx`<x preserveAlpha="1" foo="1"></x>`))
  is(esx.renderToString `<x preserveAspectRatio="1" foo="1"></x>`, renderToString(esx`<x preserveAspectRatio="1" foo="1"></x>`))
  is(esx.renderToString `<x primitiveUnits="1" foo="1"></x>`, renderToString(esx`<x primitiveUnits="1" foo="1"></x>`))
  is(esx.renderToString `<x refX="1" foo="1"></x>`, renderToString(esx`<x refX="1" foo="1"></x>`))
  is(esx.renderToString `<x refY="1" foo="1"></x>`, renderToString(esx`<x refY="1" foo="1"></x>`))
  is(esx.renderToString `<x renderingIntent="1" foo="1"></x>`, renderToString(esx`<x renderingIntent="1" foo="1"></x>`))
  is(esx.renderToString `<x repeatCount="1" foo="1"></x>`, renderToString(esx`<x repeatCount="1" foo="1"></x>`))
  is(esx.renderToString `<x repeatDur="1" foo="1"></x>`, renderToString(esx`<x repeatDur="1" foo="1"></x>`))
  is(esx.renderToString `<x requiredExtensions="1" foo="1"></x>`, renderToString(esx`<x requiredExtensions="1" foo="1"></x>`))
  is(esx.renderToString `<x requiredFeatures="1" foo="1"></x>`, renderToString(esx`<x requiredFeatures="1" foo="1"></x>`))
  is(esx.renderToString `<x shapeRendering="1" foo="1"></x>`, renderToString(esx`<x shapeRendering="1" foo="1"></x>`))
  is(esx.renderToString `<x specularConstant="1" foo="1"></x>`, renderToString(esx`<x specularConstant="1" foo="1"></x>`))
  is(esx.renderToString `<x specularExponent="1" foo="1"></x>`, renderToString(esx`<x specularExponent="1" foo="1"></x>`))
  is(esx.renderToString `<x spreadMethod="1" foo="1"></x>`, renderToString(esx`<x spreadMethod="1" foo="1"></x>`))
  is(esx.renderToString `<x startOffset="1" foo="1"></x>`, renderToString(esx`<x startOffset="1" foo="1"></x>`))
  is(esx.renderToString `<x stdDeviation="1" foo="1"></x>`, renderToString(esx`<x stdDeviation="1" foo="1"></x>`))
  is(esx.renderToString `<x stitchTiles="1" foo="1"></x>`, renderToString(esx`<x stitchTiles="1" foo="1"></x>`))
  is(esx.renderToString `<x stopColor="1" foo="1"></x>`, renderToString(esx`<x stopColor="1" foo="1"></x>`))
  is(esx.renderToString `<x stopOpacity="1" foo="1"></x>`, renderToString(esx`<x stopOpacity="1" foo="1"></x>`))
  is(esx.renderToString `<x strikethroughPosition="1" foo="1"></x>`, renderToString(esx`<x strikethroughPosition="1" foo="1"></x>`))
  is(esx.renderToString `<x strikethroughThickness="1" foo="1"></x>`, renderToString(esx`<x strikethroughThickness="1" foo="1"></x>`))
  is(esx.renderToString `<x strokeDasharray="1" foo="1"></x>`, renderToString(esx`<x strokeDasharray="1" foo="1"></x>`))
  is(esx.renderToString `<x strokeDashoffset="1" foo="1"></x>`, renderToString(esx`<x strokeDashoffset="1" foo="1"></x>`))
  is(esx.renderToString `<x strokeLinecap="1" foo="1"></x>`, renderToString(esx`<x strokeLinecap="1" foo="1"></x>`))
  is(esx.renderToString `<x strokeLinejoin="1" foo="1"></x>`, renderToString(esx`<x strokeLinejoin="1" foo="1"></x>`))
  is(esx.renderToString `<x strokeMiterlimit="1" foo="1"></x>`, renderToString(esx`<x strokeMiterlimit="1" foo="1"></x>`))
  is(esx.renderToString `<x strokeWidth="1" foo="1"></x>`, renderToString(esx`<x strokeWidth="1" foo="1"></x>`))
  is(esx.renderToString `<x strokeOpacity="1" foo="1"></x>`, renderToString(esx`<x strokeOpacity="1" foo="1"></x>`))
  is(esx.renderToString `<x surfaceScale="1" foo="1"></x>`, renderToString(esx`<x surfaceScale="1" foo="1"></x>`))
  is(esx.renderToString `<x systemLanguage="1" foo="1"></x>`, renderToString(esx`<x systemLanguage="1" foo="1"></x>`))
  is(esx.renderToString `<x tableValues="1" foo="1"></x>`, renderToString(esx`<x tableValues="1" foo="1"></x>`))
  is(esx.renderToString `<x targetX="1" foo="1"></x>`, renderToString(esx`<x targetX="1" foo="1"></x>`))
  is(esx.renderToString `<x targetY="1" foo="1"></x>`, renderToString(esx`<x targetY="1" foo="1"></x>`))
  is(esx.renderToString `<x textAnchor="1" foo="1"></x>`, renderToString(esx`<x textAnchor="1" foo="1"></x>`))
  is(esx.renderToString `<x textDecoration="1" foo="1"></x>`, renderToString(esx`<x textDecoration="1" foo="1"></x>`))
  is(esx.renderToString `<x textLength="1" foo="1"></x>`, renderToString(esx`<x textLength="1" foo="1"></x>`))
  is(esx.renderToString `<x textRendering="1" foo="1"></x>`, renderToString(esx`<x textRendering="1" foo="1"></x>`))
  is(esx.renderToString `<x underlinePosition="1" foo="1"></x>`, renderToString(esx`<x underlinePosition="1" foo="1"></x>`))
  is(esx.renderToString `<x underlineThickness="1" foo="1"></x>`, renderToString(esx`<x underlineThickness="1" foo="1"></x>`))
  is(esx.renderToString `<x unicodeBidi="1" foo="1"></x>`, renderToString(esx`<x unicodeBidi="1" foo="1"></x>`))
  is(esx.renderToString `<x unicodeRange="1" foo="1"></x>`, renderToString(esx`<x unicodeRange="1" foo="1"></x>`))
  is(esx.renderToString `<x unitsPerEm="1" foo="1"></x>`, renderToString(esx`<x unitsPerEm="1" foo="1"></x>`))
  is(esx.renderToString `<x vAlphabetic="1" foo="1"></x>`, renderToString(esx`<x vAlphabetic="1" foo="1"></x>`))
  is(esx.renderToString `<x vectorEffect="1" foo="1"></x>`, renderToString(esx`<x vectorEffect="1" foo="1"></x>`))
  is(esx.renderToString `<x vertAdvY="1" foo="1"></x>`, renderToString(esx`<x vertAdvY="1" foo="1"></x>`))
  is(esx.renderToString `<x vertOriginX="1" foo="1"></x>`, renderToString(esx`<x vertOriginX="1" foo="1"></x>`))
  is(esx.renderToString `<x vertOriginY="1" foo="1"></x>`, renderToString(esx`<x vertOriginY="1" foo="1"></x>`))
  is(esx.renderToString `<x vHanging="1" foo="1"></x>`, renderToString(esx`<x vHanging="1" foo="1"></x>`))
  is(esx.renderToString `<x vIdeographic="1" foo="1"></x>`, renderToString(esx`<x vIdeographic="1" foo="1"></x>`))
  is(esx.renderToString `<x viewBox="1" foo="1"></x>`, renderToString(esx`<x viewBox="1" foo="1"></x>`))
  is(esx.renderToString `<x viewTarget="1" foo="1"></x>`, renderToString(esx`<x viewTarget="1" foo="1"></x>`))
  is(esx.renderToString `<x vMathematical="1" foo="1"></x>`, renderToString(esx`<x vMathematical="1" foo="1"></x>`))
  is(esx.renderToString `<x wordSpacing="1" foo="1"></x>`, renderToString(esx`<x wordSpacing="1" foo="1"></x>`))
  is(esx.renderToString `<x writingMode="1" foo="1"></x>`, renderToString(esx`<x writingMode="1" foo="1"></x>`))
  is(esx.renderToString `<x xChannelSelector="1" foo="1"></x>`, renderToString(esx`<x xChannelSelector="1" foo="1"></x>`))
  is(esx.renderToString `<x xHeight="1" foo="1"></x>`, renderToString(esx`<x xHeight="1" foo="1"></x>`))
  is(esx.renderToString `<x xlinkActuate="1" foo="1"></x>`, renderToString(esx`<x xlinkActuate="1" foo="1"></x>`))
  is(esx.renderToString `<x xlinkArcrole="1" foo="1"></x>`, renderToString(esx`<x xlinkArcrole="1" foo="1"></x>`))
  is(esx.renderToString `<x xlinkHref="1" foo="1"></x>`, renderToString(esx`<x xlinkHref="1" foo="1"></x>`))
  is(esx.renderToString `<x xlinkRole="1" foo="1"></x>`, renderToString(esx`<x xlinkRole="1" foo="1"></x>`))
  is(esx.renderToString `<x xlinkShow="1" foo="1"></x>`, renderToString(esx`<x xlinkShow="1" foo="1"></x>`))
  is(esx.renderToString `<x xlinkTitle="1" foo="1"></x>`, renderToString(esx`<x xlinkTitle="1" foo="1"></x>`))
  is(esx.renderToString `<x xlinkType="1" foo="1"></x>`, renderToString(esx`<x xlinkType="1" foo="1"></x>`))
  is(esx.renderToString `<x xmlBase="1" foo="1"></x>`, renderToString(esx`<x xmlBase="1" foo="1"></x>`))
  is(esx.renderToString `<x xmlLang="1" foo="1"></x>`, renderToString(esx`<x xmlLang="1" foo="1"></x>`))
  is(esx.renderToString `<x xmlSpace="1" foo="1"></x>`, renderToString(esx`<x xmlSpace="1" foo="1"></x>`))
  is(esx.renderToString `<x xmlnsXlink="1" foo="1"></x>`, renderToString(esx`<x xmlnsXlink="1" foo="1"></x>`))
  is(esx.renderToString `<x xmlSpace="1" foo="1"></x>`, renderToString(esx`<x xmlSpace="1" foo="1"></x>`))
  is(esx.renderToString `<x yChannelSelector="1" foo="1"></x>`, renderToString(esx`<x yChannelSelector="1" foo="1"></x>`))
  is(esx.renderToString `<x zoomAndPan="1" foo="1"></x>`, renderToString(esx`<x zoomAndPan="1" foo="1"></x>`))
})

test('null value attributes', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<img x=${null}/>`, renderToString(esx `<img x=${null}/>`))
})

test('undefined value attributes', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<img x=${undefined}/>`, renderToString(esx `<img x=${undefined}/>`))
})

test('attribute single quotes are converted to double quotes', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<img src='http://example.com'/>`, renderToString(esx `<img src='http://example.com'/>`))
})

test('expects corresponding closing tag, as with JSX compilation', async ({ throws }) => {
  const esx = init()
  const Component = () => {
    return esx `<div>loaded</span>`
  }
  esx.register({Component})
  throws(() => esx.renderToString `<Component/>`, SyntaxError('Expected corresponding ESX closing tag for <div>'))
})

test('whitespace variations', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<img  src="http://example.com"/>`, renderToString(esx `<img  src="http://example.com"/>`))
  is(esx.renderToString `<img src="http://example.com" />`, renderToString(esx `<img src="http://example.com" />`))
  is(esx.renderToString `<p><img src="http://example.com" /></p>`, renderToString(esx `<p><img src="http://example.com" /></p>`))
  is(esx.renderToString `<p ><a > <img src="http://example.com"/></a></p>`, renderToString(esx `<p ><a > <img src="http://example.com"/></a></p>`))
  is(esx.renderToString `<p    >     <a     >    <img src="http://example.com"/></a></p>`, renderToString(esx `<p    >     <a     >    <img src="http://example.com"/></a></p>`))
  is(esx.renderToString `<p ><a > <img src="http://example.com"/></ a></p >`, renderToString(esx `<p ><a > <img src="http://example.com"/></ a></p >`))
  is(esx.renderToString `<p ><a > <img src="http://example.com"/></     a></    p     >`, renderToString(esx `<p ><a > <img src="http://example.com"/></     a></    p     >`))
  is(esx.renderToString `<img src="http://example.com"  />`, renderToString(esx `<img src="http://example.com"  />`))
  is(esx.renderToString `<    p    ></p>`, renderToString(esx `<    p    ></p>`))
  is(esx.renderToString `<p>      xyz        </p>`, renderToString(esx `<p>      xyz        </p>`))
  is(esx.renderToString `<p>      <span>   \nxyz    </span>        </p>`, renderToString(esx `<p>      <span>   \nxyz    </span>        </p>`))
  is(
    esx.renderToString `
      <p>
        <span>   xyz    </span>  
      </p>
    `, 
    renderToString(esx  `
      <p>
        <span>   xyz    </span>  
      </p>
    `)
  )
  is(esx.renderToString `<img  src=${'http://example.com'}/>`, renderToString(esx `<img  src=${'http://example.com'}/>`))
  is(esx.renderToString `<img src=${'http://example.com'} />`, renderToString(esx `<img src=${'http://example.com'} />`))
  is(esx.renderToString `<p><img src=${'http://example.com'} /></p>`, renderToString(esx `<p><img src=${'http://example.com'} /></p>`))
  is(esx.renderToString `<p ><a > <img src=${'http://example.com'}/></a></p>`, renderToString(esx `<p ><a > <img src=${'http://example.com'}/></a></p>`))
  is(esx.renderToString `<p    >     <a     >    <img src=${'http://example.com'}/></a></p>`, renderToString(esx `<p    >     <a     >    <img src=${'http://example.com'}/></a></p>`))
  is(esx.renderToString `<p ><a > <img src=${'http://example.com'}/></ a></p >`, renderToString(esx `<p ><a > <img src=${'http://example.com'}/></ a></p >`))
  is(esx.renderToString `<p ><a > <img src=${'http://example.com'}/></     a></    p     >`, renderToString(esx `<p ><a > <img src=${'http://example.com'}/></     a></    p     >`))
  is(esx.renderToString `<img src=${'http://example.com'}  />`, renderToString(esx `<img src=${'http://example.com'}  />`))
  is(esx.renderToString `<img   key="1" src=${'http://example.com'}/>`, renderToString(esx `<img   key="1" src=${'http://example.com'}/>`))
  is(esx.renderToString `<img ref=${'1'} src=${'http://example.com'}/>`, renderToString(esx `<img   ref=${'1'} src=${'http://example.com'}/>`))
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`<p><Toolbar /></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`<p><Toolbar ></Toolbar></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`<p><Toolbar></ Toolbar></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`<p><Toolbar></Toolbar ></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`<p>< Toolbar></Toolbar ></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`<p><Toolbar> </Toolbar ></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`<p>< Toolbar > < /Toolbar ></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`<p><Toolbar></Toolbar></p>`
    })
    is(esx.renderToString `<App />`, renderToString(esx `<App />`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`<p><Toolbar></Toolbar></p>`
    })
    is(esx.renderToString `< App/>`, renderToString(esx `< App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a >hi</a>`,
      App: () => esx`<p><Toolbar></Toolbar></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a >`,
      App: () => esx`<p><Toolbar></Toolbar></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a >hi</ a>`,
      App: () => esx`<p><Toolbar></Toolbar></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`<div><a></ a><p><Toolbar/></p></div>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`<div><a ></a><p><Toolbar/></p></div>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`<div><a></a ><p><Toolbar/></p></div>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>
        hi
      </a>`,
      App: () => esx`<p><Toolbar></Toolbar></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`
        <p>
          <Toolbar>
          </Toolbar>
        </p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`<p>
          <Toolbar>
          </Toolbar>
        </p>
      `
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: () => esx `<a>hi</a>`,
      App: () => esx`
        <p>
          <Toolbar/>
        </p>
      `
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`<p><Toolbar x=${'hi'}/></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`<p><Toolbar x=${'hi'} ></Toolbar></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`<p><Toolbar x=${'hi'}></ Toolbar></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`<p><Toolbar x=${'hi'}></Toolbar ></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`<p>< Toolbar x=${'hi'}></Toolbar ></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`<p><Toolbar x=${'hi'}> </Toolbar ></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`<p>< Toolbar x=${'hi'} > < /Toolbar ></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a >${x}</a>`,
      App: () => esx`<p><Toolbar x=${'hi'}></Toolbar></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a >`,
      App: () => esx`<p><Toolbar x=${'hi'}></Toolbar></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a >${x}</ a>`,
      App: () => esx`<p><Toolbar x=${'hi'}></Toolbar></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`<div><a></ a><p><Toolbar x=${'hi'}/></p></div>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`<div><a ></a><p><Toolbar x=${'hi'}/></p></div>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`<div><a></a ><p><Toolbar x=${'hi'}/></p></div>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>
        ${x}
      </a>`,
      App: () => esx`<p><Toolbar x=${'hi'}></Toolbar></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`
        <p>
          <Toolbar x=${'hi'}>
          </Toolbar>
        </p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`<p>
          <Toolbar x=${'hi'}>
          </Toolbar>
        </p>
      `
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`
        <p>
          <Toolbar x=${'hi'}/>
        </p>
      `
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`<p><Toolbar y=1   x=${'hi'}></Toolbar></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  {
    const esx = init({ 
      Toolbar: ({x}) => esx `<a>${x}</a>`,
      App: () => esx`<p><Toolbar x=${'hi'}  y=1  ></Toolbar></p>`
    })
    is(esx.renderToString `<App/>`, renderToString(esx `<App/>`))
  }
  is(esx.renderToString `<img />`, renderToString(esx`<img />`))
  is(esx.renderToString `<img >`, renderToString(esx`<img >`))
  is(esx.renderToString `<img ></img>`, renderToString(esx`<img ></img>`))
  is(esx.renderToString `<div ></div>`, renderToString(esx`<div ></div>`))
  is(esx.renderToString `<div />`, renderToString(esx`<div />`))
})

test('props.children.props.children of dynamic component with multiple component children peers to multiple static element children containing interpolated values within at varied nesting depths as prop', async ({ is }) => {
  const esx = init()
  const childTest = childValidator(is)
  const A = ({value, children}) => {
    childTest.register(children.props.children)
    return esx `<div><span>${value}</span>${children}</div>`
  }
  const B = () => esx `<a>test1</a>`
  const C = () => esx `<a>test3</a>`
  esx.register({ A, B, C })
  const App = () =>  esx`<A value=${'a'}><p><div>${'test0'}</div><B/><a href=${'interpolatedprop'}>${'test2'}</a><div><C/></div></p></A>`
  esx.register({ App })
  is(esx.renderToString `<App/>`, renderToString(createElement(App)))
  childTest.validate()
})

test('deviation: spread duplicate props are rendered', async ({is}) => {
  const esx = init()
  is(
    esx.renderToString `<img b='a' ...${{a: 1, b: 2}} b=${'x'} b='y'/>`,
    '<img b="a" a="1" b="x" b="y" data-reactroot=""/>'
  )
})

test('deviation:deep nested, non-self closing components with object child', async ({ is, throws, doesNotThrow }) => {
  const esx = init()
  const Cmp2 = ({children}) => {
    return esx `<p>${children}</p>`
  }
  esx.register({Cmp2})
  const Cmp1 = (props) => {
    return esx `<div a=${props.a}><Cmp2>${{a: 1}}</Cmp2></div>`
  }

  esx.register({Cmp1})
  const value = 'hia'
  const Component = () => esx `<Cmp1 a=${value}/>`
  esx.register({Component})
  // here we deviate from react, instead of throwing we simply don't 
  // render objects if passed
  throws(() => renderToString(createElement(Component)))
  doesNotThrow(() => esx.renderToString `<Component/>`)
  is(esx.renderToString `<Component/>`, '<div a="hia" data-reactroot=""><p>[object Object]</p></div>')
})

test('deviation: propTypes invalidation will *not* throw, even in dev mode', async ({doesNotThrow}) => {
  // esx server side rendering will not validate propTypes in production *or* development mode
  // This allows for lower production server side rendering overhead 
  // and in development allows for browser debugging of propTypes invalidation
  // (e.g. the server won't crash before loading the UI)
  const esx = init()
  const Component = ({a}) => {
    return esx `<img a=${a}/>`
  }
  Component.propTypes = {a: PropTypes.bool}
  esx.register({Component})
  doesNotThrow(() => esx.renderToString `<Component a='str'/>`)
})

test('deviation: esx.renderToString spread duplicate props are rendered', async ({is}) => {
  const esx = init()
  is(
    esx.renderToString `<img b='a' b=${'x'} b='y'/>`,
    '<img b="a" b="x" b="y" data-reactroot=""/>'
  )
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