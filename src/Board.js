import { Component } from 'react'
import BoardWorkings from './BoardWorkings.js'
import Tile from './Tile.js'
import Exchange from './Exchange.js'
import dictionary from './dictionary.json'

class Board extends Component {
    state = { board: new BoardWorkings(), savedWords: [], players: [], nextPlayer: 0, started: false, finished: false }
    nextPlayer = this.state.nextPlayer
    placedTiles = []
    invalidTiles = []

    findRowIndex (column) {
        for (const row of this.state.board.board) if (row.indexOf(column) > -1) return this.state.board.board.indexOf(row)
    }

    findColumnIndex (column) {
        for (const row of this.state.board.board) if (row.indexOf(column) > -1) return row.indexOf(column)
    }

    checkForLetter (char) {
        if (this.state.players.length) for (const letter of this.state.players[this.nextPlayer].hand)
            if (letter === char) return { inHand: true, handIndex: this.state.players[this.nextPlayer].hand.indexOf(letter) }
        return { inHand: false, handIndex: 0 }
    }

    addTiles (player = this.state.players[this.nextPlayer]) {
        while (player.hand.length < 7) {
            if (!this.state.board.letterBag.length) break
            player.hand.push(this.state.board.letterBag.pop())
        }
    }

    sortTiles (tiles, reverse = false) {
        for (let i = 0, tempTile; i < tiles.length - 1; i++)
            for (let j = 0; j < tiles.length - 1; j++)
                if (reverse ? (tiles[j].id < tiles[j + 1].id) : (tiles[j].id > tiles[j + 1].id)) {
                    tempTile = tiles.slice()[j]
                    tiles[j] = tiles.slice()[j + 1]
                    tiles[j + 1] = tempTile
                }
    }

    checkTileValidity (tile) {
        return tile.valid && tile.char
    }

    makeTileValid (tile, char) {
        tile.valid = true
        if (char) this.invalidTiles.splice(this.invalidTiles.indexOf(tile), 1)
    }

    makeTileInvalid (tile, checkForInvalidTiles) {
        tile.valid = false
        if (checkForInvalidTiles && this.invalidTiles.indexOf(tile) < 0) this.invalidTiles.push(tile)
    }

    returnTileToPlayer (tile) {
        this.state.players[this.nextPlayer].hand.push(tile.char) // place the removed tile back in the player's hand
        this.placedTiles.splice(this.placedTiles.indexOf(tile), 1)
        tile.char = ''
        tile.name = ''
        tile.points = 0
    }

    endTurn (potentialWords) {
        if (this.invalidTiles.length) return
        for (const potentialWord of potentialWords)
            if (dictionary.words.indexOf(potentialWord.word.toLowerCase()) < 0) return // check if the word is valid
        const players = this.state.players.slice()
        for (const potentialWord of potentialWords)
            players[this.nextPlayer].score += potentialWord.score
        if (this.placedTiles.length === 7) players[this.nextPlayer].score += 50 // award 50 additional points if the player has placed 7 tiles in one turn
        this.state.board.board.forEach(row => row.forEach(column => column.locked = !(!column.char)))
        this.placedTiles = []
        if (this.nextPlayer < this.state.players.length - 1) this.nextPlayer++
        else this.nextPlayer = 0
        this.addTiles()
        for (const player of this.state.players) player.isActive = this.state.players.indexOf(player) === this.nextPlayer
        this.setState({ board: this.state.board, savedWords: this.state.savedWords.concat(potentialWords), 
                players: players.slice(), nextPlayer: this.nextPlayer }, () => {
            if (!players[this.nextPlayer ? this.nextPlayer - 1 : players.length - 1].hand.length && !this.state.board.letterBag.length) {
                // end game
                let winnerBonus = 0
                for (const player of players)
                    for (const tile of player.hand)
                        for (const letter of this.state.board.letters)
                            if (tile === letter.letter) {
                                player.score -= letter.value // subtract the points of each remaining letter a player has from said player's total score
                                winnerBonus += letter.value // accumulate the aforementioned points as a bonus to be added to the winning player's total score
                            }
                players[this.nextPlayer ? this.nextPlayer - 1 : players.length - 1].score += winnerBonus
                this.setState({ players: players.slice(), finished: true })
            }
        })
    }

    exchange (potentialWords, text) {
        const letters = text.split('')
        for (const letter of letters) if (!this.checkForLetter(letter).inHand || letters.length > this.state.board.letterBag.length) return
        for (const letter of letters) this.state.players[this.nextPlayer].hand.splice(this.checkForLetter(letter).handIndex, 1)
        this.addTiles()
        for (const letter of letters) this.state.board.letterBag.push(letter)
        this.state.board.shuffle()
        this.endTurn(potentialWords)
    }

