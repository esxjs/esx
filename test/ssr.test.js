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


only('children attribute on element', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<form children='test'></form>`, renderToString(esx `<form children='test'></form>`))
  is(esx.renderToString `<form children=${'test'}></form>`, renderToString(esx `<form innerHTML=${'test'}></form>`))
})

only('defaultChecked', async ({ is }) => {
  const esx = init()
  is(esx.renderToString `<input defaultChecked foo="1">`, renderToString(esx`<input defaultChecked foo="1">`))
  // is(esx.renderToString `<input defaultChecked>`,z renderToString(esx `<input defaultChecked>`))
  // is(esx.renderToString `<input defaultChecked=${true}>`, renderToString(esx `<input defaultChecked=${true}>`))
  // is(esx.renderToString `<input defaultChecked=${false}>`, renderToString(esx `<input defaultChecked=${false}>`))
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

only('style throws error when not an object', async ({ throws }) => {
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

only('implicit boolean attributes', async ({ is }) => {
  const esx = init()
  console.log(esx.renderToString `<img x/>`, (esx `<img x/>`))
  console.log(esx.renderToString `<img x foo="1"/>`, renderToString(esx `<img x foo="1"/>`))
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