'use strict'

const esx = require('../..')()
const Cmp2 = ({text}) => {
  return esx `
    <div>
      <aside> foo </aside>
      <main>
          <div>
            <h2> something </h2>
            <div>
              <a href='http://www.example.com'>a link </a>
              <span><em>some</em> text</span>
            </div>
            <p>${text}</p>
            <p> more text, <small> small print </small> </p>
          </div>
      </main>
    </div>
  `
}
esx.register({Cmp2})
const Cmp1 = (props) => {
  return esx `
    <div a=${props.a}>
      <Cmp2 text=${props.text}/>
      <Cmp2 text=${props.text}/>
      <Cmp2 text=${props.text}/>
      <Cmp2 text=${props.text}/>
      <Cmp2 text=${props.text}/>
      <Cmp2 text=${props.text}/>
      <Cmp2 text=${props.text}/>
      <Cmp2 text=${props.text}/>
      <Cmp2 text=${props.text}/>
      <Cmp2 text=${props.text}/>
      <Cmp2 text=${props.text}/>
    </div>
  `
}
esx.register({Cmp1})
const value = 'hia'

module.exports = () => esx `<Cmp1 a=${value} text='hi'/>`