    handleCharChange (tile, char, checkForInvalidTiles = true, name = char) {
        let tileHorizontallyAdjacent, tileVerticallyAdjacent, lineHorizontal, lineVertical, rowIndex, columnIndex, hasPoints = false,
            wildCardLetter = 0, checkForValidTiles = true
        if (checkForInvalidTiles) for (const letter of this.state.board.letters)
            if (char && (char === letter.letter && this.checkForLetter(char).inHand && !letter.wildCard)) {
                if (!tile.locked) tile.points = letter.value
                hasPoints = true
                break
            }
        if (!hasPoints && checkForInvalidTiles) for (const letter of this.state.board.letters)
            if (char && (!this.checkForLetter(char).inHand && letter.wildCard && this.checkForLetter(letter.letter).inHand)) {
                if (!tile.locked) tile.points = letter.value
                wildCardLetter = letter.letter
                hasPoints = true
                break
            }
        tileHorizontallyAdjacent = this.checkTileValidity(this.state.board.checkLeftTile(this.state.board.board[this.findRowIndex(tile)], tile))
            || this.checkTileValidity(this.state.board.checkRightTile(this.state.board.board[this.findRowIndex(tile)], tile))
        tileVerticallyAdjacent = this.checkTileValidity(this.state.board.checkTileAbove(this.state.board.board[this.findRowIndex(tile)], tile,
                this.state.board.board)) 
            || this.checkTileValidity(this.state.board.checkTileBelow(this.state.board.board[this.findRowIndex(tile)], tile,
                this.state.board.board))
        // check if the line of letters is horizontal or vertical
        if (this.placedTiles.length > 1) {
            lineHorizontal = this.findRowIndex(this.placedTiles[0]) === this.findRowIndex(this.placedTiles[1])
            if (lineHorizontal) rowIndex = this.findRowIndex(this.placedTiles[1])
            lineVertical = this.findColumnIndex(this.placedTiles[0]) === this.findColumnIndex(this.placedTiles[1])
            if (lineVertical) columnIndex = this.findColumnIndex(this.placedTiles[1])
        }
        if ((hasPoints || !char || !checkForInvalidTiles) && !tile.locked) {
            if (!char) { // check if a tile was meant to be removed
                if (!tile.valid) this.makeTileValid(tile, char)
                this.returnTileToPlayer(tile)
                for (const placedTile of this.placedTiles) this.makeTileInvalid(placedTile, checkForInvalidTiles)
            }
            else if (!tile.char) { // check if a tile was meant to be placed
                this.placedTiles.push(tile)
                // remove the tile from the player's hand
                this.state.players[this.nextPlayer].hand.splice(this.checkForLetter(wildCardLetter ? wildCardLetter : char).handIndex, 1)
            }
            else if (char !== tile.char) { // check if a tile was swapped with another
                this.state.players[this.nextPlayer].hand.push(tile.char) // place the old tile back in the player's hand
                // remove the new tile from the player's hand
                this.state.players[this.nextPlayer].hand.splice(this.checkForLetter(wildCardLetter ? wildCardLetter : char).handIndex, 1)
            }
            if (name === char) {
                tile.char = wildCardLetter ? wildCardLetter : char
                tile.name = char
            }
            // ensure that any tiles placed within a horizontal line in the same turn are not interrupted by a gap
            if (char && this.findRowIndex(this.placedTiles[0]) === this.findRowIndex(this.placedTiles[1])) {
                this.sortTiles(this.placedTiles)
                for (let i = 0, gap; i < this.placedTiles.length - 1; i++)
                    if (this.placedTiles[i].id !== this.placedTiles[i + 1].id - 1) {
                        gap = this.placedTiles[i + 1].id - this.placedTiles[i].id
                        for (let j = 1; j < gap; j++) {
                            if (!this.state.board.board[this.findRowIndex(this.placedTiles[i])][this.findColumnIndex(this.placedTiles[i]) + j].char) {
                                for (const placedTile of this.placedTiles) this.makeTileInvalid(placedTile, checkForInvalidTiles)
                                checkForValidTiles = false
                                break
                            }
                        }
                        if (!checkForValidTiles) break
                    }
            }
            // ensure that any tiles placed within a vertical line in the same turn are not interrupted by a gap
            if (char && this.findColumnIndex(this.placedTiles[0]) === this.findColumnIndex(this.placedTiles[1])) {
                this.sortTiles(this.placedTiles)
                for (let i = 0, gap; i < this.placedTiles.length - 1; i++)
                    if (this.placedTiles[i].id !== this.placedTiles[i + 1].id - this.state.board.board[0].length) {
                        gap = (this.placedTiles[i + 1].id - this.placedTiles[i].id) / this.state.board.board[0].length
                        for (let j = 1; j < gap; j++) {
                            if (!this.state.board.board[this.findRowIndex(this.placedTiles[i]) + j][this.findColumnIndex(this.placedTiles[i])].char) {
                                for (const placedTile of this.placedTiles) this.makeTileInvalid(placedTile, checkForInvalidTiles)
                                checkForValidTiles = false
                                break
                            }
                        }
                        if (!checkForValidTiles) break
                    }
            }
            // for when there are only two tiles, ensure that the second tile is in the same row or column as the first tile
            if (this.placedTiles.length === 2 ? this.findColumnIndex(this.placedTiles[0]) !== this.findColumnIndex(this.placedTiles[1])
                    && this.findRowIndex(this.placedTiles[0]) !== this.findRowIndex(this.placedTiles[1]) : false) {
                this.makeTileInvalid(tile, checkForInvalidTiles)
                checkForValidTiles = false
            }
            // check if the tile is adjacent to another and exclusively forms a single horizontal line with the other tiles placed in the same turn
            if (char && !((tileHorizontallyAdjacent && (((rowIndex === this.findRowIndex(tile)) && lineHorizontal) || this.placedTiles.length <= 1))
                    // check if the tile is adjacent to another and exclusively forms a single vertical line with the other tiles placed in the same turn
                    || (tileVerticallyAdjacent && (((columnIndex === this.findColumnIndex(tile)) && lineVertical) || this.placedTiles.length <= 1))
                    || tile.start))
                this.makeTileInvalid(tile, checkForInvalidTiles)
        }
        if (tile.points && !tile.char) tile.points = 0
        if ((tileHorizontallyAdjacent || tileVerticallyAdjacent || tile.start) && checkForValidTiles) this.makeTileValid(tile, tile.char)
        else if (char && this.invalidTiles.indexOf(tile) < 0) this.makeTileInvalid(tile, checkForInvalidTiles)
        if (checkForInvalidTiles) {
            this.sortTiles(this.placedTiles)
            for (const placedTile of this.placedTiles) this.handleCharChange(placedTile, placedTile.char, false, placedTile.name)
            this.sortTiles(this.placedTiles, true)
            for (const placedTile of this.placedTiles) this.handleCharChange(placedTile, placedTile.char, false, placedTile.name)
        }
        for (const invalidTile of this.invalidTiles) if (!invalidTile.char) this.makeTileValid(invalidTile, 'A')
        for (const placedTile of this.placedTiles) if (!placedTile.valid && this.invalidTiles.indexOf(placedTile) < 0)
            this.makeTileValid(placedTile, placedTile.char)
        this.setState({ board: this.state.board, started: !this.state.started && hasPoints ? true : this.state.started })
    }

