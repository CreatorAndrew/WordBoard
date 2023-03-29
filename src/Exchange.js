import { Component } from 'react'

class Exchange extends Component {
    state = { changeToInput: false }
    text = ''

    handleKeyPress = (event, force = false) => {
        if (!force) this.text = event.target.value.toUpperCase()
        if (this.text && (event.key === "Enter" || force)) {
            this.props.execute(this.text)
            this.setState({ changeToInput: false })
        }
    }

    render () {
        return <>
            {this.state.changeToInput
                ? <input type='text'
                    defaultValue=""
                    onFocus={(event) => event.target.select()}
                    onBlur={() => this.setState({ changeToInput: false })}
                    onKeyUp={this.handleKeyPress}
                    autoFocus/>
                : ''}
            <button onClick={(event) => {
                if (!this.state.changeToInput) this.setState({ changeToInput: true })
                else this.handleKeyPress(event, true)
            }}>Exchange</button>
        </>
    }
}

export default Exchange
