// Gestion du son

const audioCtx = new AudioContext();
const distortion = audioCtx.createWaveShaper();
const gainNode = audioCtx.createGain();
const biquadFilter = audioCtx.createBiquadFilter();
const convolver = audioCtx.createConvolver();
const analyser = audioCtx.createAnalyser();
analyser.minDecibels = -50;
analyser.maxDecibels = -1;
analyser.smoothingTimeConstant = 0.15;

analyser.fftSize = 256;

export const GameAudio = {
	source: undefined,
	threshold: 60,
	amortisseur: 1.5,
	analyser,
	dataArrayAlt: new Uint8Array(analyser.frequencyBinCount)
};

if (navigator.mediaDevices.getUserMedia) {
	var constraints = { audio: true }
	navigator.mediaDevices.getUserMedia(constraints)
		.then((stream) => {
			GameAudio.source = audioCtx.createMediaStreamSource(stream);
			const audio = GameAudio.source.connect(distortion);
			distortion.connect(biquadFilter);
			biquadFilter.connect(gainNode);
			convolver.connect(gainNode);
			gainNode.connect(analyser);
			analyser.connect(audioCtx.destination);

			// gainNode.gain.value = 0;
			// debugger;
		})
		.catch((err) => {
			console.error(err);
		})
} else {
	console.warning('getUserMedia not supported on your browser!');
}
