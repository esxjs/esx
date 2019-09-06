'use strict'
/* eslint-env node */
let test = require('aquatap')
const renderer = require('react-test-renderer')
const PropTypes = require('prop-types')
const render = (o) => renderer.create(o).toJSON()
const React = require('react')
const { createElement } = React
const init = process.env.TEST_CLIENT_CODE ? require('../browser') : require('..')
const { MODE } = process.env
if (typeof window === 'undefined') {
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
}

test('components parameter must be a plain object or undefined', async ({ throws, doesNotThrow }) => {
  throws(() => init(null), Error('ESX: supplied components must be a plain object'))
  throws(() => init(() => {}), Error('ESX: supplied components must be a plain object'))
  throws(() => init([]), Error('ESX: supplied components must be a plain object'))
  throws(() => init(Symbol('test')), Error('ESX: supplied components must be a plain object'))
  throws(() => init(1), Error('ESX: supplied components must be a plain object'))
  throws(() => init('str'), Error('ESX: supplied components must be a plain object'))
  throws(() => init(new (class {})()))
  doesNotThrow(() => init())
  doesNotThrow(() => init(undefined))
  doesNotThrow(() => init({}))
})

test('components object must contain only uppercase property keys', async ({ throws, doesNotThrow }) => {
  throws(() => init({ component: () => {} }), Error(`ESX: component is not valid. All components should use PascalCase`))
  doesNotThrow(() => init({ Component: () => {} }))
})

test('components object values must be function,classes,symbols,strings  or objects with a $$typeof key', async ({ throws, doesNotThrow }) => {
  throws(() => init({ Component: undefined }), Error(`ESX: Component is not a valid component`))
  throws(() => init({ Component: null }), Error(`ESX: Component is not a valid component`))
  throws(() => init({ Component: 1 }), Error(`ESX: Component is not a valid component`))
  throws(() => init({ Component: {} }), Error(`ESX: Component is not a valid component`))
  throws(() => init({ Component: [] }), Error(`ESX: Component is not a valid component`))
  doesNotThrow(() => init({ Component: Symbol('test') }))
  doesNotThrow(() => init({ Component: () => {} }))
  doesNotThrow(() => init({ Component: class {} }))
  doesNotThrow(() => init({ Component: { $$typeof: Symbol('test') } }))
  doesNotThrow(() => init({ Component: 'div' }))
})

test('register: components object values must be function,classes,symbols,strings or objects with a $$typeof key', async ({ throws, doesNotThrow }) => {
  throws(() => init().register({ Component: undefined }), Error(`ESX: Component is not a valid component`))
  throws(() => init().register({ Component: null }), Error(`ESX: Component is not a valid component`))
  throws(() => init().register({ Component: 1 }), Error(`ESX: Component is not a valid component`))
  throws(() => init().register({ Component: {} }), Error(`ESX: Component is not a valid component`))
  throws(() => init().register({ Component: [] }), Error(`ESX: Component is not a valid component`))
  doesNotThrow(() => init().register({ Component: Symbol('test') }))
  doesNotThrow(() => init().register({ Component: () => {} }))
  doesNotThrow(() => init().register({ Component: class {} }))
  doesNotThrow(() => init().register({ Component: { $$typeof: Symbol('test') } }))
  doesNotThrow(() => init().register({ Component: 'div' }))
})

test('register.lax: skips validation', async ({ doesNotThrow }) => {
  doesNotThrow(() => init().register.lax({ Component: undefined }))
  doesNotThrow(() => init().register.lax({ Component: null }))
  doesNotThrow(() => init().register.lax({ Component: 1 }))
  doesNotThrow(() => init().register.lax({ Component: {} }))
  doesNotThrow(() => init().register.lax({ Component: [] }))
  doesNotThrow(() => init().register.lax({ Component: Symbol('test') }))
  doesNotThrow(() => init().register.lax({ Component: () => {} }))
  doesNotThrow(() => init().register.lax({ Component: class {} }))
  doesNotThrow(() => init().register.lax({ Component: { $$typeof: Symbol('test') } }))
  doesNotThrow(() => init().register.lax({ Component: 'div' }))
})

