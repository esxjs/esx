'use strict'

const { createElement } = require('react')
const Cmp2 = ({ text }) => {
  return createElement(
    'div',
    null,
    createElement(
      'aside',
      null,
      ' foo '
    ),
    createElement(
      'main',
      null,
      createElement(
        'div',
        null,
        createElement(
          'h2',
          null,
          ' something '
        ),
        createElement(
          'div',
          null,
          [
            createElement(
              'a',
              { href: 'http://www.example.com' },
              'a link '
            ),
            createElement(
              'span',
              { href: 'http://www.example.com' },
              createElement('em', null, 'some'),
              ' text'
            )
          ]
        ),
        createElement(
          'p',
          null,
          text
        ),
        createElement(
          'p',
          null,
          ' more text, ',
          createElement(
            'small',
            null,
            ' small print '
          )
        )
      )
    )
  )
}

const Cmp1 = (props) => {
  return createElement(
      'div', 
      {a: props.a}, 
      [
        createElement(Cmp2, {text: props.text}),
        createElement(Cmp2, {text: props.text}),
        createElement(Cmp2, {text: props.text}),
        createElement(Cmp2, {text: props.text}),
        createElement(Cmp2, {text: props.text}),
        createElement(Cmp2, {text: props.text}),
        createElement(Cmp2, {text: props.text}),
        createElement(Cmp2, {text: props.text}),
        createElement(Cmp2, {text: props.text}),
        createElement(Cmp2, {text: props.text}),
        createElement(Cmp2, {text: props.text})
      ]
  )
}

const value = 'hia'

module.exports = () => createElement(Cmp1, {a: value, text: 'hi'})