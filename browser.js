'use strict'
const debug = require('debug')('esx')
const escapeHtml = require('./escape')
const tokens = debug.extend('tokens')

if (process.env.TRACE) tokens.log = (...args) => {
  console.log(...args, Error('trace').stack)
}
const { createElement, createContext, memo, forwardRef, Fragment, Suspense } = require('react')
const { Provider, Consumer } = createContext()
const REACT_PROVIDER_TYPE = Provider.$$typeof
const REACT_CONSUMER_TYPE = Consumer.$$typeof
const REACT_MEMO_TYPE = memo(()=>{}).$$typeof
const REACT_ELEMENT_TYPE = createElement('div').$$typeof
const REACT_FORWARD_REF_TYPE = forwardRef(() => {}).$$typeof
const [
  VAR, TEXT, OPEN, CLOSE, 
  ATTR, KEY, KW, VW, VAL,
  SQ, DQ, EQ, BRK, SC, SPREAD
] = tokens.enabled === false ? Array.from(Array(14)).map((_, i) => i) : [
  'VAR', 'TEXT', 'OPEN', 'CLOSE', 
  'ATTR', 'KEY', 'KW', 'VW', 'VAL',
  'SQ', 'DQ', 'EQ', 'BRK', 'SC', 'SPREAD'
]
const isEsx = Symbol('esx')
const marker = Symbol('esx.valuePlaceholder')
const skip = Symbol('esx.skip')
const provider = Symbol('esx.provider')
const esxValues = Symbol('esx.value')
// singleton state for ssr
var ssr = false 
var current = null
var currentValues = null
var currentTree = null
var ssrReactRootAdded = false

function validateComponents (components) {
  if (typeof components !== 'object' || components === null) {
    throw Error('ESX: supplied components must be an object')
  }
  const keys = Object.keys(components)
  for (var i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key[0].toUpperCase() !== key[0]) {
      throw Error('ESX: all components should use PascalCase')
    }
    // if (typeof components[key] !== 'function') {
    //   console.trace(key, components, components[key])
    //   throw Error('ESX: all components must be functions or classes')
    // }
  }
}
const elementToMarkup = (el) => {
  const result = renderToStaticMarkup(el)
  return result
}

const attr = (key, val) => {
  if (typeof val === 'boolean') {
    if (val === true) return ' '+ key
  } else {
    return inject(val, ` ${key}=`)
  }
  return ''
}

const spread = (ix, [,props,,meta], values, strBefore = '', strAfter = '') => {
  const object = values[ix]
  const keys = Object.keys(object)
  const { spread, spreadIndices } = meta
  const spreadCount = spreadIndices.length
  var priorSpreadKeys = spreadCount > 0 && new Set()
  var result = ''
  var dirtyBefore = false

  if (spreadCount > 0) {
    for (var si = 0; si < spreadCount; si++) {
      const sIx = spreadIndices[si]
      if (sIx >= ix) break
      priorSpreadKeys.add(...spread[sIx].dynamic)
    }
    spread[ix].dynamic = keys
  }
  for (var k in keys) {
    const key = keys[k]
    if (spread[ix].after.indexOf(key) > -1) continue
    const val = typeof object[key] === 'number' ? object[key] + '' : object[key]
    result += inject(val, ` ${key}=`)
    if (spread[ix].before.indexOf(key) > -1) {
      dirtyBefore = true
      continue
    }
    if (priorSpreadKeys && priorSpreadKeys.has(key)) {
      dirtyBefore = true
    } 
  }
  
  if (dirtyBefore) {
    strBefore = ''
    for (var i = 0; i < spread[ix].before.length; i++) {
      const key = spread[ix].before[i]
      if (keys.indexOf(key) > -1) continue
      if (props[key] === marker) {
        strBefore += inject(values[meta.dynAttrs[key]], ` ${key}=`)
      } else {
       strBefore += inject(props[key], ` ${key}=`)
      }
    }
  }
  if (strAfter.length > 0 && strAfter[0] !== ' ') strAfter = ' ' + strAfter
  const out = `${strBefore}${result}${strAfter}`
  return out[0] === ' ' ? out : ' ' + out
}

