# vue-async-operations

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
    }
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

Also, you can define as much operation as you need:

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

### Getting operation result

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

### Async operations composing

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
