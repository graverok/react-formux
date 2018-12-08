// @flow

/*::
  import { Name, Rules, ErrorType } from './flowTypes'

  type Errors = Array<{ name: Name, errorType: ErrorType }>
  type SortedErrors = Array<[Name, ErrorType]>

  type Props = {
    name?: string,
    children?: *,
    onLeaveUnsaved?: ?function,
    onSubmit?: function,
    validateOnSubmit?: boolean | Array<string>,
    rules?: Rules,
    innerRef?: function,
  }

  type State = {
    isFormSubmitted: boolean,
    isFormTouched: boolean
  }

  type Store = ?{
    prefix: string,
    change: function,
    error: function,
    rules?: Rules,
    submit: function,
    isFormTouched: boolean,
    isFormSubmitted: boolean,
  }
*/

import React from 'react'
import { documentScrollTop } from './helpers'
export const Formux = React.createContext/*:: <Store> */()

class Provider extends React.PureComponent /*:: <Props, State> */ {
  /*::
    handleFormedChanged: () => void
    handleFormedInvalid: () => void
    handleFormRef: () => void
    handleUserInteraction: () => void
    handleLinkClick: () => void
    handleSubmit: () => void
    handleRejectSubmit: () => void
    setInteractionListeners: (boolean) => void
    handleLeaveUnsaved: () => void
    focusErrorElement: (SortedErrors) => void
    sortErrorFields: (Errors) => SortedErrors
    changed: Array<Name>
    invalid: Array<{ name: Name, errorType: ErrorType }>
    saving: Array<Name>
    prefix: string
    form: null | HTMLFormElement
  */

  constructor (props /*: Props */) {
    super(props)

    this.handleFormedChanged = this.handleFormedChanged.bind(this)
    this.handleFormedInvalid = this.handleFormedInvalid.bind(this)
    this.handleFormRef = this.handleFormRef.bind(this)
    this.handleUserInteraction = this.handleUserInteraction.bind(this)
    this.handleLinkClick = this.handleLinkClick.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleRejectSubmit = this.handleRejectSubmit.bind(this)
    this.handleLeaveUnsaved = this.handleLeaveUnsaved.bind(this)
    this.focusErrorElement = this.focusErrorElement.bind(this)
    this.sortErrorFields = this.sortErrorFields.bind(this)
    this.setInteractionListeners = this.setInteractionListeners.bind(this)

    this.state = {
      isFormSubmitted: false,
      isFormTouched: false
    }

    this.prefix = props.name ? props.name + '.' : ''
    this.changed = []
    this.saving = []
    this.invalid = []
    this.form = null
  }

  setInteractionListeners (value /*: boolean */) {
    if (value) {
      this.form && this.form.addEventListener('mousedown', this.handleUserInteraction)
      this.form && this.form.addEventListener('keydown', this.handleUserInteraction)
      this.form && this.form.addEventListener('touchstart', this.handleUserInteraction)
    } else {
      this.form && this.form.removeEventListener('mousedown', this.handleUserInteraction)
      this.form && this.form.removeEventListener('keydown', this.handleUserInteraction)
      this.form && this.form.removeEventListener('touchstart', this.handleUserInteraction)
    }
  }

  componentDidMount () {
    this.setInteractionListeners(true)
  }

  componentDidUpdate (prevProps /*: Props */, prevState /*: State */) {
    const { isFormSubmitted } = this.state
    const { onLeaveUnsaved } = this.props

    // Toggle form submission
    if (isFormSubmitted && !prevState.isFormSubmitted) {
      this.setState({
        isFormSubmitted: false
      })
    }

    if (onLeaveUnsaved !== prevProps.onLeaveUnsaved) {
      window.onbeforeunload = (this.changed.length !== 0 && onLeaveUnsaved) || null
    }
  }

  componentWillUnmount () {
    this.setInteractionListeners(false)
  }

  handleFormRef (el /*: ?HTMLFormElement */) {
    const { innerRef } = this.props
    this.form = el || this.form
    if (innerRef) {
      if (typeof innerRef === 'function') {
        innerRef(el)
      } else if (innerRef.hasOwnProperty('current')) {
        innerRef.current = el
      }
    }
  }

  handleUserInteraction () {
    const { isFormTouched } = this.state

    if (!isFormTouched) {
      this.setState({
        isFormTouched: true
      })

      this.setInteractionListeners(false)
    }
  }

  handleLinkClick (
    e /*: SyntheticEvent<EventTarget> */
  ) {
    const { onLeaveUnsaved } = this.props

    if (e.target instanceof HTMLElement) {
      const elem = e.target.closest('a')
      if (!elem) {
        return
      }

      if (
        this.form && !this.form.contains(elem) &&
        this.changed.length > 0 && onLeaveUnsaved
      ) {
        const errors = this.getErrorFields()
        onLeaveUnsaved(e, this.handleLeaveUnsaved, errors)
      }
    }
  }