const inject = (val, attrKey = '') => {
  if (val == null) return ''
  const type = typeof val
  if (type === 'function' || type === 'symbol') return ''
  if (type === 'string' && val.length) {
    val = attrKey.length > 0 ? attrKey + '"' + escapeHtml(val) + '"' : escapeHtml(val)
  } else if (type === 'object') {
    if (val.$$typeof === REACT_ELEMENT_TYPE) {
      val = 'render' in val ? val.render(val.values) : elementToMarkup(val)
    } else if (Array.isArray(val)) {
      const childrenValue = val.reduce((acc, v) => acc.concat(v), [])
      val = ''
      const keys = Object.keys(childrenValue)
      for (var z = 0; z < keys.length; z++) {
        const k = keys[z]
        const item = childrenValue[k]
        if (item == null) continue
        const type = typeof item
        if (type === 'function' || type === 'symbol') continue
        if (type === 'string') {
          val += escapeHtml(item)
          if (typeof childrenValue[z + 1] === 'string') {
            val += '<!-- -->'
          }
        } else if (type === 'object') {
          if (item.$$typeof === REACT_ELEMENT_TYPE) {
            val += 'render' in item ? item.render(item.values) : elementToMarkup(item)
          } else {
            val = item + ''
            debug('Objects are not valid as a React child', val)
          }
        } else val += item
      }
    } else {
      debug('Objects are not valid as a React child', val)
      val = attrKey.length > 0 ? attrKey + '"' + val + '"' : val
    }
  }
  return val
}

function compileChildRenderer (item, tree, top) {
  
  const meta = item[3]
  const { openTagStart, openTagEnd, selfClosing, closeTagEnd, attrPos } = meta
  const to = selfClosing ? openTagEnd[0] : closeTagEnd[0] 
  const from = openTagStart[0]
  const fields = meta.fields.map((f) => f.split(''))
  const snips = {}
  for (var cmi in tree) {
    const item = tree[cmi][3]
    if (item.isComponent === false) continue
    const ix = item.openTagStart[0]
    if (ix > to || ix < from) continue
    const sPos = item.openTagStart[1]
    if (sPos < openTagEnd[1]) continue
    
    const ePos = item.selfClosing ? item.openTagEnd[1] : item.closeTagEnd[1]
    if (ePos > (selfClosing ? openTagEnd[1] : closeTagEnd[1])) continue
    if (snips[ix - from]) snips[ix - from].push(tree[cmi])
    else snips[ix - from] = [tree[cmi]]
  }
  const values = tree[esxValues].slice(from, to)
  replace(fields[from], 0, openTagStart[1] - 1)
  fields[to].length = (selfClosing ? openTagEnd[1] : closeTagEnd[1]) + 1
  const body = generate(fields.slice(from, to + 1), values, snips, attrPos, tree, from)
  const fn = Function('values', 'return (`' + body.join('') + '`)').bind({
    inject, spread, snips, renderComponent, addRoot
  })

  return fn
}

