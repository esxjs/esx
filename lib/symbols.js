'use strict'
const isEsx = Symbol('esx')
const marker = Symbol('esx.valuePlaceholder')
const skip = Symbol('esx.skip')
const provider = Symbol('esx.provider')
const esxValues = Symbol('esx.value')
const parent = Symbol('esx.parent')
module.exports = {
  isEsx, marker, skip, provider, esxValues, parent
}