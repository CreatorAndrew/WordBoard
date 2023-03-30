import { Component } from 'react'
import BoardWorkings from './BoardWorkings.js'
import Tile from './Tile.js'
import Exchange from './Exchange.js'
import dictionary from './dictionary.json'

class Board extends Component {
    state = { board: new BoardWorkings(), savedWords: { words: [], scores: [] }, players: [], nextPlayer: 0, finished: false }
    nextPlayer = this.state.nextPlayer
    placedTiles = []
    placedTileIndices = []
    placedTileIndex = 0

    findRowIndex (column) {
        for (const row of this.state.board.board) if (row.indexOf(column) >= 0) return this.state.board.board.indexOf(row)
    }

    findColumnIndex (column) {
        for (const row of this.state.board.board) if (row.indexOf(column) >= 0) return row.indexOf(column)
    }

    checkForLetter (char) {
        if (this.state.players.length) for (const letter of this.state.players[this.nextPlayer].hand)
            if (letter === char) return { inHand: true, handIndex: this.state.players[this.nextPlayer].hand.indexOf(letter) }
        return { inHand: false, handIndex: 0 }
    }

    addTiles () {
        while (this.state.players[this.nextPlayer].hand.length < 7) {
            if (!this.state.board.letterBag.length) break
            this.state.players[this.nextPlayer].hand.push(this.state.board.letterBag.pop())
        }
    }

    returnTileToPlayer (tile) {
        this.state.players[this.nextPlayer].hand.push(tile.char) // place the removed tile back in the player's hand
        this.placedTileIndices.splice(this.placedTiles.indexOf(tile), 1)
        this.placedTiles.splice(this.placedTiles.indexOf(tile), 1)
        this.placedTileIndex--
        tile.char = ''
        tile.name = ''
        tile.points = 0
    }

