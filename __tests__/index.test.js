'use strict';

const makePromisePlus = require('../');

function rejectIfResolves() {
  return Promise.reject(new Error('should not have resolved'));
}

describe('makePromisePlus', function () {
  it('defaults status properties to false', function () {
    var promisePlus = makePromisePlus();

    expect(promisePlus.isFulfilled).toBe(false);
    expect(promisePlus.isResolved).toBe(false);
    expect(promisePlus.isRejected).toBe(false);

    return promisePlus.resolve();
  });

  it('updates status properties when it resolves', function () {
    var promisePlus = makePromisePlus();

    promisePlus.resolve();

    expect(promisePlus.isFulfilled).toBe(true);
    expect(promisePlus.isResolved).toBe(true);
    expect(promisePlus.isRejected).toBe(false);

    return promisePlus;
  });

  it('updates status properties when it rejects', function () {
    var promisePlus = makePromisePlus();

    promisePlus.reject();

    return promisePlus.catch(() => {
      expect(promisePlus.isFulfilled).toBe(true);
      expect(promisePlus.isResolved).toBe(false);
      expect(promisePlus.isRejected).toBe(true);
    });
  });

  it('can resolve with resolve function', function () {
    var promisePlus = makePromisePlus();
    var result = {foo: 'bar'};

    promisePlus.resolve(result);

    return promisePlus.then(function (payload) {
      expect(payload).toBe(result);
    });
  });

  it('can provide an onResolve function to run before it resolves', function () {
    var spy = jest.fn(function (result) {
      result.baz = 'foo';

      return result;
    });
    var promisePlus = makePromisePlus({
      onResolve: spy
    });
    var result = {foo: 'bar'};

    promisePlus.resolve(result);

    return promisePlus.then(function (payload) {
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
    var promisePlus = makePromisePlus({
      onResolve: spy
    });
    var result = {foo: 'bar'};

    promisePlus.resolve(result);

    return promisePlus.then(function (payload) {
      expect(payload.foo).toBe('baz');
      expect(payload.baz).toBe('foo');
    });
  });

  it('rejects if onResolve function rejects', function () {
    var spy = jest.fn().mockRejectedValue(new Error('error'));
    var promisePlus = makePromisePlus({
      onResolve: spy
    });
    var result = {foo: 'bar'};

    promisePlus.resolve(result);

    return promisePlus.then(rejectIfResolves).catch(function (err) {
      expect(err.message).toBe('error');
    });
  });

  it('uses onReject function if onResolve function rejects', function () {
    var err = new Error('resolved error');
    var resolveSpy = jest.fn().mockRejectedValue(err);
    var rejectSpy = jest.fn().mockResolvedValue({didError: true});
    var promisePlus = makePromisePlus({
      onResolve: resolveSpy,
      onReject: rejectSpy
    });

    promisePlus.resolve({foo: 'bar'});

    return promisePlus.then(function (payload) {
      expect(payload.didError).toBe(true);
      expect(promisePlus.isRejected).toBe(false);
      expect(promisePlus.isResolved).toBe(true);
    });
  });

  it('can reject with reject function', function () {
    var promisePlus = makePromisePlus();
    var error = new Error('foo');

    promisePlus.reject(error);

    return promisePlus.then(rejectIfResolves).catch(function (err) {
      expect(err).toBe(error);
    });
  });

  it('can provide an onReject function to run before it rejects', function () {
    var spy = jest.fn().mockRejectedValue(new Error('onReject error'));
    var promisePlus = makePromisePlus({
      onReject: spy
    });
    var result = {foo: 'bar'};

    promisePlus.reject(result);

    return promisePlus.then(rejectIfResolves).catch(function (err) {
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
    var promisePlus = makePromisePlus({
      onReject: spy
    });

    promisePlus.reject({foo: 'bar'});

    return promisePlus.then(rejectIfResolves).catch(function (err) {
      expect(err.message).toBe('onReject error');
    });
  });

  it('resolves if onReject function resolves', function () {
    var spy = jest.fn().mockResolvedValue({ok: 'ok'});
    var promisePlus = makePromisePlus({
      onReject: spy
    });

    promisePlus.reject({foo: 'bar'});

    return promisePlus.then(function (result) {
      expect(result.ok).toBe('ok');
      expect(promisePlus.isRejected).toBe(false);
      expect(promisePlus.isResolved).toBe(true);
    });
  });

  it('will not update status properties when it has already resolved', function () {
    var promisePlus = makePromisePlus();

    promisePlus.resolve();

    expect(promisePlus.isFulfilled).toBe(true);
    expect(promisePlus.isResolved).toBe(true);
    expect(promisePlus.isRejected).toBe(false);

    promisePlus.reject();

    expect(promisePlus.isFulfilled).toBe(true);
    expect(promisePlus.isResolved).toBe(true);
    expect(promisePlus.isRejected).toBe(false);
  });

  it('will not update the resolved value after it has already been resolved', function () {
    var promisePlus = makePromisePlus();

    promisePlus.resolve('1');

    return promisePlus.then(function (result) {
      expect(result).toBe('1');

      promisePlus.resolve('2');

      return promisePlus;
    }).then(function (result) {
      expect(result).toBe('1');

      promisePlus.reject(new Error('foo'));

      return promisePlus;
    }).then(function (result) {
      expect(result).toBe('1');
    });
  });

  it('will not update status properties when it has already rejected', function () {
    var promisePlus = makePromisePlus();

    promisePlus.reject();

    expect(promisePlus.isFulfilled).toBe(true);
    expect(promisePlus.isResolved).toBe(false);
    expect(promisePlus.isRejected).toBe(true);

    promisePlus.resolve();

    expect(promisePlus.isFulfilled).toBe(true);
    expect(promisePlus.isResolved).toBe(false);
    expect(promisePlus.isRejected).toBe(true);

    return promisePlus.catch(() => { /* noop */ });
  });

  it('will not update the rejected value after it has already been rejected', function () {
    var promisePlus = makePromisePlus();
    var error = new Error('1');

    promisePlus.reject(error);

    return promisePlus.then(rejectIfResolves).catch(function (result) {
      expect(result).toBe(error);

      promisePlus.reject(new Error('2'));

      return promisePlus;
    }).then(rejectIfResolves).catch(function (result) {
      expect(result).toBe(error);

      promisePlus.resolve('3');

      return promisePlus;
    }).then(rejectIfResolves).catch(function (result) {
      expect(result).toBe(error);
    });
  });
});
