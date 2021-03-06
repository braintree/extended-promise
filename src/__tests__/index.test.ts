import ExtendedPromise = require("../");

function rejectIfResolves(): Promise<unknown> {
  return Promise.reject(new Error("should not have resolved"));
}
const fakeResolve = jest.fn().mockResolvedValue(null);
const fakeReject = jest.fn();

function FakePromise(fn): void {
  fn(fakeResolve, fakeReject);
}
FakePromise.prototype.then = jest.fn();
FakePromise.prototype.catch = jest.fn();
FakePromise.resolve = jest.fn();

describe("ExtendedPromise", () => {
  afterEach(() => {
    // always revert back to the global Promise object after tests
    ExtendedPromise.setPromise(Promise);

    FakePromise.prototype.then.mockReset();
    FakePromise.prototype.catch.mockReset();
    fakeResolve.mockReset();
    fakeReject.mockReset();
    FakePromise.resolve.mockReset();
  });

  it("has all the methods a Promise object has", function () {
    expect(ExtendedPromise.resolve).toBeInstanceOf(Function);
    expect(ExtendedPromise.reject).toBeInstanceOf(Function);
    expect(ExtendedPromise.all).toBeInstanceOf(Function);
    // expect(ExtendedPromise.allSettled).toBeInstanceOf(Function);
    expect(ExtendedPromise.race).toBeInstanceOf(Function);
  });

  it("defaults status properties to false", () => {
    const promise = new ExtendedPromise();

    expect(promise.isFulfilled).toBe(false);
    expect(promise.isResolved).toBe(false);
    expect(promise.isRejected).toBe(false);
  });

  it("updates status properties when it resolves", () => {
    const promise = new ExtendedPromise();

    return promise.resolve().then(() => {
      expect(promise.isFulfilled).toBe(true);
      expect(promise.isResolved).toBe(true);
      expect(promise.isRejected).toBe(false);
    });
  });

  it("updates status properties when it rejects", () => {
    const promise = new ExtendedPromise();

    return promise.reject().catch(() => {
      expect(promise.isFulfilled).toBe(true);
      expect(promise.isResolved).toBe(false);
      expect(promise.isRejected).toBe(true);
    });
  });

  it("can suppress unhandled promise messages", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ExtendedPromise.setPromise(FakePromise as any);

    const promiseWithoutCatch = new ExtendedPromise(); // eslint-disable-line @typescript-eslint/no-unused-vars

    expect(FakePromise.prototype.catch).toBeCalledTimes(0);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const promiseWithCatch = new ExtendedPromise({
      suppressUnhandledPromiseMessage: true,
    });

    expect(FakePromise.prototype.catch).toBeCalledTimes(1);
  });

  it("can suppress unhandled promise messages with ExtendedPromise default", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ExtendedPromise.setPromise(FakePromise as any);
    ExtendedPromise.suppressUnhandledPromiseMessage = true;

    const promise = new ExtendedPromise(); // eslint-disable-line @typescript-eslint/no-unused-vars

    expect(FakePromise.prototype.catch).toBeCalledTimes(1);

    delete ExtendedPromise.suppressUnhandledPromiseMessage;
  });

  it("defers to setting passed into instance", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ExtendedPromise.setPromise(FakePromise as any);
    ExtendedPromise.suppressUnhandledPromiseMessage = true;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const promise = new ExtendedPromise({
      suppressUnhandledPromiseMessage: false,
    });

    expect(FakePromise.prototype.catch).toBeCalledTimes(0);

    delete ExtendedPromise.suppressUnhandledPromiseMessage;
  });

  it("can resolve with resolve function", () => {
    const promise = new ExtendedPromise();
    const result = { foo: "bar" };

    promise.resolve(result);

    return promise.then((payload) => {
      expect(payload).toBe(result);
    });
  });

  it("returns itself when calling resolve", () => {
    const promise = new ExtendedPromise();
    const result = { foo: "bar" };

    expect(promise.resolve(result)).toBe(promise);
  });

  it("can provide an onResolve function to run before it resolves", () => {
    const promise = new ExtendedPromise({
      onResolve(result): unknown {
        result.newProperty = "new";
        result.changedProperty = "changed";

        return result;
      },
    });

    promise.resolve({
      unchangedProperty: "unchanged",
      changedProperty: "unchanged",
    });

    return promise.then((payload) => {
      expect(payload.unchangedProperty).toBe("unchanged");
      expect(payload.changedProperty).toBe("changed");
      expect(payload.newProperty).toBe("new");
    });
  });

  it("can provide an async onResolve function to run before it resolves", () => {
    const promise = new ExtendedPromise({
      onResolve(result): unknown {
        result.newProperty = "new";

        return new Promise((resolve) => {
          setTimeout(() => {
            result.changedProperty = "changed";

            resolve(result);
          }, 10);
        });
      },
    });

    promise.resolve({
      unchangedProperty: "unchanged",
      changedProperty: "unchanged",
    });

    return promise.then((payload) => {
      expect(payload.unchangedProperty).toBe("unchanged");
      expect(payload.changedProperty).toBe("changed");
      expect(payload.newProperty).toBe("new");
    });
  });

  it("rejects if onResolve function rejects", () => {
    const promise = new ExtendedPromise({
      onResolve: jest.fn().mockRejectedValue(new Error("error")),
    });

    promise.resolve({});

    return promise.then(rejectIfResolves).catch((err) => {
      expect(err.message).toBe("error");
    });
  });

  it("uses onReject function if onResolve function rejects", () => {
    const err = new Error("resolved error");
    const promise = new ExtendedPromise({
      onResolve: jest.fn().mockRejectedValue(err),
      onReject: jest.fn().mockResolvedValue({ didError: true }),
    });

    promise.resolve({});

    return promise.then((payload) => {
      expect(payload.didError).toBe(true);
    });
  });

  it("can reject with reject function", () => {
    const promise = new ExtendedPromise();
    const error = new Error("foo");

    promise.reject(error);

    return promise.then(rejectIfResolves).catch((err) => {
      expect(err).toBe(error);
    });
  });

  it("returns itself when calling reject", () => {
    const promise = new ExtendedPromise();

    expect(promise.reject(new Error("some error"))).toBe(promise);

    return promise.catch(() => {
      /* noop */
    });
  });

  it("can provide an onReject function to run before it rejects", () => {
    const promise = new ExtendedPromise({
      onReject: jest.fn().mockRejectedValue(new Error("onReject error")),
    });

    promise.reject(new Error("error"));

    return promise.then(rejectIfResolves).catch((err) => {
      expect(err.message).toBe("onReject error");
    });
  });

  it("can provide an async onReject function to run before it rejects", () => {
    const promise = new ExtendedPromise({
      onReject(): Promise<unknown> {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error("onReject error"));
          }, 10);
        });
      },
    });

    promise.reject(new Error("error"));

    return promise.then(rejectIfResolves).catch((err) => {
      expect(err.message).toBe("onReject error");
    });
  });

  it("resolves if onReject function resolves", () => {
    const promise = new ExtendedPromise({
      onReject: jest.fn().mockResolvedValue({ ok: "ok" }),
    });

    promise.reject(new Error("error"));

    return promise.then((result) => {
      expect(result.ok).toBe("ok");
      expect(promise.isRejected).toBe(false);
      expect(promise.isResolved).toBe(true);
    });
  });

  it("will not update status properties when it has already resolved", () => {
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

  it("will not update the resolved value after it has already been resolved", () => {
    const promise = new ExtendedPromise();

    promise.resolve("1");

    return promise
      .then((result) => {
        expect(result).toBe("1");

        promise.resolve("2");

        return promise;
      })
      .then((result) => {
        expect(result).toBe("1");

        promise.reject(new Error("foo"));

        return promise;
      })
      .then((result) => {
        expect(result).toBe("1");
      });
  });

  it("will not update status properties when it has already rejected", () => {
    const promise = new ExtendedPromise();

    promise.reject();

    expect(promise.isFulfilled).toBe(true);
    expect(promise.isResolved).toBe(false);
    expect(promise.isRejected).toBe(true);

    promise.resolve();

    expect(promise.isFulfilled).toBe(true);
    expect(promise.isResolved).toBe(false);
    expect(promise.isRejected).toBe(true);

    return promise.catch(() => {
      /* noop */
    });
  });

  it("will not update the rejected value after it has already been rejected", () => {
    const promise = new ExtendedPromise();
    const error = new Error("1");

    promise.reject(error);

    return promise
      .then(rejectIfResolves)
      .catch((result) => {
        expect(result).toBe(error);

        promise.reject(new Error("2"));

        return promise;
      })
      .then(rejectIfResolves)
      .catch((result) => {
        expect(result).toBe(error);

        promise.resolve("3");

        return promise;
      })
      .then(rejectIfResolves)
      .catch((result) => {
        expect(result).toBe(error);
      });
  });

  it("treats it as a normal promise if instantiated with a function", () => {
    let didError = false;
    const error = new Error("1");
    const resolvingPromise = new ExtendedPromise(function (resolve) {
      resolve("value");
    });
    const rejectingPromise = new ExtendedPromise(function (resolve, reject) {
      reject(error);
    });

    return rejectingPromise
      .catch((e) => {
        expect(e).toBe(error);
        didError = true;

        return resolvingPromise;
      })
      .then((val) => {
        expect(didError).toBe(true);
        expect(val).toBe("value");
      });
  });

  it("can globally set a custom Promise to use", function (done) {
    FakePromise.resolve
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("value");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ExtendedPromise.setPromise(FakePromise as any);

    ExtendedPromise.resolve("foo");
    expect(FakePromise.resolve).toBeCalledWith("foo");

    const promise = new ExtendedPromise();

    promise.resolve("value");

    setTimeout(() => {
      // have to do this in a setTimeout so that the mock promises
      // have time to resolve
      expect(fakeResolve).toBeCalledTimes(1);
      expect(fakeResolve).toBeCalledWith("value");

      done();
    }, 1);
  });
});
