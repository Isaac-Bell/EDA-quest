import React from 'react'
import HighScore from './HighScore.jsx'

export default class App extends React.Component {
  render () {
    return (
      <div style={{ textAlign: 'center' }}>
        {/* <h1>Hello World</h1> */}
        <img id="logo" src="/assets/Game/quest-logo.png" alt="Quest Logo" />
      </div>
    )
  }
}
