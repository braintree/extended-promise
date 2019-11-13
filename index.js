'use strict';

var Promise = global.Promise || require('promise-polyfill');

function resetState(promise) {
  promise.isFulfilled = false;
  promise.isResolved = false;
  promise.isRejected = false;
}

function setResolved(promise) {
  promise.isFulfilled = true;
  promise.isResolved = true;
  promise.isRejected = false;
}

function setRejected(promise) {
  promise.isFulfilled = true;
  promise.isResolved = false;
  promise.isRejected = true;
}

function defaultOnResolve(result) {
  return Promise.resolve(result);
}

function defaultOnReject(err) {
  return Promise.reject(err);
}

module.exports = function makePromisePlus(options) {
  var resolveFunction, rejectFunction, onResolve, onReject;
  var promise = new Promise(function (resolve, reject) {
    resolveFunction = resolve;
    rejectFunction = reject;
  });

  options = options || {};
  onResolve = options.onResolve || defaultOnResolve;
  onReject = options.onReject || defaultOnReject;

  resetState(promise);

  promise.resolve = function (arg) {
    if (promise.isFulfilled) {
      return promise;
    }
    setResolved(promise);

    Promise.resolve().then(function () {
      return onResolve(arg);
    }).then(resolveFunction).catch(function (err) {
      resetState(promise);

      promise.reject(err);
    });

    return promise;
  };

  promise.reject = function (arg) {
    if (promise.isFulfilled) {
      return promise;
    }
    setRejected(promise);

    Promise.resolve().then(function () {
      return onReject(arg);
    }).then(function (result) {
      setResolved(promise);

      resolveFunction(result);
    }).catch(rejectFunction);

    return promise;
  };

  return promise;
};
