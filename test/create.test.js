'use strict'
const test = require('aquatap')
process.env.NODE_ENV = 'production' // stop react warnings
const renderer = require('react-test-renderer')
const render = (o) => renderer.create(o).toJSON()
const React = require('react')
const { createElement } = React
const init = process.env.TEST_CLIENT_CODE ? require('../browser') : require('..')

test('element and text child', async ({ same }) => {
  const esx = init()
  same(render(esx `<div>hi</div>`), render(createElement('div', null, 'hi')))
})

test('interpolation', async ({ is }) => {
  const esx = init({})
  const value = 'test'
  const { type, props} = esx `
    <div>${value}</div>
  `
  is(type, 'div')
  is(props.children, value)
})

test('function component', async ({ same }) => {
  const Component = () => esx `<div>test</div>`
  const esx = init({ Component })
  same(render(esx `<Component/>`), render(createElement(Component)))
})

test('class component', async ({ same }) => {
  class Component extends React.Component {
    render () {
      return esx `<div>test</div>`
    }
  }
  const esx = init({ Component })
  same(render(esx `<Component/>`), render(createElement(Component)))
})

test('attr: interpolated element attribute', async ({ same }) => {
  const esx = init()
  const x = '1'
  const Component = () => {
    return esx`<div x=${x}>1</div>`
  }
  esx.register({Component})
  same(
    render(esx`<div x=${x}>1</div>`), 
    render(createElement('div', {x}, '1'))
  )
})

test('attr: function component props', async ({ same }) => {
  const Component = (props) => {
    return esx `<div a=${props.a}>${props.text}</div>`
  }
  const esx = init({ Component })
  const value = 'hi'
  same(
    render(esx `<Component a=${value} text='hi'/>`), 
    render(createElement(Component, {a:value,text: 'hi'}))
  )
})

test('attr: class component props', async ({ same }) => {
  class Component extends React.Component {
    render () {
      const props = this.props
      return esx `<div a=${props.a}>${props.text}</div>`
    }
  }
  const esx = init({ Component })
  const value = 'hi'
  same(render(esx `<Component a=${value} text='hi'/>`), render(createElement(Component, {a:value,text: 'hi'})))
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
      return esx `<div a=${state.a}>${state.text}</div>`
    }
  }
  const esx = init({ Component })
  same(render(esx `<Component/>`), render(createElement(Component)))
})

test('attr: boolean implicit true', async ({ plan, is, same }) => {
  const esx = init()
  plan(5)
  const Component = (props) => {
    is(props.test, true)
    return esx `<img/>`
  }
  esx.register({Component})
  render(esx `<Component test></Component>`)
  render(esx `<Component test />`)
  render(esx `<Component test/>`)
  same(render(esx `<input checked/>`), render(createElement('input', {checked: true})))
  same(render(esx `<input checked foo="test"/>`), render(createElement('input', {checked: true, foo: 'test'})))
})

test('latest prop wins', async ({ is }) => {
  const esx = init()
  is(esx `<img b=${'x'} b='y'/>`.props.b, 'y')
  is(esx `<img b=${'x'} b='y' b='z'/>`.props.b, 'z')
  is(esx `<img b='x' b=${'y'} b='z'/>`.props.b, 'z')
  is(esx `<img b='x' b='y' b=${'z'}/>`.props.b, 'z')
  is(esx `<img b='x' b=${'y'}/>`.props.b, 'y')
})

test('spread: props', async ({ is }) => {
  const esx = init()
  const { props } = esx `<img ...${{a: 1, b: 2}}/>`
  const { a, b } = props
  is(a, 1)
  is(b, 2)
})

test('spread: props overwrite prior static props when collision', async ({ is }) => {
  const esx = init()
  const { props } = esx `<img x='y' a='overwrite' ...${{a: 1, b: 2}}/>`
  const { a, b, x} = props
  is(a, 1)
  is(b, 2)
  is(x, 'y')
})