    render () {
        const potentialWords = this.state.board.getPotentialWords()
        return <div>
            {this.state.started ? '' : <button onClick={() => {
                this.setState({ players: [...this.state.players, { name: 'Player ' + (this.state.players.length + 1), hand: [], score: 0,
                        isActive: !this.state.players.length }] }, () => {
                    this.addTiles(this.state.players[this.state.players.length - 1])
                    this.setState({ players: this.state.players.slice() })
                })}}>Add Player</button>}
            {this.state.finished ? <label>[ Game Finished ]</label> : <button onClick={() => this.endTurn(potentialWords)}>Next Player</button>}
            {!this.state.finished
                && !this.placedTiles.length && this.state.board.letterBag.length ? <Exchange execute={text => this.exchange(potentialWords, text)}/> : ''}
            <table style={{ border: '1px solid black', borderCollapse: 'collapse' }}>
                <tbody>
                    {this.state.board.board.map(row =>
                        <tr style={{ border: '1px solid black', borderCollapse: 'collapse' }} key={this.state.board.board.indexOf(row)}>
                            {row.map(column => <td
                                    style={{ border: '1px solid black', borderCollapse: 'collapse', width: '32px', height: '32px', textAlign: 'center' }}
                                    key={row.indexOf(column)}>
                                <Tile tile={column} onCharChange={char => this.handleCharChange(column, char)}/>
                            </td>)}
                        </tr>)}
                </tbody>
            </table>
            <div>{this.state.players.map(player => <label key={this.state.players.indexOf(player)}>
                {(player.isActive ? '* ' : '') + player.name + ' (Score: ' + player.score + (player.isActive ? ', Hand: ' + player.hand : '') + ')'}
                {this.state.players.indexOf(player) < this.state.players.length - 1 ? <br/> : ''}
            </label>)}</div>
            <br/>
            {this.state.savedWords.map(savedWord => <label key={this.state.savedWords.indexOf(savedWord)}>
                {savedWord.word + ' (' + savedWord.score + ')' +
                    (this.state.savedWords.indexOf(savedWord) < this.state.savedWords.length - 1 || potentialWords.length ? ', ' : '')}
            </label>)}
            {potentialWords.map(potentialWord => <label key={potentialWords.indexOf(potentialWord)}>
                {potentialWord.word + ' (' + potentialWord.score + ')' +
                    (potentialWords.indexOf(potentialWord) < potentialWords.length - 1 ? ', ' : '')}
            </label>)}
            <br/>
            {this.invalidTiles.length ? <label>Invalid Tiles ({this.invalidTiles.length}): {this.invalidTiles.map(tile => tile.char)}</label> : ''}
        </div>
    }
}

export default Board
