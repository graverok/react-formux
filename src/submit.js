import React from 'react'
import { Formux } from './Provider'

export default function (Button) {
  class Submit extends React.Component {
    static contextType = Formux

    render () {
      const { submit } = this.context
      const { forwardedRef, children, ...buttonProps } = this.props
      return <Button
        ref={forwardedRef}
        {...buttonProps}
        onClick={() => submit(buttonProps)}
      >
        { children }
      </Button>
    }
  }

  return React.forwardRef((props, ref) =>
    <Submit forwardedRef={ref} {...props} />
  )
}
