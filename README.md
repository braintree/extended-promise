extended-promise
----------------

Promises are great! But, could they be even better?

## Install

```sh
npm install @braintree/extended-promise
```

## Why?

This library was developed to make working with APIs that are not easilly wrapped in promises, such as kicking off a promise that resolves within a callback for an event listener.

Before we wrote this lib, we were saving references to the underlying promise, and references to the `resolve`/`reject` functions in order to resolve and reject it later:

```js
// without this lib
class MyCustomObject () {
  constructor () {
    this._promise = new Promise((resolve, reject) => {
      this._resolveFunction = resolve;
      this._rejectFunction = reject;
    });
  }

  asyncProcess() {
    // do something very async that's not easilly wrapped in a promise
    if (success) {
      this._resolveFunction(data);
    } else {
      this._rejectFunction(new Error('fail'));
    }
  }

  methodRelyingOnResultOfPromise() {
    return this._promise;
  }
}
```

Instead, we can save a reference to just the promise, and then resolve or reject it directly:

```js
// with this lib
class MyCustomObject () {
  constructor () {
    this._promise = new ExtendedPromise();
  }

  asyncProcess() {
    // do something very async that's not easilly wrapped in a promise
    if (success) {
      this._promise.resolve(data);
    } else {
      this._promise.reject(new Error('fail'));
    }
  }

  methodRelyingOnResultOfPromise() {
    return this._promise;
  }
}
```

## Add a hook to run when a promise resolves/rejects

The object also supplies an `onResolve` and `onReject` hook that can be passed in on instantiation:

```js
var promise = new ExtendedPromise({
  onResolve(data) {
    return someFunctionToTransformData(data);
  },
  onReject(error) {
    // decide if you want to catch the error
    return someFallbackDataInstead;
    // or if you want to continue through with the rejection
    return Promise.reject(error);
  }
});
```

## Development

Run tests:

```sh
npm test
```
