'use strict';

const ExtendedPromise = require('../');

function rejectIfResolves() {
  return Promise.reject(new Error('should not have resolved'));
}

describe('ExtendedPromise', () => {
  it('has all the methods a Promise object has', function () {
    expect(ExtendedPromise.resolve).toBeInstanceOf(Function);
    expect(ExtendedPromise.reject).toBeInstanceOf(Function);
    expect(ExtendedPromise.all).toBeInstanceOf(Function);
    expect(ExtendedPromise.race).toBeInstanceOf(Function);
  });

  it('defaults status properties to false', () => {
    const promise = new ExtendedPromise();

    expect(promise.isFulfilled).toBe(false);
    expect(promise.isResolved).toBe(false);
    expect(promise.isRejected).toBe(false);
  });

  it('updates status properties when it resolves', () => {
    const promise = new ExtendedPromise();

    return promise.resolve().then(() => {
      expect(promise.isFulfilled).toBe(true);
      expect(promise.isResolved).toBe(true);
      expect(promise.isRejected).toBe(false);
    });
  });

  it('updates status properties when it rejects', () => {
    const promise = new ExtendedPromise();

    return promise.reject().catch(() => {
      expect(promise.isFulfilled).toBe(true);
      expect(promise.isResolved).toBe(false);
      expect(promise.isRejected).toBe(true);
    });
  });

  it('can resolve with resolve function', () => {
    const promise = new ExtendedPromise();
    const result = {foo: 'bar'};

    promise.resolve(result);

    return promise.then(payload => {
      expect(payload).toBe(result);
    });
  });

  it('returns itself when calling resolve', () => {
    const promise = new ExtendedPromise();
    const result = {foo: 'bar'};

    expect(promise.resolve(result)).toBe(promise);
  });

  it('can provide an onResolve function to run before it resolves', () => {
    const promise = new ExtendedPromise({
      onResolve(result) {
        result.newProperty = 'new';
        result.changedProperty = 'changed';

        return result;
      }
    });

    promise.resolve({
      unchangedProperty: 'unchanged',
      changedProperty: 'unchanged'
    });

    return promise.then(payload => {
      expect(payload.unchangedProperty).toBe('unchanged');
      expect(payload.changedProperty).toBe('changed');
      expect(payload.newProperty).toBe('new');
    });
  });

  it('can provide an async onResolve function to run before it resolves', () => {
    const promise = new ExtendedPromise({
      onResolve(result) {
        result.newProperty = 'new';

        return new Promise(resolve => {
          setTimeout(() => {
            result.changedProperty = 'changed';

            resolve(result);
          }, 10);
        });
      }
    });

    promise.resolve({
      unchangedProperty: 'unchanged',
      changedProperty: 'unchanged'
    });

    return promise.then(payload => {
      expect(payload.unchangedProperty).toBe('unchanged');
      expect(payload.changedProperty).toBe('changed');
      expect(payload.newProperty).toBe('new');
    });
  });

  it('rejects if onResolve function rejects', () => {
    const promise = new ExtendedPromise({
      onResolve: jest.fn().mockRejectedValue(new Error('error'))
    });

    promise.resolve({});

    return promise.then(rejectIfResolves).catch(err => {
      expect(err.message).toBe('error');
    });
  });

  it('uses onReject function if onResolve function rejects', () => {
    const err = new Error('resolved error');
    const promise = new ExtendedPromise({
      onResolve: jest.fn().mockRejectedValue(err),
      onReject: jest.fn().mockResolvedValue({didError: true})
    });

    promise.resolve({});

    return promise.then(payload => {
      expect(payload.didError).toBe(true);
    });
  });

  it('can reject with reject function', () => {
    const promise = new ExtendedPromise();
    const error = new Error('foo');

    promise.reject(error);

    return promise.then(rejectIfResolves).catch(err => {
      expect(err).toBe(error);
    });
  });

  it('returns itself when calling reject', () => {
    const promise = new ExtendedPromise();

    expect(promise.reject(new Error('some error'))).toBe(promise);

    return promise.catch(() => { /* noop */ });
  });

  it('can provide an onReject function to run before it rejects', () => {
    const promise = new ExtendedPromise({
      onReject: jest.fn().mockRejectedValue(new Error('onReject error'))
    });

    promise.reject(new Error('error'));

    return promise.then(rejectIfResolves).catch(err => {
      expect(err.message).toBe('onReject error');
    });
  });

  it('can provide an async onReject function to run before it rejects', () => {
    const promise = new ExtendedPromise({
      onReject() {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('onReject error'));
          }, 10);
        });
      }
    });

    promise.reject(new Error('error'));

    return promise.then(rejectIfResolves).catch(err => {
      expect(err.message).toBe('onReject error');
    });
  });

  it('resolves if onReject function resolves', () => {
    const promise = new ExtendedPromise({
      onReject: jest.fn().mockResolvedValue({ok: 'ok'})
    });

    promise.reject(new Error('error'));

    return promise.then(result => {
      expect(result.ok).toBe('ok');
      expect(promise.isRejected).toBe(false);
      expect(promise.isResolved).toBe(true);
    });
  });

  it('will not update status properties when it has already resolved', () => {
    const promise = new ExtendedPromise();

    promise.resolve();

    expect(promise.isFulfilled).toBe(true);
    expect(promise.isResolved).toBe(true);
    expect(promise.isRejected).toBe(false);

    promise.reject();

    expect(promise.isFulfilled).toBe(true);
    expect(promise.isResolved).toBe(true);
    expect(promise.isRejected).toBe(false);
  });

  it('will not update the resolved value after it has already been resolved', () => {
    const promise = new ExtendedPromise();

    promise.resolve('1');

    return promise.then(result => {
      expect(result).toBe('1');

      promise.resolve('2');

      return promise;
    }).then(result => {
      expect(result).toBe('1');

      promise.reject(new Error('foo'));

      return promise;
    }).then(result => {
      expect(result).toBe('1');
    });
  });

  it('will not update status properties when it has already rejected', () => {
    const promise = new ExtendedPromise();

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

  it('will not update the rejected value after it has already been rejected', () => {
    const promise = new ExtendedPromise();
    const error = new Error('1');

    promise.reject(error);

    return promise.then(rejectIfResolves).catch(result => {
      expect(result).toBe(error);

      promise.reject(new Error('2'));

      return promise;
    }).then(rejectIfResolves).catch(result => {
      expect(result).toBe(error);

      promise.resolve('3');

      return promise;
    }).then(rejectIfResolves).catch(result => {
      expect(result).toBe(error);
    });
  });

  it('can globally set a custom Promise to use', function (done) {
    const fakeResolve = jest.fn().mockResolvedValue();
    const fakeReject = jest.fn();

    function FakePromise(fn) {
      fn(fakeResolve, fakeReject);
    }
    FakePromise.resolve = jest.fn()
      .mockResolvedValueOnce()
      .mockResolvedValueOnce()
      .mockResolvedValueOnce('value');

    ExtendedPromise.setPromise(FakePromise);

    ExtendedPromise.resolve('foo');
    expect(FakePromise.resolve).toBeCalledWith('foo');

    const promise = new ExtendedPromise();

    promise.resolve('value');

    setTimeout(() => {
      // have to do this in a setTimeout so that the mock promises
      // have time to resolve
      expect(fakeResolve).toBeCalledTimes(1);
      expect(fakeResolve).toBeCalledWith('value');

      // reset back to global Promise
      ExtendedPromise.Promise = global.Promise;
      done();
    }, 1);
  });
});