test('spread: props overwrite prior dynamic props when collision', async ({ is }) => {
  const esx = init()
  const { props } = esx `<img a=${'overwrite'} ...${{a: 1, b: 2}}/>`
  const { a, b } = props
  is(a, 1)
  is(b, 2)
})

test('spread: props preserve prior static props when no collision', async ({ is }) => {
  const esx = init()
  const { props } = esx `<img x='keep' ...${{a: 1, b: 2}}/>`
  const { a, b, x } = props
  is(a, 1)
  is(b, 2)
  is(x, 'keep')
})

test('spread: props preserve prior dynamic props when no collision', async ({ is }) => {
  const esx = init()
  const { props } = esx `<img x=${'keep'} ...${{a: 1, b: 2}}/>`
  const { a, b, x } = props
  is(a, 1)
  is(b, 2)
  is(x, 'keep')
})

test('spread: props overwritten with latter static props', async ({ is }) => {
  const esx = init()
  const { props } = esx `<img ...${{a: 1, b: 2}} b='x'/>`
  const { a, b } = props
  is(a, 1)
  is(b, 'x')
})

test('spread: props overwritten with latter dynamic props', async ({ is }) => {
  const esx = init()
  const { props } = esx `<img ...${{a: 1, b: 2}} b=${'x'}/>`
  const { a, b } = props
  is(a, 1)
  is(b, 'x')
})

test('spread: latest prop wins', async ({ is }) => {
  const esx = init()
  const { props } = esx `<img b='a' ...${{a: 1, b: 2}} b=${'x'} b='y'/>`
  const { a, b } = props
  is(a, 1)
  is(b, 'y')
})

test('spread: multiple objects', async ({ is }) => {
  const esx = init()
  const { props } = esx `<img ...${{a: 1, b: 2}} ...${{c: 3, d: 4}}/>`
  const { a, b, c, d } = props
  is(a, 1)
  is(b, 2)
  is(c, 3)
  is(d, 4)
})

test('spread: multiple objects, later object properties override', async ({ is }) => {
  const esx = init()
  const { props } = esx `<img ...${{a: 1, b: 2}} ...${{a: 3, b: 4}}/>`
  const { a, b } = props
  is(a, 3)
  is(b, 4)
})

test('spread: multiple objects, static props between spreads', async ({ is }) => {
  const esx = init()
  const { props } = esx `<img ...${{a: 1, b: 2}} x='y' ...${{a: 3, b: 4}}/>`
  const { a, b, x } = props
  is(a, 3)
  is(b, 4)
  is(x, 'y')
})

test('spread: multiple objects, dynamic props between spreads', async ({ is }) => {
  const esx = init()
  const { props } = esx `<img ...${{a: 1, b: 2}} x=${'y'} ...${{a: 3, b: 4}}/>`
  const { a, b, x } = props
  is(a, 3)
  is(b, 4)
  is(x, 'y')
})

test('spread: multiple objects, duplicate dynamic props between spreads overriden by last spread', async ({ is }) => {
  const esx = init()
  const { props } = esx `<img ...${{a: 1, b: 2}} a=${3} ...${{a: 3, b: 4}}/>`
  const { a, b, x } = props
  is(a, 3)
  is(b, 4)
})

test('children: deep element-nested dynamic + inline children', async ({ same }) => {
  const esx = init()
  const value = 'dynamic'
  const ESXComponent = () => esx `<div>${value} inline</div>`
  const ReactComponent = () => React.createElement('div', null, [value, ' inline'])
  same(render(createElement(ESXComponent)), render(createElement(ReactComponent)))
})

test('children: deep inline children + element-nested dynamic', async ({ same }) => {
  const esx = init()
  const value = 'dynamic'
  const ESXComponent = () => esx `<div>inline ${value}</div>`
  const ReactComponent = () => React.createElement('div', null, ['inline ', value])
  same(render(createElement(ESXComponent)), render(createElement(ReactComponent)))
})

