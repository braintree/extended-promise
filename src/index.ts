type PromiseConstructorOptions<T> = (
  resolve: (value?: T | PromiseLike<T>) => void,
  reject: (reason?: Error) => void
) => void;
type ResolveFunction<T> = (arg?: T) => T | PromiseLike<T>;
type RejectFunction<T> = (err?: Error) => T | PromiseLike<T>;
type ExtendedPromiseOptions<T> = {
  onResolve?: ResolveFunction<T>;
  onReject?: RejectFunction<T>;
  suppressUnhandledPromiseMessage?: boolean;
};
type ExtendedPromiseConstructorOptions<T> =
  | ExtendedPromiseOptions<T>
  | PromiseConstructorOptions<T>;

class ExtendedPromise<T> extends Promise<T> {
  static suppressUnhandledPromiseMessage: boolean;
  static defaultOnResolve<T>(result?: T): Promise<T> {
    return ExtendedPromise.resolve(result);
  }
  static defaultOnReject<T>(err?: Error): Promise<T> {
    return ExtendedPromise.reject(err);
  }
  static shouldCatchExceptions(
    suppressUnhandledPromiseMessage?: boolean
  ): boolean {
    if (typeof suppressUnhandledPromiseMessage === "boolean") {
      return Boolean(suppressUnhandledPromiseMessage);
    }

    return Boolean(ExtendedPromise.suppressUnhandledPromiseMessage);
  }

  isFulfilled: boolean;
  isResolved: boolean;
  isRejected: boolean;
  _onResolve: ResolveFunction<T>;
  _onReject: RejectFunction<T>;
  _resolveFunction: ResolveFunction<T>;
  _rejectFunction: RejectFunction<T>;

  constructor(options?: ExtendedPromiseConstructorOptions<T>) {
    if (typeof options === "function") {
      super(options);
      return;
    }

    let tempResolve, tempReject;

    super((resolve, reject) => {
      tempResolve = resolve;
      tempReject = reject;
    });
    this._resolveFunction = tempResolve;
    this._rejectFunction = tempReject;

    options = options || {};
    this._onResolve = options.onResolve || ExtendedPromise.defaultOnResolve;
    this._onReject = options.onReject || ExtendedPromise.defaultOnReject;

    if (
      ExtendedPromise.shouldCatchExceptions(
        options.suppressUnhandledPromiseMessage
      )
    ) {
      this.catch(() => {
        // prevents unhandled promise rejection warning
        // in the console for extended promises that
        // catch the error in an asynchronous manner
      });
    }

    this._resetState();
  }

  resolve(arg?: T): ExtendedPromise<T> {
    if (this.isFulfilled) {
      return this;
    }
    this._setResolved();

    ExtendedPromise.resolve()
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

  reject(arg?: Error): ExtendedPromise<T> {
    if (this.isFulfilled) {
      return this;
    }
    this._setRejected();

    ExtendedPromise.resolve()
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
