'use strict'

function mapping (key, tag) {
  switch (key) {
    // prop->attr
    case 'className': return 'class'
    case 'htmlFor': return 'for'
    case 'defaultChecked': return 'checked'
    case 'defaultValue': return tag === 'input' ? 'value' : (tag === 'textarea' ? 'children' : '')
    // lowercase
    case 'contentEditable': return 'contenteditable'
    case 'crossOrigin': return 'crossorigin'
    case 'spellCheck': return 'spellcheck'
    case 'allowFullScreen': return 'allowfullscreen'
    case 'autoPlay': return 'autoplay'
    case 'autoFocus': return 'autofocus'
    case 'formNoValidate': return 'formnovalidate'
    case 'noModule': return 'nomodule'
    case 'noValidate': return 'novalidate'
    case 'playsInline': return 'playsinline'
    case 'readOnly': return 'readonly'
    case 'rowSpan': return 'rowspan'
    case 'itemScope': return 'itemscope'
    case 'tabIndex': return 'tabindex'
    // hyphenated
    case 'httpEquiv': return 'http-equiv'
    case 'acceptCharset': return 'accept-charset'
    case 'accentHeight': return 'accent-height'
    case 'alignmentBaseline': return 'alignment-baseline'
    case 'arabicForm': return 'arabic-form'
    case 'baselineShift': return 'baseline-shift'
    case 'capHeight': return 'cap-height'
    case 'clipPath': return 'clip-path'
    case 'clipRule': return 'clip-rule'
    case 'colorInterpolation': return 'color-interpolation'
    case 'colorInterpolationFilters': return 'color-interpolation-filters'
    case 'colorProfile': return 'color-profile'
    case 'colorRendering': return 'color-rendering'
    case 'dominantBaseline': return 'dominant-baseline'
    case 'enableBackground': return 'enable-background'
    case 'fillOpacity': return 'fill-opacity'
    case 'fillRule': return 'fill-rule'
    case 'floodColor': return 'flood-color'
    case 'floodOpacity': return 'flood-opacity'
    case 'fontFamily': return 'font-family'
    case 'fontSize': return 'font-size'
    case 'fontSizeAdjust': return 'font-size-adjust'
    case 'fontStretch': return 'font-stretch'
    case 'fontStyle': return 'font-style'
    case 'fontVariant': return 'font-variant'
    case 'fontWeight': return 'font-weight'
    case 'glyphName': return 'glyph-name'
    case 'glyphOrientationHorizontal': return 'glyph-orientation-horizontal'
    case 'glyphOrientationVertical': return 'glyph-orientation-vertical'
    case 'horizAdvX': return 'horiz-adv-x'
    case 'horizOriginX': return 'horiz-origin-x'
    case 'imageRendering': return 'image-rendering'
    case 'letterSpacing': return 'letter-spacing'
    case 'lightingColor': return 'lighting-color'
    case 'markerEnd': return 'marker-end'
    case 'markerMid': return 'marker-mid'
    case 'markerStart': return 'marker-start'
    case 'overlinePosition': return 'overline-position'
    case 'overlineThickness': return 'overline-thickness'
    case 'paintOrder': return 'paint-order'
    case 'panose-1': return 'panose-1'
    case 'pointerEvents': return 'pointer-events'
    case 'renderingIntent': return 'rendering-intent'
    case 'shapeRendering': return 'shape-rendering'
    case 'stopColor': return 'stop-color'
    case 'stopOpacity': return 'stop-opacity'
    case 'strikethroughPosition': return 'strikethrough-position'
    case 'strikethroughThickness': return 'strikethrough-thickness'
    case 'strokeDasharray': return 'stroke-dasharray'
    case 'strokeDashoffset': return 'stroke-dashoffset'
    case 'strokeLinecap': return 'stroke-linecap'
    case 'strokeLinejoin': return 'stroke-linejoin'
    case 'strokeMiterlimit': return 'stroke-miterlimit'
    case 'strokeOpacity': return 'stroke-opacity'
    case 'strokeWidth': return 'stroke-width'
    case 'textAnchor': return 'text-anchor'
    case 'textDecoration': return 'text-decoration'
    case 'textRendering': return 'text-rendering'
    case 'underlinePosition': return 'underline-position'
    case 'underlineThickness': return 'underline-thickness'
    case 'unicodeBidi': return 'unicode-bidi'
    case 'unicodeRange': return 'unicode-range'
    case 'unitsPerEm': return 'units-per-em'
    case 'vAlphabetic': return 'v-alphabetic'
    case 'vHanging': return 'v-hanging'
    case 'vIdeographic': return 'v-ideographic'
    case 'vMathematical': return 'v-mathematical'
    case 'vectorEffect': return 'vector-effect'
    case 'vertAdvY': return 'vert-adv-y'
    case 'vertOriginX': return 'vert-origin-x'
    case 'vertOriginY': return 'vert-origin-y'
    case 'wordSpacing': return 'word-spacing'
    case 'writingMode': return 'writing-mode'
    case 'xHeight': return 'x-height'
    // xml namespace
    case 'xmlnsXlink': return 'xmlns:xlink'
    case 'xmlBase': return 'xml:base'
    case 'xmlLang': return 'xml:lang'
    case 'xmlSpace': return 'xml:space'
    case 'xlinkActuate': return 'xlink:actuate'
    case 'xlinkArcrole': return 'xlink:arcrole'
    case 'xlinkHref': return 'xlink:href'
    case 'xlinkRole': return 'xlink:role'
    case 'xlinkShow': return 'xlink:show'
    case 'xlinkTitle': return 'xlink:title'
    case 'xlinkType': return 'xlink:type'
    default: return key
  }
}

function reserved (key) {
  /* eslint-disable no-fallthrough */
  switch (key) {
    case 'key':
    case 'ref':
    case 'innerHTML':
    case 'suppressContentEditableWarning':
    case 'suppressHydrationWarning': return true
    default: return false
  }
  /* eslint-enable no-fallthrough */
}

function serializeBool (key, val) {
  return enumeratedBool(key) ? `"${val.toString()}"` : (val ? '""' : '')
}

function enumeratedBool (key) {
  /* eslint-disable no-fallthrough */
  switch (key) {
    // enumerated HTML attributes (must have boolean strings)
    case 'contentEditable':
    case 'draggable':
    case 'spellCheck':
    case 'value':
    // enumerated SVG attributes (must have boolean strings)
    case 'autoReverse':
    case 'externalResourcesRequired':
    case 'focusable':
    case 'preserveAlpha': return true
    default: return false
  }
  /* eslint-enable no-fallthrough */
}

function bool (key, strict = false) {
  /* eslint-disable no-fallthrough */
  switch (key) {
    // props
    case 'defaultChecked':
    // true HTML boolean attributes
    case 'allowFullScreen':
    case 'async':
    case 'autoPlay':
    case 'autoFocus':
    case 'controls':
    case 'default':
    case 'defer':
    case 'disabled':
    case 'formNoValidate':
    case 'hidden':
    case 'loop':
    case 'noModule':
    case 'noValidate':
    case 'open':
    case 'playsInline':
    case 'readOnly':
    case 'required':
    case 'reversed':
    case 'scoped':
    case 'seamless':
    case 'itemScope':
    // DOM properties
    case 'checked':
    case 'multiple':
    case 'muted':
    case 'selected': return true
    // overloaded booleans
    case 'capture':
    case 'download': return !strict
    default: return strict ? false : enumeratedBool(key)
  }
  /* eslint-enable no-fallthrough */
}

module.exports = {
  mapping,
  reserved,
  bool,
  enumeratedBool,
  serializeBool
}