function resolveChildren (childMap, dynChildren, tree, top) {
  const children = []

  for (var i = 0; i < childMap.length; i++) {

    if (typeof childMap[i] === 'number') {
      if (tree[childMap[i]]) {
        const [ tag, props, elChildMap, elMeta ] = tree[childMap[i]]
        if (typeof tag === 'function') {
          const element = renderComponent(tree[childMap[i]], tree[esxValues])
          element.props[parent] = children[i] = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: tag,
            render: element.render,
            values: element.values,
            props: element.props,
            current: tree[childMap[i]],
            [isEsx]: true,
            ref: null
          }
        } else {              
          if (elMeta.dynAttrs) {
            for (var p in elMeta.dynAttrs) {
              if (!(p in props)) {
                props[p] = tree[esxValues][elMeta.dynAttrs[p]]
              }
            }
          }
          tree[childMap[i]][3].render = tree[childMap[i]][3].render || 
            compileChildRenderer(tree[childMap[i]], tree, top)
          
          props[parent] = children[i] = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: tag,
            render: tree[childMap[i]][3].render,
            values: tree[esxValues],
            props: props,
            current: tree[childMap[i]],
            [isEsx]: true,
            ref: null
          }
        }
      }
    } else {
      children[i] = childMap[i]
    }
    if (dynChildren) {
      for (var n in dynChildren) {
        const val = tree[esxValues][dynChildren[n]]
        children[n] = val
      }
    }
  }

  if (children.length === 0) return null 
  if (children.length === 1) return children[0]
  return children
}

function childPropsGetter () {
  if (!ssr) return null
  if (this[parent]) current = this[parent].current
  const [ , , childMap, meta ] = current
  const { dynChildren } = meta 
  return resolveChildren(childMap, dynChildren, meta.tree, current)
}

const parent = Symbol('esx.parent')
function esx (components = {}) {
  validateComponents(components)
  const cache = new WeakMap()
  const render = (strings, ...values) => {
    const key = strings
    const state = cache.has(key) ? 
      cache.get(key) : 
      cache.set(key, parse(components, strings, values)).get(key)
    const { tree } = state
    var i = tree.length
    var root = null
    const map = {}
    while (i--) {
      const [tag, props, childMap, meta] = tree[i]
      const children = new Array(childMap.length)
      const { dynAttrs, dynChildren, spread } = meta
      const spreads = spread && Object.keys(spread).map(Number)
      for (var c in childMap) {
        if (typeof childMap[c] === 'number') {
          children[c] = map[childMap[c]]
        } else {
          children[c] = childMap[c]
        }
      }
      if (spread) {
        for (var sp in spread)  { 
          const keys = Object.keys(values[sp])
          for (var k in keys) {
            if (spread[sp].after.indexOf(keys[k]) > -1) continue
            props[keys[k]] = values[sp][keys[k]]
          }
        }
      }
      if (dynAttrs) {
        for (var p in dynAttrs) {
          const overridden = spread && spreads.filter((n => {
            return dynAttrs[p] < n
          })).some((n) => {
            return p in values[n] && spread[n].before.indexOf(p) > -1
          })
          if (overridden) continue
          if (props[p] !== marker) continue // this means later static property, should override
          props[p] = values[dynAttrs[p]]
        }
      }
      if (dynChildren) {
        for (var n in dynChildren) {
          children[n] = values[dynChildren[n]]
        }
      }
      const reactChildren = children.length === 0 ? (props.children || null) : (children.length === 1 ? children[0] : children)
      root = reactChildren === null ? createElement(tag, props) : createElement(tag, props, reactChildren)
      map[i] = root
    }
    return root
  }
  render.register = (additionalComponents) => {
    validateComponents(additionalComponents)
    Object.assign(components, additionalComponents)
  }
  return render
}

function grow (r, index, c, tree, components, fields, attrPos) {
  const parent = getParent(tree)
  if (parent !== null) parent[2].push(tree.length)
  const isComponent = r in components || r === 'Fragment'
  const tag = isComponent ? (components[r] || Fragment) : r
  const meta = {
    closed: false,
    isComponent, 
    openTagStart: [c, index],
    fields,
    attrPos,
    lasKey: '',
    spreadIndices: [],
    spread: null,
    keys: [],
    dynAttrs: {},
    dynChildren: {},
    tree
  }
  const props = (isComponent && typeof tag.defaultProps === 'object') ? 
    Object.assign({}, tag.defaultProps) : 
    {}
  if (!('children' in props)) {
    Object.defineProperty(props, 'children', { get: childPropsGetter, configurable: true })
  }
  const item = [tag, props, [], meta]
  if (tag.$$typeof === REACT_PROVIDER_TYPE) {
    meta.isProvider = true
    tag._context[provider] = item
  }
  tree.push(item)
  return meta
}

