import { GameAudio } from './client-audio.js'
import { drawCanon, CANON_WIDTH } from './client-canon.js'
import { socket } from './client-sockets.js'
import { clearUI, showTpl, $, $$ } from './client-ui.js'
import { deg2rad, reverseY, refreshFPS, getFPS } from './client-utils.js'

/**
 *        Sponsors du jeu
 *
 *           Lyliya
 *         QuickTilted
 *
 *           ________
 *       (( /========\
 *       __/__________\____________n_
 *   (( /              \_____________]
 *     /  =(*)=          \
 *     |_._._._._._._._._.|         !
 * (( / __________________ \       =o
 *   | OOOOOOOOOOOOOOOOOOO0 |   =
 */

export const canvas = $('#latoile');
export const ctx = canvas.getContext('2d');


const physics = {
	g: 9.81,
}
const canon = {
	x: 100,
	y: 200,
	angle: 45, // 1-89
	v0: 0,  // 180 <-> 90
	size: 100,
}
const boulet = {
	x: 0,
	y: 0,
	size: 15,
	triggerTime: 0,
	speedFactor: 100,
}
const playersCannonballs = new Map()

const panier = {
	x: 600,
	size: 50,
	direction: -1, // +1 vers la droite, -1 vers la gauche
	vitesse: 1, // #de pixel parcouru à chaque tour de boucle
	/*
	// TODO: faire passer en # de seconde avec les FPS. J'ai créer une fonction
	getFPS pour ça.
	// TODO: faire passer la position du panier par le serveur, tous les joueurs
	n'ont pas la meme position de panier selon leur FPS. Ceci peut peut-etre etre
	reglé par le TODO précédent.
	*/
}

const explosion = {
	duration: 500,
	lastStart: 0,
}

let distance = 0;
let hauteur = 0;

let score = {};
let player = undefined;
const explo_image = new Image();
explo_image.src = 'explosion.png';


socket.on('connect', () => {
	showTpl('join-game')
});

socket.on('game.joined', (game) => {
	// Drawing!
	score = Object.assign({}, game);
	draw();
	showTpl('game-info').then(() => {
		$('#game-info-id').textContent = game.id
	});
});

socket.on('game.update', (game) => {
	// Drawing!
	score = Object.assign({}, game)
});

socket.on('player.status', (data) => {
	player = data
})

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw trajectory
	drawTrajectory();
	// Draw les boulets des autres
	drawOthersCannonball();
	// Draw le boulet
	drawCannonball();
	// Draw le canon
	drawCanon();
	// Draw le panier
	drawPanier();
	// Draw le score
	drawScore();
	// Draw Explosion
	drawExplosion();

	refreshFPS();

	if (boulet.x > (canon.x + distance)) {
		boulet.x = 0;
		boulet.y = 0;
		boulet.triggerTime = 0;
		distance = 0;
		hauteur = 0;
		// Refresh le score quand le ballon franchit le panier
		refreshScore();
	}

	playersCannonballs.forEach((item) => {
		if (item.y > (canvas.height)) {
			item.x = 0;
			item.y = 0;
			item.triggerTime = 0;
		}
	})

	if (!boulet.triggerTime) {
		// analyser.getByteTimeDomainData(GameAudio.dataArrayAlt);
		GameAudio.analyser.getByteFrequencyData(GameAudio.dataArrayAlt);
		let max = Math.max.apply(null, GameAudio.dataArrayAlt);

		if (max > GameAudio.threshold) {
			canon.v0 = max / GameAudio.amortisseur;
			distance = (Math.pow(canon.v0, 2) / physics.g) * Math.sin(2 * deg2rad(canon.angle));
			hauteur = (Math.pow(canon.v0, 2) * Math.pow(Math.sin(deg2rad(canon.angle)), 2)) / (2 * physics.g);

			// Calcule le score avant l'animation :D
			addScore(((distance + canon.x) < (panier.x + panier.size)) && ((distance + canon.x) > (panier.x - panier.size)))
			boulet.triggerTime = Date.now();
			explosion.lastStart = boulet.triggerTime;
			socket.emit('player.shoot', {v0: canon.v0});
		}
	}

	// Animation du panier
	movePanier();

	window.requestAnimationFrame(draw);
}

socket.on('player.shot', (data) => {
	if (data.player.name === player.name) {
		return;
	}

	let ball = playersCannonballs.get(data.player.name)

	if (!ball) {
		ball = {
			x: 0,
			y: 0,
			size: 15,
			triggerTime: 0,
			speedFactor: 150,
		}
		playersCannonballs.set(data.player.name, ball)
	}

	ball.v0 = data.ball.v0
	ball.triggerTime = Date.now();
});

function addScore(isScored) {
	if(!isScored)
		return;
	socket.emit('game.scored', {});
}