test('register.one: components object values must be function,classes,symbols,strings or objects with a $$typeof key', async ({ throws, doesNotThrow }) => {
  throws(() => init().register.one('Component', undefined), Error(`ESX: Component is not a valid component`))
  throws(() => init().register.one('Component', null), Error(`ESX: Component is not a valid component`))
  throws(() => init().register.one('Component', 1), Error(`ESX: Component is not a valid component`))
  throws(() => init().register.one('Component', {}), Error(`ESX: Component is not a valid component`))
  throws(() => init().register.one('Component', []), Error(`ESX: Component is not a valid component`))
  doesNotThrow(() => init().register.one('Component', Symbol('test')))
  doesNotThrow(() => init().register.one('Component', () => {}))
  doesNotThrow(() => init().register.one('Component', class {}))
  doesNotThrow(() => init().register.one('Component', { $$typeof: Symbol('test') }))
  doesNotThrow(() => init().register.one('Component', 'div'))
})

test('register.one.lax: skips validation', async ({ doesNotThrow }) => {
  doesNotThrow(() => init().register.one.lax('Component', undefined))
  doesNotThrow(() => init().register.one.lax('Component', null))
  doesNotThrow(() => init().register.one.lax('Component', 'str'))
  doesNotThrow(() => init().register.one.lax('Component', 1))
  doesNotThrow(() => init().register.one.lax('Component', {}))
  doesNotThrow(() => init().register.one.lax('Component', []))
  doesNotThrow(() => init().register.one.lax('Component', Symbol('test')))
  doesNotThrow(() => init().register.one.lax('Component', () => {}))
  doesNotThrow(() => init().register.one.lax('Component', class {}))
  doesNotThrow(() => init().register.one.lax('Component', { $$typeof: Symbol('test') }))
})

test('all registrations throws if any component is using legacy context API', async ({ throws }) => {
  const esx = init()
  // simulate react-router 4 Link
  class Link extends React.Component {
    render () {
      return esx`<div></div>`
    }
  }

  Link.contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired,
        createHref: PropTypes.func.isRequired
      }).isRequired
    }).isRequired
  }
  const err = Error(`ESX: Link has a contextTypes property. Legacy context API is not supported – https://reactjs.org/docs/legacy-context.html`)
  throws(() => { init({ Link }) }, err)
  throws(() => { esx.register({ Link }) }, err)
  throws(() => { esx.register.lax({ Link }) }, err)
  throws(() => { esx.register.one('Link', Link) }, err)
  throws(() => { esx.register.one.lax('Link', Link) }, err)
})

test('empty string returns null', async ({ same }) => {
  const esx = init()
  same(render(esx``), null)
})

test('text at the root is ignored, returns null', async ({ same }) => {
  const esx = init()
  same(render(esx`ignore me`), null)
})

test('text outside elements is ignored', async ({ same }) => {
  const esx = init()
  same(render(esx`ignore me<p>test</p>`), render(createElement('p', null, 'test')))
})

test('element', async ({ same }) => {
  const esx = init()
  same(render(esx`<hr/>`), render(createElement('hr')))
})

test('element and text child', async ({ same }) => {
  const esx = init()
  same(render(esx`<div>hi</div>`), render(createElement('div', null, 'hi')))
})

test('interpolation', async ({ is }) => {
  const esx = init({})
  const value = 'test'
  const { type, props } = esx`
    <div>${value}</div>
  `
  is(type, 'div')
  is(props.children, value)
})

test('function component', async ({ same }) => {
  const Component = () => esx`<div>test</div>`
  const esx = init({ Component })
  same(render(esx`<Component/>`), render(createElement(Component)))
})

