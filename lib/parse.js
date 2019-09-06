const debug = require('debug')('esx')
const { Fragment } = require('react')
const escapeHtml = require('./escape')
const attr = require('./attr')
const get = require('./get')
const {
  VOID_ELEMENTS,
  AUTO_CLOSING_ELEMENTS,
  PROPERTIES_RX
} = require('./constants')
const { marker, ties } = require('./symbols')
const tokens = debug.extend('tokens')

/* istanbul ignore next */
if (process.env.TRACE) {
  tokens.log = (...args) => {
    console.log(...args, Error('trace').stack)
  }
}

/* istanbul ignore next */
const [
  VAR, TEXT, OPEN, CLOSE,
  ATTR, KEY, KW, VW, VAL,
  SQ, DQ, EQ, BRK, SC, SPREAD
] = tokens.enabled === false ? Array.from(Array(14)).map((_, i) => i) : [
  'VAR', 'TEXT', 'OPEN', 'CLOSE',
  'ATTR', 'KEY', 'KW', 'VW', 'VAL',
  'SQ', 'DQ', 'EQ', 'BRK', 'SC', 'SPREAD'
]

function addInterpolatedChild (tree, valuesIndex) {
  const node = getParent(tree)
  const children = node[2]
  const meta = node[3]
  meta.dynChildren[children.length] = valuesIndex
  children.push(marker)
}

function addInterpolatedAttr (tree, valuesIndex) {
  const node = tree[tree.length - 1]
  const props = node[1]
  const meta = node[3]
  props[meta.lastKey] = marker
  meta.dynAttrs[meta.lastKey] = valuesIndex
}

function addValue (tree, val) {
  const node = tree[tree.length - 1]
  const props = node[1]
  const meta = node[3]
  props[meta.lastKey] = val
  if (meta.lastKey === 'children') {
    meta.childrenAttribute = true
  }
}

function addProp (tree, name) {
  tokens(KEY, name)
  const node = tree[tree.length - 1]
  const tag = node[0]
  const props = node[1]
  const meta = node[3]
  if ((name === 'dangerouslySetInnerHTML' || name === 'children') && VOID_ELEMENTS.has(tag)) {
    throw SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.')
  }
  if (name === 'children') {
    if ('dangerouslySetInnerHTML' in props) {
      throw SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.')
    }
    Object.defineProperty(props, name, { value: true, writable: true, enumerable: true })
  } else props[name] = true

  if (name === 'dangerouslySetInnerHTML' && 'children' in props) {
    throw SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.')
  }

  meta.lastKey = name
  meta.keys.push(name)
}

function valuelessAttr (tree, field, key, suffix = '') {
  addProp(tree, key)
  if (attr.bool(key)) {
    // the fact that it's present and a legit boolean attribute
    // means that it's value is true:
    addValue(tree, true)
    return `${field.slice(0, 0 - key.length - suffix.length)}${attr.mapping(key)}=${attr.serializeBool(key, true)}${suffix}`
  }
  debug(`the attribute "${key}" has no value and is not a boolean attribute. This attribute will not be rendered.`)
  return field.slice(0, -1 - key.length - suffix.length) + suffix
}

function getParent (tree) {
  var top = tree.length
  while (top-- > 0) {
    const el = tree[top]
    if (el[3].closed === false) return el
  }
  return null
}

