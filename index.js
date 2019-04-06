'use strict'
const debug = require('debug')('esx')
const { createElement } = tryToLoad('react')
const { 
  renderToStaticMarkup,
  renderToString: reactRenderToString 
} = tryToLoad('react-dom/server')
const escapeHtml = require('./lib/escape')
const parse = require('./lib/parse')
const validate = require('./lib/validate')
const attr = require('./lib/attr')
const {
  REACT_PROVIDER_TYPE,
  REACT_CONSUMER_TYPE,
  REACT_MEMO_TYPE,
  REACT_ELEMENT_TYPE,
  REACT_FORWARD_REF_TYPE,
  VOID_ELEMENTS
} = require('./lib/constants')
const {
  ns, marker, skip, provider, esxValues, parent, owner
} = require('./lib/symbols')
// singleton state for ssr
var ssr = false 
var ssrReactRootAdded = false
var currentValues = null
var lastChildProp = null

function selected (val, wasSelected) {
  if (Array.isArray(selected.defaultValue)) {
    return selected.defaultValue.includes(val) ? ' selected=""' : ''
  }
  return selected.defaultValue != null ? 
    (val === selected.defaultValue ? ' selected=""' : '') 
    : (wasSelected ? ' selected=""' : '')
}

selected.defaultValue = null

selected.register = function (val) {
  selected.defaultValue = Array.isArray(val) ? val : escapeHtml(val)
  return ''
}
selected.deregister = function () {
  selected.defaultValue = null
  return ''
}

const elementToMarkup = (el) => {
  if (ssrReactRootAdded === false) {
    return reactRenderToString(el)
  }
  return renderToStaticMarkup(el)
}
const spread = (ix, [tag, props, childMap, meta], values, strBefore = '', strAfter = '') => {
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
    if (attr.reserved(key)) continue
    if (spread[ix].after.indexOf(key) > -1) continue
    if (tag === 'select' && key === 'defaultValue') {
      selected.register(object[key])
      continue
    }
    const keyIsDSIH = key === 'dangerouslySetInnerHTML'
    if (keyIsDSIH || key === 'children' || (tag === 'textarea' && key === 'defaultValue')) {
      const forbiddenKey = keyIsDSIH ? 'children' : 'dangerouslySetInnerHTML'
      const collision = spread[ix].before.indexOf(forbiddenKey) > -1 || 
        spread[ix].after.indexOf(forbiddenKey) > -1 ||
        priorSpreadKeys.has(forbiddenKey) ||
        forbiddenKey in object ||
        keyIsDSIH && childMap.length > 0
      if (collision) {
        throw SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.')
      }
      const overrideChildren = spread[ix].before.indexOf(key) > -1 ||
        priorSpreadKeys && priorSpreadKeys.has(key) ||
        childMap.length === 0
    
      if (overrideChildren) {
        const suspendRootAdding = ssrReactRootAdded === false
        if (suspendRootAdding) ssrReactRootAdded = true
        childMap[0] = (key === 'children' || 
          (tag === 'textarea' && key === 'defaultValue')) ? 
            inject(object[key]) : 
            object[key].__html
        if (suspendRootAdding) ssrReactRootAdded = false
      }
      continue
    }
    const val = typeof object[key] === 'number' ? object[key] + '' : object[key]
    const mappedKey = attr.mapping(key, tag)
    if (mappedKey.length === 0) continue
    if (mappedKey === 'style') result += style(val)
    else result += attribute(val, mappedKey, key)
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
      const mappedKey = attr.mapping(key, tag)
      if (mappedKey.length === 0) continue
      if (props[key] === marker) {
        strBefore += attribute(values[meta.dynAttrs[key]], mappedKey, key)
      } else {
       strBefore += attribute(props[key], mappedKey, key)
      }
    }
  }
  if (strAfter.length > 0 && strAfter[0] !== ' ') strAfter = ' ' + strAfter
  const out = `${strBefore}${result}${strAfter}`
  return (out.length === 0 || out[0] === ' ') ? out : ' ' + out
}

