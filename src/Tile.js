import { Component } from 'react'

class Tile extends Component {
    state = { changeToInput: false }

    handleKeyPress = (event, force = false) => {
        if (event.key === "Enter" || force) {
            if (event.target.value.toUpperCase() !== this.props.tile.char) this.props.onCharChange(event.target.value.toUpperCase())
            this.setState({ changeToInput: false })
        }
    }

    render () {
        return <div style={{ width: 'auto', height: '100%', textAlign: 'center', 
                backgroundColor: this.props.tile.name ? this.props.tile.tileColor : this.props.tile.color,
                color: this.props.tile.name ? (this.props.tile.valid ? this.props.tile.tileFontColor : this.props.tile.tileInvalidFontColor)
                    : this.props.tile.fontColor }}
            onClick={() => this.setState({ changeToInput: true })}>
            {this.state.changeToInput
                ? <input type='text'
                    defaultValue={this.props.tile.name}
                    style={{ width: '80%', textAlign: 'center', fontSize: '75%' }}
                    onFocus={(event) => event.target.select()}
                    onBlur={(event) => this.handleKeyPress(event, true)}
                    onKeyUp={this.handleKeyPress}
                    autoFocus/>
                : <label style={{ textAlign: 'center', fontSize: this.props.tile.name ? this.props.tile.tileFontSize : this.props.tile.fontSize }}>
                {this.props.tile.name && this.props.tile.name !== ' ' ? this.props.tile.name : this.props.tile.hide
                    || this.props.tile.name === ' ' ? <br/> : this.props.tile.type}
            </label>}
            <div style={{ textAlign: 'left', fontSize: '50%' }}>{(this.props.tile.points ? this.props.tile.points : '')}</div>
        </div>
    }
}

export default Tile