function grow (r, index, c, tree, components, fields, attrPos) {
  const parent = getParent(tree)
  if (parent !== null) parent[2].push(tree.length)
  if (!(r in components)) {
    const propPath = r.match(PROPERTIES_RX).map((p) => {
      return p.replace(/'|"|`/g, '')
    })
    if (propPath.length > 1) {
      components[r] = get(components, propPath)
      if (components[r] === undefined) {
        throw ReferenceError(`ESX: ${r} not found in registered components`)
      }
    } else if (r[0].toUpperCase() === r[0] && !(r in components) && r !== 'Fragment') {
      throw ReferenceError(`ESX: ${r} not found in registered components`)
    }
  }
  const isComponent = r in components || r === 'Fragment'
  const meta = {
    name: r,
    closed: false,
    selfClosing: false,
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
    hooks: null,
    hooksSetup: false,
    hooksUsed: false,
    attributes: {},
    tree
  }
  const tag = isComponent ? (components[r] || Fragment) : r
  const props = meta.attributes
  const item = [tag, props, [], meta]
  components[ties][r] = components[ties][r] || []
  components[ties][r].push(item)
  tree.push(item)
  return meta
}

function parse (components, strings, values) {
  var ctx = TEXT
  const tree = []
  const fields = []
  const attrPos = {}
  for (var c = 0; c < strings.length; c++) {
    const s = ((ctx === VW ? strings[c].trimRight() : strings[c].trim())
      .replace(/<(\s+)?(\/)?>/g, '<$2Fragment>'))

    var field = ''
    var r = ''
    if (ctx === VW) {
      ctx = ATTR
      tokens(ATTR)
    }
    for (var i = 0; i < s.length; i++) {
      var ch = s[i]
      if (/\s/.test(ch) && /\s/.test(s[i - 1])) {
        continue
      }
      if (ctx === OPEN && r === '/' && /\s/.test(ch)) {
        if (!tree[tree.length - 1][3].isComponent) {
          continue
        }
      }
      switch (true) {
        case (ctx === TEXT && ch === '<'):
          const trim = field.trimRight()
          if (trim.slice(-1) === '>') field = trim
          if (r.length > 0 && !/^\s$|-/.test(r)) {
            const parent = getParent(tree)
            tokens(TEXT, r)
            if (parent !== null) {
              if (VOID_ELEMENTS.has(parent[0])) {
                throw SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.')
              }
              if ('dangerouslySetInnerHTML' in parent[1]) {
                throw SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.')
              }

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
          field += ch
          break
        case (ch === '>' && s[i - 1] === '/'):
          const node = tree[tree.length - 1][3]
          node.closed = true
          node.selfClosing = true
          const parent = getParent(tree)
          if (parent !== null) {
            if (VOID_ELEMENTS.has(parent[0])) {
              throw SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.')
            }
          }
          ctx = TEXT
          tokens(SC)
          const { isComponent, childrenAttribute } = node
          if (!isComponent && /\s/.test(s[i - 2])) {
            field = field.slice(0, -1).trimRight() + '/'
          }
          if (r.length && r !== '/') {
            field = valuelessAttr(tree, field, r.slice(0, r.length - 1), '/')
          }
          r = ''
          const textAreaWithDefaultValue = tree[tree.length - 1][0] === 'textarea' && ('defaultValue' in tree[tree.length - 1][1])
          if (isComponent === false && (childrenAttribute || textAreaWithDefaultValue)) {
            const [tag, props] = tree[tree.length - 1]
            field = field.slice(0, -1).trimRight() + ch
            node.openTagEnd = [c, field.length - 1]
            node.selfClosing = false
            const children = textAreaWithDefaultValue ? props.defaultValue : props.children
            if (children !== marker) field += escapeHtml(children)
            node.closeTagStart = [c, field.length]
            field += '</' + tag + '>'
            node.closeTagEnd = [c, field.length]
          } else {
            field += ch
            node.openTagEnd = [c, field.length - 1]
          }
          if (node.spread) {
            node.spread[Object.keys(node.spread).pop()].after = node.keys
            node.keys = []
          }
          break
        case (ch === '>' && ctx !== DQ && ctx !== SQ):
          if (ctx === KEY) {
            field = valuelessAttr(tree, field, r)
          } else if (ctx === OPEN) {
            tokens(OPEN, r)
            var top = tree.length
            if (r[0] !== '/') {
              const parent = getParent(tree)
              if (parent !== null && VOID_ELEMENTS.has(parent[0])) {
                throw SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.')
              }
              grow(r, field.length - r.length - 1, c, tree, components, fields, attrPos)
            } else {
              top = tree.length
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
                    if (AUTO_CLOSING_ELEMENTS.has(tag) === false) {
                      throw SyntaxError(`Expected corresponding ESX closing tag for <${tag.name || tag.toString()}>`)
                    }
                  }
                }
              }
            }
          }

          tokens(CLOSE, r)
          const el = tree[tree.length - 1]
          const props = el[1]
          const meta = el[3]
          if (meta.isComponent === false) {
            const tag = el[0]
            field = field.trimRight()
            const textAreaWithDefaultValue = tag === 'textarea' && 'defaultValue' in el[1]
            const selectWithDefaultValue = tag === 'select' && 'defaultValue' in el[1]
            if (meta.closed && (meta.childrenAttribute || textAreaWithDefaultValue)) {
              const hasNoChildren = field[field.length - r.length - 2] === '>'
              if (hasNoChildren) {
                const children = tag === 'textarea' ? props.defaultValue : props.children
                if (children !== marker) field = field.slice(0, field.length - r.length - 1) + escapeHtml(children) + field.slice(-r.length - 1)
              }
            }
            if (meta.closed === false && selectWithDefaultValue) {
              if (props.defaultValue !== marker) field += `\${this.selected.register("${props.defaultValue}")}`
            }
            if (r === '/option') {
              const parentSelect = getParent(tree)
              const parentSelectIndex = tree.findIndex((el) => el === parentSelect)
              const encodedPsi = String.fromCharCode(parentSelectIndex)
              const wasSelected = props.selected !== marker ? props.selected : '§' + encodedPsi
              const optionValue = typeof props.value === 'string' ? props.value
                : typeof el[2][0] === 'string' ? el[2][0] : ''
              if (parentSelectIndex > -1) {
                if (optionValue) {
                  const [ ix, pos ] = meta.openTagStart
                  const priorField = ix in fields
                  let str = priorField ? fields[ix] : field
                  str = str.replace(/ selected=""/g, '')
                  const pre = str.slice(0, pos + r.length)
                  const aft = str.slice(pos + r.length)
                  const inject = `\${this.selected(${JSON.stringify(optionValue)}, ${wasSelected})}`
                  str = `${pre}${inject}${aft}`
                  if (priorField) {
                    const min = pre.length - 1
                    const offset = inject.length
                    fields[ix] = str
                    if (ix in meta.attrPos) {
                      if (meta.attrPos[ix].s > min) {
                        meta.attrPos[ix].s += offset
                        meta.attrPos[ix].e += offset
                      }
                    }
                  } else field = str
                }
              }
            }
            if (r === '/select') {
              field += `\${this.selected.deregister()}`
            }
          }
          if (!meta.openTagEnd) {
            meta.openTagEnd = [c, field.length + 1]
            if (meta.spread) {
              meta.spread[Object.keys(meta.spread).pop()].after = meta.keys
              meta.keys = []
            }
          }
          r = ''
          ctx = TEXT
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
          field += ch
          break
        case (ctx === KEY):
          if (/\s/.test(ch)) {
            field = valuelessAttr(tree, field, r)
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
          tokens(BRK)
          if (/[\w-]/.test(ch)) {
            r += ch
            ctx = KEY
            field += ch
            break
          }
          ctx = ATTR
          tokens(ATTR)
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
          ctx = VAL
          i -= 1
          field += ch
          break
        case (ctx === VAL && /\s/.test(ch)):
          throw SyntaxError('ESX: attribute value should be either an expression or quoted text')
        case (ctx === DQ && ch === `"`): // eslint-disable-line no-fallthrough
        case (ctx === SQ && ch === `'`):
          tokens(BRK)
          const tag = tree[tree.length - 1][0]
          const { lastKey } = tree[tree.length - 1][3]
          const esc = r.length > 0 ? (attr.bool(lastKey, true) ? '' : escapeHtml(r)) : ''
          if (lastKey === 'style' && esc.length > 0) {
            throw TypeError('The `style` prop expects a mapping from style properties to values, not a string.')
          }
          tokens(VAL, r, BRK)
          const val = r
          addValue(tree, val)
          if (val !== esc) field = field.replace(RegExp(`${val}$`, 'm'), esc)
          ctx = ATTR
          tokens(ATTR)
          const tKey = attr.mapping(lastKey, tag)
          if (tKey !== lastKey) {
            field = field.slice(0, field.length - 1 - esc.length - 1 - lastKey.length) + tKey + field.slice(field.length - 1 - esc.length - 1)
            if (tKey.length === 0) field = field.slice(0, 0 - 2 - esc.length)
          }
          if (tree[tree.length - 1][3].isComponent === false && tKey === 'children') {
            field = field.replace(RegExp(`children="${esc}$`), '')
            break
          }
          if (attr.reserved(tKey)) {
            field = field.slice(0, field.length - esc.length - lastKey.length - 3)
          } else if (tKey.length > 0) {
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
    if (r.length > 0) {
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
    }
    fields[c] = field
    if (c in values === false) break
    if (ctx === ATTR) throw SyntaxError('Unexpected token. Attributes must have a name.')
    tokens(VAR)
    if (ctx === VW) {
      tokens(VAL, values[c], VW)
      const { lastKey } = tree[tree.length - 1][3]
      attrPos[c] = { s: field.length - 1 - lastKey.length, e: field.length - 1 }
      addInterpolatedAttr(tree, c, i)
    } else if (ctx === VAL || ctx === SQ || ctx === DQ) { // value interpolated between quote marks
      throw SyntaxError('Unexpected token. Attribute expressions must not be surrounded in quotes.')
    } else if (ctx === TEXT) { // dynamic children
      tokens(TEXT, values[c])
      if (VOID_ELEMENTS.has(tree[tree.length - 1][0])) {
        throw SyntaxError('ESX: Void elements must not have children or use dangerouslySetInnerHTML.')
      }
      if ('dangerouslySetInnerHTML' in tree[tree.length - 1][1]) {
        throw SyntaxError('ESX: Can only set one of children or dangerouslySetInnerHTML.')
      }
      addInterpolatedChild(tree, c)
    } else if (ctx === SPREAD) {
      ctx = ATTR
      r = ''
      const meta = tree[tree.length - 1][3]
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

  const root = tree[0]
  if (root && root[3].selfClosing === false && !('closeTagStart' in root[3])) {
    const [ tag ] = root
    if (AUTO_CLOSING_ELEMENTS.has(tag) === false) {
      throw SyntaxError(`Expected corresponding ESX closing tag for <${tag.name || tag.toString()}>`)
    }
  }

  debug('tree parsed from string')
  return { tree, fields: fields.map((f) => f.split('')), attrPos, fn: null }
}

module.exports = parse
