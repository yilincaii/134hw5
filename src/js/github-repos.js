/* github-repos.js
   Part 2: <github-repos>
   Usage:
     <github-repos username="yilincaii" count="5">
       <p class="grepos-fallback">My public repositories are listed on
       <a href="https://github.com/yilincaii">github.com/yilincaii</a>.</p>
     </github-repos>
 */

const TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const template = document.createElement('template');
template.innerHTML = `
	<p class="grepos-loading" hidden>Loading repositories&hellip;</p>
	<p class="grepos-error" hidden>
		<span class="grepos-error-message"></span>
		<button type="button" class="grepos-retry">Retry</button>
	</p>
	<ul class="grepos-list" hidden></ul>
`;

function timeAgo(isoDate) {
	const then = new Date(isoDate).getTime();
	const now = Date.now();
	const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));

	if (days < 1) return 'today';
	if (days === 1) return '1 day ago';
	if (days < 30) return `${days} days ago`;

	const months = Math.floor(days / 30);
	if (months < 12) return months === 1 ? '1 month ago' : `${months} months ago`;

	const years = Math.floor(months / 12);
	return years === 1 ? '1 year ago' : `${years} years ago`;
}

class GithubRepos extends HTMLElement {
	static get observedAttributes() {
		return ['username', 'count'];
	}

	connectedCallback() {
		if (!this._built) {
			const clone = template.content.cloneNode(true);
			this.appendChild(clone);

			this._loadingEl = this.querySelector('.grepos-loading');
			this._errorEl = this.querySelector('.grepos-error');
			this._errorMessageEl = this.querySelector('.grepos-error-message');
			this._listEl = this.querySelector('.grepos-list');
			this._retryButton = this.querySelector('.grepos-retry');
			this._retryButton.addEventListener('click', () => this.load());

			this._built = true;
		}

		this.load();
	}

	disconnectedCallback() {
		if (this._controller) {
			this._controller.abort();
		}
		if (this._timeoutId) {
			clearTimeout(this._timeoutId);
		}
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (!this._built || oldValue === newValue) return;
		this.load();
	}

	get username() {
		return this.getAttribute('username') || 'yilincaii';
	}

	get count() {
		const value = parseInt(this.getAttribute('count'), 10);
		return Number.isInteger(value) && value > 0 ? value : 5;
	}

	setState(state) {
		this.setAttribute('state', state);
	}
	async load() {
		if (this._controller) {
			this._controller.abort();
		}
		if (this._timeoutId) {
			clearTimeout(this._timeoutId);
		}

		const username = this.username;
		const count = this.count;
		const cacheKey = `github-repos:${username}:${count}`;

		const cached = this.readCache(cacheKey);
		if (cached) {
			this.renderRepos(cached);
			this.setState('ready');
			return;
		}

		this.setState('loading');
		this._loadingEl.hidden = false;
		this._errorEl.hidden = true;
		this._listEl.hidden = true;

		const controller = new AbortController();
		this._controller = controller;
		this._timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

		try {
			const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&direction=desc&per_page=${count}`;
			const response = await fetch(url, { signal: controller.signal });

			if (!response.ok) {
				throw new Error(`GitHub API responded with ${response.status}`);
			}

			const data = await response.json();
			const repos = data.slice(0, count);

			this.writeCache(cacheKey, repos);
			this.renderRepos(repos);
			this.setState('ready');
		} catch (error) {
			const timedOut = error.name === 'AbortError';
			this.showError(timedOut ? 'The request timed out. Please try again.' : 'Could not load repositories right now.');
			this.setState('error');
		} finally {
			clearTimeout(this._timeoutId);
		}
	}

	renderRepos(repos) {
		this._listEl.innerHTML = '';

		if (repos.length === 0) {
			this.setState('idle');
			this._listEl.hidden = true;
			this._loadingEl.hidden = true;
			this._errorEl.hidden = true;
			return;
		}

		repos.forEach((repo) => {
			const li = document.createElement('li');

			const link = document.createElement('a');
			link.href = repo.html_url;
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
			link.textContent = repo.name;
			li.appendChild(link);

			const language = document.createElement('span');
			language.className = 'grepos-lang';
			language.textContent = repo.language || 'N/A';
			li.appendChild(language);

			const updated = document.createElement('span');
			updated.className = 'grepos-updated';
			updated.textContent = `Updated ${timeAgo(repo.updated_at)}`;
			li.appendChild(updated);

			this._listEl.appendChild(li);
		});

		this._loadingEl.hidden = true;
		this._errorEl.hidden = true;
		this._listEl.hidden = false;
	}

	showError(message) {
		this._errorMessageEl.textContent = message;
		this._loadingEl.hidden = true;
		this._listEl.hidden = true;
		this._errorEl.hidden = false;
	}

	readCache(key) {
		try {
			const raw = sessionStorage.getItem(key);
			if (!raw) return null;
			const parsed = JSON.parse(raw);
			if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
			return parsed.repos;
		} catch (error) {
			return null;
		}
	}

	writeCache(key, repos) {
		try {
			sessionStorage.setItem(key, JSON.stringify({ cachedAt: Date.now(), repos }));
		} catch (error) {
			// sessionStorage unavailable (private browsing, quota, etc.) —
			// the component still works, it just re-fetches next time.
		}
	}
}

customElements.define('github-repos', GithubRepos);