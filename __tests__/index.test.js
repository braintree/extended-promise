'use strict';

const makePromisePlus = require('../');

function rejectIfResolves() {
  return Promise.reject(new Error('should not have resolved'));
}

describe('makePromisePlus', function () {
  it('it returns a promise', function () {
    var promise = makePromisePlus();

    expect(promise).to.be.an.instanceof(Promise);
  });

  it('defaults status properties to false', function () {
    var promisePlus = makePromisePlus();

    expect(promisePlus.isFulfilled).to.equal(false);
    expect(promisePlus.isResolved).to.equal(false);
    expect(promisePlus.isRejected).to.equal(false);
  });

  it('updates status properties when it resolves', function () {
    var promisePlus = makePromisePlus();

    promisePlus.resolve();

    expect(promisePlus.isFulfilled).to.equal(true);
    expect(promisePlus.isResolved).to.equal(true);
    expect(promisePlus.isRejected).to.equal(false);
  });

  it('updates status properties when it rejects', function () {
    var promisePlus = makePromisePlus();

    promisePlus.reject();

    expect(promisePlus.isFulfilled).to.equal(true);
    expect(promisePlus.isResolved).to.equal(false);
    expect(promisePlus.isRejected).to.equal(true);
  });

  it('can resolve with resolve function', function () {
    var promisePlus = makePromisePlus();
    var result = {foo: 'bar'};

    promisePlus.resolve(result);

    return promisePlus.then(function (payload) {
      expect(payload).to.equal(result);
    });
  });

  it('can provide an onResolve function to run before it resolves', function () {
    var spy = this.sandbox.stub().callsFake(function (result) {
      result.baz = 'foo';

      return result;
    });
    var promisePlus = makePromisePlus({
      onResolve: spy
    });
    var result = {foo: 'bar'};

    promisePlus.resolve(result);

    return promisePlus.then(function (payload) {
      expect(payload.foo).to.equal('bar');
      expect(payload.baz).to.equal('foo');
    });
  });

  it('can provide an async onResolve function to run before it resolves', function () {
    var spy = this.sandbox.stub().callsFake(function (result) {
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
      expect(payload.foo).to.equal('baz');
      expect(payload.baz).to.equal('foo');
    });
  });

  it('rejects if onResolve function rejects', function () {
    var spy = this.sandbox.stub().rejects(new Error('error'));
    var promisePlus = makePromisePlus({
      onResolve: spy
    });
    var result = {foo: 'bar'};

    promisePlus.resolve(result);

    return promisePlus.then(rejectIfResolves).catch(function (err) {
      expect(err.message).to.equal('error');
    });
  });

  it('uses onReject function if onResolve function rejects', function () {
    var err = new Error('resolved error');
    var resolveSpy = this.sandbox.stub().rejects(err);
    var rejectSpy = this.sandbox.stub().resolves({didError: true});
    var promisePlus = makePromisePlus({
      onResolve: resolveSpy,
      onReject: rejectSpy
    });

    promisePlus.resolve({foo: 'bar'});

    return promisePlus.then(function (payload) {
      expect(payload.didError).to.equal(true);
      expect(promisePlus.isRejected).to.equal(false);
      expect(promisePlus.isResolved).to.equal(true);
    });
  });

  it('can reject with reject function', function () {
    var promisePlus = makePromisePlus();
    var error = new Error('foo');

    promisePlus.reject(error);

    return promisePlus.then(rejectIfResolves).catch(function (err) {
      expect(err).to.equal(error);
    });
  });

  it('can provide an onReject function to run before it rejects', function () {
    var spy = this.sandbox.stub().rejects(new Error('onReject error'));
    var promisePlus = makePromisePlus({
      onReject: spy
    });
    var result = {foo: 'bar'};

    promisePlus.reject(result);

    return promisePlus.then(rejectIfResolves).catch(function (err) {
      expect(err.message).to.equal('onReject error');
    });
  });

  it('can provide an async onReject function to run before it rejects', function () {
    var spy = this.sandbox.stub().callsFake(function () {
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
      expect(err.message).to.equal('onReject error');
    });
  });

  it('resolves if onReject function resolves', function () {
    var spy = this.sandbox.stub().resolves({ok: 'ok'});
    var promisePlus = makePromisePlus({
      onReject: spy
    });

    promisePlus.reject({foo: 'bar'});

    return promisePlus.then(function (result) {
      expect(result.ok).to.equal('ok');
      expect(promisePlus.isRejected).to.equal(false);
      expect(promisePlus.isResolved).to.equal(true);
    });
  });

  it('will not update status properties when it has already resolved', function () {
    var promisePlus = makePromisePlus();

    promisePlus.resolve();

    expect(promisePlus.isFulfilled).to.equal(true);
    expect(promisePlus.isResolved).to.equal(true);
    expect(promisePlus.isRejected).to.equal(false);

    promisePlus.reject();

    expect(promisePlus.isFulfilled).to.equal(true);
    expect(promisePlus.isResolved).to.equal(true);
    expect(promisePlus.isRejected).to.equal(false);
  });

  it('will not update the resolved value after it has already been resolved', function () {
    var promisePlus = makePromisePlus();

    promisePlus.resolve('1');

    return promisePlus.then(function (result) {
      expect(result).to.equal('1');

      promisePlus.resolve('2');

      return promisePlus;
    }).then(function (result) {
      expect(result).to.equal('1');

      promisePlus.reject(new Error('foo'));

      return promisePlus;
    }).then(function (result) {
      expect(result).to.equal('1');
    });
  });

  it('will not update status properties when it has already rejected', function () {
    var promisePlus = makePromisePlus();

    promisePlus.reject();

    expect(promisePlus.isFulfilled).to.equal(true);
    expect(promisePlus.isResolved).to.equal(false);
    expect(promisePlus.isRejected).to.equal(true);

    promisePlus.resolve();

    expect(promisePlus.isFulfilled).to.equal(true);
    expect(promisePlus.isResolved).to.equal(false);
    expect(promisePlus.isRejected).to.equal(true);
  });

  it('will not update the rejected value after it has already been rejected', function () {
    var promisePlus = makePromisePlus();
    var error = new Error('1');

    promisePlus.reject(error);

    return promisePlus.then(rejectIfResolves).catch(function (result) {
      expect(result).to.equal(error);

      promisePlus.reject(new Error('2'));

      return promisePlus;
    }).then(rejectIfResolves).catch(function (result) {
      expect(result).to.equal(error);

      promisePlus.resolve('3');

      return promisePlus;
    }).then(rejectIfResolves).catch(function (result) {
      expect(result).to.equal(error);
    });
  });
});
