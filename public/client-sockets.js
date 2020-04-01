export const socket = io.connect('http://localhost:3000');

socket.on('connected', function (data) {
	console.log(data);
});
