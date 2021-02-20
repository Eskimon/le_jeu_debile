import { ctx } from './client.js';
import { deg2rad } from './client-utils.js';

export const CANON_WIDTH = 512;
export const CANON_HEIGHT = 512;
export const CANON_SCALE = 0.2;

// Original SVG: https://image.flaticon.com/icons/svg/1747/1747947.svg
export const CANON_PARTS = {
	body: {
		path: new Path2D('m467 164.003906c-9.308594 0-17.960938 2.839844-25.144531 7.699219-4.832031-10.582031-11.695313-20.242187-20.320313-28.308594-13.414062-12.550781-30.386718-20.601562-48.339844-23.261719 5.863282-18.042968 22.832032-31.128906 42.804688-31.128906 8.285156 0 15-6.714844 15-15s-6.714844-15-15-15c-36.621094 0-67.175781 26.390625-73.695312 61.148438l-208.300782 13.886718c-7.882812.523438-14.003906 7.070313-14.003906 14.964844v120c0 7.898438 6.125 14.441406 14.003906 14.96875l31.777344 2.117188 2.644531-21.820313c2.992188-24.679687 13.246094-47.136719 29.65625-64.941406 15.15625-16.445313 34.789063-28.15625 56.773438-33.867187 9.789062-2.542969 19.832031-3.832032 29.84375-3.832032 12.367187 0 24.558593 1.949219 36.238281 5.792969 22.996094 7.570313 42.882812 22.199219 57.503906 42.308594l45.453125 62.496093c1.941407-1.945312 3.804688-3.980468 5.566407-6.109374 5.011718-6.054688 9.167968-12.726563 12.402343-19.804688 7.183594 4.855469 15.835938 7.691406 25.136719 7.691406 24.8125 0 45-20.1875 45-45s-20.1875-45-45-45zm0 60c-8.269531 0-15-6.730468-15-15 0-8.269531 6.730469-15 15-15s15 6.730469 15 15c0 8.269532-6.730469 15-15 15zm0 0'),
		color: 'black',
		rotate: true,
	},
	exit: {
		path: new Path2D('m45 104.003906c-24.8125 0-45 20.1875-45 45v120c0 24.8125 20.1875 45 45 45s45-20.1875 45-45v-120c0-24.8125-20.1875-45-45-45zm0 0'),
		color: 'red',
		rotate: true,
	},
	foot: {
		path: new Path2D('m354.179688 227.371094c-10.898438-14.984375-25.640626-25.863282-42.625-31.453125-15.761719-5.1875-32.761719-5.679688-49.160157-1.421875-16.394531 4.257812-31.007812 12.957031-42.253906 25.164062-12.117187 13.148438-19.703125 29.820313-21.933594 48.21875l-15.382812 126.914063c-1.203125 9.9375 1.914062 19.929687 8.550781 27.421875 6.640625 7.492187 16.1875 11.789062 26.195312 11.789062h178.878907c20.792969 0 39.574219-11.511718 49.011719-30.042968 9.433593-18.53125 7.699218-40.492188-4.53125-57.308594zm-70.179688 61.132812c-8.285156 0-15-6.714844-15-15s6.714844-15 15-15 15 6.714844 15 15-6.714844 15-15 15zm0 0'),
		color: 'black',
	},
	spark1: {
		path: new Path2D('m431 47.992188c2.363281 1.367187 4.941406 2.011718 7.484375 2.011718 5.1875 0 10.230469-2.6875 13.003906-7.5l11.546875-20c4.144532-7.175781 1.6875-16.347656-5.488281-20.492187s-16.347656-1.683594-20.488281 5.492187l-11.546875 20c-4.144531 7.171875-1.6875 16.347656 5.488281 20.488282zm0 0'),
		color: 'orange',
		rotate: true,
	},
	spark2: {
		path: new Path2D('m446 74.003906c0 8.285156 6.714844 15 15 15h30c8.285156 0 15-6.714844 15-15s-6.714844-15-15-15h-30c-8.285156 0-15 6.714844-15 15zm0 0'),
		color: 'orange',
		rotate: true,
	},
	spark3: {
		path: new Path2D('m431 100.011719c-7.175781 4.144531-9.632812 13.316406-5.488281 20.492187l11.546875 20c2.777344 4.8125 7.820312 7.5 13.003906 7.5 2.542969 0 5.121094-.644531 7.484375-2.011718 7.175781-4.140626 9.632813-13.316407 5.488281-20.488282l-11.546875-20c-4.140625-7.175781-13.3125-9.632812-20.488281-5.492187zm0 0'),
		color: 'orange',
		rotate: true,
	},
}

for (let part in CANON_PARTS) {
	const svg = document.createElement('svg');
	const path = document.createElement('path');

	svg.appendChild(path)
	svg.getBoundingClientRect()
}


export function drawCanonPart(name, angle, dx, dy) {
	const part = CANON_PARTS[name]
	if (!part) {
		throw new Error('Canon part not found')
	}

	if (!angle) angle = 42
	if (!dx) dx = 120
	if (!dy) dy = 570

	ctx.save()
	ctx.translate(dx, dy)

	// ctx.fillStyle = 'blue';
	// ctx.fillRect(0, 0, 20, 4);

	// if (part.rotate) {
		ctx.translate(-((CANON_WIDTH * CANON_SCALE) / 2), (CANON_HEIGHT * CANON_SCALE / 2))
		// ctx.fillStyle = 'pink';
		// ctx.fillRect(0, 0, 20, 4);

		ctx.rotate(deg2rad(-angle))
		// ctx.fillStyle = 'orange';
		// ctx.fillRect(0, 0, 20, 4);
		ctx.translate((CANON_WIDTH * CANON_SCALE / 2), -(CANON_HEIGHT * CANON_SCALE / 2))
	// }
	// if (!part.rotate) {
	// 	ctx.rotate(deg2rad(40))
	// }
	ctx.scale(-CANON_SCALE, CANON_SCALE)
	// ctx.fillStyle = 'blue';
	// ctx.fillRect(0, 0, 20, 4);
	// ctx.translate(dx, dy)
	ctx.fillStyle = part.color || 'black'
	ctx.fill(part.path)
	ctx.restore()
}

export function drawCanon(angle) {
	drawCanonPart('body', angle);
	drawCanonPart('exit', angle);
	drawCanonPart('spark1', angle);
	drawCanonPart('spark2', angle);
	drawCanonPart('spark3', angle);
	drawCanonPart('foot', 0);
}