test('class component', async ({ same }) => {
  class Component extends React.Component {
    render () {
      return esx`<div>test</div>`
    }
  }
  const esx = init({ Component })
  same(render(esx`<Component/>`), render(createElement(Component)))
})

test('attr: interpolated element attribute', async ({ same }) => {
  const esx = init()
  const x = '1'
  const Component = () => {
    return esx`<div x=${x}>1</div>`
  }
  esx.register({ Component })
  same(
    render(esx`<div x=${x}>1</div>`),
    render(createElement('div', { x }, '1'))
  )
})

test('attr: function component props', async ({ same }) => {
  const Component = (props) => {
    return esx`<div a=${props.a}>${props.text}</div>`
  }
  const esx = init({ Component })
  const value = 'hi'
  same(
    render(esx`<Component a=${value} text='hi'/>`),
    render(createElement(Component, { a: value, text: 'hi' }))
  )
})

test('attr: class component props', async ({ same }) => {
  class Component extends React.Component {
    render () {
      const props = this.props
      return esx`<div a=${props.a}>${props.text}</div>`
    }
  }
  const esx = init({ Component })
  const value = 'hi'
  same(render(esx`<Component a=${value} text='hi'/>`), render(createElement(Component, { a: value, text: 'hi' })))
})

test('attr: class component state', async ({ same }) => {
  const value = 'hi'
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
  same(render(esx`<Component/>`), render(createElement(Component)))
})

test('attr: boolean implicit true', async ({ plan, is, same }) => {
  const esx = init()
  plan(5)
  const Component = (props) => {
    is(props.test, true)
    return esx`<img/>`
  }
  esx.register({ Component })
  render(esx`<Component test></Component>`)
  render(esx`<Component test />`)
  render(esx`<Component test/>`)
  same(render(esx`<input checked/>`), render(createElement('input', { checked: true })))
  same(render(esx`<input checked foo="test"/>`), render(createElement('input', { checked: true, foo: 'test' })))
})

test('latest prop wins', async ({ is }) => {
  const esx = init()
  is(esx`<img b=${'x'} b='y'/>`.props.b, 'y')
  is(esx`<img b=${'x'} b='y' b='z'/>`.props.b, 'z')
  is(esx`<img b='x' b=${'y'} b='z'/>`.props.b, 'z')
  is(esx`<img b='x' b='y' b=${'z'}/>`.props.b, 'z')
  is(esx`<img b='x' b=${'y'}/>`.props.b, 'y')
})

test('spread: props', async ({ is }) => {
  const esx = init()
  const { props } = esx`<img ...${{ a: 1, b: 2 }}/>`
  const { a, b } = props
  is(a, 1)
  is(b, 2)
})

test('spread: props overwrite prior static props when collision', async ({ is }) => {
  const esx = init()
  const { props } = esx`<img x='y' a='overwrite' ...${{ a: 1, b: 2 }}/>`
  const { a, b, x } = props
  is(a, 1)
  is(b, 2)
  is(x, 'y')
})

test('spread: props overwrite prior dynamic props when collision', async ({ is }) => {
  const esx = init()
  const { props } = esx`<img a=${'overwrite'} ...${{ a: 1, b: 2 }}/>`
  const { a, b } = props
  is(a, 1)
  is(b, 2)
})

test('spread: props preserve prior static props when no collision', async ({ is }) => {
  const esx = init()
  const { props } = esx`<img x='keep' ...${{ a: 1, b: 2 }}/>`
  const { a, b, x } = props
  is(a, 1)
  is(b, 2)
  is(x, 'keep')
})

test('spread: props preserve prior dynamic props when no collision', async ({ is }) => {
  const esx = init()
  const { props } = esx`<img x=${'keep'} ...${{ a: 1, b: 2 }}/>`
  const { a, b, x } = props
  is(a, 1)
  is(b, 2)
  is(x, 'keep')
})

