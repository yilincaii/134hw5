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
function renderExcerpt(container, excerptText) {
	const pattern = /<mark>(.*?)<\/mark>/g;
	let lastIndex = 0;
	let match;

	while ((match = pattern.exec(excerptText)) !== null) {
		if (match.index > lastIndex) {
			container.appendChild(document.createTextNode(excerptText.slice(lastIndex, match.index)));
		}
		const mark = document.createElement('mark');
		mark.textContent = match[1];
		container.appendChild(mark);
		lastIndex = pattern.lastIndex;
	}

	if (lastIndex < excerptText.length) {
		container.appendChild(document.createTextNode(excerptText.slice(lastIndex)));
	}
}

async function runSearch(query) {
	if (!query) {
		results.replaceChildren();
		status.textContent = '';
		return;
	}

	const pf = await loadPagefind();
	const search = await pf.search(query);

	results.replaceChildren();

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
		renderExcerpt(excerpt, data.excerpt);
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