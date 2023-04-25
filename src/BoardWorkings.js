import boardData from './board.json'

class BoardWorkings {
    constructor () {
        let id = 0, name, color, fontColor, fontSize, hide, start
        const tileColor = boardData.tileColor, tileFontColor = boardData.tileFontColor,
            tileInvalidFontColor = boardData.tileInvalidFontColor, tileFontSize = boardData.tileFontSize
        this.letters = []
        this.letterBag = []
        for (const letter of boardData.letters) {
            this.letters.push(letter)
            for (let i = 0; i < letter.count; i++) this.letterBag.push(letter.letter)
        }
        this.shuffle()
        this.board = []
        this.parseCells(boardData.rows).forEach(row => {
            this.board.push([]) // create a new row
            row.forEach(tileTypeID => {
                for (const type of boardData.tileTypes) if (type.id === tileTypeID) {
                    name = type.name
                    color = type.color
                    fontColor = type.fontColor
                    fontSize = type.fontSize
                    hide = type.hide
                    start = type.start
                }
                // create a new tile slot
                this.board[this.board.length - 1].push({ id: id++, char: '', type: name, color: color, tileColor: tileColor, fontColor: fontColor,
                    tileFontColor: tileFontColor, tileInvalidFontColor: tileInvalidFontColor, fontSize: fontSize, tileFontSize: tileFontSize,
                    hide: hide, start: start, locked: false, valid: true, points: 0 })})
        })
    }

    parseCells (rows) {
        let tiles = []
        rows.forEach(row => tiles.push(row.split(' ')))
        return tiles
    }

    shuffle () {
        let tempLetter, tempIndex
        for (let i = 0; i < this.letterBag.length && this.letterBag.length; i++) {
            tempIndex = Math.floor(Math.random() * this.letterBag.length)
            tempLetter = this.letterBag[tempIndex]
            this.letterBag[tempIndex] = this.letterBag[i]
            this.letterBag[i] = tempLetter
        }
    }

    checkLeftTile (row, column) {
        return row[row.indexOf(column) - 1] ? row[row.indexOf(column) - 1] : false
    }

    checkRightTile (row, column) {
        return row[row.indexOf(column) + 1] ? row[row.indexOf(column) + 1] : false
    }

    checkHorizontalAdjacency (row, column) {
        return (this.checkLeftTile(row, column) ? this.checkLeftTile(row, column).char : false)
            || (this.checkRightTile(row, column) ? this.checkRightTile(row, column).char : false)
    }

    checkTileAbove (row, column, board) {
        return board ? board[board.indexOf(row) - 1] ? board[board.indexOf(row) - 1][row.indexOf(column)]
                ? board[board.indexOf(row) - 1][row.indexOf(column)] : false : false : false
    }

    checkTileBelow (row, column, board) {
        return board ? board[board.indexOf(row) + 1] ? board[board.indexOf(row) + 1][row.indexOf(column)]
                ? board[board.indexOf(row) + 1][row.indexOf(column)] : false : false : false
    }

    checkVerticalAdjacency (row, column, board) {
        return (this.checkTileAbove(row, column, board) ? this.checkTileAbove(row, column, board).char : false)
            || (this.checkTileBelow(row, column, board) ? this.checkTileBelow(row, column, board).char : false)
    }

