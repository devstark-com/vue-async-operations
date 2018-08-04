# vue-async-operations

[![npm](https://img.shields.io/npm/v/vue-async-operations.svg) ![npm](https://img.shields.io/npm/dm/vue-async-operations.svg)](https://www.npmjs.com/package/vue-async-operations)
[![vue2](https://img.shields.io/badge/vue-2.x-brightgreen.svg)](https://vuejs.org/)

> Managing async operations statuses in your Vue components

### Install

```bash
npm install vue-async-operations
```

### Basic usage
```js
import Vue from 'vue'
import VueAsyncOperations from 'vue-async-operations'

Vue.use(VueAsyncOperations)
```

Then, in your component options, provide an `asyncOperations` object where each key is a name of an async operation and the value is a function that returns `Promise`:

```js
//...
  asyncOperations: {
    someAsyncStuff () {
      // return Promise
      // ☝️vm instance is binded to function as `this` context
    }
  }
//...
```

Or you can link operation to some method in component:

```js
//...
  asyncOperations: {
    someAsyncStuff: 'someMethodName'
  }
//...
```

Then, trigger an operation in your component e.g. in `created` hook:

```js
//...
  created () {
    this.$async.someAsyncStuff.$perform()
  }
//...
```

And use operation performing state in the template:

```html

<div v-if="$async.someAsyncStuff.$pending">
  <!-- render a loader while async operation is pending -->
</div>

<!-- OR -->

<div v-if="$async.someAsyncStuff.$resolved">
  <!-- some stuff that shouldn't be rendered until async operation finished -->
</div>

<!-- OR -->

<div v-if="$async.someAsyncStuff.$rejected">
  <!-- some stuff that should be displayed if async operation failed -->
</div>

```

### Several operations in one

The function that defines an operation may return an array of promises, e.g.:

```js
//...
  asyncOperations: {
    someCompositAsyncStuff () {
      return [
        this.someVuexAction(),
        this.someAnotherVuexAction()
      ]
    }
  }
//...
```

This way, the operation state handler, that placed under the hood of this plugin, will operates via `Promise.all([])` so reactive states of operation will be changed only when last promise will be resolved or rejected.

Also, you can define as much separate operations as you need:

```js
//...
  asyncOperations: {
    asyncStuff1 () { //... },
    asyncStuff2 () { //... },
    asyncStuff3 () { //... },
    ...
  }
//...
```

### Passing args
You can pass arguments to `$perform()` method and receive them in operation function:
```js
//...
asyncOperations: {
  // some operation defined as function
  stuff1 (a, b, c) {
    console.log(a, b, c) // 1, 2, 3
  },
  // another operation defined as link to some method of a component
  stuff2: 'loadStuff2'
},
methods: {
  loadStuff2 (d, e, f) {
    console.log(d, e, f) // 4, 5, 6
  }
},
created () {
  this.$async.stuff1.$perform(1, 2, 3)
  this.$async.stuff2.$perform(4, 5, 6)
}
//...
```

### Handle operation result 

The `.$perform()` method of an operation returns `Promise` and passes the result of the original promise into `resolve` and `reject` methods:

```js
//...
created () {
  this.$async.someAsyncStuff.$perform().then(
    result => { // handle a result },
    err => { // handle an error },
    finally => { // handle the finish of an operation }
  )
}
//...
```

If your operation returns an array of promises, the result will contain an array of results in the order they were defined in the original array

Also, you can handle the result directly in operation function:

```js
//...
asyncOperations: {
  someOperation: 'someMethod'
},
methods: {
  someMethod () {
    this.$api.someApiCall().then(
      result => { // handle the result },
      error => { // handle an error }
    )
  }
},
created () {
  this.$async.someOperation.$perform()
}
//...
```

### Operations composing

If you have several async operations that are leading to some common result and you need to track their reactive statuses separately but also you wanna have an aggregated reactive status for whole batch, you can compose your operations the following way:

```js
//...
  asyncOperations: {
    allAsyncStuff: {
      asyncStuff1 () {},
      asyncStuff2 () {}
    }
  }
//...
```

Then, use separate and aggregated reactive statuses

```html

<div v-if="$async.allAsyncStuff.$pending"> Some stuff is still loading... </div>
<div v-else-if="$async.allAsyncStuff.$resolved"> All stuff loaded </div>

<div v-if="$async.allAsyncStuff.asyncStuff1.$resolved"> Stuff 1 is loaded  </div>

<div v-if="$async.allAsyncStuff.asyncStuff2.$resolved"> Stuff 2 is loaded </div>

```

### Performing composed operations with passing args

```js
//...
  asyncOperations: {
    allAsyncStuff: {
      asyncStuff1 (a, b, c) {
        console.log(a, b, c) // 1, 2, 3
      },
      asyncStuff2 ({a, b, c}) {
        console.log(a, b, c) // 4, 5, 6
      }
    }
  },
  created () {
    this.$async.allAsyncStuff.$perform({
      asyncStuff1: [1, 2, 3], // pass args to `asyncStuff1`
      asyncStuff2: {a: 4, b: 5, c: 6} // pass args to `asyncStuff2`
    })
  }
//...
```

### Operation states

- `$pending`
- `$resolved`
- `$rejected`
- `$err`

### Operation methods

- `$perform`

### Plugin options

You can customize some stuff:

```js
Vue.use(VueAsyncOperations, {
  mixinPrefix,
  dataPropName,
  computedPropName,
  componentOptionName
})
```

- `mixinPrefix` - plugin adds to your application a global mixin which injects property with operations states into the components `data` and according to [official vuejs style guide](https://vuejs.org/v2/style-guide/#Private-property-names-essential) this property is prefixed, but you can change this prefix if it's necessary for some reason

- `dataPropName` - actually the name of the prop mentioned above

- `computedPropName` - the name of the computed prop you use for getting acces to operations for getting its states and calling `$perform()` method

- `componentOptionName` - the name of the component option where you define operations

Plugin defaults are:
```
{
  mixinPrefix: 'vueAsyncOps_',
  dataPropName: 'async',
  computedPropName: '$async',
  componentOptionName: 'asyncOperations'
}
```
