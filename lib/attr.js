'use strict'


function mapping (key) {
  switch (key) {
    case 'className': return 'class'
    case 'htmlFor': return 'for'
    case 'defaultChecked': return 'checked'
    case 'httpEquiv': return 'http-equiv'
    case 'acceptCharset': return 'accept-charset'
    default: return key
  }
}
// 'suppressContentEditableWarning', 'suppressHydrationWarning', 'style'
function reserved (key) {
  switch (key) {
    case 'key':
    case 'ref':
    case 'innerHTML':
    case 'suppressContentEditableWarning':
    case 'suppressHydrationWarning': return true
  }
  return false
}

module.exports = {
  mapping,
  reserved 
}