    getPotentialWords () {
        let id = this.board[this.board.length - 1][this.board[this.board.length - 1].length - 1].id, board = [],
            potentialHWords = [{ word: '', score: 0 }], potentialVWords = [{ word: '', score: 0 }], columnStart = 0, hWordModifier = 1, vWordModifier = 1,
            hWordLocked = false, vWordLocked = false, hLock = true, vLock = true
        // append an additional invisible dummy tile to each row to prevent horizontal word wrapping
        this.board.forEach(row => board.push([...row.slice(), { id: id++, char: '', type: '', color: 'none', tileColor: 'none', fontColor: 'none',
            tileFontColor: 'none', tileInvalidFontColor: 'none', fontSize: 1, tileFontSize: 1, hide: 0, start: 0, locked: false, valid: false, points: 0 }]))
        // add an invisible row of dummy tiles to prevent vertical word wrapping
        board.push([])
        for (let i = 0; i < board[0].length; i++) board[board.length - 1].push({ id: id++, char: '', type: '', color: 'none', tileColor: 'none',
            fontColor: 'none', tileFontColor: 'none', tileInvalidFontColor: 'none', fontSize: 1, tileFontSize: 1, hide: 0, start: 0, locked: false,
            valid: false, points: 0 })
        for (const row of board) {
            for (const column of row) {
                if (!column.char && (this.checkLeftTile(row, column) ? this.checkLeftTile(row, column).char : false)) {
                    potentialHWords[potentialHWords.length - 1].score *= hWordModifier
                    hWordModifier = 1 // reset the modifier for the next searched word
                    if (hWordLocked || !potentialHWords[potentialHWords.length - 1].word) {
                        potentialHWords.pop() // remove the word if it is locked
                        hWordLocked = false
                    }
                    potentialHWords.push({ word: '', score: 0 }) // create a blank slate for a new potential word
                    hLock = true
                }
                else if (column.char && (!this.checkVerticalAdjacency(row, column, board) || this.checkHorizontalAdjacency(row, column))) {
                    potentialHWords[potentialHWords.length - 1].word += column.name // add the tile's letter to the potential word
                    potentialHWords[potentialHWords.length - 1].score += column.points // add the tile's points to the potential score of the word
                    for (const type of boardData.tileTypes)
                        if (type.name === column.type && !column.locked) {
                            // set the tile's modifier to act as a modifier for the entire word
                            if (type.affects === 'word') hWordModifier = type.modifier
                            // multiply the points of the tile by the tile's modifier
                            else potentialHWords[potentialHWords.length - 1].score += column.points * (type.modifier - 1)
                        }
                    if (hLock) hLock = column.locked
                    hWordLocked = hLock // lock the word played by a previous player so that it does not count as a word played by the current player
                }
                for (const columnRow of board)
                    if (!columnRow[row.indexOf(column)].char && (board[board.indexOf(columnRow) - 1]
                            ? board[board.indexOf(columnRow) - 1][row.indexOf(column)].char : false)) {
                        potentialVWords[potentialVWords.length - 1].score *= vWordModifier
                        vWordModifier = 1 // reset the modifier for the next searched word
                        if (vWordLocked || !potentialVWords[potentialVWords.length - 1].word) {
                            potentialVWords.pop() // remove the word if it is locked
                            vWordLocked = false
                        }
                        potentialVWords.push({ word: '', score: 0 }) // create a blank slate for a new potential word
                        vLock = true
                    }
                    else if (row.indexOf(column) >= columnStart && columnRow[row.indexOf(column)].char
                            && ((board[board.indexOf(columnRow) - 1]
                                ? board[board.indexOf(columnRow) - 1][row.indexOf(column)].char : false)
                            || (board[board.indexOf(columnRow) + 1]
                                ? board[board.indexOf(columnRow) + 1][row.indexOf(column)].char : false))) {
                        potentialVWords[potentialVWords.length - 1].word += columnRow[row.indexOf(column)].name // add the tile's letter to the potential word
                        // add the tile's points to the potential score of the word
                        potentialVWords[potentialVWords.length - 1].score += columnRow[row.indexOf(column)].points
                        for (const type of boardData.tileTypes)
                            if (type.name === columnRow[row.indexOf(column)].type && !columnRow[row.indexOf(column)].locked) {
                                // set the tile's modifier to act as a modifier for the entire word
                                if (type.affects === 'word') vWordModifier = type.modifier
                                // multiply the points of the tile by the tile's modifier
                                else potentialVWords[potentialVWords.length - 1].score += columnRow[row.indexOf(column)].points * (type.modifier - 1)
                            }
                        if (vLock) vLock = columnRow[row.indexOf(column)].locked
                        vWordLocked = vLock // lock the word played by a previous player so that it does not count as a word played by the current player
                    }
                columnStart++ // shift the starting column for searching to the right to prevent letters within each column from being read multiple times
            }
        }
        potentialHWords.splice(potentialHWords.indexOf(''), 1)
        potentialVWords.splice(potentialVWords.indexOf(''), 1)
        return potentialHWords.concat(potentialVWords)
    }
}

export default BoardWorkings