test('spread: props overwritten with latter static props', async ({ is }) => {
  const esx = init()
  const { props } = esx`<img ...${{ a: 1, b: 2 }} b='x'/>`
  const { a, b } = props
  is(a, 1)
  is(b, 'x')
})

test('spread: props overwritten with latter dynamic props', async ({ is }) => {
  const esx = init()
  const { props } = esx`<img ...${{ a: 1, b: 2 }} b=${'x'}/>`
  const { a, b } = props
  is(a, 1)
  is(b, 'x')
})

test('spread: latest prop wins', async ({ is }) => {
  const esx = init()
  const { props } = esx`<img b='a' ...${{ a: 1, b: 2 }} b=${'x'} b='y'/>`
  const { a, b } = props
  is(a, 1)
  is(b, 'y')
})

test('spread: multiple objects', async ({ is }) => {
  const esx = init()
  const { props } = esx`<img ...${{ a: 1, b: 2 }} ...${{ c: 3, d: 4 }}/>`
  const { a, b, c, d } = props
  is(a, 1)
  is(b, 2)
  is(c, 3)
  is(d, 4)
})

test('spread: multiple objects, later object properties override', async ({ is }) => {
  const esx = init()
  const { props } = esx`<img ...${{ a: 1, b: 2 }} ...${{ a: 3, b: 4 }}/>`
  const { a, b } = props
  is(a, 3)
  is(b, 4)
})

test('spread: multiple objects, static props between spreads', async ({ is }) => {
  const esx = init()
  const { props } = esx`<img ...${{ a: 1, b: 2 }} x='y' ...${{ a: 3, b: 4 }}/>`
  const { a, b, x } = props
  is(a, 3)
  is(b, 4)
  is(x, 'y')
})

test('spread: multiple objects, dynamic props between spreads', async ({ is }) => {
  const esx = init()
  const { props } = esx`<img ...${{ a: 1, b: 2 }} x=${'y'} ...${{ a: 3, b: 4 }}/>`
  const { a, b, x } = props
  is(a, 3)
  is(b, 4)
  is(x, 'y')
})

test('spread: multiple objects, duplicate dynamic props between spreads overriden by last spread', async ({ is }) => {
  const esx = init()
  const { props } = esx`<img ...${{ a: 1, b: 2 }} a=${3} ...${{ a: 3, b: 4 }}/>`
  const { a, b } = props
  is(a, 3)
  is(b, 4)
})

test('children: deep element-nested dynamic + inline children', async ({ same }) => {
  const esx = init()
  const value = 'dynamic'
  const ESXComponent = () => esx`<div>${value} inline</div>`
  const ReactComponent = () => React.createElement('div', null, [value, ' inline'])
  same(render(createElement(ESXComponent)), render(createElement(ReactComponent)))
})

test('children: deep inline children + element-nested dynamic', async ({ same }) => {
  const esx = init()
  const value = 'dynamic'
  const ESXComponent = () => esx`<div>inline ${value}</div>`
  const ReactComponent = () => React.createElement('div', null, ['inline ', value])
  same(render(createElement(ESXComponent)), render(createElement(ReactComponent)))
})

test('nested components', async ({ same }) => {
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
  same(render(esx`<Component a=${value} text='hi'/>`), render(createElement(Component, { a: value, text: 'hi' })))
})

test('nested closed components', async ({ same }) => {
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
  same(render(esx`<Component/>`), render(createElement(Component)))
})

test('React.Fragment interopability', async ({ same }) => {
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
  same(
    render(esx`<div><EsxCmp/></div>`),
    render(createElement('div', null, createElement(ReactCmp)))
  )
})

test('React.Fragment as a special-case does not need to be a registered component', async ({ same }) => {
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
  same(
    render(esx`<div><EsxCmp/></div>`),
    render(createElement('div', null, createElement(ReactCmp)))
  )
})

