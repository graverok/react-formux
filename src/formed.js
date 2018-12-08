// @flow

/*::
  import { Name, Value, Rules, ErrorType } from './flowTypes'

  type InitialProps = *

  type OwnProps = {
    name: Name,
    value: Value,
    defaultValue: Value,
    mapProps: Array<function|string>,
    component: *,
    rules?: function,
    isError?: ?boolean,
    errorHint?: string | ?false,
    forwardRef: *,
    formux: {
      prefix: string,
      isFormTouched: boolean,
      isFormSubmitted: boolean,
      change: function,
      error: function,
      rules: Rules,
    }
  }

  type Actions = {
    updateStore: function
  }

  type Props = {
    name: Name,
    value: Value,
    defaultValue?: Value,
    onChange?: function,
    component: *,
    isError?: ?boolean,
    errorHint?: string | ?false,
    forwardRef: *,
    '@@formux': {
      updateStore: function,
      change: function,
      error: function,
      isFormTouched: boolean,
      isFormSubmitted: boolean,
      rule: false | function,
    }
  }

  type State = {
    value: Value,
    initialValue: Value,
    timeoutId: ?TimeoutID,
    update: function,
    isDefault: boolean,
    isSubmitted: boolean,
    hasError: ErrorType,
    isChanged: boolean
  }

  type DerivedState = {
    value: Value,
    initialValue?: Value,
    isSubmitted?: boolean,
    isDefault?: boolean,
    hasError?: ErrorType
  }
*/

import React, { useContext } from 'react'
import { connect } from 'react-redux'
import { updateField } from './connect'
import { getValue, getRule } from '.'
import { isObjectsEqual, findRelativePath, findRelativeName } from './helpers'
import { Formux } from './Provider'

const FORMUX_KEY = '@@formux'

class Formed extends React.Component /*:: <Props, State> */ {
  /*::
    updateStore: (value: Value) => void
    handleChange: (*) => void
    callsCounter: number
    isUnmounted: boolean
  */

  constructor (props /*: Props */) {
    super(props)

    this.updateStore = this.updateStore.bind(this)
    this.handleChange = this.handleChange.bind(this)

    const { defaultValue, [FORMUX_KEY]: formux } = props
    const isDefault = props.value === undefined || props.value === null
    const value = isDefault ? defaultValue : props.value

    this.state = {
      value,
      initialValue: value,
      timeoutId: null,
      isDefault,
      isChanged: formux.isFormTouched,
      hasError: formux.rule && formux.rule(value),
      update: this.updateStore,
      /*
       Form element considered submitted only
       when it was alive during submit.
       Elements mounted after form submission are
       always unsubmitted
      */
      isSubmitted: false
    }

    this.callsCounter = 0
    this.isUnmounted = false
  }

  static getDerivedStateFromProps (
    props /*: Props */,
    state /*: State */
  ) /*: null | DerivedState */ {
    const {
      [FORMUX_KEY]: { rule, isFormTouched },
      value, defaultValue
    } = props

    /* Return if user currenty changes value */
    if (state.timeoutId) { return null }

    const isDefault = (
      // Deleted values (undefined || null) consider default
      (value === undefined || value === null) ||
      (state.isDefault && value === state.value && defaultValue !== value)
    )

    if (!isDefault) {
      // Value updated outside
      if (value !== state.value) {
        return {
          value: value,
          initialValue: isFormTouched ? state.initialValue : value,
          isChanged: isFormTouched ? !isObjectsEqual(state.initialValue, value) : false,
          isDefault,
          hasError: rule && rule(value)
        }
      }
    } else {
      if (defaultValue !== value) {
        state.update(defaultValue)
      }

      if (defaultValue !== state.value) {
        return {
          value: defaultValue,
          initialValue: isFormTouched ? state.initialValue : defaultValue,
          isChanged: isFormTouched ? !isObjectsEqual(state.initialValue, defaultValue) : false,
          isDefault,
          hasError: rule && rule(defaultValue)
        }
      }
    }

    return null
  }

  componentDidMount () {
    const { isChanged, isDefault, hasError, value } = this.state
    const { [FORMUX_KEY]: formux, name } = this.props

    /*
      Mounting (creating) component after form touched (isChanging === true)
      means value is changed
    */
    if (isChanged) {
      formux.change(true, name)
    }
    if (isDefault) {
      this.updateStore(value)
    }
    if (hasError) {
      formux.error(hasError, name)
    }
  }

  componentDidUpdate (prevProps /*: Props */, prevState /*: State */) {
    if (this.isUnmounted) { return }

    const {
      [FORMUX_KEY]: { rule, change, error, isFormSubmitted },
      name
    } = this.props
    const { hasError, value, isChanged } = this.state

    if (isChanged !== prevState.isChanged) {
      change(isChanged, name)
    }

    if (hasError !== prevState.hasError) {
      error(hasError, name)
    }

    if (rule !== prevProps[FORMUX_KEY].rule) {
      this.setState({
        hasError: rule && rule(value)
      })
    }

    if (isFormSubmitted && !prevProps[FORMUX_KEY].isFormSubmitted) {
      this.setState({
        isSubmitted: true
      })
    }
  }

