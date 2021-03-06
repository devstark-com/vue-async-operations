import asyncOperations from './async-operations.js'
import mixin from './mix.js'

const defaultOptions = {
  mixinPrefix: 'vueAsyncOps_',
  dataPropName: 'async',
  computedPropName: '$async',
  componentOptionName: 'asyncOperations',
}

export function install (Vue, options = {}) {
  const mergedOptions = {...defaultOptions, ...options}
  asyncOperations.init(mergedOptions)
  Vue.mixin(mixin)
}

/* -- Plugin definition & Auto-install -- */
/* You shouldn't have to modify the code below */

// Plugin
const plugin = {
  /* eslint-disable no-undef */
  version: VERSION,
  install,
}

export default plugin

// Auto-install
let GlobalVue = null
if (typeof window !== 'undefined') {
  GlobalVue = window.Vue
} else if (typeof global !== 'undefined') {
  GlobalVue = global.Vue
}
if (GlobalVue) {
  GlobalVue.use(plugin)
}
