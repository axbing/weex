const {
  setTimeout, setTimeoutNative, clearTimeout
} = global

// fix no setTimeout on Android V8
if (typeof setTimeout === 'undefined' &&
  typeof setTimeoutNative === 'function') {
  const timeoutMap = {}
  let timeoutId = 0
  global.setTimeout = (cb, time) => {
    timeoutMap[++timeoutId] = cb
    setTimeoutNative(timeoutId.toString(), time)
  }
  global.setTimeoutCallback = (id) => {
    if (typeof timeoutMap[id] === 'function') {
      timeoutMap[id]()
      delete timeoutMap[id]
    }
  }
}

if (typeof clearTimeout === 'undefined') {
  global.clearTimeout = (timeoutId) => {
    timeoutId && (timeoutMap[timeoutId] = null);
  };
}