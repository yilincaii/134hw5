/* hello-world.js
   Carried over from HW2 Part 2. Prints a console message on connect. */

class HelloWorld extends HTMLElement {
	connectedCallback() {
		console.log('Hello World!');
	}
}

customElements.define('hello-world', HelloWorld);