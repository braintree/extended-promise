import ExtendedPromise = require("../");

type FakeResult = {
  unchangedProperty?: string;
  changedProperty?: string;
  ok?: boolean;
  newProperty?: string;
};

describe("ExtendedPromise", () => {
  it("extends promise", function () {
    const promise = new ExtendedPromise<string>(() => {
      // never resolve
    });
    expect(promise).toBeInstanceOf(Promise);
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
    expect.assertions(3);

    const promise = new ExtendedPromise();

    return promise.reject().catch(() => {
      expect(promise.isFulfilled).toBe(true);
      expect(promise.isResolved).toBe(false);
      expect(promise.isRejected).toBe(true);
    });
  });

  it("can suppress unhandled promise messages", () => {
    jest.spyOn(Promise.prototype, "catch");

    const promiseWithoutCatch = new ExtendedPromise();

    expect(promiseWithoutCatch.catch).toBeCalledTimes(0);

    const promiseWithCatch = new ExtendedPromise({
      suppressUnhandledPromiseMessage: true,
    });

    expect(promiseWithCatch.catch).toBeCalledTimes(1);
  });

  it("can suppress unhandled promise messages with ExtendedPromise default", () => {
    jest.spyOn(Promise.prototype, "catch");

    ExtendedPromise.suppressUnhandledPromiseMessage = true;

    const promise = new ExtendedPromise();

    expect(promise.catch).toBeCalledTimes(1);

    delete ExtendedPromise.suppressUnhandledPromiseMessage;
  });

  it("defers to setting passed into instance", () => {
    jest.spyOn(Promise.prototype, "catch");

    ExtendedPromise.suppressUnhandledPromiseMessage = true;

    const promise = new ExtendedPromise({
      suppressUnhandledPromiseMessage: false,
    });

    expect(promise.catch).toBeCalledTimes(0);

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
    const promise = new ExtendedPromise<FakeResult>({
      onResolve(result) {
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
    const promise = new ExtendedPromise<FakeResult>({
      onResolve(result) {
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
    expect.assertions(1);

    const promise = new ExtendedPromise({
      onResolve: jest.fn().mockRejectedValue(new Error("error")),
    });

    promise.resolve({});

    return promise.catch((err) => {
      expect(err.message).toBe("error");
    });
  });

  it("uses onReject function if onResolve function rejects", () => {
    const err = new Error("resolved error");
    const promise = new ExtendedPromise<FakeResult>({
      onResolve: jest.fn().mockRejectedValue(err),
      onReject: jest.fn().mockResolvedValue({ ok: false }),
    });

    promise.resolve({});

    return promise.then((payload) => {
      expect(payload.ok).toBe(false);
    });
  });

  it("can reject with reject function", () => {
    expect.assertions(1);

    const promise = new ExtendedPromise();
    const error = new Error("foo");

    promise.reject(error);

    return promise.catch((err) => {
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
    expect.assertions(1);

    const promise = new ExtendedPromise({
      onReject: jest.fn().mockRejectedValue(new Error("onReject error")),
    });

    promise.reject(new Error("error"));

    return promise.catch((err) => {
      expect(err.message).toBe("onReject error");
    });
  });

  it("can provide an async onReject function to run before it rejects", () => {
    expect.assertions(1);

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

    return promise.catch((err) => {
      expect(err.message).toBe("onReject error");
    });
  });

  it("resolves if onReject function resolves", () => {
    const promise = new ExtendedPromise<FakeResult>({
      onReject: jest.fn().mockResolvedValue({ ok: true }),
    });

    promise.reject(new Error("error"));

    return promise.then((result) => {
      expect(result.ok).toBe(true);
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
    expect.assertions(3);

    const promise = new ExtendedPromise();
    const error = new Error("1");

    promise.reject(error);

    return promise
      .catch((result) => {
        expect(result).toBe(error);

        promise.reject(new Error("2"));

        return promise;
      })
      .catch((result) => {
        expect(result).toBe(error);

        promise.resolve("3");

        return promise;
      })
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
});