function renderComponent(item, values) { 
  const [tag, props, childMap, meta] = item


  if (tag.$$typeof === REACT_PROVIDER_TYPE) {
    for (var p in meta.dynAttrs) props[p] = currentValues[meta.dynAttrs[p]]
    return resolveChildren(childMap, meta.dynChildren, meta.tree, current)
  }
  current = item
  const { dynAttrs, dynChildren } = meta

  for (var p in dynAttrs) {
    if (p[0] === '…') {
      const ix = dynAttrs[p]
      for (var sp in values[ix]) {
        if (meta.spread[ix].after.indexOf(sp) > -1) continue
        if (values[ix].hasOwnProperty(sp)) {
          props[sp] = values[ix][sp]
        }
      }
    } else {
      props[p] = values[dynAttrs[p]]
    }
    if (p === 'ref' || p === 'key') {
      values[dynAttrs[p]] = skip
    }
  }

  const context = tag.contextType ? 
    (tag.contextType[provider] ? 
      tag.contextType[provider][1].value : 
      tag.contextType._currentValue2
    ) : {}

  if (tag.$$typeof === REACT_CONSUMER_TYPE) {
    const tagContext = tag._context || tag
    const context = tagContext[provider] ? 
      tagContext[provider][1].value :
      tagContext._currentValue2
    const props = Object.assign({children: currentValues[dynChildren[0]]}, item[1])
    return currentValues[dynChildren[0]].call(props, context)
  }
  if (tag.$$typeof === REACT_MEMO_TYPE) {
    return tag.type(props, context)
  }
  if (tag.$$typeof === REACT_FORWARD_REF_TYPE) {
    return tag.render(props, props.ref)
  }
  if (tag.prototype && tag.prototype.render) {
    const element = new tag(props, context)
    if ('componentWillMount' in element) element.componentWillMount()
    if ('UNSAFE_componentWillMount' in element) element.UNSAFE_componentWillMount()
    return element.render()
  }

  return tag(props, context)
}

