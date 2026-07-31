/* canvas-demo.js
   Draws the sample rectangle on the Experiments page canvas.*/

const canvas = document.getElementById('demo-canvas');
if (canvas) {
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = '#688000';
	ctx.fillRect(20, 20, 100, 110);
	ctx.strokeStyle = '#000878';
	ctx.strokeRect(20, 20, 100, 110);
}