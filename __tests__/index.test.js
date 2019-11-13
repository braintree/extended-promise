'use strict';

const ExtendedPromise = require('../');

function rejectIfResolves() {
  return Promise.reject(new Error('should not have resolved'));
}

describe('ExtendedPromise', function () {
  it('defaults status properties to false', function () {
    var promise = new ExtendedPromise();

    expect(promise.isFulfilled).toBe(false);
    expect(promise.isResolved).toBe(false);
    expect(promise.isRejected).toBe(false);

    return promise.resolve();
  });

  it('updates status properties when it resolves', function () {
    var promise = new ExtendedPromise();

    promise.resolve();

    expect(promise.isFulfilled).toBe(true);
    expect(promise.isResolved).toBe(true);
    expect(promise.isRejected).toBe(false);

    return promise;
  });

  it('updates status properties when it rejects', function () {
    var promise = new ExtendedPromise();

    promise.reject();

    return promise.catch(() => {
      expect(promise.isFulfilled).toBe(true);
      expect(promise.isResolved).toBe(false);
      expect(promise.isRejected).toBe(true);
    });
  });

  it('can resolve with resolve function', function () {
    var promise = new ExtendedPromise();
    var result = {foo: 'bar'};

    promise.resolve(result);

    return promise.then(function (payload) {
      expect(payload).toBe(result);
    });
  });

  it('returns itself when calling resolve', function () {
    var promise = new ExtendedPromise();
    var result = {foo: 'bar'};

    expect(promise.resolve(result)).toBe(promise);

    return promise;
  });

  it('can provide an onResolve function to run before it resolves', function () {
    var spy = jest.fn(function (result) {
      result.baz = 'foo';

      return result;
    });
    var promise = new ExtendedPromise({
      onResolve: spy
    });
    var result = {foo: 'bar'};

    promise.resolve(result);

    return promise.then(function (payload) {
      expect(payload.foo).toBe('bar');
      expect(payload.baz).toBe('foo');
    });
  });

  it('can provide an async onResolve function to run before it resolves', function () {
    var spy = jest.fn(function (result) {
      result.baz = 'foo';

      return new Promise(function (resolve) {
        setTimeout(function () {
          result.foo = 'baz';

          resolve(result);
        }, 10);
      });
    });
    var promise = new ExtendedPromise({
      onResolve: spy
    });
    var result = {foo: 'bar'};

    promise.resolve(result);

    return promise.then(function (payload) {
      expect(payload.foo).toBe('baz');
      expect(payload.baz).toBe('foo');
    });
  });

  it('rejects if onResolve function rejects', function () {
    var spy = jest.fn().mockRejectedValue(new Error('error'));
    var promise = new ExtendedPromise({
      onResolve: spy
    });
    var result = {foo: 'bar'};

    promise.resolve(result);

    return promise.then(rejectIfResolves).catch(function (err) {
      expect(err.message).toBe('error');
    });
  });

  it('uses onReject function if onResolve function rejects', function () {
    var err = new Error('resolved error');
    var resolveSpy = jest.fn().mockRejectedValue(err);
    var rejectSpy = jest.fn().mockResolvedValue({didError: true});
    var promise = new ExtendedPromise({
      onResolve: resolveSpy,
      onReject: rejectSpy
    });

    promise.resolve({foo: 'bar'});

    return promise.then(function (payload) {
      expect(payload.didError).toBe(true);
      expect(promise.isRejected).toBe(false);
      expect(promise.isResolved).toBe(true);
    });
  });

  it('can reject with reject function', function () {
    var promise = new ExtendedPromise();
    var error = new Error('foo');

    promise.reject(error);

    return promise.then(rejectIfResolves).catch(function (err) {
      expect(err).toBe(error);
    });
  });

  it('returns itself when calling reject', function () {
    var promise = new ExtendedPromise();

    expect(promise.reject(new Error('some error'))).toBe(promise);

    return promise.catch(() => { /* noop */ });
  });


  it('can provide an onReject function to run before it rejects', function () {
    var spy = jest.fn().mockRejectedValue(new Error('onReject error'));
    var promise = new ExtendedPromise({
      onReject: spy
    });
    var result = {foo: 'bar'};

    promise.reject(result);

    return promise.then(rejectIfResolves).catch(function (err) {
      expect(err.message).toBe('onReject error');
    });
  });

  it('can provide an async onReject function to run before it rejects', function () {
    var spy = jest.fn(function () {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          reject(new Error('onReject error'));
        }, 10);
      });
    });
    var promise = new ExtendedPromise({
      onReject: spy
    });

    promise.reject({foo: 'bar'});

    return promise.then(rejectIfResolves).catch(function (err) {
      expect(err.message).toBe('onReject error');
    });
  });

  it('resolves if onReject function resolves', function () {
    var spy = jest.fn().mockResolvedValue({ok: 'ok'});
    var promise = new ExtendedPromise({
      onReject: spy
    });

    promise.reject({foo: 'bar'});

    return promise.then(function (result) {
      expect(result.ok).toBe('ok');
      expect(promise.isRejected).toBe(false);
      expect(promise.isResolved).toBe(true);
    });
  });

  it('will not update status properties when it has already resolved', function () {
    var promise = new ExtendedPromise();

    promise.resolve();

    expect(promise.isFulfilled).toBe(true);
    expect(promise.isResolved).toBe(true);
    expect(promise.isRejected).toBe(false);

    promise.reject();

    expect(promise.isFulfilled).toBe(true);
    expect(promise.isResolved).toBe(true);
    expect(promise.isRejected).toBe(false);
  });

  it('will not update the resolved value after it has already been resolved', function () {
    var promise = new ExtendedPromise();

    promise.resolve('1');

    return promise.then(function (result) {
      expect(result).toBe('1');

      promise.resolve('2');

      return promise;
    }).then(function (result) {
      expect(result).toBe('1');

      promise.reject(new Error('foo'));

      return promise;
    }).then(function (result) {
      expect(result).toBe('1');
    });
  });

  it('will not update status properties when it has already rejected', function () {
    var promise = new ExtendedPromise();

    promise.reject();

    expect(promise.isFulfilled).toBe(true);
    expect(promise.isResolved).toBe(false);
    expect(promise.isRejected).toBe(true);

    promise.resolve();

    expect(promise.isFulfilled).toBe(true);
    expect(promise.isResolved).toBe(false);
    expect(promise.isRejected).toBe(true);

    return promise.catch(() => { /* noop */ });
  });

  it('will not update the rejected value after it has already been rejected', function () {
    var promise = new ExtendedPromise();
    var error = new Error('1');

    promise.reject(error);

    return promise.then(rejectIfResolves).catch(function (result) {
      expect(result).toBe(error);

      promise.reject(new Error('2'));

      return promise;
    }).then(rejectIfResolves).catch(function (result) {
      expect(result).toBe(error);

      promise.resolve('3');

      return promise;
    }).then(rejectIfResolves).catch(function (result) {
      expect(result).toBe(error);
    });
  });
});