    endTurn (potentialWords) {
        for (const potentialWord of potentialWords.words)
            if (dictionary.words.indexOf(potentialWord.toLowerCase()) < 0) return // check if the word is valid
        const players = this.state.players.slice()
        for (let i = 0; i < potentialWords.words.length; i++) {
            this.state.savedWords.words.push('' + potentialWords.words[i])
            this.state.savedWords.scores.push(0 + potentialWords.scores[i])
            players[this.nextPlayer].score += potentialWords.scores[i]
        }
        if (this.placedTiles.length === 7) players[this.nextPlayer].score += 50 // award 50 additional points if the player has placed 7 tiles in one turn
        this.state.board.board.forEach(row => row.forEach(column => column.locked = !(!column.char)))
        this.placedTiles = []
        this.placedTileIndices = []
        this.placedTileIndex = 0
        if (this.nextPlayer < this.state.players.length - 1) this.nextPlayer++
        else this.nextPlayer = 0
        this.addTiles()
        for (const player of this.state.players) player.isActive = this.state.players.indexOf(player) === this.nextPlayer
        this.setState({ board: this.state.board, savedWords: this.state.savedWords, players: players, nextPlayer: this.nextPlayer }, () => {
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
                this.setState({ players: players, finished: true })
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

    handleCharChange (tile, char) {
        let tileHorizontallyAdjacent, tileVerticallyAdjacent, lineHorizontal, lineVertical, rowIndex, columnIndex, hasPoints = false, wildCardLetter = 0
        for (const letter of this.state.board.letters)
            if (char && ((char === letter.letter && this.checkForLetter(char).inHand) || (letter.wildCard && this.checkForLetter(letter.letter).inHand))) {
                if (!tile.locked) tile.points = letter.value
                hasPoints = true
                if (letter.wildCard) wildCardLetter = letter.letter
                break
            }
        for (const row of this.state.board.board) {
            tileHorizontallyAdjacent = this.state.board.checkHorizontalAdjacency(row, tile)
            tileVerticallyAdjacent = this.state.board.checkVerticalAdjacency(row, tile, this.state.board.board)
            if (tileHorizontallyAdjacent || tileVerticallyAdjacent) break
        }
        // check if the line of letters is horizontal or vertical
        if (this.placedTiles.length > 1) {
            lineHorizontal = this.findRowIndex(this.placedTiles[0]) === this.findRowIndex(this.placedTiles[1])
            if (lineHorizontal) rowIndex = this.findRowIndex(this.placedTiles[1])
            lineVertical = this.findColumnIndex(this.placedTiles[0]) === this.findColumnIndex(this.placedTiles[1])
            if (lineVertical) columnIndex = this.findColumnIndex(this.placedTiles[1])
        }
        if (((hasPoints // check if a tile was meant to be placed
                // check if the tile is adjacent to another and exclusively forms a single horizontal line with the other tiles placed in the same turn
                && ((((tileHorizontallyAdjacent && (((rowIndex === this.findRowIndex(tile)) && lineHorizontal) || this.placedTiles.length <= 1))
                // check if the tile is adjacent to another and exclusively forms a single vertical line with the other tiles placed in the same turn
                || (tileVerticallyAdjacent && (((columnIndex === this.findColumnIndex(tile)) && lineVertical) || this.placedTiles.length <= 1))))
                || tile.start)) // if the tile is not adjacent to any other tiles, check if the tile is in the start slot
                || !char) // if the above conditions fail, check if a tile was meant to be removed
                && !tile.locked) { // make sure that the tile being placed or removed wasn't in a slot already occupied from a previous turn
            if (!char) this.returnTileToPlayer(tile) // check if a tile was meant to be removed
            else if (!tile.char) { // check if a tile was meant to be placed
                this.placedTiles.push(tile)
                this.placedTileIndices.push(this.placedTileIndex++)
                // remove the tile from the player's hand
                this.state.players[this.nextPlayer].hand.splice(this.checkForLetter(wildCardLetter ? wildCardLetter : char).handIndex, 1)
            }
            else if (char !== tile.char) { // check if a tile was swapped with another
                this.state.players[this.nextPlayer].hand.push(tile.char) // place the old tile back in the player's hand
                // remove the new tile from the player's hand
                this.state.players[this.nextPlayer].hand.splice(this.checkForLetter(wildCardLetter ? wildCardLetter : char).handIndex, 1)
            }
            tile.char = wildCardLetter ? wildCardLetter : char
            tile.name = char
            // ensure that any tiles placed within a horizontal line in the same turn are not interrupted by a gap
            if (char && this.findRowIndex(this.placedTiles[0]) === this.findRowIndex(this.placedTiles[1]))
                for (const column of this.state.board.board[this.findRowIndex(this.placedTiles[1])])
                    if (!column.char && ((this.findColumnIndex(column) > this.findColumnIndex(this.placedTiles[0])
                            && this.findColumnIndex(column) < this.findColumnIndex(tile))
                            || (this.findColumnIndex(column) < this.findColumnIndex(this.placedTiles[0])
                            && this.findColumnIndex(column) > this.findColumnIndex(tile)))) {
                        this.returnTileToPlayer(tile)
                        break
                    }
            // ensure that any tiles placed within a vertical line in the same turn are not interrupted by a gap
            if (char && this.findColumnIndex(this.placedTiles[0]) === this.findColumnIndex(this.placedTiles[1]))
                for (const row of this.state.board.board)
                    if  (!row[this.findColumnIndex(this.placedTiles[1])].char
                            && ((this.findRowIndex(row[this.findColumnIndex(this.placedTiles[1])]) > this.findRowIndex(this.placedTiles[0])
                            && this.findRowIndex(row[this.findColumnIndex(this.placedTiles[1])]) < this.findRowIndex(tile))
                            || (this.findRowIndex(row[this.findColumnIndex(this.placedTiles[1])]) < this.findRowIndex(this.placedTiles[0])
                            && this.findRowIndex(row[this.findColumnIndex(this.placedTiles[1])]) > this.findRowIndex(tile)))) {
                        this.returnTileToPlayer(tile)
                        break
                    }
            // for when there are only two tiles, ensure that the second tile is in the same row or column as the first tile
            if (this.placedTiles.length === 2 ? this.findColumnIndex(this.placedTiles[0]) !== this.findColumnIndex(this.placedTiles[1])
                    && this.findRowIndex(this.placedTiles[0]) !== this.findRowIndex(this.placedTiles[1]) : false) {
                this.returnTileToPlayer(tile)
            }
        }
        // remove tiles that were placed after the placement of another tile that was later removed
        for (let i = 0; i < this.placedTiles.length; i++)
            if (i !== this.placedTileIndices[i]) {
                this.state.players[this.nextPlayer].hand.push(this.placedTiles[i].char) // place the removed tile back in the player's hand
                for (const row of this.state.board.board)
                    if (row[row.indexOf(this.placedTiles[i])]) {
                        row[row.indexOf(this.placedTiles[i])].char = ''
                        row[row.indexOf(this.placedTiles[i])].name = ''
                        row[row.indexOf(this.placedTiles[i])].points = 0
                    }
                this.placedTiles.splice(i, 1)
                this.placedTileIndices.splice(i, 1)
                this.placedTileIndex--
                i--
            }
        if (tile.points && !tile.char) tile.points = 0
        this.setState({ board: this.state.board })
    }

    render () {
        let potentialWords = this.state.board.getPotentialWords(), potentialWordCount = 0, savedWordCount = 0, playerCount = 0
        return <div>
            <button onClick={() => {
                this.setState({ players: [...this.state.players, { name: 'Player ' + (this.state.players.length + 1), hand: [], score: 0,
                    isActive: !this.state.players.length }] }, () => {
                        this.addTiles()
                        this.setState({ players: this.state.players.slice() })
                    })}}>Add Player</button>
            {!this.state.finished ? <button onClick={() => this.endTurn(potentialWords)}>Next Player</button> : <label>[ Game Finished ]</label>}
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
            <div>{this.state.players.map(player => <label key={playerCount++}>
                {(player.isActive ? '* ' : '') + player.name + ' (Score: ' + player.score + (player.isActive ? ', Hand: ' + player.hand : '') + ')'}
                {this.state.players.indexOf(player) < this.state.players.length - 1 ? <br/> : ''}
            </label>)}</div>
            <br/>
            {this.state.savedWords.words.map(savedWord => <label key={savedWordCount++}>
                {savedWord + ' (' + this.state.savedWords.scores[savedWordCount] + ')' +
                    (this.state.savedWords.words.indexOf(savedWord) < this.state.savedWords.words.length - 1 || potentialWords.words.length ? ', ' : '')}
            </label>)}
            {potentialWords.words.map(potentialWord => <label key={potentialWordCount++}>
                {potentialWord + ' (' + potentialWords.scores[potentialWordCount] + ')' +
                    (potentialWords.words.indexOf(potentialWord) < potentialWords.words.length - 1 ? ', ' : '')}
            </label>)}
        </div>
    }
}

export default Board
