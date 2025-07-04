(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
function nanoid(size = 21) {
  let id = "";
  let i = size | 0;
  while (i--) {
    id += urlAlphabet[Math.random() * 64 | 0];
  }
  return id;
}
const runtimeURL = window.location.origin + "/wails/runtime";
const objectNames = Object.freeze({
  Call: 0,
  Clipboard: 1,
  Application: 2,
  Events: 3,
  ContextMenu: 4,
  Dialog: 5,
  Window: 6,
  Screens: 7,
  System: 8,
  Browser: 9,
  CancelCall: 10
});
let clientId = nanoid();
function newRuntimeCaller(object, windowName = "") {
  return function(method, args = null) {
    return runtimeCallWithID(object, method, windowName, args);
  };
}
async function runtimeCallWithID(objectID, method, windowName, args) {
  var _a2, _b;
  let url = new URL(runtimeURL);
  url.searchParams.append("object", objectID.toString());
  url.searchParams.append("method", method.toString());
  if (args) {
    url.searchParams.append("args", JSON.stringify(args));
  }
  let headers = {
    ["x-wails-client-id"]: clientId
  };
  if (windowName) {
    headers["x-wails-window-name"] = windowName;
  }
  let response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  if (((_b = (_a2 = response.headers.get("Content-Type")) === null || _a2 === void 0 ? void 0 : _a2.indexOf("application/json")) !== null && _b !== void 0 ? _b : -1) !== -1) {
    return response.json();
  } else {
    return response.text();
  }
}
newRuntimeCaller(objectNames.System);
const _invoke = function() {
  var _a2, _b, _c, _d, _e;
  try {
    if ((_b = (_a2 = window.chrome) === null || _a2 === void 0 ? void 0 : _a2.webview) === null || _b === void 0 ? void 0 : _b.postMessage) {
      return window.chrome.webview.postMessage.bind(window.chrome.webview);
    } else if ((_e = (_d = (_c = window.webkit) === null || _c === void 0 ? void 0 : _c.messageHandlers) === null || _d === void 0 ? void 0 : _d["external"]) === null || _e === void 0 ? void 0 : _e.postMessage) {
      return window.webkit.messageHandlers["external"].postMessage.bind(window.webkit.messageHandlers["external"]);
    }
  } catch (e) {
  }
  console.warn("\n%c⚠️ Browser Environment Detected %c\n\n%cOnly UI previews are available in the browser. For full functionality, please run the application in desktop mode.\nMore information at: https://v3.wails.io/learn/build/#using-a-browser-for-development\n", "background: #ffffff; color: #000000; font-weight: bold; padding: 4px 8px; border-radius: 4px; border: 2px solid #000000;", "background: transparent;", "color: #ffffff; font-style: italic; font-weight: bold;");
  return null;
}();
function invoke(msg) {
  _invoke === null || _invoke === void 0 ? void 0 : _invoke(msg);
}
function IsWindows() {
  return window._wails.environment.OS === "windows";
}
function IsDebug() {
  return Boolean(window._wails.environment.Debug);
}
function canTrackButtons() {
  return new MouseEvent("mousedown").buttons === 0;
}
function eventTarget(event) {
  var _a2;
  if (event.target instanceof HTMLElement) {
    return event.target;
  } else if (!(event.target instanceof HTMLElement) && event.target instanceof Node) {
    return (_a2 = event.target.parentElement) !== null && _a2 !== void 0 ? _a2 : document.body;
  } else {
    return document.body;
  }
}
document.addEventListener("DOMContentLoaded", () => {
});
window.addEventListener("contextmenu", contextMenuHandler);
const call$1 = newRuntimeCaller(objectNames.ContextMenu);
const ContextMenuOpen = 0;
function openContextMenu(id, x, y, data) {
  void call$1(ContextMenuOpen, { id, x, y, data });
}
function contextMenuHandler(event) {
  const target = eventTarget(event);
  const customContextMenu = window.getComputedStyle(target).getPropertyValue("--custom-contextmenu").trim();
  if (customContextMenu) {
    event.preventDefault();
    const data = window.getComputedStyle(target).getPropertyValue("--custom-contextmenu-data");
    openContextMenu(customContextMenu, event.clientX, event.clientY, data);
  } else {
    processDefaultContextMenu(event, target);
  }
}
function processDefaultContextMenu(event, target) {
  if (IsDebug()) {
    return;
  }
  switch (window.getComputedStyle(target).getPropertyValue("--default-contextmenu").trim()) {
    case "show":
      return;
    case "hide":
      event.preventDefault();
      return;
  }
  if (target.isContentEditable) {
    return;
  }
  const selection = window.getSelection();
  const hasSelection = selection && selection.toString().length > 0;
  if (hasSelection) {
    for (let i = 0; i < selection.rangeCount; i++) {
      const range = selection.getRangeAt(i);
      const rects = range.getClientRects();
      for (let j = 0; j < rects.length; j++) {
        const rect = rects[j];
        if (document.elementFromPoint(rect.left, rect.top) === target) {
          return;
        }
      }
    }
  }
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    if (hasSelection || !target.readOnly && !target.disabled) {
      return;
    }
  }
  event.preventDefault();
}
function GetFlag(key) {
  try {
    return window._wails.flags[key];
  } catch (e) {
    throw new Error("Unable to retrieve flag '" + key + "': " + e, { cause: e });
  }
}
let canDrag = false;
let dragging = false;
let resizable = false;
let canResize = false;
let resizing = false;
let resizeEdge = "";
let defaultCursor = "auto";
let buttons = 0;
const buttonsTracked = canTrackButtons();
window._wails = window._wails || {};
window._wails.setResizable = (value) => {
  resizable = value;
  if (!resizable) {
    canResize = resizing = false;
    setResize();
  }
};
window.addEventListener("mousedown", update, { capture: true });
window.addEventListener("mousemove", update, { capture: true });
window.addEventListener("mouseup", update, { capture: true });
for (const ev of ["click", "contextmenu", "dblclick"]) {
  window.addEventListener(ev, suppressEvent, { capture: true });
}
function suppressEvent(event) {
  if (dragging || resizing) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    event.preventDefault();
  }
}
const MouseDown = 0;
const MouseUp = 1;
const MouseMove = 2;
function update(event) {
  let eventType, eventButtons = event.buttons;
  switch (event.type) {
    case "mousedown":
      eventType = MouseDown;
      if (!buttonsTracked) {
        eventButtons = buttons | 1 << event.button;
      }
      break;
    case "mouseup":
      eventType = MouseUp;
      if (!buttonsTracked) {
        eventButtons = buttons & ~(1 << event.button);
      }
      break;
    default:
      eventType = MouseMove;
      if (!buttonsTracked) {
        eventButtons = buttons;
      }
      break;
  }
  let released = buttons & ~eventButtons;
  let pressed = eventButtons & ~buttons;
  buttons = eventButtons;
  if (eventType === MouseDown && !(pressed & event.button)) {
    released |= 1 << event.button;
    pressed |= 1 << event.button;
  }
  if (eventType !== MouseMove && resizing || dragging && (eventType === MouseDown || event.button !== 0)) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    event.preventDefault();
  }
  if (released & 1) {
    primaryUp();
  }
  if (pressed & 1) {
    primaryDown(event);
  }
  if (eventType === MouseMove) {
    onMouseMove(event);
  }
}
function primaryDown(event) {
  canDrag = false;
  canResize = false;
  if (!IsWindows()) {
    if (event.type === "mousedown" && event.button === 0 && event.detail !== 1) {
      return;
    }
  }
  if (resizeEdge) {
    canResize = true;
    return;
  }
  const target = eventTarget(event);
  const style = window.getComputedStyle(target);
  canDrag = style.getPropertyValue("--wails-draggable").trim() === "drag" && (event.offsetX - parseFloat(style.paddingLeft) < target.clientWidth && event.offsetY - parseFloat(style.paddingTop) < target.clientHeight);
}
function primaryUp(event) {
  canDrag = false;
  dragging = false;
  canResize = false;
  resizing = false;
}
const cursorForEdge = Object.freeze({
  "se-resize": "nwse-resize",
  "sw-resize": "nesw-resize",
  "nw-resize": "nwse-resize",
  "ne-resize": "nesw-resize",
  "w-resize": "ew-resize",
  "n-resize": "ns-resize",
  "s-resize": "ns-resize",
  "e-resize": "ew-resize"
});
function setResize(edge) {
  if (edge) {
    if (!resizeEdge) {
      defaultCursor = document.body.style.cursor;
    }
    document.body.style.cursor = cursorForEdge[edge];
  } else if (!edge && resizeEdge) {
    document.body.style.cursor = defaultCursor;
  }
  resizeEdge = edge || "";
}
function onMouseMove(event) {
  if (canResize && resizeEdge) {
    resizing = true;
    invoke("wails:resize:" + resizeEdge);
  } else if (canDrag) {
    dragging = true;
    invoke("wails:drag");
  }
  if (dragging || resizing) {
    canDrag = canResize = false;
    return;
  }
  if (!resizable || !IsWindows()) {
    if (resizeEdge) {
      setResize();
    }
    return;
  }
  const resizeHandleHeight = GetFlag("system.resizeHandleHeight") || 5;
  const resizeHandleWidth = GetFlag("system.resizeHandleWidth") || 5;
  const cornerExtra = GetFlag("resizeCornerExtra") || 10;
  const rightBorder = window.outerWidth - event.clientX < resizeHandleWidth;
  const leftBorder = event.clientX < resizeHandleWidth;
  const topBorder = event.clientY < resizeHandleHeight;
  const bottomBorder = window.outerHeight - event.clientY < resizeHandleHeight;
  const rightCorner = window.outerWidth - event.clientX < resizeHandleWidth + cornerExtra;
  const leftCorner = event.clientX < resizeHandleWidth + cornerExtra;
  const topCorner = event.clientY < resizeHandleHeight + cornerExtra;
  const bottomCorner = window.outerHeight - event.clientY < resizeHandleHeight + cornerExtra;
  if (!leftCorner && !topCorner && !bottomCorner && !rightCorner) {
    setResize();
  } else if (rightCorner && bottomCorner)
    setResize("se-resize");
  else if (leftCorner && bottomCorner)
    setResize("sw-resize");
  else if (leftCorner && topCorner)
    setResize("nw-resize");
  else if (topCorner && rightCorner)
    setResize("ne-resize");
  else if (leftBorder)
    setResize("w-resize");
  else if (topBorder)
    setResize("n-resize");
  else if (bottomBorder)
    setResize("s-resize");
  else if (rightBorder)
    setResize("e-resize");
  else
    setResize();
}
var fnToStr = Function.prototype.toString;
var reflectApply = typeof Reflect === "object" && Reflect !== null && Reflect.apply;
var badArrayLike;
var isCallableMarker;
if (typeof reflectApply === "function" && typeof Object.defineProperty === "function") {
  try {
    badArrayLike = Object.defineProperty({}, "length", {
      get: function() {
        throw isCallableMarker;
      }
    });
    isCallableMarker = {};
    reflectApply(function() {
      throw 42;
    }, null, badArrayLike);
  } catch (_) {
    if (_ !== isCallableMarker) {
      reflectApply = null;
    }
  }
} else {
  reflectApply = null;
}
var constructorRegex = /^\s*class\b/;
var isES6ClassFn = function isES6ClassFunction(value) {
  try {
    var fnStr = fnToStr.call(value);
    return constructorRegex.test(fnStr);
  } catch (e) {
    return false;
  }
};
var tryFunctionObject = function tryFunctionToStr(value) {
  try {
    if (isES6ClassFn(value)) {
      return false;
    }
    fnToStr.call(value);
    return true;
  } catch (e) {
    return false;
  }
};
var toStr = Object.prototype.toString;
var objectClass = "[object Object]";
var fnClass = "[object Function]";
var genClass = "[object GeneratorFunction]";
var ddaClass = "[object HTMLAllCollection]";
var ddaClass2 = "[object HTML document.all class]";
var ddaClass3 = "[object HTMLCollection]";
var hasToStringTag = typeof Symbol === "function" && !!Symbol.toStringTag;
var isIE68 = !(0 in [,]);
var isDDA = function isDocumentDotAll() {
  return false;
};
if (typeof document === "object") {
  var all = document.all;
  if (toStr.call(all) === toStr.call(document.all)) {
    isDDA = function isDocumentDotAll2(value) {
      if ((isIE68 || !value) && (typeof value === "undefined" || typeof value === "object")) {
        try {
          var str = toStr.call(value);
          return (str === ddaClass || str === ddaClass2 || str === ddaClass3 || str === objectClass) && value("") == null;
        } catch (e) {
        }
      }
      return false;
    };
  }
}
function isCallableRefApply(value) {
  if (isDDA(value)) {
    return true;
  }
  if (!value) {
    return false;
  }
  if (typeof value !== "function" && typeof value !== "object") {
    return false;
  }
  try {
    reflectApply(value, null, badArrayLike);
  } catch (e) {
    if (e !== isCallableMarker) {
      return false;
    }
  }
  return !isES6ClassFn(value) && tryFunctionObject(value);
}
function isCallableNoRefApply(value) {
  if (isDDA(value)) {
    return true;
  }
  if (!value) {
    return false;
  }
  if (typeof value !== "function" && typeof value !== "object") {
    return false;
  }
  if (hasToStringTag) {
    return tryFunctionObject(value);
  }
  if (isES6ClassFn(value)) {
    return false;
  }
  var strClass = toStr.call(value);
  if (strClass !== fnClass && strClass !== genClass && !/^\[object HTML/.test(strClass)) {
    return false;
  }
  return tryFunctionObject(value);
}
const isCallable = reflectApply ? isCallableRefApply : isCallableNoRefApply;
var _a;
class CancelError extends Error {
  /**
   * Constructs a new `CancelError` instance.
   * @param message - The error message.
   * @param options - Options to be forwarded to the Error constructor.
   */
  constructor(message, options) {
    super(message, options);
    this.name = "CancelError";
  }
}
class CancelledRejectionError extends Error {
  /**
   * Constructs a new `CancelledRejectionError` instance.
   * @param promise - The promise that caused the error originally.
   * @param reason - The rejection reason.
   * @param info - An optional informative message specifying the circumstances in which the error was thrown.
   *               Defaults to the string `"Unhandled rejection in cancelled promise."`.
   */
  constructor(promise, reason, info) {
    super((info !== null && info !== void 0 ? info : "Unhandled rejection in cancelled promise.") + " Reason: " + errorMessage(reason), { cause: reason });
    this.promise = promise;
    this.name = "CancelledRejectionError";
  }
}
const barrierSym = Symbol("barrier");
const cancelImplSym = Symbol("cancelImpl");
const species = (_a = Symbol.species) !== null && _a !== void 0 ? _a : Symbol("speciesPolyfill");
class CancellablePromise extends Promise {
  /**
   * Creates a new `CancellablePromise`.
   *
   * @param executor - A callback used to initialize the promise. This callback is passed two arguments:
   *                   a `resolve` callback used to resolve the promise with a value
   *                   or the result of another promise (possibly cancellable),
   *                   and a `reject` callback used to reject the promise with a provided reason or error.
   *                   If the value provided to the `resolve` callback is a thenable _and_ cancellable object
   *                   (it has a `then` _and_ a `cancel` method),
   *                   cancellation requests will be forwarded to that object and the oncancelled will not be invoked anymore.
   *                   If any one of the two callbacks is called _after_ the promise has been cancelled,
   *                   the provided values will be cancelled and resolved as usual,
   *                   but their results will be discarded.
   *                   However, if the resolution process ultimately ends up in a rejection
   *                   that is not due to cancellation, the rejection reason
   *                   will be wrapped in a {@link CancelledRejectionError}
   *                   and bubbled up as an unhandled rejection.
   * @param oncancelled - It is the caller's responsibility to ensure that any operation
   *                      started by the executor is properly halted upon cancellation.
   *                      This optional callback can be used to that purpose.
   *                      It will be called _synchronously_ with a cancellation cause
   *                      when cancellation is requested, _after_ the promise has already rejected
   *                      with a {@link CancelError}, but _before_
   *                      any {@link then}/{@link catch}/{@link finally} callback runs.
   *                      If the callback returns a thenable, the promise returned from {@link cancel}
   *                      will only fulfill after the former has settled.
   *                      Unhandled exceptions or rejections from the callback will be wrapped
   *                      in a {@link CancelledRejectionError} and bubbled up as unhandled rejections.
   *                      If the `resolve` callback is called before cancellation with a cancellable promise,
   *                      cancellation requests on this promise will be diverted to that promise,
   *                      and the original `oncancelled` callback will be discarded.
   */
  constructor(executor, oncancelled) {
    let resolve;
    let reject;
    super((res, rej) => {
      resolve = res;
      reject = rej;
    });
    if (this.constructor[species] !== Promise) {
      throw new TypeError("CancellablePromise does not support transparent subclassing. Please refrain from overriding the [Symbol.species] static property.");
    }
    let promise = {
      promise: this,
      resolve,
      reject,
      get oncancelled() {
        return oncancelled !== null && oncancelled !== void 0 ? oncancelled : null;
      },
      set oncancelled(cb) {
        oncancelled = cb !== null && cb !== void 0 ? cb : void 0;
      }
    };
    const state = {
      get root() {
        return state;
      },
      resolving: false,
      settled: false
    };
    void Object.defineProperties(this, {
      [barrierSym]: {
        configurable: false,
        enumerable: false,
        writable: true,
        value: null
      },
      [cancelImplSym]: {
        configurable: false,
        enumerable: false,
        writable: false,
        value: cancellerFor(promise, state)
      }
    });
    const rejector = rejectorFor(promise, state);
    try {
      executor(resolverFor(promise, state), rejector);
    } catch (err) {
      if (state.resolving) {
        console.log("Unhandled exception in CancellablePromise executor.", err);
      } else {
        rejector(err);
      }
    }
  }
  /**
   * Cancels immediately the execution of the operation associated with this promise.
   * The promise rejects with a {@link CancelError} instance as reason,
   * with the {@link CancelError#cause} property set to the given argument, if any.
   *
   * Has no effect if called after the promise has already settled;
   * repeated calls in particular are safe, but only the first one
   * will set the cancellation cause.
   *
   * The `CancelError` exception _need not_ be handled explicitly _on the promises that are being cancelled:_
   * cancelling a promise with no attached rejection handler does not trigger an unhandled rejection event.
   * Therefore, the following idioms are all equally correct:
   * ```ts
   * new CancellablePromise((resolve, reject) => { ... }).cancel();
   * new CancellablePromise((resolve, reject) => { ... }).then(...).cancel();
   * new CancellablePromise((resolve, reject) => { ... }).then(...).catch(...).cancel();
   * ```
   * Whenever some cancelled promise in a chain rejects with a `CancelError`
   * with the same cancellation cause as itself, the error will be discarded silently.
   * However, the `CancelError` _will still be delivered_ to all attached rejection handlers
   * added by {@link then} and related methods:
   * ```ts
   * let cancellable = new CancellablePromise((resolve, reject) => { ... });
   * cancellable.then(() => { ... }).catch(console.log);
   * cancellable.cancel(); // A CancelError is printed to the console.
   * ```
   * If the `CancelError` is not handled downstream by the time it reaches
   * a _non-cancelled_ promise, it _will_ trigger an unhandled rejection event,
   * just like normal rejections would:
   * ```ts
   * let cancellable = new CancellablePromise((resolve, reject) => { ... });
   * let chained = cancellable.then(() => { ... }).then(() => { ... }); // No catch...
   * cancellable.cancel(); // Unhandled rejection event on chained!
   * ```
   * Therefore, it is important to either cancel whole promise chains from their tail,
   * as shown in the correct idioms above, or take care of handling errors everywhere.
   *
   * @returns A cancellable promise that _fulfills_ after the cancel callback (if any)
   * and all handlers attached up to the call to cancel have run.
   * If the cancel callback returns a thenable, the promise returned by `cancel`
   * will also wait for that thenable to settle.
   * This enables callers to wait for the cancelled operation to terminate
   * without being forced to handle potential errors at the call site.
   * ```ts
   * cancellable.cancel().then(() => {
   *     // Cleanup finished, it's safe to do something else.
   * }, (err) => {
   *     // Unreachable: the promise returned from cancel will never reject.
   * });
   * ```
   * Note that the returned promise will _not_ handle implicitly any rejection
   * that might have occurred already in the cancelled chain.
   * It will just track whether registered handlers have been executed or not.
   * Therefore, unhandled rejections will never be silently handled by calling cancel.
   */
  cancel(cause) {
    return new CancellablePromise((resolve) => {
      Promise.all([
        this[cancelImplSym](new CancelError("Promise cancelled.", { cause })),
        currentBarrier(this)
      ]).then(() => resolve(), () => resolve());
    });
  }
  /**
   * Binds promise cancellation to the abort event of the given {@link AbortSignal}.
   * If the signal has already aborted, the promise will be cancelled immediately.
   * When either condition is verified, the cancellation cause will be set
   * to the signal's abort reason (see {@link AbortSignal#reason}).
   *
   * Has no effect if called (or if the signal aborts) _after_ the promise has already settled.
   * Only the first signal to abort will set the cancellation cause.
   *
   * For more details about the cancellation process,
   * see {@link cancel} and the `CancellablePromise` constructor.
   *
   * This method enables `await`ing cancellable promises without having
   * to store them for future cancellation, e.g.:
   * ```ts
   * await longRunningOperation().cancelOn(signal);
   * ```
   * instead of:
   * ```ts
   * let promiseToBeCancelled = longRunningOperation();
   * await promiseToBeCancelled;
   * ```
   *
   * @returns This promise, for method chaining.
   */
  cancelOn(signal) {
    if (signal.aborted) {
      void this.cancel(signal.reason);
    } else {
      signal.addEventListener("abort", () => void this.cancel(signal.reason), { capture: true });
    }
    return this;
  }
  /**
   * Attaches callbacks for the resolution and/or rejection of the `CancellablePromise`.
   *
   * The optional `oncancelled` argument will be invoked when the returned promise is cancelled,
   * with the same semantics as the `oncancelled` argument of the constructor.
   * When the parent promise rejects or is cancelled, the `onrejected` callback will run,
   * _even after the returned promise has been cancelled:_
   * in that case, should it reject or throw, the reason will be wrapped
   * in a {@link CancelledRejectionError} and bubbled up as an unhandled rejection.
   *
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A `CancellablePromise` for the completion of whichever callback is executed.
   * The returned promise is hooked up to propagate cancellation requests up the chain, but not down:
   *
   *   - if the parent promise is cancelled, the `onrejected` handler will be invoked with a `CancelError`
   *     and the returned promise _will resolve regularly_ with its result;
   *   - conversely, if the returned promise is cancelled, _the parent promise is cancelled too;_
   *     the `onrejected` handler will still be invoked with the parent's `CancelError`,
   *     but its result will be discarded
   *     and the returned promise will reject with a `CancelError` as well.
   *
   * The promise returned from {@link cancel} will fulfill only after all attached handlers
   * up the entire promise chain have been run.
   *
   * If either callback returns a cancellable promise,
   * cancellation requests will be diverted to it,
   * and the specified `oncancelled` callback will be discarded.
   */
  then(onfulfilled, onrejected, oncancelled) {
    if (!(this instanceof CancellablePromise)) {
      throw new TypeError("CancellablePromise.prototype.then called on an invalid object.");
    }
    if (!isCallable(onfulfilled)) {
      onfulfilled = identity;
    }
    if (!isCallable(onrejected)) {
      onrejected = thrower;
    }
    if (onfulfilled === identity && onrejected == thrower) {
      return new CancellablePromise((resolve) => resolve(this));
    }
    const barrier = {};
    this[barrierSym] = barrier;
    return new CancellablePromise((resolve, reject) => {
      void super.then((value) => {
        var _a2;
        if (this[barrierSym] === barrier) {
          this[barrierSym] = null;
        }
        (_a2 = barrier.resolve) === null || _a2 === void 0 ? void 0 : _a2.call(barrier);
        try {
          resolve(onfulfilled(value));
        } catch (err) {
          reject(err);
        }
      }, (reason) => {
        var _a2;
        if (this[barrierSym] === barrier) {
          this[barrierSym] = null;
        }
        (_a2 = barrier.resolve) === null || _a2 === void 0 ? void 0 : _a2.call(barrier);
        try {
          resolve(onrejected(reason));
        } catch (err) {
          reject(err);
        }
      });
    }, async (cause) => {
      try {
        return oncancelled === null || oncancelled === void 0 ? void 0 : oncancelled(cause);
      } finally {
        await this.cancel(cause);
      }
    });
  }
  /**
   * Attaches a callback for only the rejection of the Promise.
   *
   * The optional `oncancelled` argument will be invoked when the returned promise is cancelled,
   * with the same semantics as the `oncancelled` argument of the constructor.
   * When the parent promise rejects or is cancelled, the `onrejected` callback will run,
   * _even after the returned promise has been cancelled:_
   * in that case, should it reject or throw, the reason will be wrapped
   * in a {@link CancelledRejectionError} and bubbled up as an unhandled rejection.
   *
   * It is equivalent to
   * ```ts
   * cancellablePromise.then(undefined, onrejected, oncancelled);
   * ```
   * and the same caveats apply.
   *
   * @returns A Promise for the completion of the callback.
   * Cancellation requests on the returned promise
   * will propagate up the chain to the parent promise,
   * but not in the other direction.
   *
   * The promise returned from {@link cancel} will fulfill only after all attached handlers
   * up the entire promise chain have been run.
   *
   * If `onrejected` returns a cancellable promise,
   * cancellation requests will be diverted to it,
   * and the specified `oncancelled` callback will be discarded.
   * See {@link then} for more details.
   */
  catch(onrejected, oncancelled) {
    return this.then(void 0, onrejected, oncancelled);
  }
  /**
   * Attaches a callback that is invoked when the CancellablePromise is settled (fulfilled or rejected). The
   * resolved value cannot be accessed or modified from the callback.
   * The returned promise will settle in the same state as the original one
   * after the provided callback has completed execution,
   * unless the callback throws or returns a rejecting promise,
   * in which case the returned promise will reject as well.
   *
   * The optional `oncancelled` argument will be invoked when the returned promise is cancelled,
   * with the same semantics as the `oncancelled` argument of the constructor.
   * Once the parent promise settles, the `onfinally` callback will run,
   * _even after the returned promise has been cancelled:_
   * in that case, should it reject or throw, the reason will be wrapped
   * in a {@link CancelledRejectionError} and bubbled up as an unhandled rejection.
   *
   * This method is implemented in terms of {@link then} and the same caveats apply.
   * It is polyfilled, hence available in every OS/webview version.
   *
   * @returns A Promise for the completion of the callback.
   * Cancellation requests on the returned promise
   * will propagate up the chain to the parent promise,
   * but not in the other direction.
   *
   * The promise returned from {@link cancel} will fulfill only after all attached handlers
   * up the entire promise chain have been run.
   *
   * If `onfinally` returns a cancellable promise,
   * cancellation requests will be diverted to it,
   * and the specified `oncancelled` callback will be discarded.
   * See {@link then} for more details.
   */
  finally(onfinally, oncancelled) {
    if (!(this instanceof CancellablePromise)) {
      throw new TypeError("CancellablePromise.prototype.finally called on an invalid object.");
    }
    if (!isCallable(onfinally)) {
      return this.then(onfinally, onfinally, oncancelled);
    }
    return this.then((value) => CancellablePromise.resolve(onfinally()).then(() => value), (reason) => CancellablePromise.resolve(onfinally()).then(() => {
      throw reason;
    }), oncancelled);
  }
  /**
   * We use the `[Symbol.species]` static property, if available,
   * to disable the built-in automatic subclassing features from {@link Promise}.
   * It is critical for performance reasons that extenders do not override this.
   * Once the proposal at https://github.com/tc39/proposal-rm-builtin-subclassing
   * is either accepted or retired, this implementation will have to be revised accordingly.
   *
   * @ignore
   * @internal
   */
  static get [species]() {
    return Promise;
  }
  static all(values) {
    let collected = Array.from(values);
    const promise = collected.length === 0 ? CancellablePromise.resolve(collected) : new CancellablePromise((resolve, reject) => {
      void Promise.all(collected).then(resolve, reject);
    }, (cause) => cancelAll(promise, collected, cause));
    return promise;
  }
  static allSettled(values) {
    let collected = Array.from(values);
    const promise = collected.length === 0 ? CancellablePromise.resolve(collected) : new CancellablePromise((resolve, reject) => {
      void Promise.allSettled(collected).then(resolve, reject);
    }, (cause) => cancelAll(promise, collected, cause));
    return promise;
  }
  static any(values) {
    let collected = Array.from(values);
    const promise = collected.length === 0 ? CancellablePromise.resolve(collected) : new CancellablePromise((resolve, reject) => {
      void Promise.any(collected).then(resolve, reject);
    }, (cause) => cancelAll(promise, collected, cause));
    return promise;
  }
  static race(values) {
    let collected = Array.from(values);
    const promise = new CancellablePromise((resolve, reject) => {
      void Promise.race(collected).then(resolve, reject);
    }, (cause) => cancelAll(promise, collected, cause));
    return promise;
  }
  /**
   * Creates a new cancelled CancellablePromise for the provided cause.
   *
   * @group Static Methods
   */
  static cancel(cause) {
    const p = new CancellablePromise(() => {
    });
    p.cancel(cause);
    return p;
  }
  /**
   * Creates a new CancellablePromise that cancels
   * after the specified timeout, with the provided cause.
   *
   * If the {@link AbortSignal.timeout} factory method is available,
   * it is used to base the timeout on _active_ time rather than _elapsed_ time.
   * Otherwise, `timeout` falls back to {@link setTimeout}.
   *
   * @group Static Methods
   */
  static timeout(milliseconds, cause) {
    const promise = new CancellablePromise(() => {
    });
    if (AbortSignal && typeof AbortSignal === "function" && AbortSignal.timeout && typeof AbortSignal.timeout === "function") {
      AbortSignal.timeout(milliseconds).addEventListener("abort", () => void promise.cancel(cause));
    } else {
      setTimeout(() => void promise.cancel(cause), milliseconds);
    }
    return promise;
  }
  static sleep(milliseconds, value) {
    return new CancellablePromise((resolve) => {
      setTimeout(() => resolve(value), milliseconds);
    });
  }
  /**
   * Creates a new rejected CancellablePromise for the provided reason.
   *
   * @group Static Methods
   */
  static reject(reason) {
    return new CancellablePromise((_, reject) => reject(reason));
  }
  static resolve(value) {
    if (value instanceof CancellablePromise) {
      return value;
    }
    return new CancellablePromise((resolve) => resolve(value));
  }
  /**
   * Creates a new CancellablePromise and returns it in an object, along with its resolve and reject functions
   * and a getter/setter for the cancellation callback.
   *
   * This method is polyfilled, hence available in every OS/webview version.
   *
   * @group Static Methods
   */
  static withResolvers() {
    let result = { oncancelled: null };
    result.promise = new CancellablePromise((resolve, reject) => {
      result.resolve = resolve;
      result.reject = reject;
    }, (cause) => {
      var _a2;
      (_a2 = result.oncancelled) === null || _a2 === void 0 ? void 0 : _a2.call(result, cause);
    });
    return result;
  }
}
function cancellerFor(promise, state) {
  let cancellationPromise = void 0;
  return (reason) => {
    if (!state.settled) {
      state.settled = true;
      state.reason = reason;
      promise.reject(reason);
      void Promise.prototype.then.call(promise.promise, void 0, (err) => {
        if (err !== reason) {
          throw err;
        }
      });
    }
    if (!state.reason || !promise.oncancelled) {
      return;
    }
    cancellationPromise = new Promise((resolve) => {
      try {
        resolve(promise.oncancelled(state.reason.cause));
      } catch (err) {
        Promise.reject(new CancelledRejectionError(promise.promise, err, "Unhandled exception in oncancelled callback."));
      }
    }).catch((reason2) => {
      Promise.reject(new CancelledRejectionError(promise.promise, reason2, "Unhandled rejection in oncancelled callback."));
    });
    promise.oncancelled = null;
    return cancellationPromise;
  };
}
function resolverFor(promise, state) {
  return (value) => {
    if (state.resolving) {
      return;
    }
    state.resolving = true;
    if (value === promise.promise) {
      if (state.settled) {
        return;
      }
      state.settled = true;
      promise.reject(new TypeError("A promise cannot be resolved with itself."));
      return;
    }
    if (value != null && (typeof value === "object" || typeof value === "function")) {
      let then;
      try {
        then = value.then;
      } catch (err) {
        state.settled = true;
        promise.reject(err);
        return;
      }
      if (isCallable(then)) {
        try {
          let cancel = value.cancel;
          if (isCallable(cancel)) {
            const oncancelled = (cause) => {
              Reflect.apply(cancel, value, [cause]);
            };
            if (state.reason) {
              void cancellerFor(Object.assign(Object.assign({}, promise), { oncancelled }), state)(state.reason);
            } else {
              promise.oncancelled = oncancelled;
            }
          }
        } catch (_a2) {
        }
        const newState = {
          root: state.root,
          resolving: false,
          get settled() {
            return this.root.settled;
          },
          set settled(value2) {
            this.root.settled = value2;
          },
          get reason() {
            return this.root.reason;
          }
        };
        const rejector = rejectorFor(promise, newState);
        try {
          Reflect.apply(then, value, [resolverFor(promise, newState), rejector]);
        } catch (err) {
          rejector(err);
        }
        return;
      }
    }
    if (state.settled) {
      return;
    }
    state.settled = true;
    promise.resolve(value);
  };
}
function rejectorFor(promise, state) {
  return (reason) => {
    if (state.resolving) {
      return;
    }
    state.resolving = true;
    if (state.settled) {
      try {
        if (reason instanceof CancelError && state.reason instanceof CancelError && Object.is(reason.cause, state.reason.cause)) {
          return;
        }
      } catch (_a2) {
      }
      void Promise.reject(new CancelledRejectionError(promise.promise, reason));
    } else {
      state.settled = true;
      promise.reject(reason);
    }
  };
}
function cancelAll(parent, values, cause) {
  const results = [];
  for (const value of values) {
    let cancel;
    try {
      if (!isCallable(value.then)) {
        continue;
      }
      cancel = value.cancel;
      if (!isCallable(cancel)) {
        continue;
      }
    } catch (_a2) {
      continue;
    }
    let result;
    try {
      result = Reflect.apply(cancel, value, [cause]);
    } catch (err) {
      Promise.reject(new CancelledRejectionError(parent, err, "Unhandled exception in cancel method."));
      continue;
    }
    if (!result) {
      continue;
    }
    results.push((result instanceof Promise ? result : Promise.resolve(result)).catch((reason) => {
      Promise.reject(new CancelledRejectionError(parent, reason, "Unhandled rejection in cancel method."));
    }));
  }
  return Promise.all(results);
}
function identity(x) {
  return x;
}
function thrower(reason) {
  throw reason;
}
function errorMessage(err) {
  try {
    if (err instanceof Error || typeof err !== "object" || err.toString !== Object.prototype.toString) {
      return "" + err;
    }
  } catch (_a2) {
  }
  try {
    return JSON.stringify(err);
  } catch (_b) {
  }
  try {
    return Object.prototype.toString.call(err);
  } catch (_c) {
  }
  return "<could not convert error to string>";
}
function currentBarrier(promise) {
  var _a2;
  let pwr = (_a2 = promise[barrierSym]) !== null && _a2 !== void 0 ? _a2 : {};
  if (!("promise" in pwr)) {
    Object.assign(pwr, promiseWithResolvers());
  }
  if (promise[barrierSym] == null) {
    pwr.resolve();
    promise[barrierSym] = pwr;
  }
  return pwr.promise;
}
let promiseWithResolvers = Promise.withResolvers;
if (promiseWithResolvers && typeof promiseWithResolvers === "function") {
  promiseWithResolvers = promiseWithResolvers.bind(Promise);
} else {
  promiseWithResolvers = function() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
window._wails = window._wails || {};
window._wails.callResultHandler = resultHandler;
window._wails.callErrorHandler = errorHandler;
const call = newRuntimeCaller(objectNames.Call);
const cancelCall = newRuntimeCaller(objectNames.CancelCall);
const callResponses = /* @__PURE__ */ new Map();
const CallBinding = 0;
const CancelMethod = 0;
class RuntimeError extends Error {
  /**
   * Constructs a new RuntimeError instance.
   * @param message - The error message.
   * @param options - Options to be forwarded to the Error constructor.
   */
  constructor(message, options) {
    super(message, options);
    this.name = "RuntimeError";
  }
}
function resultHandler(id, data, isJSON) {
  const resolvers = getAndDeleteResponse(id);
  if (!resolvers) {
    return;
  }
  if (!data) {
    resolvers.resolve(void 0);
  } else if (!isJSON) {
    resolvers.resolve(data);
  } else {
    try {
      resolvers.resolve(JSON.parse(data));
    } catch (err) {
      resolvers.reject(new TypeError("could not parse result: " + err.message, { cause: err }));
    }
  }
}
function errorHandler(id, data, isJSON) {
  const resolvers = getAndDeleteResponse(id);
  if (!resolvers) {
    return;
  }
  if (!isJSON) {
    resolvers.reject(new Error(data));
  } else {
    let error;
    try {
      error = JSON.parse(data);
    } catch (err) {
      resolvers.reject(new TypeError("could not parse error: " + err.message, { cause: err }));
      return;
    }
    let options = {};
    if (error.cause) {
      options.cause = error.cause;
    }
    let exception;
    switch (error.kind) {
      case "ReferenceError":
        exception = new ReferenceError(error.message, options);
        break;
      case "TypeError":
        exception = new TypeError(error.message, options);
        break;
      case "RuntimeError":
        exception = new RuntimeError(error.message, options);
        break;
      default:
        exception = new Error(error.message, options);
        break;
    }
    resolvers.reject(exception);
  }
}
function getAndDeleteResponse(id) {
  const response = callResponses.get(id);
  callResponses.delete(id);
  return response;
}
function generateID() {
  let result;
  do {
    result = nanoid();
  } while (callResponses.has(result));
  return result;
}
function Call(options) {
  const id = generateID();
  const result = CancellablePromise.withResolvers();
  callResponses.set(id, { resolve: result.resolve, reject: result.reject });
  const request = call(CallBinding, Object.assign({ "call-id": id }, options));
  let running = false;
  request.then(() => {
    running = true;
  }, (err) => {
    callResponses.delete(id);
    result.reject(err);
  });
  const cancel = () => {
    callResponses.delete(id);
    return cancelCall(CancelMethod, { "call-id": id }).catch((err) => {
      console.error("Error while requesting binding call cancellation:", err);
    });
  };
  result.oncancelled = () => {
    if (running) {
      return cancel();
    } else {
      return request.then(cancel);
    }
  };
  return result.promise;
}
function ByID(methodID, ...args) {
  return Call({ methodID, args });
}
function Any(source) {
  return source;
}
function Array$1(element) {
  if (element === Any) {
    return (source) => source === null ? [] : source;
  }
  return (source) => {
    if (source === null) {
      return [];
    }
    for (let i = 0; i < source.length; i++) {
      source[i] = element(source[i]);
    }
    return source;
  };
}
function Nullable(element) {
  if (element === Any) {
    return Any;
  }
  return (source) => source === null ? null : element(source);
}
window._wails = window._wails || {};
window._wails.invoke = invoke;
invoke("wails:runtime:ready");
class LogData {
  /**
   * Creates a new LogData instance.
   * @param {Partial<LogData>} [$$source = {}] - The source object to create the LogData.
   */
  constructor($$source = {}) {
    if (!("stdout" in $$source)) {
      this["stdout"] = [];
    }
    if (!("stderr" in $$source)) {
      this["stderr"] = [];
    }
    Object.assign(this, $$source);
  }
  /**
   * Creates a new LogData instance from a string or object.
   * @param {any} [$$source = {}]
   * @returns {LogData}
   */
  static createFrom($$source = {}) {
    const $$createField0_0 = $$createType0$1;
    const $$createField1_0 = $$createType0$1;
    let $$parsedSource = typeof $$source === "string" ? JSON.parse($$source) : $$source;
    if ("stdout" in $$parsedSource) {
      $$parsedSource["stdout"] = $$createField0_0($$parsedSource["stdout"]);
    }
    if ("stderr" in $$parsedSource) {
      $$parsedSource["stderr"] = $$createField1_0($$parsedSource["stderr"]);
    }
    return new LogData(
      /** @type {Partial<LogData>} */
      $$parsedSource
    );
  }
}
class MetricsData {
  /**
   * Creates a new MetricsData instance.
   * @param {Partial<MetricsData>} [$$source = {}] - The source object to create the MetricsData.
   */
  constructor($$source = {}) {
    if (!("totalProcesses" in $$source)) {
      this["totalProcesses"] = 0;
    }
    if (!("running" in $$source)) {
      this["running"] = 0;
    }
    if (!("errored" in $$source)) {
      this["errored"] = 0;
    }
    if (!("stopped" in $$source)) {
      this["stopped"] = 0;
    }
    if (!("totalMemory" in $$source)) {
      this["totalMemory"] = 0;
    }
    if (!("totalCPU" in $$source)) {
      this["totalCPU"] = 0;
    }
    Object.assign(this, $$source);
  }
  /**
   * Creates a new MetricsData instance from a string or object.
   * @param {any} [$$source = {}]
   * @returns {MetricsData}
   */
  static createFrom($$source = {}) {
    let $$parsedSource = typeof $$source === "string" ? JSON.parse($$source) : $$source;
    return new MetricsData(
      /** @type {Partial<MetricsData>} */
      $$parsedSource
    );
  }
}
class OperationResult {
  /**
   * Creates a new OperationResult instance.
   * @param {Partial<OperationResult>} [$$source = {}] - The source object to create the OperationResult.
   */
  constructor($$source = {}) {
    if (!("success" in $$source)) {
      this["success"] = false;
    }
    if (!("message" in $$source)) {
      this["message"] = "";
    }
    Object.assign(this, $$source);
  }
  /**
   * Creates a new OperationResult instance from a string or object.
   * @param {any} [$$source = {}]
   * @returns {OperationResult}
   */
  static createFrom($$source = {}) {
    let $$parsedSource = typeof $$source === "string" ? JSON.parse($$source) : $$source;
    return new OperationResult(
      /** @type {Partial<OperationResult>} */
      $$parsedSource
    );
  }
}
class PM2VersionInfo {
  /**
   * Creates a new PM2VersionInfo instance.
   * @param {Partial<PM2VersionInfo>} [$$source = {}] - The source object to create the PM2VersionInfo.
   */
  constructor($$source = {}) {
    if (!("version" in $$source)) {
      this["version"] = "";
    }
    if (!("installed" in $$source)) {
      this["installed"] = false;
    }
    if (!("message" in $$source)) {
      this["message"] = "";
    }
    Object.assign(this, $$source);
  }
  /**
   * Creates a new PM2VersionInfo instance from a string or object.
   * @param {any} [$$source = {}]
   * @returns {PM2VersionInfo}
   */
  static createFrom($$source = {}) {
    let $$parsedSource = typeof $$source === "string" ? JSON.parse($$source) : $$source;
    return new PM2VersionInfo(
      /** @type {Partial<PM2VersionInfo>} */
      $$parsedSource
    );
  }
}
class ProcessInfo {
  /**
   * Creates a new ProcessInfo instance.
   * @param {Partial<ProcessInfo>} [$$source = {}] - The source object to create the ProcessInfo.
   */
  constructor($$source = {}) {
    if (!("id" in $$source)) {
      this["id"] = 0;
    }
    if (!("name" in $$source)) {
      this["name"] = "";
    }
    if (!("status" in $$source)) {
      this["status"] = "";
    }
    if (!("cpu" in $$source)) {
      this["cpu"] = 0;
    }
    if (!("memory" in $$source)) {
      this["memory"] = 0;
    }
    if (!("uptime" in $$source)) {
      this["uptime"] = 0;
    }
    if (!("startedAt" in $$source)) {
      this["startedAt"] = "";
    }
    if (!("runtime" in $$source)) {
      this["runtime"] = "";
    }
    if (!("pid" in $$source)) {
      this["pid"] = 0;
    }
    if (!("user" in $$source)) {
      this["user"] = "";
    }
    if (!("command" in $$source)) {
      this["command"] = "";
    }
    if (!("script" in $$source)) {
      this["script"] = "";
    }
    if (!("autoStart" in $$source)) {
      this["autoStart"] = false;
    }
    Object.assign(this, $$source);
  }
  /**
   * Creates a new ProcessInfo instance from a string or object.
   * @param {any} [$$source = {}]
   * @returns {ProcessInfo}
   */
  static createFrom($$source = {}) {
    let $$parsedSource = typeof $$source === "string" ? JSON.parse($$source) : $$source;
    return new ProcessInfo(
      /** @type {Partial<ProcessInfo>} */
      $$parsedSource
    );
  }
}
const $$createType0$1 = Array$1(Any);
function AddProcess(config) {
  let $resultPromise = (
    /** @type {any} */
    ByID(3944241078, config)
  );
  let $typingPromise = (
    /** @type {any} */
    $resultPromise.then(($result) => {
      return $$createType1($result);
    })
  );
  $typingPromise.cancel = $resultPromise.cancel.bind($resultPromise);
  return $typingPromise;
}
function DeleteProcess(processId) {
  let $resultPromise = (
    /** @type {any} */
    ByID(3080829698, processId)
  );
  let $typingPromise = (
    /** @type {any} */
    $resultPromise.then(($result) => {
      return $$createType1($result);
    })
  );
  $typingPromise.cancel = $resultPromise.cancel.bind($resultPromise);
  return $typingPromise;
}
function GetLogs(id) {
  let $resultPromise = (
    /** @type {any} */
    ByID(3173972357, id)
  );
  let $typingPromise = (
    /** @type {any} */
    $resultPromise.then(($result) => {
      return $$createType3($result);
    })
  );
  $typingPromise.cancel = $resultPromise.cancel.bind($resultPromise);
  return $typingPromise;
}
function GetMetrics() {
  let $resultPromise = (
    /** @type {any} */
    ByID(1999670315)
  );
  let $typingPromise = (
    /** @type {any} */
    $resultPromise.then(($result) => {
      return $$createType5($result);
    })
  );
  $typingPromise.cancel = $resultPromise.cancel.bind($resultPromise);
  return $typingPromise;
}
function GetPM2Version() {
  let $resultPromise = (
    /** @type {any} */
    ByID(400493671)
  );
  let $typingPromise = (
    /** @type {any} */
    $resultPromise.then(($result) => {
      return $$createType7($result);
    })
  );
  $typingPromise.cancel = $resultPromise.cancel.bind($resultPromise);
  return $typingPromise;
}
function ListProcesses() {
  let $resultPromise = (
    /** @type {any} */
    ByID(1687570995)
  );
  let $typingPromise = (
    /** @type {any} */
    $resultPromise.then(($result) => {
      return $$createType9($result);
    })
  );
  $typingPromise.cancel = $resultPromise.cancel.bind($resultPromise);
  return $typingPromise;
}
function RestartAllProcesses() {
  let $resultPromise = (
    /** @type {any} */
    ByID(3044283317)
  );
  let $typingPromise = (
    /** @type {any} */
    $resultPromise.then(($result) => {
      return $$createType1($result);
    })
  );
  $typingPromise.cancel = $resultPromise.cancel.bind($resultPromise);
  return $typingPromise;
}
function RestartProcess(id) {
  let $resultPromise = (
    /** @type {any} */
    ByID(2524949450, id)
  );
  let $typingPromise = (
    /** @type {any} */
    $resultPromise.then(($result) => {
      return $$createType1($result);
    })
  );
  $typingPromise.cancel = $resultPromise.cancel.bind($resultPromise);
  return $typingPromise;
}
function StartAllProcesses() {
  let $resultPromise = (
    /** @type {any} */
    ByID(2260572278)
  );
  let $typingPromise = (
    /** @type {any} */
    $resultPromise.then(($result) => {
      return $$createType1($result);
    })
  );
  $typingPromise.cancel = $resultPromise.cancel.bind($resultPromise);
  return $typingPromise;
}
function StartProcess(id) {
  let $resultPromise = (
    /** @type {any} */
    ByID(4010452023, id)
  );
  let $typingPromise = (
    /** @type {any} */
    $resultPromise.then(($result) => {
      return $$createType1($result);
    })
  );
  $typingPromise.cancel = $resultPromise.cancel.bind($resultPromise);
  return $typingPromise;
}
function StopAllProcesses() {
  let $resultPromise = (
    /** @type {any} */
    ByID(1838046614)
  );
  let $typingPromise = (
    /** @type {any} */
    $resultPromise.then(($result) => {
      return $$createType1($result);
    })
  );
  $typingPromise.cancel = $resultPromise.cancel.bind($resultPromise);
  return $typingPromise;
}
function StopProcess(id) {
  let $resultPromise = (
    /** @type {any} */
    ByID(2492013207, id)
  );
  let $typingPromise = (
    /** @type {any} */
    $resultPromise.then(($result) => {
      return $$createType1($result);
    })
  );
  $typingPromise.cancel = $resultPromise.cancel.bind($resultPromise);
  return $typingPromise;
}
function UpdateProcess(processId, config) {
  let $resultPromise = (
    /** @type {any} */
    ByID(1439448800, processId, config)
  );
  let $typingPromise = (
    /** @type {any} */
    $resultPromise.then(($result) => {
      return $$createType1($result);
    })
  );
  $typingPromise.cancel = $resultPromise.cancel.bind($resultPromise);
  return $typingPromise;
}
const $$createType0 = OperationResult.createFrom;
const $$createType1 = Nullable($$createType0);
const $$createType2 = LogData.createFrom;
const $$createType3 = Nullable($$createType2);
const $$createType4 = MetricsData.createFrom;
const $$createType5 = Nullable($$createType4);
const $$createType6 = PM2VersionInfo.createFrom;
const $$createType7 = Nullable($$createType6);
const $$createType8 = ProcessInfo.createFrom;
const $$createType9 = Array$1($$createType8);
let processes = [];
let metrics = {};
let selectedProcesses = /* @__PURE__ */ new Set();
let currentLogContent = "";
document.addEventListener("DOMContentLoaded", () => {
  refreshData();
  loadPM2Version();
  setInterval(refreshData, 5e3);
  console.log("deleteProcess function available:", typeof window.deleteProcess);
  window.startAllProcesses = startAllProcesses;
  window.stopAllProcesses = stopAllProcesses;
  window.restartAllProcesses = restartAllProcesses;
  window.refreshData = refreshData;
  window.startProcess = startProcess;
  window.stopProcess = stopProcess;
  window.restartProcess = restartProcess;
  window.showLogs = showLogs;
  window.closeLogModal = closeLogModal;
  window.copyLogsToClipboard = copyLogsToClipboard;
  window.exportLogsToFile = exportLogsToFile;
  window.toggleSelectAll = toggleSelectAll;
  window.toggleProcessSelection = toggleProcessSelection;
  window.showAddProcessDialog = showAddProcessDialog;
  window.showEditProcessDialog = showEditProcessDialog;
  window.deleteProcess = deleteProcess;
});
window.refreshData = async () => {
  try {
    await Promise.all([
      loadMetrics(),
      loadProcesses()
    ]);
  } catch (error) {
    console.error("Error refreshing data:", error);
    showError("刷新数据失败: " + error.message);
  }
};
async function loadMetrics() {
  try {
    metrics = await GetMetrics();
    updateMetricsDisplay();
  } catch (error) {
    console.error("Error loading metrics:", error);
    throw error;
  }
}
async function loadProcesses() {
  try {
    processes = await ListProcesses();
    updateProcessesDisplay();
  } catch (error) {
    console.error("Error loading processes:", error);
    throw error;
  }
}
async function loadPM2Version() {
  try {
    const versionInfo = await GetPM2Version();
    updatePM2VersionDisplay(versionInfo);
  } catch (error) {
    console.error("Error loading PM2 version:", error);
    updatePM2VersionDisplay({
      installed: false,
      message: "PM2 状态未知"
    });
  }
}
function updateMetricsDisplay() {
  document.getElementById("total-processes").textContent = metrics.totalProcesses || 0;
  document.getElementById("running-processes").textContent = metrics.running || 0;
  document.getElementById("errored-processes").textContent = metrics.errored || 0;
  document.getElementById("stopped-processes").textContent = metrics.stopped || 0;
}
function updatePM2VersionDisplay(versionInfo) {
  const versionElement = document.getElementById("pm2-version");
  if (versionElement) {
    versionElement.textContent = versionInfo.message;
    versionElement.className = versionInfo.installed ? "pm2-version installed" : "pm2-version not-installed";
  }
}
function updateProcessesDisplay() {
  const container = document.getElementById("processes-list");
  if (!processes || processes.length === 0) {
    container.innerHTML = '<tr><td colspan="7" class="loading">暂无进程</td></tr>';
    return;
  }
  container.innerHTML = processes.map((process) => `
        <tr>
            <td>
                <input type="checkbox"
                       class="process-checkbox"
                       value="${process.id}"
                       onchange="toggleProcessSelection(${process.id})"
                       ${selectedProcesses.has(process.id) ? "checked" : ""}/>
            </td>
            <td>
                <div class="process-name">${process.name}</div>
                
                <div class="process-user">User: ${process.user || "-"} | Auto Start: ${process.autoStart ? "✓" : "✗"}</div>
                <div class="process-command" title="${process.command || "-"}">${truncateText(process.command || "-", 50)}</div>
            </td>
            <td>
                <div class="process-id">ID: ${process.id} | PID: ${process.pid || "-"}</div>
            </td>
            <td>
                <span class="status ${getStatusClass(process.status)}">${getStatusText(process.status)}</span>
            </td>
            <td>${process.cpu ? process.cpu.toFixed(1) + "%" : "0%"}</td>
            <td>${formatMemory(process.memory)}</td>
            <td>${process.startedAt || "-"}</td>
            <td>${process.runtime || "-"}</td>
            <td>
                <div class="actions">
                    ${process.status === "online" ? `<button class="btn danger" onclick="stopProcess(${process.id})">停止</button>
                         <button class="btn secondary" onclick="restartProcess(${process.id})">重启</button>` : `<button class="btn success" onclick="startProcess(${process.id})">启动</button>`}
                    <button class="btn outline" onclick="showLogs(${process.id}, '${process.name}')">日志</button>
                    <button class="btn outline" onclick="showEditProcessDialog(${process.id})">编辑</button>
                    <button class="btn danger" onclick="deleteProcess(${process.id})">删除</button>
                </div>
            </td>
        </tr>
    `).join("");
}
function getStatusClass(status) {
  switch (status) {
    case "online":
      return "online";
    case "stopped":
      return "stopped";
    case "error":
      return "error";
    default:
      return "stopped";
  }
}
function getStatusText(status) {
  switch (status) {
    case "online":
      return "运行中";
    case "stopped":
      return "已停止";
    case "error":
      return "异常";
    default:
      return "未知";
  }
}
function formatMemory(bytes) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
}
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
window.startProcess = async (id) => {
  try {
    const result = await StartProcess(id);
    if (result.success) {
      showSuccess(`进程 ${id} 启动成功`);
      await refreshData();
    } else {
      showError(`启动失败: ${result.message}`);
    }
  } catch (error) {
    showError(`启动进程失败: ${error.message}`);
  }
};
window.stopProcess = async (id) => {
  try {
    const result = await StopProcess(id);
    if (result.success) {
      showSuccess(`进程 ${id} 停止成功`);
      await refreshData();
    } else {
      showError(`停止失败: ${result.message}`);
    }
  } catch (error) {
    showError(`停止进程失败: ${error.message}`);
  }
};
window.restartProcess = async (id) => {
  try {
    const result = await RestartProcess(id);
    if (result.success) {
      showSuccess(`进程 ${id} 重启成功`);
      await refreshData();
    } else {
      showError(`重启失败: ${result.message}`);
    }
  } catch (error) {
    showError(`重启进程失败: ${error.message}`);
  }
};
window.startAllProcesses = async () => {
  try {
    const result = await StartAllProcesses();
    if (result.success) {
      showSuccess(result.message);
    } else {
      showError(result.message || result.error);
    }
    await refreshData();
  } catch (error) {
    showError(`启动所有进程失败: ${error.message}`);
  }
};
window.stopAllProcesses = async () => {
  try {
    const result = await StopAllProcesses();
    if (result.success) {
      showSuccess(result.message);
    } else {
      showError(result.message || result.error);
    }
    await refreshData();
  } catch (error) {
    showError(`停止所有进程失败: ${error.message}`);
  }
};
window.restartAllProcesses = async () => {
  try {
    const result = await RestartAllProcesses();
    if (result.success) {
      showSuccess(result.message);
    } else {
      showError(result.message || result.error);
    }
    await refreshData();
  } catch (error) {
    showError(`重启所有进程失败: ${error.message}`);
  }
};
window.toggleSelectAll = () => {
  const selectAllCheckbox = document.getElementById("select-all");
  const processCheckboxes = document.querySelectorAll(".process-checkbox[value]");
  if (selectAllCheckbox.checked) {
    processCheckboxes.forEach((checkbox) => {
      checkbox.checked = true;
      selectedProcesses.add(parseInt(checkbox.value));
    });
  } else {
    processCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
    selectedProcesses.clear();
  }
};
window.toggleProcessSelection = (id) => {
  if (selectedProcesses.has(id)) {
    selectedProcesses.delete(id);
  } else {
    selectedProcesses.add(id);
  }
  const selectAllCheckbox = document.getElementById("select-all");
  const processCheckboxes = document.querySelectorAll(".process-checkbox[value]");
  const checkedCount = Array.from(processCheckboxes).filter((cb) => cb.checked).length;
  selectAllCheckbox.checked = checkedCount === processCheckboxes.length;
  selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < processCheckboxes.length;
};
window.showLogs = async (id, name) => {
  try {
    document.getElementById("modal-title").textContent = `${name} (ID: ${id}) - 进程日志`;
    document.getElementById("log-modal").classList.add("show");
    document.getElementById("logs-container").innerHTML = '<div class="loading">加载日志中...</div>';
    const logData = await GetLogs(id);
    currentLogContent = logData.content || "暂无日志";
    displayLogs(currentLogContent);
  } catch (error) {
    console.error("Error loading logs:", error);
    document.getElementById("logs-container").innerHTML = '<div class="error">加载日志失败: ' + error.message + "</div>";
  }
};
window.closeLogModal = () => {
  document.getElementById("log-modal").classList.remove("show");
  currentLogContent = "";
};
window.copyLogsToClipboard = async () => {
  if (!currentLogContent) {
    showError("没有可复制的日志内容");
    return;
  }
  try {
    await navigator.clipboard.writeText(currentLogContent);
    showSuccess("日志已复制到剪贴板");
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = currentLogContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    showSuccess("日志已复制到剪贴板");
  }
};
window.exportLogsToFile = () => {
  if (!currentLogContent) {
    showError("没有可导出的日志内容");
    return;
  }
  const processName = document.getElementById("modal-title").textContent.split(" ")[0];
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const filename = `${processName}-logs-${timestamp}.txt`;
  const blob = new Blob([currentLogContent], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  showSuccess(`日志已导出为 ${filename}`);
};
function displayLogs(logContent) {
  const container = document.getElementById("logs-container");
  if (!logContent || logContent.trim() === "") {
    container.innerHTML = '<div class="loading">暂无日志</div>';
    return;
  }
  const lines = logContent.split("\n");
  const formattedLines = lines.map((line) => {
    let className = "log-line";
    if (line.toLowerCase().includes("error")) {
      className += " error";
    } else if (line.toLowerCase().includes("warn")) {
      className += " warn";
    } else if (line.toLowerCase().includes("info")) {
      className += " info";
    }
    return `<div class="${className}">${escapeHtml(line)}</div>`;
  }).join("");
  container.innerHTML = formattedLines;
  container.scrollTop = container.scrollHeight;
}
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function showSuccess(message) {
  showNotification(message, "success");
}
function showError(message) {
  showNotification(message, "error");
}
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        word-wrap: break-word;
        transition: all 0.3s ease;
    `;
  switch (type) {
    case "success":
      notification.style.backgroundColor = "#10b981";
      break;
    case "error":
      notification.style.backgroundColor = "#ef4444";
      break;
    case "info":
      notification.style.backgroundColor = "#3b82f6";
      break;
    default:
      notification.style.backgroundColor = "#6b7280";
  }
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3e3);
}
window.showAddProcessDialog = function() {
  const dialog = createProcessDialog("add");
  document.body.appendChild(dialog);
};
window.showEditProcessDialog = function(processId) {
  const process = processes.find((p) => p.id === processId);
  if (!process) {
    showError("进程不存在");
    return;
  }
  const dialog = createProcessDialog("edit", process);
  document.body.appendChild(dialog);
};
async function deleteProcess(processId) {
  console.log("deleteProcess called with ID:", processId);
  const confirmDialog = createConfirmDialog(
    "确认删除",
    `确定要删除进程 ${processId} 吗？此操作不可撤销。`,
    async () => {
      try {
        console.log("Calling PM2Service.DeleteProcess...");
        const result = await DeleteProcess(processId);
        console.log("Delete result:", result);
        if (result.success) {
          showSuccess(`进程 ${processId} 删除成功`);
          await refreshData();
        } else {
          showError(result.message || "删除进程失败");
        }
      } catch (error) {
        console.error("Error deleting process:", error);
        showError("删除进程时发生错误: " + error.message);
      }
    }
  );
  document.body.appendChild(confirmDialog);
}
function createProcessDialog(mode, process = null) {
  const dialog = document.createElement("div");
  dialog.className = "modal show";
  dialog.style.zIndex = "2000";
  const isEdit = mode === "edit";
  const title = isEdit ? "编辑进程" : "添加新进程";
  dialog.innerHTML = `
        <div class="modal-content" style="max-width: 500px; height: auto;">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-btn" onclick="closeProcessDialog()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <form id="process-form" style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">进程名称 *</label>
                        <input type="text" id="process-name" required
                               style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                               value="${process ? process.name : ""}" placeholder="my-app">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">脚本路径 *</label>
                        <input type="text" id="process-script" required
                               style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                               value="${process ? process.script : ""}" placeholder="/path/to/app.js 或 npm start">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">工作目录</label>
                        <input type="text" id="process-cwd"
                               style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                               value="" placeholder="/path/to/project">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">启动参数</label>
                        <input type="text" id="process-args"
                               style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                               value="" placeholder="--port 3000">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">实例数量</label>
                        <input type="number" id="process-instances" min="1"
                               style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                               value="1">
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="process-autostart" ${process && process.autoStart ? "checked" : ""}>
                        <label for="process-autostart">开机自启</label>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                        <button type="button" class="btn outline" onclick="closeProcessDialog()">取消</button>
                        <button type="submit" class="btn primary">${isEdit ? "更新" : "添加"}</button>
                    </div>
                </form>
            </div>
        </div>
    `;
  const form = dialog.querySelector("#process-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const config = {
      name: document.getElementById("process-name").value.trim(),
      script: document.getElementById("process-script").value.trim(),
      cwd: document.getElementById("process-cwd").value.trim(),
      args: document.getElementById("process-args").value.trim(),
      instances: parseInt(document.getElementById("process-instances").value) || 1,
      autoStart: document.getElementById("process-autostart").checked
    };
    if (!config.name || !config.script) {
      showError("进程名称和脚本路径不能为空");
      return;
    }
    try {
      let result;
      if (isEdit) {
        result = await UpdateProcess(process.id, config);
      } else {
        result = await AddProcess(config);
      }
      if (result.success) {
        showSuccess(result.message || `进程${isEdit ? "更新" : "添加"}成功`);
        closeProcessDialog();
        await refreshData();
      } else {
        showError(result.message || `${isEdit ? "更新" : "添加"}进程失败`);
      }
    } catch (error) {
      console.error(`Error ${isEdit ? "updating" : "adding"} process:`, error);
      showError(`${isEdit ? "更新" : "添加"}进程时发生错误: ` + error.message);
    }
  });
  return dialog;
}
function closeProcessDialog() {
  const dialogs = document.querySelectorAll('.modal[style*="z-index: 2000"]');
  dialogs.forEach((dialog) => {
    if (dialog.parentNode) {
      document.body.removeChild(dialog);
    }
  });
}
window.closeProcessDialog = closeProcessDialog;
document.addEventListener("click", (e) => {
  const modal = document.getElementById("log-modal");
  if (e.target === modal) {
    closeLogModal();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLogModal();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "r") {
    e.preventDefault();
    refreshData();
  }
});
function createConfirmDialog(title, message, onConfirm) {
  const dialog = document.createElement("div");
  dialog.className = "modal show";
  dialog.style.zIndex = "2000";
  dialog.innerHTML = `
        <div class="modal-content" style="width: 400px; height: auto; max-width: 90vw;">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <p style="margin-bottom: 20px; color: #374151;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn outline" onclick="this.closest('.modal').remove()">取消</button>
                    <button class="btn danger confirm-btn">确认删除</button>
                </div>
            </div>
        </div>
    `;
  const confirmBtn = dialog.querySelector(".confirm-btn");
  confirmBtn.addEventListener("click", () => {
    dialog.remove();
    onConfirm();
  });
  return dialog;
}
console.log("PM2 Manager frontend loaded successfully");
