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
 *           NeallyPJ
 *          MelcoreHat
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
	x: 120,
	y: 200,
	angle: 45, // 1-89
	directionAngulaire: 1, // +1 : sens trigo , -1 sens horaire
	v0: 0,  // 180 <-> 90
	size: 100,
}
const boulet = {
	x: 0,
	y: 0,
	size: 15,
	triggerTime: 0,
	speedFactor: 100,
	initialAngle: 45,
	initialX: 0,
	initialY: 0,
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
	drawCanon(canon.angle);
	// Draw le panier
	drawPanier();
	// Draw le score
	drawScore();
	// Draw Explosion
	drawExplosion();

	refreshFPS();

	if (boulet.x > (canon.x + distance)) {
		boulet.x = (canon.x - canon.size / 2) +	(canon.size / 2) * Math.cos(deg2rad(canon.angle)) - boulet.size /2;
		boulet.y = canon.y + 										(canon.size / 2) * Math.sin(deg2rad(canon.angle)) - boulet.size / 2;
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
			boulet.initialAngle = canon.angle;
			boulet.initialX = boulet.x;
			boulet.initialY = boulet.y;
			distance = (Math.pow(canon.v0, 2) / physics.g) * Math.sin(2 * deg2rad(boulet.initialAngle));
			hauteur = (Math.pow(canon.v0, 2) * Math.pow(Math.sin(deg2rad(boulet.initialAngle)), 2)) / (2 * physics.g);

			// Calcule le score avant l'animation :D
			addScore(((distance + boulet.initialX) < (panier.x + panier.size)) && ((distance + boulet.initialX) > (panier.x - panier.size)))
			boulet.triggerTime = Date.now();
			explosion.lastStart = boulet.triggerTime;
			socket.emit('player.shoot', {v0: canon.v0, initialAngle: boulet.initialAngle, initialX: boulet.initialX, initialY: boulet.initialY });
		}
	}

	moveCanon();
	movePanier()

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
	ball.initialAngle = data.ball.initialAngle;
	ball.initialX = data.ball.initialX;
	ball.initialY = data.ball.initialY;
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

function moveCanon() {
	if (canon.angle < 89 && canon.directionAngulaire == 1){
		canon.angle++;
	} else if (canon.angle > 1 && canon.directionAngulaire == -1) {
		canon.angle--;
	} else {
		canon.directionAngulaire = -canon.directionAngulaire;
	}
	boulet.x = (canon.x - canon.size / 2) +	(canon.size / 2) * Math.cos(deg2rad(canon.angle)) - boulet.size /2;
	boulet.y = canon.y + 										(canon.size / 2) * Math.sin(deg2rad(canon.angle)) - boulet.size / 2;
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
	ctx.drawImage(explo_image, boulet.initialX - 50, reverseY(boulet.initialY + 45));
}

function drawScore() {
	ctx.font = "18pt Verdana";
	ctx.fillStyle = "black";
	if (score.player){
		score.players.forEach((item, idx) => {
			ctx.fillText(`${item['name']} - ${item['score']}`, 600, 50 + idx*22);
		});
	}
}

function drawTrajectory() {
	// Distance = (v² / g) * sin(2*alpha)
	// Hauteur = (v² * sin²alpha) / (2g)
	ctx.save();
	ctx.setLineDash([5, 3]);
	ctx.beginPath();
	ctx.lineWidth = 1;
	ctx.strokeStyle = '#333333';
	ctx.moveTo(boulet.initialX, reverseY(boulet.initialY));
	ctx.quadraticCurveTo(boulet.initialX + (distance / 2), reverseY(boulet.initialY + hauteur * 2), boulet.initialX + distance, reverseY(boulet.initialY));
	ctx.stroke();
	ctx.restore();
}

function drawCannonball() {
	// x = cos(alpha) * v0 * t
	// y = -1/2 * g * t² + sin(alpha) * v0 * t + h

	if (boulet.triggerTime){
		let time = Date.now();
		let t = (time - boulet.triggerTime) / boulet.speedFactor;
		let x = boulet.initialX + Math.cos(deg2rad(boulet.initialAngle)) * canon.v0 * t;
		let y = -((physics.g * Math.pow(t, 2)) / 2) + (Math.sin(deg2rad(boulet.initialAngle)) * canon.v0 * t) + boulet.initialY;
		boulet.x = x;
		boulet.y = y;
	}

	ctx.beginPath();
	ctx.arc(boulet.x, reverseY(boulet.y), boulet.size, 0, Math.PI*2, true);
	ctx.strokeStyle = "black";
	ctx.fillStyle = "black";
	ctx.fill();
	ctx.stroke();
}

function drawOthersCannonball() {
	// x = cos(alpha) * v0 * t
	// y = -1/2 * g * t² + sin(alpha) * v0 * t + h
	let time = Date.now();
	playersCannonballs.forEach((item) => {
		if(!item.triggerTime)
			return;

		let t = (time - item.triggerTime) / item.speedFactor;
		// Possible erreur en multijoueur du au canon qui n'en s'en pas au meme endroit
		// Solution faire passer l'angle de tir par le serveur.
		let x = item.initialX + Math.cos(deg2rad(item.initialAngle)) * item.v0 * t;
		let y = -((physics.g * Math.pow(t, 2)) / 2) + (Math.sin(deg2rad(item.initialAngle)) * item.v0 * t) + item.initialY;
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