function parse (components, strings, values) {
  var ctx = TEXT
  const tree = []
  const fields = []
  const attrPos = {}
  for (var c = 0; c < strings.length; c++) {
    const s = (ctx === VW ? strings[c].trimRight() : strings[c].trim())
      .replace(/<(\s+)?(\/)?>/g, '<$2Fragment>')
    var field = ''
    var r = ''
    if (ctx === VW) {
      ctx = ATTR
      tokens(ATTR)
    }
    for (var i = 0; i < s.length; i++) {
      var ch = s[i]
      if (/\s/.test(ch) && /\s/.test(s[i-1])) {
        continue
      }
      if (ctx === OPEN && r === '/' && /\s/.test(ch)) {
        if (!tree[tree.length-1][3].isComponent) {
          continue
        }
      }
      switch (true) {
        case (ctx === TEXT && ch === '<'): 
          if (r.length > 0  && !/^\s$|-/.test(r)) {
            tokens(TEXT, r)
            const parent = getParent(tree)
            if (parent !== null) {
              if (s.length < strings[c].length) {
                const match = strings[c].match(/^\s+/)
                if (match !== null && s[0] !== '<') {
                  r = ' ' + r
                  field = ' ' + field
                }
              }
              parent[2].push(r)
            }
          }
          ctx = OPEN
          r = ''
          const trim = field.trimRight() 
          if (trim.slice(-1) === '>') field = trim
          field += ch
          break
        case (ch === '>' && s[i - 1] === '/'):
          const node = tree[tree.length -1][3]
          node.closed = true
          node.selfClosing = true
          ctx = TEXT
          const { isComponent } = node
          if (!isComponent && /\s/.test(s[i - 2])) {
            field = field.slice(0, -1).trimRight() + '/'
          }
          if (r.length && r !== '/') {
            addProp(tree, r.slice(0, r.length - 1))
          }
          tokens(SC)
          r = ''
          field += ch
          node.openTagEnd = [c, field.length - 1]
          if (node.spread) {
            node.spread[Object.keys(node.spread).pop()].after = node.keys 
            node.keys = []
          }
          break
        case (ch === '>' && ctx !== DQ && ctx !== SQ):
          if (ctx === KEY) {
            addProp(tree, r)
          } else if (ctx === OPEN) {
            tokens(OPEN, r)
            var top = tree.length
            if (r[0] !== '/') {
              grow(r, field.length - r.length - 1, c, tree, components, fields, attrPos)
            } else {
              var top = tree.length
              while (top-- > 0) {
                const meta = tree[top][3] 
                const tag = tree[top][0]
                if (meta.closed === false) {
                  const name = r.slice(1)
                  if (name === tag || components[name] === tag || tag === Fragment) {
                    meta.closed = true
                    meta.closeTagStart = [c, field.length - r.length - 1]
                    meta.closeTagEnd = [c, field.length]
                    break
                  } else {
                    throw SyntaxError(`Expected corresponding ESX closing tag for <${tag.name || tag.toString()}>`)
                  }
                }
              }
            }
          }
          else if (ctx === VAL && r.length > 0) {
            tokens(VAL, r)
          }
          tokens(CLOSE, r)
          if (r[0] !== '/') {
            tree[tree.length-1][3].openTagEnd = [c, i + 1]
            if (tree[tree.length-1][3].spread) {
              tree[tree.length -1][3].spread[Object.keys(tree[tree.length -1][3].spread).pop()].after = tree[tree.length -1][3].keys
              tree[tree.length -1][3].keys = []
            }
          }
          r = ''
          ctx = TEXT
          if (tree[tree.length-1][3].isComponent === false) {
            field = field.trimRight()
          }
          field += ch
          break
        case (ctx === TEXT): 
          r += ch
          field += ch
          break
        case (ctx === OPEN && ch === '/' && r.length > 0):
          tokens(OPEN, r)
          grow(r, field.length - r.length - 1, c, tree, components, fields, attrPos)
          r = ''
          ctx = TEXT
          field += ch
          break
        case (ctx === OPEN && /\s/.test(ch)):
          // ignore all whitespace in closing elements
          if (r[0] === '/') {
            continue
          }
          // ignore whitespace in opening tags prior to the tag name
          if (r.length === 0) {
            continue 
          }
          tokens(OPEN, r)
          grow(r, field.length - r.length - 1, c, tree, components, fields, attrPos)
          r = ''
          ctx = ATTR
          tokens(ATTR)
          field += ch
          break
        case (ctx === OPEN):
          r += ch
          field += ch
          break
          case (ctx === ATTR):
            if (/[^\s=]/.test(ch)) {
              ctx = KEY
              r = ch
              field += ch
              break
            }
            if (ctx === KEY && /\s/.test(ch)) {
              if (r.length > 0) {
                addProp(tree, r)
              }
              tokens(BRK)
              field += ch
              break
            }
            field += ch
            break
        case (ctx === KEY): 
          if (/\s/.test(ch)) {
            addProp(tree, r)
            r = ''
            ctx = KW
            tokens(KW)
            field += ch
            break
          }
          if (ch === '=') {
            addProp(tree, r)
            tokens(EQ)
            r = ''
            ctx = VW
            field += ch
            break
          }
          r += ch
          if (r === '...' && i === s.length - 1) {
            ctx = SPREAD
            field = field.slice(0, -2)
            ch = '…'
            tokens(SPREAD)
          }
          field += ch
          break
        case (ctx === KW || ctx === ATTR): 
          if (ch === '=') {
            tokens(EQ)
            ctx = VW
            field += ch
            break
          }
          if (/\s/.test(ch) === false) {
            tokens(BRK)
            if (/[\w-]/.test(ch)) {
              r += c
              ctx = KEY
              field += ch
              break
            }
            ctx = ATTR
            tokens(ATTR)
          }
          field += ch
          break
        case (ctx === VW): 
          if (ch === `"`) {
            ctx = DQ 
            field += ch
            break
          }
          if (ch === `'`) {
            ctx = SQ 
            field += '"'
            break
          }
          if (/\s/.test(ch) === false) {
            ctx = VAL
            i -= 1
            field += ch
            break
          }
        case (ctx === DQ && ch === `"`):
        case (ctx === SQ && ch === `'`):
        case (ctx === VAL && /\s/.test(ch)):
          tokens(BRK)
          const { lastKey } = tree[tree.length-1][3]
          if (r.length > 0) {
            tokens(VAL, r, BRK)
            const val = r
            const esc = escapeHtml(val)
            addValue(tree, val)
            
            if (val !== esc) field = field.replace(RegExp(`${val}$`, 'm'), esc)
          }
          
          ctx = ATTR
          tokens(ATTR)
          if (lastKey === 'key' || lastKey === 'ref') {
            field = field.slice(0, field.length - r.length - lastKey.length - 3)
          } else { 
            if (ch === `'`) ch = '"'
            field += ch
          }
          r = '' 
          break
        case (ctx === VAL || ctx === DQ || ctx === SQ):
          r += ch
          if (ch === `'`) ch = '"'
          field += ch
          break 
      }
    }
    if (r.length === 0) {
      if (ctx === KEY) {
        addProp(tree, r)
      }
    } else {
      if (ctx === TEXT) {
        const parent = getParent(tree)
        if (parent !== null) {
          if (s.length < strings[c].length) {
            const match = strings[c].match(/\s+$/)
            if (match !== null) {
              r += match[0]
              field += match[0]
            }
          }
          parent[2].push(r)
        }
        tokens(TEXT, r)
      }
      if (ctx === VAL || ctx === DQ || ctx === SQ) tokens(VAL, r)
    }
    fields[c] = field
    if (c in values === false) break
    if (ctx === ATTR) throw SyntaxError('Unexpected token. Attributes must have a name.')
    tokens(VAR)
    if (ctx === VW) {
      tokens(VAL, values[c], VW)
      const pMeta = tree[tree.length-1][3]
      attrPos[c] = {s: field.length - 1 - pMeta.lastKey.length, e: field.length - 1}
      addInterpolatedAttr(tree, c, i)
    }
    else if (ctx === VAL || ctx === SQ || ctx === DQ) { // value interpolated between quote marks
      throw SyntaxError('Unexpected token. Attribute expressions must not be surround in quotes.')
    }
    else if (ctx === ATTR) {
      addProp(tree, values[c])
    }
    else if (ctx === TEXT) { // dynamic children
      tokens(TEXT, values[c])
      addInterpolatedChild(tree, c)
    }  
    else if (ctx === SPREAD) {
      ctx = ATTR
      r = ''
      const props = tree[tree.length-1][1]
      const meta = tree[tree.length-1][3]
      meta.spread = meta.spread || {}
      meta.spread[c] = {
        before: meta.keys,
        after: []
      }
      meta.spreadIndices.push(c)
      meta.dynAttrs['…' + c] = c
      meta.keys = []
      tokens(ATTR)
    } else {
      tokens(ctx, values[c])
      switch (ctx) {
        case OPEN: 
          throw SyntaxError('ESX: Unexpected token in element. Expressions may only be spread, embedded in attributes be included as children.')
        default: 
          throw SyntaxError('ESX: Unexpected token.')
      }
    }
  }
  
  debug('tree parsed from string')
  
  return { tree, fields: fields.map((f) => f.split('')), attrPos, fn: null }
}

