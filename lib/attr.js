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

function reserved (key) {
  switch (key) {
    case 'key':
    case 'ref':
    case 'innerHTML': return true
  }
  return false
}

module.exports = {
  mapping,
  reserved 
}