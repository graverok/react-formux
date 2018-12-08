// @flow

/*::
  import { State, Name, Value } from './flowTypes'

  type Action = {
    type: string,
    payload: {
      value: Value,
      name: Name
    }
  }
*/

import { updateStateByName } from '.'
const UPDATE_FIELD = '@@FormuxUpdateField'

export default (state /*: State */ = {}, action /*: Action */) => {
  const { type, payload } = action

  switch (type) {
    case UPDATE_FIELD: {
      return {
        ...updateStateByName(state, payload.value, payload.name)
      }
    }
    default:
      return state
  }
}

export function updateField (name /*: Name */, value /*: Value */) /*: Action */ {
  return {
    type: UPDATE_FIELD,
    payload: { name, value }
  }
}