function recompile (state, values) {
  if (state.fn) return state
  const {tree, fields, attrPos } = state
  const snips = {}
  for (var cmi in tree) {
    // if (tree[cmi][3].isComponent === false) continue
    const ix = tree[cmi][3].openTagStart[0]
    if (snips[ix]) snips[ix].push(tree[cmi])
    else snips[ix] = [tree[cmi]]
  }

  const body = generate(fields, values, snips, attrPos, tree)
  const fn = Function('values', 'return `' + body.join('') + '`').bind({
    inject, spread, snips, renderComponent, addRoot
  })
  state.fn = fn
  state.snips = snips
  fn.body = body.join('')
  return state
}

function replace (array, s, e, ch = '', rx = null) {
  while (s <= e) {
    if (rx === null) array[s] = ch
    else if (rx.test(array[s])) array[s] = array[s].replace(rx, ch)
    s++
  }
}
function seek (array, pos, rx) {
  var i = pos - 1
  const end = array.length - 1
  while (i++ < end) {
    if (rx.test(array[i])) return i - 1
  }
  return -1
}
function reverseSeek (array, pos, rx) {
  var i = pos
  while (i--) {
    if (rx.test(array[i])) return i
  }
  return -1
}

function seek2 (array, pos, rx) {
  var i = pos - 1
  const end = array.length - 1
  while (i++ < end) {
    if (rx.test(array[i])) return i - 1
  }
  return pos
}
function reverseSeek2 (array, pos, rx) {
  var i = pos
  while (i--) {
    if (rx.test(array[i])) return i
  }
  return pos
}

