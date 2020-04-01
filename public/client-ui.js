import { socket } from './client-sockets.js';

const uiContainer = document.getElementById('game-ui')

export const $ = document.querySelector.bind(document);
export const $$ = document.querySelectorAll.bind(document);

export function showTpl(tplName) {
	return new Promise((resolve, reject) => {
		const tpl = document.getElementById(`tpl-${tplName}`)

		if (!tpl) {
			reject(new Error('Template not found'))
			return
		}

		clearUI()

		uiContainer.innerHTML = tpl.innerHTML

		setTimeout(() => {
			resolve()
		}, 0)

		switch(tplName) {
			case 'join-game':
				setTimeout(() => {
					$('#game-join-form').addEventListener('submit', (evt) => {
						evt.preventDefault()

            const gameId = $('#game-join-session-code').value
            const playerName = $('#player-name-input').value

						socket.emit('games.join', { gameId, playerName })
					});

					$('#game-create-form').addEventListener('submit', (evt) => {
						evt.preventDefault()

            const playerName = $('#player-name-input').value
						socket.emit('games.create', { playerName })
					});

					resolve()
				}, 0);
			break;
		}
	})
}

export function clearUI() {
	uiContainer.innerHTML = '';
}
