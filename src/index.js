// @flow

/*::
  import { State, Value, Name, Rules, ErrorType } from './flowTypes'
*/

import formuxReducer from './connect.js'
import { updateStateByKeys, getStoreData, getKeys } from './helpers'
export { default } from './Provider'
export { default as formed } from './formed'
export { default as submit } from './submit'

export const withFormux = (reducers /*: Function */) => {
  return (state /*: State */, action /*: * */) => {
    return reducers(formuxReducer(state, action), action)
  }
}

export const updateStateByName = function (
  state /*: State */,
  value /*: Value */,
  name /*: Name */
) /*: State */ {
  if (!name) {
    return state
  }

  return updateStateByKeys(state, value, getKeys(name))
}

export const getValue = function (state /*: State */, name /*: Name */) /*: Value */ {
  if (!name) {
    return state
  }

  return getStoreData(state, getKeys(name))
}

export const getRule = function (rules /*: Rules */, name /*: Name */) /*: ErrorType */ {
  const keys = name
    ? name.replace(/\[/g, '.').split('.').map(
      x => x.substr(-1) === ']' ? 0 : String(x)
    )
    : []

  return getStoreData(rules, keys)
}