function seekToElementStart (fields, ix) {
  do {
    var boundary = reverseSeek(fields[ix], fields[ix].length - 1, /</)
    if (boundary === -1) boundary = fields[ix].length - 1
  } while (boundary === fields[ix].length - 1 && --ix >= 0)
  
  while (ix < fields.length) {
    var pos = seek(fields[ix], boundary, /(^[\s/>]$)|^\$/)
    if (pos === -1) pos === boundary
    if (pos !== boundary) break
    boundary = 0
    ix++
  }
  pos++
  return [ix, pos]
}

function seekToElementEnd (fields, ix) {
  const rx = /\/?>/
  do {
    var pos = seek(fields[ix], 0, rx)
  } while (rx.test(fields[ix][pos]) === false && ++ix < fields.length)
  ix--
  return [ix, pos]
}

function generate (fields, values, snips, attrPos, tree, offset = 0) {
  var valdex = 0
  var priorCmpBounds = {}
  for (var i = 0; i < fields.length; i++) {
    
    const field = fields[i]
    const priorChar = field[field.length - 1]
    if (priorChar === '') continue
    if (priorChar === '=') {
      const { s, e } = attrPos[i + offset]
      const key = field.slice(s, e + 1).join('')      
      const pos = s === 0 ? 0 : reverseSeek(field, s, /^[^\s]$/) + 1
      if (key !== 'ref=' && key !== 'key=') {
        field[pos] = `\${this.inject(values[${offset + valdex++}], ' ${key}')}`
        replace(field, pos + 1, e)
        if (pos > 0) replace(field, 0, seek(field, 0, /^[^\s]$/)) // trim left
      } else {
        replace(field, pos, e)
        valdex++
      }
    } else if (priorChar === '…') {
      var ix = i + 1
      var item = snips[ix]
      while (ix >= 0) {
        if (item) break
        item = snips[--ix]
      }
      item = item[0]
      const [ tag, props, , meta] = item
      if (typeof tag === 'function') {
        // setting the field to a space instead of ellipsis
        // and rewinding i allows for a second pass where it's
        // recognized as a component, the space will be wiped
        // away with the component overwrite (don't set it to 
        // empty string since this indicates "don't process")
        // when it's a prior char
        field[field.length - 1] = ' '
        i--
        continue
      }
      const { spread } = meta
      const [openIx, openPos] = seekToElementStart(fields, i)
      const [closeIx, closePos] = seekToElementEnd(fields, i + 1)

      if (field[field.length - 2] === ' ') field[field.length - 2] = ''

      field[field.length - 1] = '`, `'
      const str = fields[openIx][openPos]  
      fields[openIx][openPos] = `\${this.spread(${offset + valdex++}, this.snips[${ix}][0], values, \``
      if (str[0] === '$') fields[openIx][openPos] += str
      fields[closeIx][closePos] = '`)}' + fields[closeIx][closePos]
    } else if (valdex < values.length) {
      const output = `\${this.inject(values[${offset + valdex++}])}`
      const prefix = (priorChar !== '>') ?
        '<!-- -->' :
        ''
      const suffix = (fields[i + 1] && fields[i + 1].join('').trimLeft()[0] !== '<') 
        ? '<!-- -->' :
        ''
      field[field.length - 1] = `${field[field.length - 1]}${prefix}${output}${suffix}`
    }
    if (i in snips) {
      snips[i].forEach((snip, ix) => {       
        const { openTagStart, openTagEnd, selfClosing, closeTagEnd, isComponent } = snip[3]
        if (!isComponent) return
        const [ from, start ] = openTagStart
        const [ to, end ] = selfClosing ? openTagEnd : closeTagEnd
        if (priorCmpBounds.to > from || priorCmpBounds.to === from && priorCmpBounds.end > start) {
          return
        }
        priorCmpBounds = {to, end}
        if (typeof snip[0] === 'symbol') {
          tree[esxValues] = values
          snip[2] = resolveChildren(snip[2], snip[3].dynChildren, tree, tree[0])
          field[start] = `\${this.inject(this.snips[${i}][${ix}][2])}`
        } else {
          field[start] = `\${this.inject(this.renderComponent(this.snips[${i}][${ix}], values))}`
        }
        replace(field, start + 1, from === to ? end : field.length - 1)
        if (from < to) {
          valdex = to
          var c = from
          while (c++ < to) {
            replace(fields[c], 0, c === to ? end : fields[c].length - 1)
          }
        }
      })
    }
  }

  const body = fields.map((f) => f.join(''))
  for (var fi = 0; fi < body.length; fi++) {
    const field = body[fi]
    if (typeof field !== 'string') continue
    const match = field.match(/\/>|>/)
    if (match === null) continue
    if (match.input[match.index - 1] === '-') continue
    const pre = field.slice(0, match.index).trimRight()
    const post = field.slice(match.index).trimLeft()
    body[fi] = pre + '${this.addRoot()}' + post
    break
  }
  return body
}