function refreshScore() {
	socket.emit('game.status', {});
}

function movePanier() {
	if (panier.x < 800 && panier.direction == 1){
		panier.x += panier.vitesse;
	}else if (panier.x > 400 && panier.direction == -1) {
		panier.x -= panier.vitesse;
	}else{
		panier.direction = -panier.direction;
	}

}

function drawExplosion() {
	if(!explosion.lastStart)
		return
	let time = Date.now();
	if((time - explosion.lastStart) > explosion.duration) {
		explosion.lastStart = 0;
	}
	ctx.drawImage(explo_image, canon.x - 50, reverseY(canon.y + 45));
}

function drawScore() {
	ctx.font = "18pt Verdana";
	ctx.fillStyle = "black";
	score.players.forEach((item, idx) => {
		ctx.fillText(`${item['name']} - ${item['score']}`, 600, 50 + idx*22);
	});
}

function drawTrajectory() {
	// Distance = (v² / g) * sin(2*alpha)
	// Hauteur = (v² * sin²alpha) / (2g)
	ctx.save();
	ctx.setLineDash([5, 3]);
	ctx.beginPath();
	ctx.lineWidth = 1;
	ctx.strokeStyle = '#333333';
	ctx.moveTo(canon.x, reverseY(canon.y));
	ctx.quadraticCurveTo(canon.x + (distance / 2), reverseY(canon.y + hauteur * 2), canon.x + distance, reverseY(canon.y));
	ctx.stroke();
	ctx.restore();
}

function drawCannonball() {
	// x = cos(alpha) * v0 * t
	// y = -1/2 * g * t² + sin(alpha) * v0 * t + h

	if (!boulet.triggerTime)
		return;

	let time = Date.now();
	let t = (time - boulet.triggerTime) / boulet.speedFactor;
	let x = canon.x + Math.cos(deg2rad(canon.angle)) * canon.v0 * t;
	let y = -((physics.g * Math.pow(t, 2)) / 2) + (Math.sin(deg2rad(canon.angle)) * canon.v0 * t) + canon.y;
	ctx.beginPath();
	ctx.arc(x, reverseY(y), boulet.size, 0, Math.PI*2, true);
	ctx.strokeStyle = "black";
	ctx.fillStyle = "black";
	ctx.fill();
	ctx.stroke();
	boulet.x = x;
	boulet.y = y;
}

function drawOthersCannonball() {
	// x = cos(alpha) * v0 * t
	// y = -1/2 * g * t² + sin(alpha) * v0 * t + h
	let time = Date.now();
	playersCannonballs.forEach((item) => {
		if(!item.triggerTime)
			return;

		let t = (time - item.triggerTime) / item.speedFactor;
		let x = canon.x + Math.cos(deg2rad(canon.angle)) * item.v0 * t;
		let y = -((physics.g * Math.pow(t, 2)) / 2) + (Math.sin(deg2rad(canon.angle)) * item.v0 * t) + canon.y;
		ctx.beginPath();
		ctx.arc(x, reverseY(y), item.size, 0, Math.PI*2, true);
		ctx.strokeStyle = "black";
		ctx.fillStyle = "orange";
		ctx.fill();
		ctx.stroke();
		item.x = x;
		item.y = y;
	})
}

function drawPanier() {
	ctx.fillStyle = '#fb7600';
	ctx.strokeStyle = '#777777';

	// Draw hoops
	ctx.beginPath();
	ctx.moveTo(panier.x - panier.size, reverseY(canon.y + 10));
	ctx.lineTo(panier.x + panier.size, reverseY(canon.y + 10));
	ctx.lineTo(panier.x + panier.size, reverseY(canon.y));
	ctx.lineTo(panier.x - panier.size, reverseY(canon.y));
	ctx.closePath();
	ctx.fill();
	// Draw net
	ctx.beginPath();
	for(let i=0; i<9; i++) {
		let temp = panier.size / 2 + 8;
		ctx.moveTo(panier.x + 4 - panier.size + (panier.size / 4.5 * i), reverseY(canon.y));
		ctx.lineTo(panier.x + 5 + 14 - panier.size + (temp/4.5 * i), reverseY(canon.y - 100));
		// ctx.lineTo(panier.x - panier.size + (panier.size / 4.5 * i) + (i > 4 ? -i*1.25 : (4-i)*2), reverseY(canon.y - 100));
	}
	ctx.closePath();
	ctx.stroke();

	ctx.beginPath();
	for(let i=0; i<8; i++) {
		ctx.moveTo(panier.x + 5 - panier.size + i*2, reverseY(canon.y - (100/8 * i)));
		ctx.lineTo(panier.x - 5 + panier.size - i*2, reverseY(canon.y - (100/8 * i)));
	}
	ctx.closePath();
	ctx.stroke();
}
