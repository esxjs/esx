'use strict'
const ns = Symbol('esx')
const marker = Symbol('esx.marker')
const skip = Symbol('esx.skip')
const provider = Symbol('esx.provider')
const esxValues = Symbol('esx.values')
const parent = Symbol('esx.parent')
const owner = Symbol('esx.owner')
const template = Symbol('esx.template')
module.exports = {
  ns, marker, skip, provider, esxValues, parent, owner, template
}