  componentWillUnmount () {
    this.isUnmounted = true

    const { [FORMUX_KEY]: { change, error }, name } = this.props
    const { timeoutId } = this.state

    change(false, name)
    error(false, name)
    timeoutId && clearTimeout(timeoutId)
  }

  updateStore (value /*: Value */) {
    const {
      [FORMUX_KEY]: { updateStore },
      name
    } = this.props

    name && updateStore(name, value)
    this.callsCounter = 0
  }

  /**
   *  User changes
   */
  handleChange (e /*: * */) {
    this.props.onChange && this.props.onChange(e)

    if (this.isUnmounted) { return }

    const value = e && e.target instanceof HTMLElement
      ? e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value
      : e

    const isTrusted = e && e.isTrusted

    if (!isTrusted) {
      this.updateStore(value)
      return
    }
    
    const { timeoutId, initialValue } = this.state
    const { [FORMUX_KEY]: { rule, isFormTouched } } = this.props

    if (!timeoutId) {
      this.updateStore(value)
    } else {
      clearTimeout(timeoutId)
      this.callsCounter++
    }

    if (value !== null && value !== undefined) {
      this.setState({
        value,
        hasError: rule && rule(value)
      })
    }

    this.setState({
      isDefault: false,
      isSubmitted: false,
      timeoutId: setTimeout(() => {
        if (this.isUnmounted) { return }

        if (this.callsCounter > 0) {
          this.updateStore(value)
        }

        this.setState({
          timeoutId: null,
          isChanged: isFormTouched && !isObjectsEqual(initialValue, value)
        })
      }, 200)
    })
  }

  shouldComponentUpdate (props /*: Props */, state /*: State */) {
    const {
      value,
      defaultValue,
      [FORMUX_KEY]: formux,
      ...other } = this.props
    const {
      value: valueNext,
      defaultValue: defaultNext,
      [FORMUX_KEY]: formuxNext,
      ...otherNext } = props

    return !isObjectsEqual(other, otherNext) ||
      state.value !== this.state.value ||
      state.initialValue !== this.state.initialValue ||
      state.hasError !== this.state.hasError ||
      state.isDefault !== this.state.isDefault ||
      state.isChanged !== this.state.isChanged ||
      state.isSubmitted !== this.state.isSubmitted ||
      (
        (typeof formux.rule === 'function' && formux.rule(state.value)) !==
        (typeof formuxNext.rule === 'function' && formuxNext.rule(state.value))
      ) ||
      formux.isFormSubmitted !== formuxNext.isFormSubmitted
  }

  render () {
    const {
      defaultValue, value, [FORMUX_KEY]: formux,
      onChange, component: Component, forwardRef,
      isError, errorHint,
      ...other
    } = this.props
    const { hasError, isSubmitted } = this.state

    return <Component
      {...other}
      value={
        this.state.value !== undefined &&
        this.state.value !== null
          ? this.state.value
          : ''
      }
      ref={forwardRef}
      onChange={this.handleChange}
      aria-invalid={isError || (isSubmitted && Boolean(hasError)) || undefined}
      aria-errormessage={errorHint || hasError || undefined}
    />
  }
}

const mapDispatchToProp = (dispatch, { formux }) /*: Actions */ => ({
  updateStore: (name, value) =>
    dispatch(updateField(formux.prefix + name, value))
})

const mapMergedProps = (
  state /*: * */,
  actions /*: Actions */,
  ownProps /*: OwnProps */
) /*: Props */ => {
  const {
    formux: {
      prefix,
      rules,
      ...formuxMeta
    },
    mapProps,
    name,
    value: propsValue,
    rules: propsRules,
    ...other
  } = ownProps

  const mappedProps = typeof mapProps === 'function'
    ? mapProps(n => getValue(state, findRelativePath(prefix + n)))
    : {}

  const value = propsValue !== null && propsValue !== undefined
    ? propsValue
    : getValue(state, prefix + name)

  const rule = typeof propsRules === 'function'
    ? propsRules
    : getRule(rules, name)

  return {
    ...other,
    ...mappedProps,
    value,
    name,
    [FORMUX_KEY]: {
      ...formuxMeta,
      ...actions,
      rule: typeof rule === 'function'
        ? value => rule(value, path => getValue(state, prefix + findRelativeName(path, name)))
        : null
    }
  }
}

const Connected = connect(
  state => state,
  mapDispatchToProp,
  mapMergedProps
)(Formed)

export default function (Component /*: * */) {
  return React.forwardRef/*:: <InitialProps, *> */((props /*: InitialProps */, ref) => {
    const context = useContext(Formux)

    if (!context) {
      return <Component {...props} ref={ref} />
    }

    const {
      prefix,
      isFormTouched,
      isFormSubmitted,
      change,
      error,
      rules
    } = context

    return <Connected
      {...props}
      formux={{
        prefix,
        isFormTouched,
        isFormSubmitted,
        change,
        error,
        rules
      }}
      forwardRef={ref}
      component={Component}
    />
  })
}
