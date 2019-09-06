'use strict'
const ns = Symbol('esx')
const marker = Symbol('esx.marker')
const skip = Symbol('esx.skip')
const provider = Symbol('esx.provider')
const esxValues = Symbol('esx.values')
const parent = Symbol('esx.parent')
const owner = Symbol('esx.owner')
const template = Symbol('esx.template')
const ties = Symbol('esx.ties')
const separator = Symbol('esx.separator')
const runners = Symbol('esx.plugin-runners')
module.exports = {
  ns, marker, skip, provider, esxValues, parent, owner, template, ties, separator, runners
}