test('nested components', async ({ same }) => {
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
  same(render(esx `<Component a=${value} text='hi'/>`), render(createElement(Component, {a:value,text: 'hi'})))
})

test('nested closed components', async ({ same }) => {
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
  same(render(esx `<Component/>`), render(createElement(Component)))
})

test('React.Fragment interopability', async ({ same }) => {
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
  same(
    render(esx `<div><EsxCmp/></div>`), 
    render(createElement('div', null, createElement(ReactCmp)))
  )
})

test('React.Fragment as a special-case does not need to be a registered component', async ({ same }) => {
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
  same(
    render(esx `<div><EsxCmp/></div>`), 
    render(createElement('div', null, createElement(ReactCmp)))
  )
})

test('React.Fragment shorthand syntax support (<></>)', async ({ same }) => {
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
  same(
    render (esx `<div><EsxCmp/></div>`),
    render(createElement('div', null, createElement(ReactCmp)))
  )
})

test('React.Fragment special-case namespace can be overridden', async ({ same }) => {
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
  same(
    render(esx `<EsxCmp/>`), 
    render(createElement(ReactCmp))
  )
})

test('self closing elements', async ({ same }) => {
  const esx = init()
  same(render(esx `<div/>`), render(createElement('div')))
  same(
    render(esx `<div><div/><p>hi</p></div>`),
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
  same(render(esx `<img className='x'>`), render(createElement('img', {className: 'x'})))
  same(render(esx `<img className=${'x'}>`), render(createElement('img', {className: 'x'})))
})

// test('unclosed tag', async ({throws}) => {
//   throws(() =>  esx `<div prop='x'`, SyntaxError(''))
// })

test('unexpected token, expression in open element', async ({throws}) => {
  const esx = init()
  throws(() =>  esx `<div${'value'}></div>`, SyntaxError('ESX: Unexpected token in element. Expressions may only be spread, embedded in attributes be included as children.'))
})

test('unexpected token, quotes around expression', async ({throws}) => {
  const esx = init()
  throws(
    () => esx `<div x="${'t'}"></div>`, 
    SyntaxError('Unexpected token. Attribute expressions must not be surrounded in quotes.')
  )
})

test('void elements must not have children', async ({throws}) => {
  const esx = init()
  throws(() => esx `<img>child</img>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
  throws(() => esx `<img>${'child'}</img>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
  throws(() => esx `<img><div>hi</div></img>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
  esx.register({Cmp() { return esx `<p>hi</p>`}})
  throws(() => esx `<img><Cmp/></img>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
  throws(() => esx `<img children='child'/>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
  throws(() => esx `<img children='child'>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
  throws(() => esx `<img children=${'child'}/>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
  throws(() => esx `<img children=${'child'}>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
})

test('void elements must not use dangerouslySetInnerHTML', async ({throws}) => {
  const esx = init()
  throws(() => esx `<img dangerouslySetInnerHTML=${{__html: '<p>no</p>'}}/>`, SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.'))
})

test('elements can only have either children or dangerouslySetInnerHTML', async ({throws}) => {
  const esx = init()
  throws(() => esx `<div children='no' dangerouslySetInnerHTML=${{__html: '<p>no</p>'}}></div>`, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx `<div dangerouslySetInnerHTML=${{__html: '<p>no</p>'}} children='no'></div>`, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx `<div dangerouslySetInnerHTML=${{__html: '<p>no</p>'}}>${'no'}</div>`, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
  throws(() => esx `<div dangerouslySetInnerHTML=${{__html: '<p>no</p>'}}>no</div>`, SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.'))
})

test('unexpected token', async ({throws}) => {
  const esx = init()
  const props = {}
  throws(() => esx `<div .${props}></div>`, SyntaxError('ESX: Unexpected token.'))
})

