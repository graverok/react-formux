// @flow

/*::
  import { State, Keys, Name, Value } from './flowTypes'
*/

export const getKeys = function (name /*: Name */) /*: Keys */ {
  if (!name) {
    return []
  }

  return name.replace(/\[/g, '.').split('.').map(
    x => x.substr(-1) === ']' ? Number(x.substr(0, x.length - 1)) : String(x)
  )
}

export const getStoreData = function (
  state /*: * */,
  keys /*: Keys */,
  depth /*: number */ = 0
) /*: Value */ {
  if (keys.length === depth) {
    return state
  }

  if (!state) {
    return undefined
  }

  if (state.hasOwnProperty(keys[depth])) {
    return getStoreData(state[keys[depth]], keys, depth + 1)
  } else {
    return undefined
  }
}

export const updateStateByKeys = function (
  partial /*: State */,
  value /*: Value */,
  keys /*: Keys */
) /*: State */ {
  if (!keys.length) {
    return value
  }

  return typeof keys[0] === 'string'
    ? {
      ...partial,
      [keys[0]]: updateStateByKeys(partial && partial[keys[0]], value, keys.slice(1))
    }
    : [
      ...(partial || []).slice(0, keys[0]),
      ...(new Array(Math.max(0, keys[0] - (partial || []).length))),
      updateStateByKeys(partial && partial[keys[0]], value, keys.slice(1)),
      ...(partial || []).slice(keys[0] + 1)
    ]
}

export const isObjectsEqual = (x /*: State */, y /*: State */) /*: boolean */ => {
  if (x === y) {
    return true
  }

  if (!(x instanceof Object) || !(y instanceof Object)) {
    return false
  }

  if (x.constructor !== y.constructor) {
    return false
  }

  for (let p in x) {
    if (!x.hasOwnProperty(p)) {
      continue
    }
    if (!y.hasOwnProperty(p)) {
      return false
    }

    if (x[p] === y[p]) {
      continue
    }

    if (typeof x[p] !== 'object') {
      return false
    }

    if (!isObjectsEqual(x[p], y[p])) {
      return false
    }
  }

  for (let p in y) {
    if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) {
      return false
    }
  }
  return true
}

export const findRelativePath = function (originalPath /*: string */) /*: string */ {
  let path = originalPath

  while (path.indexOf('.../') > -1) {
    const pointerIndex = path.indexOf('.../')
    const parentIndex = path.lastIndexOf('.', pointerIndex - 1)
    path = (
      parentIndex > -1
        ? path.substr(0, parentIndex + 1)
        : ''
    ) + path.substr(pointerIndex + 4)
  }

  return path.replace('../', '')
}

export const findRelativeName = function (path /*: string */, name /*: string */) /*: string */ {
  if (path.indexOf('../') === -1) {
    return path
  }

  return findRelativePath(`${name}.${path}`)
}

export const documentScrollTop = function (value /*: ?number */) /*: number */ {
  if (value !== undefined && value !== null) {
    document.scrollingElement && (document.scrollingElement.scrollTop = value)
    document.documentElement && (document.documentElement.scrollTop = value)
  }

  return (
    (document.scrollingElement && document.scrollingElement.scrollTop) ||
    (document.documentElement && document.documentElement.scrollTop) ||
    0
  )
}

export const documentScrollLeft = function () /*: number */ {
  return (
    (document.scrollingElement && document.scrollingElement.scrollLeft) ||
    (document.documentElement && document.documentElement.scrollLeft) ||
    0
  )
}

export const documentScrollHeight = function () /*: number */ {
  return (
    (document.scrollingElement && document.scrollingElement.scrollHeight) ||
    (document.documentElement && document.documentElement.scrollHeight) ||
    0
  )
}