function addRoot () { 
  const result = ssrReactRootAdded ? '' : ' data-reactroot=""'
  ssrReactRootAdded = true
  return result
}

function addInterpolatedChild (tree, valuesIndex) {
  const node = getParent(tree)
  if (node === null) return
  const children = node[2]
  const meta = node[3]
  meta.dynChildren[children.length] = valuesIndex
  children.push(marker)
}

function addInterpolatedAttr (tree, valuesIndex) {
  const node = tree[tree.length-1]
  const props = node[1]
  const meta = node[3]
  props[meta.lastKey] = marker
  meta.dynAttrs[meta.lastKey] = valuesIndex
}

function addValue (tree, val) {
  const node = tree[tree.length-1]
  const props = node[1]
  const meta = node[3]
  props[meta.lastKey] = val
}

function addProp (tree, name) {
  tokens(KEY, name)
  const node = tree[tree.length-1]
  const props = node[1]
  const meta = node[3]
  if (name === 'children') {
    meta.childrenAttribute = true
    Object.defineProperty(props, name, {value: true, writable: true})
  }
  else props[name] = true
  meta.lastKey = name
  meta.keys.push(name)
}

function getParent (tree) {
  var top = tree.length
  while (top-- > 0) {
    if (tree[top][3].closed === false) return tree[top]
  }
  return null
}


module.exports = esx