const attribute = (val, attrKey = '', propKey = '', replace = null) => {
  if (replace !== null && propKey in replace) return replace[propKey]
  if (val == null)  return ''
  const type = typeof val
  if (type === 'function' || type === 'symbol') return ''
  if (type === 'boolean' && attrKey.length > 0) {
    const serialized = attr.bool(propKey) ? attr.serializeBool(propKey, val) : ''
    val = serialized.length > 0 ? ` ${attrKey}=${serialized}` : ''
  } else {
    if (attr.bool(propKey, true)) val = ''
    val = ` ${attrKey}="${escapeHtml(val)}"`
  }
  return val
}

const injectObject = (val) => {
  if (val.$$typeof === REACT_ELEMENT_TYPE) {
    // if the element does not have an ns value, it may have been cloned in which
    // case we've slipped a method through the cloning process that pulls the esx 
    // state in from the old element
    const state = val[ns] || (val._owner && val._owner[owner] && val._owner())
    if (!state) {
      return elementToMarkup(val)
    }
    return state.tmpl(state.values, state.extra, state.replace)
  }
  debug('Objects are not valid as an elements child', val)
  return ''
}
const injectArray = (val) => {
  const stack = val.slice()
  var priorItemWasString = false
  var result = ''
  while (stack.length > 0) {
    const item = stack.shift()
    if (item == null) continue
    if (Array.isArray(item)) {
      stack.unshift(...item)
      continue
    }
    const type = typeof item
    if (type === 'function' || type === 'symbol') continue
    if (type === 'object') {
      result += injectObject(item)
      priorItemWasString = false
    }
    if (type === 'string') {
      if (priorItemWasString) result += '<!-- -->'
      result += escapeHtml(item)
      priorItemWasString = true
    }
  }
  return result
}
const inject = (val) => {
  if (val == null) return ''
  const type = typeof val
  if (type === 'string') return escapeHtml(val)
  if (type === 'function' || type === 'symbol') return ''
  if (type !== 'object') return val
  if (Array.isArray(val)) return injectArray(val)
  return injectObject(val)
}

function EsxElementUnopt (item) {
  this.$$typeof = REACT_ELEMENT_TYPE
  const [type, props] = item
  this.type = type 
  this.props = props
  this.key = props.key || null 
  this.ref = props.ref || null 
  this.esxUnopt = true
}

function EsxElement (item, tmpl, values) {
  this.$$typeof = REACT_ELEMENT_TYPE
  const [type, props] = item
  this.type = type 
  this.props = props
  this.key = props.key || null 
  this.ref = props.ref || null 
  this[ns] = { tmpl, values, item }
}
const ownerDesc = {
  get: function _owner () {
    var lastProps = this.props
    var state = this[ns]
    var type = this.type
    var children = lastChildProp
    const propagate = typeof type === 'string' ? function propagate () {
      var extra = ''
      var replace = null
      var same = true
      if (state === null) {
        // this is now a clone of a clone, bail:
        return null
      }
      if (this.props.children !== children) {
        // cloneElement is overriding children, bail:
        return null
      }
      for (var k in this.props) {
        const mappedKey = attr.mapping(k, type)
        if (mappedKey === 'children') continue
        if (lastProps[k] !== this.props[k]) {
          same = false
          if (k in lastProps) {
            if (replace === null) replace = {}
            
            if (mappedKey) {
              replace[mappedKey] = attribute(this.props[k], mappedKey, k)
            }
          } else {
            extra += attribute(this.props[k], mappedKey, k)
          }
        }
      }
      const result = same ? state : {
        extra,
        replace,
        tmpl: state.tmpl,
        values: state.values
      }
      // if we don't clear state from scope, memory will grow infinitely
      // that means the propagate function can only be called once, the second
      // time it will return null (which will force a deopt to standard react rendering)
      lastProps = state = type = children = null
      return result
    } : function propogate () {
      const el = renderComponent([this.type, this.props, {}, {}])
      // if we don't clear state from scope, memory will grow infinitely
      // that means the propagate function can only be called once
      lastProps = state = type = children = null
      return el ? el[ns] : null
    }
    propagate[owner] = true
    return propagate
  }
}
Object.defineProperty(EsxElement.prototype, '_owner', ownerDesc)

