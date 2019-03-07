const debug = require('debug')('esx')
const { Fragment } = require('react')
const escapeHtml = require('./escape')
const { REACT_PROVIDER_TYPE } = require('./constants')
const { marker, provider } = require('./symbols')
const tokens = debug.extend('tokens')

if (process.env.TRACE) {
  tokens.log = (...args) => {
    console.log(...args, Error('trace').stack)
  }
}
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
  if (node === null) return
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
}

function addProp (tree, name) {
  tokens(KEY, name)
  const node = tree[tree.length - 1]
  const props = node[1]
  const meta = node[3]
  if (name === 'children') {
    meta.childrenAttribute = true
    Object.defineProperty(props, name, { value: true, writable: true })
  } else props[name] = true
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
  const props = (isComponent && typeof tag.defaultProps === 'object')
    ? Object.assign({}, tag.defaultProps)
    : {}
  const item = [tag, props, [], meta]
  if (tag.$$typeof === REACT_PROVIDER_TYPE) {
    meta.isProvider = true
    tag._context[provider] = item
  }
  tree.push(item)
  return meta
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
          if (r.length > 0 && !/^\s$|-/.test(r)) {
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
          const node = tree[tree.length - 1][3]
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
                    throw SyntaxError(`Expected corresponding ESX closing tag for <${tag.name || tag.toString()}>`)
                  }
                }
              }
            }
          } else if (ctx === VAL && r.length > 0) {
            tokens(VAL, r)
          }
          tokens(CLOSE, r)
          if (r[0] !== '/') {
            tree[tree.length - 1][3].openTagEnd = [c, i + 1]
            if (tree[tree.length - 1][3].spread) {
              tree[tree.length - 1][3].spread[Object.keys(tree[tree.length - 1][3].spread).pop()].after = tree[tree.length - 1][3].keys
              tree[tree.length - 1][3].keys = []
            }
          }
          r = ''
          ctx = TEXT
          if (tree[tree.length - 1][3].isComponent === false) {
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
        case (ctx === DQ && ch === `"`): // eslint-disable-line no-fallthrough
        case (ctx === SQ && ch === `'`):
        case (ctx === VAL && /\s/.test(ch)):
          tokens(BRK)
          const { lastKey } = tree[tree.length - 1][3]
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
      const pMeta = tree[tree.length - 1][3]
      attrPos[c] = { s: field.length - 1 - pMeta.lastKey.length, e: field.length - 1 }
      addInterpolatedAttr(tree, c, i)
    } else if (ctx === VAL || ctx === SQ || ctx === DQ) { // value interpolated between quote marks
      throw SyntaxError('Unexpected token. Attribute expressions must not be surround in quotes.')
    } else if (ctx === ATTR) {
      addProp(tree, values[c])
    } else if (ctx === TEXT) { // dynamic children
      tokens(TEXT, values[c])
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

  debug('tree parsed from string')

  return { tree, fields: fields.map((f) => f.split('')), attrPos, fn: null }
}

module.exports = parse
