const resolvePath = (path, target) => {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : null
  }, target)
}

export default {
  cfg: null,

  init (options) {
    this.cfg = {
      ...options,
      dataPropName: options.mixinPrefix + options.dataPropName,
    }
  },

  onCreated (vm) {
    if (!vm.$options[this.cfg.componentOptionName]) return
    this.buildTree(vm, vm.$options[this.cfg.componentOptionName], this.cfg.dataPropName)
  },

  buildTree (vm, nodes, target) {
    const entries = Object.entries(nodes)
    entries.forEach(([key, value]) => {
      this.addNode(vm, target, key, value)
    })
  },

  addNode (vm, target, key, value) {
    if (['string', 'function'].includes(typeof value)) this.addOperation(vm, target, key)
    if (typeof value === 'object') this.addBatch(vm, target, key, value)
  },

  addBatch (vm, path, key, obj) {
    const batch = this.createNode(vm, 'batch', path, key)
    let target = resolvePath(path, vm.$data)
    vm.$set(target, key, batch)
    const childrenPath = path + '.' + key
    this.buildTree(vm, obj, childrenPath)
  },

  addOperation (vm, path, key) {
    const single = this.createNode(vm, 'single', path, key)
    let target = resolvePath(path, vm.$data)
    vm.$set(target, key, single)
  },

  /**
   * Create data node for an operation or a batch of operations
   * @param {String} type
   * @param {String} path
   * @param {String} key
   */
  createNode (vm, type, path, key) {
    return {
      $type: type,
      $pending: null,
      $resolved: null,
      $rejected: null,
      $err: null,
      $perform: (...args) => {
        const relPath = path.split('.').filter(el => el !== this.cfg.dataPropName).join('.')
        const nodePath = (relPath === '' ? '' : relPath + '.') + key
        const node = resolvePath(nodePath, vm.$data[this.cfg.dataPropName])
        if (node.$pending) return Promise.resolve({pending: true})

        switch (type) {
          case 'batch':
            return this.execBatch(vm, nodePath, args)
          case 'single':
            return this.execOperation(vm, nodePath, args)
        }
      },
    }
  },

  /**
   * Execute a batch of operations
   * @todo pass args to children
   * @param {String} batchPath
   * @param {Array} args
   */
  execBatch (vm, batchPath, args) {
    let state = resolvePath(batchPath, vm.$data[this.cfg.dataPropName])
    const batch = resolvePath(batchPath, vm.$options[this.cfg.componentOptionName])

    this.resetStates(vm, state)
    return new Promise((resolve, reject) => {
      const arr = Object.entries(batch).map(([key, value]) => {
        const childPath = batchPath + '.' + key
        const child = resolvePath(childPath, vm.$data[this.cfg.dataPropName])
        const operationArgs = [...args][0][key]
        return child.$perform(operationArgs)
      })
      Promise.all(arr).then(
        result => this.handleResolve(vm, state, result, resolve),
        err => this.handleReject(vm, state, err, reject)
      )
    })
  },

  /**
   * Execute single async operation
   * @param {String} funcPath
   * @param {Array} args
   */
  execOperation (vm, funcPath, args) {
    let state = resolvePath(funcPath, vm.$data[this.cfg.dataPropName])
    const func = resolvePath(funcPath, vm.$options[this.cfg.componentOptionName])

    this.resetStates(vm, state)
    return new Promise((resolve, reject) => {
      let result
      if (typeof func === 'string') result = vm[func](...args)
      if (typeof func === 'function') {
        result = func.call(vm, ...args)
      }

      if (Array.isArray(result)) {
        return Promise.all(result).then(
          res => this.handleResolve(vm, state, res, resolve),
          err => this.handleReject(vm, state, err, reject)
        )
      }

      if (!result.then) return this.handleResolve(vm, state, result, resolve)

      result.then(
        res => this.handleResolve(vm, state, res, resolve),
        err => this.handleReject(vm, state, err, reject)
      )
    })
  },

  resetStates (vm, state) {
    vm.$set(state, '$err', null)
    vm.$set(state, '$rejected', false)
    vm.$set(state, '$resolved', false)
    vm.$set(state, '$pending', true)
  },

  handleResolve (vm, state, result, resolve) {
    resolve(result)
    vm.$set(state, '$pending', false)
    vm.$set(state, '$resolved', true)
  },

  handleReject (vm, state, err, reject) {
    reject(err)
    vm.$set(state, '$pending', false)
    vm.$set(state, '$rejected', true)
    vm.$set(state, '$err', err)
  },
}
