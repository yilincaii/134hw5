/* search.js
   Extra Credit: site search, backed by Pagefind. */

const form = document.querySelector('#search-form');
const input = document.querySelector('#search-input');
const status = document.querySelector('#search-status');
const results = document.querySelector('#search-results');

let pagefind;
let debounceTimer;
async function loadPagefind() {
	if (!pagefind) {
		pagefind = await import('/pagefind/pagefind.js');
		await pagefind.init();
	}
	return pagefind;
}

async function runSearch(query) {
	if (!query) {
		results.innerHTML = '';
		status.textContent = '';
		return;
	}

	const pf = await loadPagefind();
	const search = await pf.search(query);

	results.innerHTML = '';

	if (search.results.length === 0) {
		status.textContent = 'No results found.';
		return;
	}
	status.textContent = `${search.results.length} result${search.results.length === 1 ? '' : 's'} found.`;
	for (const result of search.results) {
		const data = await result.data();

		const li = document.createElement('li');

		const link = document.createElement('a');
		link.href = data.url;
		link.textContent = data.meta.title || data.url;
		li.appendChild(link);

		const excerpt = document.createElement('p');
		excerpt.innerHTML = data.excerpt; // Pagefind-controlled excerpt with <mark> highlights, not raw user input
		li.appendChild(excerpt);

		results.appendChild(li);
	}
}
if (form && input) {
	form.addEventListener('submit', (event) => {
		event.preventDefault();
		runSearch(input.value.trim());
	});

	input.addEventListener('input', () => {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			runSearch(input.value.trim());
		}, 300);
	});
}