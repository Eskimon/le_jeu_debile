
export function deg2rad(angle) {
	return (Math.PI * angle) / 180;
}

export function reverseY(y) {
	return 800 - y;
}

const fpsCountOutput = document.getElementById('fpscounter');
let lastUpdateTime = Date.now();
let lastFPSRefresh = 0;

export function refreshFPS() {
	let time = Date.now();
	let delta = time - lastUpdateTime;
	lastUpdateTime = time;
	let delta_refresh = time - lastFPSRefresh;

	if (delta_refresh > 500) {
		fpsCountOutput.textContent = Math.round(1000 / delta)
		lastFPSRefresh = time;
	}
}

export function getFPS(){
	return fpsCountOutput.textContent;
}