test('React.Fragment shorthand syntax support (<></>)', async ({ same }) => {
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
  same(
    render(esx`<div><EsxCmp/></div>`),
    render(createElement('div', null, createElement(ReactCmp)))
  )
})

test('React.Fragment special-case namespace can be overridden', async ({ same }) => {
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
  same(
    render(esx`<EsxCmp/>`),
    render(createElement(ReactCmp))
  )
})

test('self closing elements', async ({ same }) => {
  const esx = init()
  same(render(esx`<div/>`), render(createElement('div')))
  same(
    render(esx`<div><div/><p>hi</p></div>`),
    render(createElement(
      'div',
      null,
      createElement('div', null),
      createElement('p', null, 'hi')
    )
    )
  )
})

test('className', async ({ same }) => {
  const esx = init()
  same(render(esx`<img className='x'/>`), render(createElement('img', { className: 'x' })))
  same(render(esx`<img className=${'x'}/>`), render(createElement('img', { className: 'x' })))
})

test('unexpected token, expression in open element', async ({ throws }) => {
  const esx = init()
  throws(() => esx`<div${'value'}></div>`, SyntaxError('ESX: Unexpected token in element. Expressions may only be spread, embedded in attributes be included as children.'))
})

test('unexpected token, quotes around expression', async ({ throws }) => {
  const esx = init()
  throws(
    () => esx`<div x="${'t'}"></div>`,
    SyntaxError('Unexpected token. Attribute expressions must not be surrounded in quotes.')
  )
})

