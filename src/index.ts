type ExtendedPromiseOptions = {
  onResolve?: Function;
  onReject?: Function;
  suppressUnhandledPromiseMessage?: boolean;
};
interface PromiseFunction {
  (resolve: (value?: any) => void, reject: (reason?: any) => void): void;
}

class ExtendedPromise {
  static Promise = Promise; // eslint-disable-line no-undef
  static suppressUnhandledPromiseMessage: boolean;
  static defaultOnResolve(result): Promise<any> {
    return ExtendedPromise.Promise.resolve(result);
  }
  static defaultOnReject(err): Promise<any> {
    return ExtendedPromise.Promise.reject(err);
  }
  static setPromise(PromiseClass): void {
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
  static all(arg): Promise<any> {
    return ExtendedPromise.Promise.all(arg);
  }
  // TODO typescript doesn't have this on the Promise type yet :(
  // static allSettled(arg): Promise<any> {
  //   return ExtendedPromise.Promise.allSettled(arg);
  // }
  static race(arg): Promise<any> {
    return ExtendedPromise.Promise.race(arg);
  }
  static reject(arg?): Promise<any> {
    return ExtendedPromise.Promise.reject(arg);
  }
  static resolve(arg?): Promise<any> {
    return ExtendedPromise.Promise.resolve(arg);
  }
  // end Promise methods

  isFulfilled: boolean;
  isResolved: boolean;
  isRejected: boolean;
  _promise: Promise<any>;
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

  then(...args): Promise<any> {
    return this._promise.then(...args);
  }

  catch(...args): Promise<any> {
    return this._promise.catch(...args);
  }

  resolve(arg?): ExtendedPromise {
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

  reject(arg?): ExtendedPromise {
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
