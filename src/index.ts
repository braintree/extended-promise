// TODO these should be converted to not use Function everywhere
/* eslint-disable @typescript-eslint/ban-types */
type ExtendedPromiseOptions = {
  onResolve?: Function;
  onReject?: Function;
  suppressUnhandledPromiseMessage?: boolean;
};
type PromiseFunction = {
  (
    resolve: (value?: unknown) => void,
    reject: (reason?: unknown) => void
  ): void;
};
interface PromiseModel {
  new (f: PromiseFunction);
  all: Function;
  // TODO typescript doesn't have this on the PromiseConstructor type yet :(
  allSettled?: Function;
  race: Function;
  resolve: Function;
  reject: Function;
}
type PromiseInstance = {
  then: Function;
  catch: Function;
};

const GlobalPromise = (typeof Promise !== "undefined"
  ? Promise // eslint-disable-line no-undef
  : null) as PromiseModel;

class ExtendedPromise {
  static Promise = GlobalPromise;
  static suppressUnhandledPromiseMessage: boolean;
  static defaultOnResolve(result: unknown): PromiseModel {
    return ExtendedPromise.Promise.resolve(result);
  }
  static defaultOnReject(err: Error): PromiseModel {
    return ExtendedPromise.Promise.reject(err);
  }
  static setPromise(PromiseClass: typeof Promise): void {
    ExtendedPromise.Promise = PromiseClass;
  }
  static shouldCatchExceptions(options: ExtendedPromiseOptions): boolean {
    if (options.hasOwnProperty("suppressUnhandledPromiseMessage")) {
      return Boolean(options.suppressUnhandledPromiseMessage);
    }

    return Boolean(ExtendedPromise.suppressUnhandledPromiseMessage);
  }

  // start Promise methods documented in:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#Methods
  static all(args: unknown[]): PromiseModel {
    return ExtendedPromise.Promise.all(args);
  }
  static allSettled(args: unknown[]): PromiseModel {
    return ExtendedPromise.Promise.allSettled(args);
  }
  static race(args: unknown[]): PromiseModel {
    return ExtendedPromise.Promise.race(args);
  }
  static reject(arg?: Error): PromiseModel {
    return ExtendedPromise.Promise.reject(arg);
  }
  static resolve(arg?: unknown): PromiseModel {
    return ExtendedPromise.Promise.resolve(arg);
  }
  // end Promise methods

  isFulfilled: boolean;
  isResolved: boolean;
  isRejected: boolean;
  _promise: PromiseInstance;
  _onResolve: Function;
  _onReject: Function;
  _resolveFunction: Function;
  _rejectFunction: Function;

  constructor(options?: ExtendedPromiseOptions | PromiseFunction) {
    if (typeof options === "function") {
      this._promise = new ExtendedPromise.Promise(options);
      return;
    }

    this._promise = new ExtendedPromise.Promise((resolve, reject) => {
      this._resolveFunction = resolve;
      this._rejectFunction = reject;
    });

    options = options || {};
    this._onResolve = options.onResolve || ExtendedPromise.defaultOnResolve;
    this._onReject = options.onReject || ExtendedPromise.defaultOnReject;

    if (ExtendedPromise.shouldCatchExceptions(options)) {
      this._promise.catch(function () {
        // prevents unhandled promise rejection warning
        // in the console for extended promises that
        // that catch the error in an asynchronous manner
      });
    }

    this._resetState();
  }

  then(...args: unknown[]): PromiseInstance {
    return this._promise.then(...args);
  }

  catch(...args: unknown[]): PromiseInstance {
    return this._promise.catch(...args);
  }

  resolve(arg?: unknown): ExtendedPromise {
    if (this.isFulfilled) {
      return this;
    }
    this._setResolved();

    ExtendedPromise.Promise.resolve()
      .then(() => {
        return this._onResolve(arg);
      })
      .then((argForResolveFunction) => {
        this._resolveFunction(argForResolveFunction);
      })
      .catch((err) => {
        this._resetState();

        this.reject(err);
      });

    return this;
  }

  reject(arg?: unknown): ExtendedPromise {
    if (this.isFulfilled) {
      return this;
    }
    this._setRejected();

    ExtendedPromise.Promise.resolve()
      .then(() => {
        return this._onReject(arg);
      })
      .then((result) => {
        this._setResolved();

        this._resolveFunction(result);
      })
      .catch((err) => {
        return this._rejectFunction(err);
      });

    return this;
  }

  _resetState(): void {
    this.isFulfilled = false;
    this.isResolved = false;
    this.isRejected = false;
  }

  _setResolved(): void {
    this.isFulfilled = true;
    this.isResolved = true;
    this.isRejected = false;
  }

  _setRejected(): void {
    this.isFulfilled = true;
    this.isResolved = false;
    this.isRejected = true;
  }
}

export = ExtendedPromise;