function esx (components = {}) {
  validate(components)
  components = Object.assign({}, components)
  const cache = new WeakMap()
  const raw = (strings, ...values) => {
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
          children[c] = childMap[c] || null
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
  const render = function (strings, ...values) {
    if (ssr === false) return raw(strings, ...values)
    currentValues = values
    const key = strings
    const state = cache.has(key) ? 
      cache.get(key) : 
      cache.set(key, parse(components, strings, values)).get(key)
    const { tree, tmpl } = loadTmpl(state, values)
    const item = tree[0]
    if (item === undefined) return null
    item[3].values = values
    tree[esxValues] = values

    const el = new EsxElement(item, tmpl, values)

    if (!(parent in el.props)) el.props[parent] = item
    return el
  }

  function renderToString (strings, ...args) {
    ssr = true
    currentValues = null
    ssrReactRootAdded = false
    const result = render(strings, ...args)
    if (result === null) return ''
    const { tmpl, values, extra, replace } = result[ns]
    const output = tmpl(values, extra, replace)
    currentValues = null
    ssrReactRootAdded = false
    ssr = false
    return output
  }
  render.register = (additionalComponents) => {
    validate(additionalComponents)
    Object.assign(components, additionalComponents)
  }
  render.renderToString = render.ssr = renderToString
  render.createElement = createElement
  return render
}

function renderComponent (item, values) {
  const [tag, props, childMap, meta] = item
  try { props[parent] = item } catch (e) {} // try/catch is to dev scenarios where object is frozen

  if (tag.$$typeof === REACT_PROVIDER_TYPE) {
    for (var p in meta.dynAttrs) {
      if (p === 'children') {
        meta.dynChildren[0] = meta.dynAttrs[p]
        childMap[0] = marker
      } else {
        props[p] = currentValues[meta.dynAttrs[p]]
      }
    }
    return resolveChildren(childMap, meta.dynChildren, meta.tree, item)
  }

  const { dynAttrs, dynChildren } = meta
  if (values) {
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
    const props = Object.assign({children: values[dynChildren[0]]}, item[1])
    return props.children.call(props, context)
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

function childPropsGetter () {
  if (!ssr) return null
  const item = this[parent]
  const [ , , childMap, meta ] = item
  const { dynChildren } = meta
  return (lastChildProp = resolveChildren(childMap, dynChildren, meta.tree, item))
}

function loadTmpl (state, values) {
  if (state.tmpl) return state
  const {tree, fields, attrPos } = state
  const snips = {}
  for (var cmi = 0; cmi < tree.length; cmi++) {
    const [ tag, props, , meta ] = tree[cmi]
    if (!('children' in props)) {
      Object.defineProperty(props, 'children', { get: childPropsGetter, enumerable: true, configurable: true })
    }
    const ix = meta.openTagStart[0]
    if (meta.isComponent === false) {
      const [ ix, pos ] = meta.openTagEnd
      const isVoidElement = VOID_ELEMENTS.has(tag)
      if (isVoidElement === true && meta.selfClosing === false) {
        fields[ix][pos - 1] = '/>'
        meta.selfClosing === true
        if (meta.closeTagStart) {
          const [ ix, pos ] = meta.closeTagStart
          replace(fields[ix], pos, meta.closeTagEnd[1])
        }
      }
      if (isVoidElement === false && meta.selfClosing === true && !meta.closeTagStart) {
        const [ ix, pos ] = meta.openTagEnd
        fields[ix][pos - 1] = '>'
        fields[ix][pos] = `</${tag}>`
      }
    }
    if (snips[ix]) snips[ix].push(tree[cmi])
    else snips[ix] = [tree[cmi]]
  }

  const body = generate(fields, values, snips, attrPos, tree)
  const tmpl = compileTmpl(body, {
    inject, attribute, style, spread, snips, renderComponent, addRoot, selected
  })
  state.tmpl = tmpl
  state.snips = snips
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
    if (rx.test(array[i])) return i
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

function seekToEndOfTagName (fields, ix) {
  do {
    var boundary = reverseSeek(fields[ix], fields[ix].length - 1, /</)
    if (boundary === -1) boundary = fields[ix].length - 1
  } while (boundary === fields[ix].length - 1 && --ix >= 0)
  
  while (ix < fields.length - 1) {
    var pos = seek(fields[ix], boundary, /(^[\s/>]$)|^\$|^$/) - 1
    if (pos === -1) pos === boundary
    if (pos !== boundary) break
    boundary = 0
    ix++
  }
  
  pos++
  return [ix, pos]
}

function seekToEndOfOpeningTag (fields, ix) {
  const rx = /\/?>/
  do {
    var pos = seek(fields[ix], 0, rx)
  } while (rx.test(fields[ix][pos]) === false && ++ix < fields.length)
  
  if (/\//.test(fields[ix][pos - 1])) pos -= 1

  return [ix, pos]
}

function style (obj) {
  if (typeof obj !== 'object' && obj != null) {
    throw TypeError('The `style` prop expects a mapping from style properties to values, not a string.')
  }
  const str = renderToStaticMarkup({
    $$typeof: REACT_ELEMENT_TYPE,
    type: 'x',
    props: {style: obj}
  }).slice(3, -5)
  return str.length > 0 ? ' ' + str : str
}

function getTag (fields, i) {
  const [ix, tPos] = seekToEndOfTagName(fields, i)
  return fields[ix].slice(reverseSeek(fields[ix], fields[ix].length - 1, /</) + 1, tPos).join('')
}

function generate (fields, values, snips, attrPos, tree, offset = 0) {
  var valdex = 0
  var priorCmpBounds = {}
  const rootElement = tree.find(([tag]) => typeof tag === 'string')
  for (var i = 0; i < fields.length; i++) {
    const field = fields[i]
    const priorChar = field[field.length - 1]
    if (priorChar === '') continue
    if (priorChar === '=') {
      const { s, e } = attrPos[i + offset]
      const key = field.slice(s, e).join('')
      const pos = s === 0 ? 0 : reverseSeek(field, s, /^[^\s]$/) + 1
      if (key === 'style') {
        replace(field, pos, e)
        field[s] = `\${this.style(values[${offset + valdex++}])}`
      } else if (key === 'dangerouslySetInnerHTML') {
        replace(field, pos, e)
        const [ix, p] = seekToEndOfOpeningTag(fields, i + 1)
        fields[ix][p + 1] = `\${values[${offset + valdex++}].__html}${fields[ix][p + 1]}`
      } else if (key === 'defaultValue' && getTag(fields, i) === 'select') {
        replace(field, pos, e)
        field[pos] = `\${this.selected.register(values[${offset + valdex++}])}`
      } else if (key === 'selected' && getTag(fields, i) === 'option') {
        replace(field, pos, e)
        const [ ix, p ] = seekToEndOfTagName(fields, i)
        const wasSelectedPos = seek(fields[ix], p, /§/)
        if (wasSelectedPos === -1) {
          field[field.length -1] = `\${this.attribute(values[${offset + valdex++}], '${key}', '${key}', replace)}`
        } else {
          const sanity = fields[ix][wasSelectedPos + 2] === ')' && fields[ix][wasSelectedPos + 3] === '}'
            && fields[ix][wasSelectedPos - 1] === ' ' && fields[ix][wasSelectedPos - 2] === ','
          if (sanity) {
            const selectIndex = fields[ix][wasSelectedPos + 1].codePointAt(0)
            fields[ix][wasSelectedPos + 1] = ''
            const selectWithDefaultValue = 'defaultValue' in tree[selectIndex][1]
            if (selectWithDefaultValue) {
              fields[ix][wasSelectedPos] = `values[${offset + valdex++}]`
            } else {
              fields[ix][wasSelectedPos] = 'false'
              field[field.length -1] = `\${this.attribute(values[${offset + valdex++}], '${key}', '${key}', replace)}`
            }
          } else {
            valdex++
          }
        }
      } else if (key === 'children' || attr.mapping(key, getTag(fields, i)) === 'children') {
          replace(field, pos, e)
          const [ix, p] = seekToEndOfOpeningTag(fields, i + 1)
          if (fields[ix][p + 1][0] === '<') {
            fields[ix][p] = fields[ix][p] + `\${this.inject(values[${offset + valdex++}])}`
          } else {
            //children attribute has clashed with element that has children,
            //increase valdex to ignore attribute
            valdex++
          }
      } else if (attr.reserved(key) === false) {
        const tag = getTag(fields, i)
        const mappedKey = attr.mapping(key, tag)
        if (mappedKey.length > 0) {
          if (snips[i] && snips[i][0] === rootElement) {
            field[pos] = `\${this.attribute(values[${offset + valdex++}], '${mappedKey}', '${key}', replace)}`
          } else {
            field[pos] = `\${this.attribute(values[${offset + valdex++}], '${mappedKey}', '${key}')}`
          }
          
        } else {
          // if the mapped key is empty, clear the attribute from the output and ignore the value
          replace(field, pos, e)
          valdex++ 
        }
        replace(field, pos + 1, e)
        if (pos > 0) replace(field, 0, seek(field, 0, /^[^\s]$/) - 1) // trim left

        if (key === 'value' && tag === 'option') {
          const p = seekToEndOfTagName(fields, i)[1]
          field[p] = `\${this.selected(values[${offset + valdex - 1}])}${field[p]}`
        }
      } else {
        replace(field, pos, e)
        valdex++
      }
    } else if (priorChar === '…') {
      var ix = i
      var item = snips[ix]
      while (ix >= 0) {
        if (item) break
        item = snips[--ix]
      }
      item = item[0]
      const [ tag, props, childMap, meta] = item
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
      const [openIx, openPos] = seekToEndOfTagName(fields, i)
      const [closeIx, closePos] = seekToEndOfOpeningTag(fields, i + 1)

      if (field[field.length - 2] === ' ') field[field.length - 2] = ''

      field[field.length - 1] = '`, `'
      const str = fields[openIx][openPos]
      fields[openIx][openPos] = `\${this.spread(${offset + valdex++}, this.snips[${ix}][0], values, \``
      if (str[0] === '$') fields[openIx][openPos] += str
      
      fields[closeIx][closePos] = '`)}' + fields[closeIx][closePos]
      if (VOID_ELEMENTS.has(tag) === false && childMap.length === 0) {
        if (meta.spread[ix] && meta.spread[ix].before.indexOf('children') > -1) {
          childMap[0] = props.children
          replace(fields[closeIx], closePos + 1, seek(fields[closeIx], 0, /</) - 1)
        }
        // this handles where the props object being spread MAY HAVE a `children`
        // property and the element itself has no children:
        if (fields[closeIx][closePos + 1][0] === '<' || fields[closeIx][closePos + 1] === '') {
          // when this.spread is called, if childMap is empty (so, no children)
          // childMap[0] is set to the value of the children attribute, now we can
          // so we can inject that value from the childMap 
          // we shift the childMap so that the value is cleared, so that future renderings
          // don't have old state
          fields[closeIx][closePos + 1] = `\${this.snips[${ix}][0][2].length === 1 ? this.snips[${ix}][0][2].shift() : ''}${fields[closeIx][closePos + 1]}`
        }
      }
    } else if (valdex < values.length) {
      let optionMayBeSelected = false
      const tag = getTag(fields, i)
      if (tag === 'option') {
        let c = i
        let select = null
        const predicate = ([tag]) => tag === 'select'
        while (c >= 0) {
          if (select = snips[c].reverse().find(predicate)) break
          c--
        }
        optionMayBeSelected = 'defaultValue' in select[1] || select[3].spreadIndices.length > 0
      }
      const output = `\${this.inject(values[${offset + valdex++}])}`
      const prefix = (priorChar !== '>') && !optionMayBeSelected ?
        '<!-- -->' :
        ''
      const suffix = (fields[i + 1] && fields[i + 1].join('').trimLeft()[0] !== '<') 
        && !optionMayBeSelected
        ? '<!-- -->' :
        ''

      field[field.length - 1] = `${field[field.length - 1]}${prefix}${output}${suffix}`

      if (optionMayBeSelected) {
        const text = fields[i + 1].slice(0, fields[i + 1].findIndex((c) => c === '<')).join('')
        const pos = reverseSeek(fields[i], fields[i].length - 1, /</) + tag.length + 1
        field[pos] = `\${this.selected(values[${offset + valdex - 1}] + '${text}')}${field[pos]}`
      }
      
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
          while (c++ < to && fields[c]) {
            replace(fields[c], 0, c === to ? end : fields[c].length - 1)
          }
        }
      })
    }
  }
  
  const body = fields.map((f) => f.join(''))
  if (rootElement) {
    const { keys } = rootElement[3]
    const attrs = keys.map((k) => {
      k = attr.mapping(k, rootElement[0])
      if (k === 'dangerouslySetInnerHTML') return ''
      return k.length === 0 || attr.reserved(k) ? '' : ` (${k})=".*"`
    }).filter(Boolean)
    const rx = RegExp(attrs.join('|'), 'g')
    
    for (var fi = 0; fi < body.length; fi++) {
      const field = body[fi]
      if (typeof field !== 'string') continue
      const match = field.match(/\/>|>/)
      if (match === null) continue
      if (match.input[match.index - 1] === '-') continue
      if (attrs.length > 0) body.slice(0, fi + 1).forEach((f, i) => {
        if (i === fi) {
          const pre = f.slice(0, match.index).trimRight()
          const post = f.slice(match.index).trimLeft()
          const clonableRootElement = makeClonable(pre, rx)
          const offset = clonableRootElement.length - pre.length
          match.index += offset
          body[i] = clonableRootElement + post
          return
        }
        const clonableRootElement = makeClonable(f, rx)
        body[i] = clonableRootElement
      })
      const pre = body[fi].slice(0, match.index).trimRight()
      const post = body[fi].slice(match.index).trimLeft()
      body[fi] = `${pre}\${extra}\${this.addRoot()}${post}`
      break
    }
  }

  return body
}

function makeClonable (str, rx) {
  return str.replace(rx, (m, ...args) => {
    const k = args.slice(0, -1).find((k) => !!k)
    return `\${replace !== null && '${k}' in replace ? replace['${k}'] : \`${m}\`}`
  })
}

function addRoot () { 
  const result = ssrReactRootAdded ? '' : ' data-reactroot=""'
  ssrReactRootAdded = true
  return result
}

function compileTmpl (body, state) {
  return Function('values', `extra=''`, 'replace=null', 'return `' + body.join('') + '`').bind(state)
}

function compileChildTmpl (item, tree, top) {
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
  const tmpl = compileTmpl(body, {
    inject, attribute, style, spread, snips, renderComponent, addRoot, selected
  })
  return tmpl
}

function resolveChildren (childMap, dynChildren, tree, top) {
  const children = []
  for (var i = 0; i < childMap.length; i++) {

    if (typeof childMap[i] === 'number') {
      if (tree[childMap[i]]) {
        const [ tag, props, , elMeta ] = tree[childMap[i]]
        if (typeof tag === 'function') {
          const element = renderComponent(tree[childMap[i]], tree[esxValues])
          if (typeof element !== 'object') {
            Object.defineProperty(props, 'children', {value: element})
            children[i] = new EsxElementUnopt(tree[childMap[i]])
          } else {
            const state = element[ns] || (element._owner && element._owner[owner] && element._owner())
            if (state) {
              children[i] = new EsxElement(tree[childMap[i]], state.tmpl, state.values)
            }   else {
              children[i] = new EsxElementUnopt(tree[childMap[i]])
            }
          }
        } else {              
          if (elMeta.dynAttrs) {
            for (var p in elMeta.dynAttrs) {
              if (!(p in props)) {
                props[p] = tree[esxValues][elMeta.dynAttrs[p]]
              }
            }
          }
          tree[childMap[i]][3][ns] = tree[childMap[i]][3][ns] || {
            tmpl: compileChildTmpl(tree[childMap[i]], tree, top),
            values: tree[esxValues]
          }

          try { 
            props[parent] = tree[childMap[i]] 
          } catch (e) {
            // this element has at some point been passed
            // through React.renderToString (or renderToStaticMarkup),
            // because props[parent] is there and has become readOnly.
            // So there's nothing to do here, we need to avoid 
            // a throw. 
          }
            
          children[i] = new EsxElement(tree[childMap[i]], tree[childMap[i]][3][ns].tmpl, tree[esxValues])
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

function tryToLoad (peer) {
  try { 
    return require(peer)
  } catch (e) {
    console.error(`
      esx depends on ${peer} as a peer dependency, 
      ensure that ${peer} (or preact-compat) is 
      installed in your application
    `)
    process.exit(1)
  }
}

module.exports = esx
