const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

app.use(express.static('public'))

app.use(function (req, res, next) {
	res.status(404).send(`Sorry can't find that!`)
})

server.listen(3000, function () {
	console.info('Server listening on port 3000')
})

const GAME_SESSIONS = new Map();

const PIRATE_NAMES = [
	'Jack Sparrow',
	'Captain Morgan',
	'Black Bellamy',
	'Bloody Bill',
	'Billy Bones',
	'Cap\'n Crunch',
	'Admiral Dredge',
	'Drongo Kane',
	'Locke Lamora',
	'Johnny LaFitte',
	'Redbeard',
	'John Silver',
	'Captain Igloo'
];

try {
	io.on('connection', (socket) => {
		const name = PIRATE_NAMES[Math.floor(Math.random() * PIRATE_NAMES.length)]
		const player = new GamePlayer(name, socket)

		let playerGame;

		socket.emit('player.status', player)

		socket.on('games.create', (data) => {
			const playerGame = new GameSession()
			GAME_SESSIONS.set(playerGame.id, playerGame)
			player.name = data.playerName;
			playerGame.join(player)
			socket.emit('player.status', player)
		})

		socket.on('games.join', (data) => {
			const game = GAME_SESSIONS.get(data.gameId)

			if (!game) {
				socket.emit('client.error', 'Game session not found')
				return
			}

			player.name = data.playerName
			game.join(player)
			socket.emit('player.status', player)
			playerGame = game
		})

		socket.on('game.scored', (data) => {
			if (!playerGame) {
				socket.emit('client.error', 'No active game session')
				return
			}

			player.score++

			io.to(`game-${playerGame.id}`).emit('player.scored', player)
		})

		socket.on('game.status', (data) => {
			socket.emit('game.update', playerGame)
		})

		socket.on('player.shoot', (data) => {
			if (!playerGame) {
				socket.emit('client.error', 'No active game session')
				return
			}
			io.to(`game-${playerGame.id}`).emit('player.shot', { ball: data , player })
		})
	});
}
catch(e) {
	console.error(e)
}

/**
 * @prop {string} id
 * @prop {Array.GamePlayer} players
 */
class GameSession {
	constructor(player) {
		this.id = Math.random().toString(36).substr(7)
		this.players = []
	}

	join(player) {
		this.players.push(player)

		player.socket.emit('game.joined', this)
		player.socket.join(`game-${this.id}`);

		player.socket.on('disconnect', () => {
			this.quit(player)
		})
	}

	quit(player) {
		player.socket.leave(`game-${this.id}`);
		this.players.every((item, index) => {
			if (item.socket === player.socket) {
				this.players.splice(index, 1)
				return false
			}
			return true
		})
	}
}

/**
 * @prop {number} name
 * @prop {Socket} socket
 * @prop {number} score
 */
class GamePlayer {
	constructor(name, socket) {
		this.name = name
		this.socket = socket
		this.score = 0
	}

	toJSON() {
		return {
			name: this.name,
			score: this.score,
		}
	}

	/**
	 * @arg {number} score
	 */
	setScore(score) {
		this.score = score
	}
}

const testingSession = new GameSession()
testingSession.id = 'testing'

GAME_SESSIONS.set(testingSession.id, testingSession) // Create test session