test('void elements must not have children', async ({ throws }) => {
  const esx = init()
  throws(() => esx`<img>child</img>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
  throws(() => esx`<img>${'child'}</img>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
  throws(() => esx`<img><div>hi</div></img>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
  esx.register({ Cmp () { return esx`<p>hi</p>` } })
  throws(() => esx`<img><Cmp/></img>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
  throws(() => esx`<img children='child'/>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
  throws(() => esx`<img children='child'>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
  throws(() => esx`<img children=${'child'}/>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
  throws(() => esx`<img children=${'child'}>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
})

test('void elements must not use dangerouslySetInnerHTML', async ({ throws }) => {
  const esx = init()
  throws(() => esx`<img dangerouslySetInnerHTML=${{ __html: '<p>no</p>' }}/>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
})

test('elements can only have either children or dangerouslySetInnerHTML', async ({ throws }) => {
  const esx = init()
  throws(() => esx`<div children='no' dangerouslySetInnerHTML=${{ __html: '<p>no</p>' }}></div>`, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx`<div dangerouslySetInnerHTML=${{ __html: '<p>no</p>' }} children='no'></div>`, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx`<div dangerouslySetInnerHTML=${{ __html: '<p>no</p>' }}>${'no'}</div>`, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx`<div dangerouslySetInnerHTML=${{ __html: '<p>no</p>' }}>no</div>`, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx`<div dangerouslySetInnerHTML=${{ __html: '<p>no</p>' }} children='no'/>`, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx`<div dangerouslySetInnerHTML=${{ __html: '<p>no</p>' }} children=${'no'}/>`, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
})

test('unexpected token', async ({ throws }) => {
  const esx = init()
  const props = {}
  throws(() => esx`<div .${props}></div>`, SyntaxError('ESX: Unexpected token.'))
})

test('lack of component closing tag causes syntax error', async ({ throws }) => {
  const esx = init({ App: () => {} })
  throws(() => esx`<App>`, SyntaxError(`Expected corresponding ESX closing tag for <App>`))
  throws(() => esx`<div><App></div>`, SyntaxError(`Expected corresponding ESX closing tag for <App>`))
})

test('lack of closing tag for elements other than auto closing elements causes syntax error', async ({ throws }) => {
  const esx = init({ App: () => {} })
  throws(() => esx`<div>`, SyntaxError(`Expected corresponding ESX closing tag for <div>`))
  throws(() => esx`<App><div></App>`, SyntaxError(`Expected corresponding ESX closing tag for <div>`))
})

test('lack of closing tag for auto closing elements does not throw', async ({ doesNotThrow }) => {
  const esx = init({ App: ({ children }) => children })
  doesNotThrow(() => esx`<area>`, SyntaxError(`Expected corresponding ESX closing tag for <area>`))
  doesNotThrow(() => esx`<App><area></App>`, SyntaxError(`Expected corresponding ESX closing tag for <area>`))
  doesNotThrow(() => esx`<base>`, SyntaxError(`Expected corresponding ESX closing tag for <base>`))
  doesNotThrow(() => esx`<App><base></App>`, SyntaxError(`Expected corresponding ESX closing tag for <base>`))
  doesNotThrow(() => esx`<br>`, SyntaxError(`Expected corresponding ESX closing tag for <br>`))
  doesNotThrow(() => esx`<App><br></App>`, SyntaxError(`Expected corresponding ESX closing tag for <br>`))
  doesNotThrow(() => esx`<col>`, SyntaxError(`Expected corresponding ESX closing tag for <col>`))
  doesNotThrow(() => esx`<App><col></App>`, SyntaxError(`Expected corresponding ESX closing tag for <col>`))
  doesNotThrow(() => esx`<embed>`, SyntaxError(`Expected corresponding ESX closing tag for <embed>`))
  doesNotThrow(() => esx`<App><embed></App>`, SyntaxError(`Expected corresponding ESX closing tag for <embed>`))
  doesNotThrow(() => esx`<hr>`, SyntaxError(`Expected corresponding ESX closing tag for <hr>`))
  doesNotThrow(() => esx`<App><hr></App>`, SyntaxError(`Expected corresponding ESX closing tag for <hr>`))
  doesNotThrow(() => esx`<img>`, SyntaxError(`Expected corresponding ESX closing tag for <img>`))
  doesNotThrow(() => esx`<App><img></App>`, SyntaxError(`Expected corresponding ESX closing tag for <img>`))
  doesNotThrow(() => esx`<input>`, SyntaxError(`Expected corresponding ESX closing tag for <input>`))
  doesNotThrow(() => esx`<App><input></App>`, SyntaxError(`Expected corresponding ESX closing tag for <input>`))
  doesNotThrow(() => esx`<link>`, SyntaxError(`Expected corresponding ESX closing tag for <link>`))
  doesNotThrow(() => esx`<App><link></App>`, SyntaxError(`Expected corresponding ESX closing tag for <link>`))
  doesNotThrow(() => esx`<meta>`, SyntaxError(`Expected corresponding ESX closing tag for <meta>`))
  doesNotThrow(() => esx`<App><meta></App>`, SyntaxError(`Expected corresponding ESX closing tag for <meta>`))
  doesNotThrow(() => esx`<param>`, SyntaxError(`Expected corresponding ESX closing tag for <param>`))
  doesNotThrow(() => esx`<App><param></App>`, SyntaxError(`Expected corresponding ESX closing tag for <param>`))
  doesNotThrow(() => esx`<source>`, SyntaxError(`Expected corresponding ESX closing tag for <source>`))
  doesNotThrow(() => esx`<App><source></App>`, SyntaxError(`Expected corresponding ESX closing tag for <source>`))
  doesNotThrow(() => esx`<track>`, SyntaxError(`Expected corresponding ESX closing tag for <track>`))
  doesNotThrow(() => esx`<App><track></App>`, SyntaxError(`Expected corresponding ESX closing tag for <track>`))
  doesNotThrow(() => esx`<wbr>`, SyntaxError(`Expected corresponding ESX closing tag for <wbr>`))
  doesNotThrow(() => esx`<App><wbr></App>`, SyntaxError(`Expected corresponding ESX closing tag for <wbr>`))
  doesNotThrow(() => esx`<command>`, SyntaxError(`Expected corresponding ESX closing tag for <command>`))
  doesNotThrow(() => esx`<App><command></App>`, SyntaxError(`Expected corresponding ESX closing tag for <command>`))
  doesNotThrow(() => esx`<keygen>`, SyntaxError(`Expected corresponding ESX closing tag for <keygen>`))
  doesNotThrow(() => esx`<App><keygen></App>`, SyntaxError(`Expected corresponding ESX closing tag for <keygen>`))
  doesNotThrow(() => esx`<menuitem>`, SyntaxError(`Expected corresponding ESX closing tag for <menuitem>`))
  doesNotThrow(() => esx`<App><menuitem></App>`, SyntaxError(`Expected corresponding ESX closing tag for <menuitem>`))
  doesNotThrow(() => esx`<html>`, SyntaxError(`Expected corresponding ESX closing tag for <html>`))
  doesNotThrow(() => esx`<App><html></App>`, SyntaxError(`Expected corresponding ESX closing tag for <html>`))
  doesNotThrow(() => esx`<head>`, SyntaxError(`Expected corresponding ESX closing tag for <head>`))
  doesNotThrow(() => esx`<App><head></App>`, SyntaxError(`Expected corresponding ESX closing tag for <head>`))
  doesNotThrow(() => esx`<body>`, SyntaxError(`Expected corresponding ESX closing tag for <body>`))
  doesNotThrow(() => esx`<App><body></App>`, SyntaxError(`Expected corresponding ESX closing tag for <body>`))
  doesNotThrow(() => esx`<p>`, SyntaxError(`Expected corresponding ESX closing tag for <p>`))
  doesNotThrow(() => esx`<App><p></App>`, SyntaxError(`Expected corresponding ESX closing tag for <p>`))
  doesNotThrow(() => esx`<dt>`, SyntaxError(`Expected corresponding ESX closing tag for <dt>`))
  doesNotThrow(() => esx`<App><dt></App>`, SyntaxError(`Expected corresponding ESX closing tag for <dt>`))
  doesNotThrow(() => esx`<dd>`, SyntaxError(`Expected corresponding ESX closing tag for <dd>`))
  doesNotThrow(() => esx`<App><dd></App>`, SyntaxError(`Expected corresponding ESX closing tag for <dd>`))
  doesNotThrow(() => esx`<li>`, SyntaxError(`Expected corresponding ESX closing tag for <li>`))
  doesNotThrow(() => esx`<App><li></App>`, SyntaxError(`Expected corresponding ESX closing tag for <li>`))
  doesNotThrow(() => esx`<option>`, SyntaxError(`Expected corresponding ESX closing tag for <option>`))
  doesNotThrow(() => esx`<App><option></App>`, SyntaxError(`Expected corresponding ESX closing tag for <option>`))
  doesNotThrow(() => esx`<thead>`, SyntaxError(`Expected corresponding ESX closing tag for <thead>`))
  doesNotThrow(() => esx`<App><thead></App>`, SyntaxError(`Expected corresponding ESX closing tag for <thead>`))
  doesNotThrow(() => esx`<th>`, SyntaxError(`Expected corresponding ESX closing tag for <th>`))
  doesNotThrow(() => esx`<App><th></App>`, SyntaxError(`Expected corresponding ESX closing tag for <th>`))
  doesNotThrow(() => esx`<tbody>`, SyntaxError(`Expected corresponding ESX closing tag for <tbody>`))
  doesNotThrow(() => esx`<App><tbody></App>`, SyntaxError(`Expected corresponding ESX closing tag for <tbody>`))
  doesNotThrow(() => esx`<tr>`, SyntaxError(`Expected corresponding ESX closing tag for <tr>`))
  doesNotThrow(() => esx`<App><tr></App>`, SyntaxError(`Expected corresponding ESX closing tag for <tr>`))
  doesNotThrow(() => esx`<td>`, SyntaxError(`Expected corresponding ESX closing tag for <td>`))
  doesNotThrow(() => esx`<App><td></App>`, SyntaxError(`Expected corresponding ESX closing tag for <td>`))
  doesNotThrow(() => esx`<tfoot>`, SyntaxError(`Expected corresponding ESX closing tag for <tfoot>`))
  doesNotThrow(() => esx`<App><tfoot></App>`, SyntaxError(`Expected corresponding ESX closing tag for <tfoot>`))
  doesNotThrow(() => esx`<colgroup>`, SyntaxError(`Expected corresponding ESX closing tag for <colgroup>`))
  doesNotThrow(() => esx`<App><colgroup></App>`, SyntaxError(`Expected corresponding ESX closing tag for <colgroup>`))
})

test('unquoted, non-interpolated attributes causes a syntax error', async ({ throws }) => {
  const esx = init({ Cmp: ({ a, b }) => esx`<x><a>${a}</a><b>${b}</b></x>` })
  throws(() => esx`<Cmp a=1 />`, SyntaxError('ESX: attribute value should be either an expression or quoted text'))
})

test('component in object', async ({ same }) => {
  const esx = init()
  const Cmp2 = ({ text }) => {
    return esx`<p>${text}</p>`
  }
  const Cmp1 = (props) => {
    return esx`<div a=${props.a}><o.Cmp2 text=${props.text}/></div>`
  }
  const value = 'hia'
  const Component = () => esx`<o.Cmp1 a=${value} text='hi'/>`
  const o = { Cmp1, Cmp2, Component }
  esx.register({ o, x: { o } })
  same(render(esx`<o.Component/>`), render(createElement(o.Component)))
  same(render(esx`<x.o.Component/>`), render(createElement(o.Component)))
  same(render(esx`<x['o']Component/>`), render(createElement(o.Component)))
  same(render(esx`<x["o"]Component/>`), render(createElement(o.Component)))
  same(render(esx`<x[\`o\`]Component/>`), render(createElement(o.Component)))
  same(render(esx`<x[\`o\`]['Component']/>`), render(createElement(o.Component)))
})

test('component in object validate', async ({ doesNotThrow, throws }) => {
  doesNotThrow(() => init({ a: { Cmp: () => {} } }))
  throws(() => init({ a: { cmp: () => {} } }), Error(`ESX: a.cmp is not valid. All components should use PascalCase`))
  doesNotThrow(() => init({ a: { Cmp: () => {}, Cmp2: () => {} } }))
  throws(() => init({ a: { Cmp: () => {}, cmp: () => {} } }), Error(`ESX: a.cmp is not valid. All components should use PascalCase`))
})

test('component not found', async ({ throws }) => {
  const esx = init()
  throws(() => {
    esx`<Cmp/>`
  }, ReferenceError(`ESX: Cmp not found in registered components`))
  throws(() => {
    esx`<o.Cmp/>`
  }, ReferenceError(`ESX: o.Cmp not found in registered components`))
  throws(() => {
    esx`<o[Cmp]/>`
  }, ReferenceError(`ESX: o[Cmp] not found in registered components`))
  throws(() => {
    esx`<o['Cmp']/>`
  }, ReferenceError(`ESX: o['Cmp'] not found in registered components`))
  throws(() => {
    esx`<o["Cmp"]/>`
  }, ReferenceError(`ESX: o["Cmp"] not found in registered components`))
  throws(() => {
    esx`<o[\`Cmp\`]/>`
  }, ReferenceError(`ESX: o[\`Cmp\`] not found in registered components`))
})

test('path component names', async ({ same }) => {
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
  same(render(esx`<o.Component/>`), render(createElement(Component)))
  same(render(esx`<o["Component"]/>`), render(createElement(Component)))
  same(render(esx`<o['Component']/>`), render(createElement(Component)))
  same(render(esx`<o[\`Component\`]/>`), render(createElement(Component)))
  same(render(esx`<o[Component]/>`), render(createElement(Component)))
})

// todo:  open ended tag syntax error (no closing >)