  handleLeaveUnsaved () {
    this.changed = []
    window.onbeforeunload = null
    document.body && document.body.removeEventListener('click', this.handleLinkClick)
  }

  sortErrorFields (
    unsorted /*: Errors */
  ) /*: SortedErrors */ {
    return unsorted.map(item => {
      const node = document.getElementsByName(item.name)[0]
      if (this.form && this.form.contains(node)) {
        const rect = node.getBoundingClientRect()
        return {
          ...item,
          top: rect.top,
          left: rect.left
        }
      } else {
        return {
          ...item,
          top: undefined,
          left: undefined
        }
      }
    }).sort(
      (
        a /*: {left: void | number; top: void | number} */,
        b /*: {left: void | number; top: void | number} */
      ) => {
        if (!a.top || !a.left) { return -1 }
        if (!b.top || !b.left) { return 1 }

        return a.top === b.top
          ? a.left - b.left
          : a.top - b.top
      }
    ).map(({ name, errorType }) => ([name, errorType]))
  }

  focusErrorElement (
    elements /*: SortedErrors */
  ) {
    let nodeElement = null

    elements.findIndex(([name]) => {
      const node = document.getElementsByName(name)[0]

      if (this.form && this.form.contains(node)) {
        nodeElement = node
        return true
      }

      return false
    })

    if (nodeElement) {
      const focusEvent = new FocusEvent('focus')
      let focusElement = null

      switch (nodeElement.tagName.toLowerCase()) {
        case 'input':
        case 'select':
        case 'textarea':
          focusElement = nodeElement
          break
        default:
          nodeElement.querySelectorAll('input, textarea, select').forEach(el => {
            const hidden = el.getAttribute('hidden')
            if (!(hidden || hidden === '') && el.style.display !== 'none') {
              focusElement = focusElement || el
            }
          })
      }

      if (focusElement) {
        focusElement.focus()
        focusElement.dispatchEvent(focusEvent)
      }

      // Scroll to element
      const rect = nodeElement.getBoundingClientRect()
      const position = rect.top + documentScrollTop() + rect.height / 2
      documentScrollTop(position - window.innerHeight / 2)
    }
  }

  getErrorFields () {
    const { validateOnSubmit } = this.props

    return (
      validateOnSubmit === true
        ? this.sortErrorFields(this.invalid)
        : Array.isArray(validateOnSubmit)
          ? this.sortErrorFields(
            this.invalid.filter(({ name }) => {
              const converted = name.replace(/\s*\[.*?\]\s*/g, '[]')
              return validateOnSubmit.includes(converted)
            })
          )
          : []
    )
  }

  handleSubmit (buttonProps /*: * */) {
    const { onSubmit, validateOnSubmit } = this.props

    // Clear unsaved values and unload handlers
    this.saving = [...this.changed]
    this.changed = []
    window.onbeforeunload = null
    document.body && document.body.removeEventListener('click', this.handleLinkClick)

    this.setState({
      isFormSubmitted: validateOnSubmit !== false,
      isFormTouched: false
    })

    this.setInteractionListeners(true)

    const errors = this.getErrorFields()

    this.focusErrorElement(errors)
    onSubmit && onSubmit(errors, this.handleRejectSubmit, buttonProps)
  }

  handleRejectSubmit () {
    this.changed = [...this.saving]
    window.onbeforeunload = this.props.onLeaveUnsaved
    document.body && document.body.addEventListener('click', this.handleLinkClick)
  }

  handleFormedChanged (
    isEnabled /*: boolean */, name /*: Name */
  ) {
    if (!name || isEnabled === this.changed.includes(name)) {
      return
    }

    const response = isEnabled
      ? [
        ...this.changed,
        name
      ]
      : this.changed.filter(x => x !== name)

    if (this.changed.length !== 0 && response.length === 0) {
      window.onbeforeunload = null
      document.body && document.body.removeEventListener('click', this.handleLinkClick)
    } else if (this.changed.length === 0 && response.length !== 0) {
      window.onbeforeunload = this.props.onLeaveUnsaved
      document.body && document.body.addEventListener('click', this.handleLinkClick)
    }

    this.changed = response
  }

  handleFormedInvalid (
    errorType /*: ErrorType */, name /*: Name */
  ) {
    if (!name) {
      return
    }

    this.invalid = [
      ...this.invalid.filter(x => x.name !== name)
    ]

    if (errorType) {
      this.invalid.push({ name, errorType })
    }
  }

  render () {
    const { isFormTouched, isFormSubmitted } = this.state
    const store = {
      prefix: this.props.name ? `${this.props.name}.` : '',
      change: this.handleFormedChanged,
      error: this.handleFormedInvalid,
      rules: this.props.rules,
      submit: this.handleSubmit,
      isFormTouched,
      isFormSubmitted
    }

    return <Formux.Provider value={store}>
      <div ref={this.handleFormRef}>
        { this.props.children }
      </div>
    </Formux.Provider>
  }
}

export default Provider
