# CSE134B-<TermInfo>-HW2
# Name: Yilin Cai
# PID: A18556317
# HW5 — Yilin Cai

## Setup

I'm using Eleventy (11ty) to build this site. Here's how to run it:

```bash
npm install
npm run dev
```

That starts a local server and reloads automatically when I change something. To build the actual site (the thing Netlify deploys):

```bash
npm run build
```

This spits out a `_site/` folder with the finished HTML. I don't commit that folder — it gets rebuilt fresh every time I push, straight from `src/`.

## Part 1: Form Validation

I went with Option B, the contact form on my About Me page.

I started by adding `required`, `minlength`, `maxlength`, and `title` to the name, email, and message fields. That part works completely on its own. If I turn JavaScript off and try to submit the form empty, the browser still stops me and shows its own little bubble telling me what's wrong. Nothing breaks, nothing looks dead.

The CSS layer adds red or green borders using `:user-invalid` and `:user-valid`. I like this one because it only kicks in after I've actually touched a field, so an empty required field doesn't look "wrong" the second the page loads. That's pure CSS too, no script involved.

Then I added `js/form-validation.js` on top of all that. It listens for the `invalid` event on each field (that event fires when the browser blocks a submit because something failed), reads the field's `validity` object, and writes a plain-English message into an `<output>` next to the field, like "Please enter at least 2 characters." I also hooked up `input` and `blur` so the message updates live while I'm typing, not just when I try to submit.

Every error also gets pushed into an array and written as JSON into a hidden input, `name="form-errors"`. Each entry has the field name, what kind of error it was, and a timestamp, so if the form actually submitted somewhere, that log would go along with it.

 I didn't write any custom focus-management code. I just never call `preventDefault()` on the invalid event, so the browser's own default behavior — jumping focus to the first bad field — stays intact. 

## Part 2: `<github-repos>`

This pulls my public GitHub repos and shows them as a list on the Project page.

**Tag name:** `github-repos`

**Attributes:**

| Attribute | Default | Accepts |
|---|---|---|
| `username` | `yilincaii` | any GitHub username string |
| `count` | `5` | any positive integer |

Both attributes are watched, so changing either one in DevTools re-fetches and re-renders right away.

**Endpoint:** `https://api.github.com/users/{username}/repos?sort=updated&direction=desc&per_page={count}` — this is the public GitHub REST API, no key needed.

**Usage:**

```html
<github-repos username="yilincaii" count="5">
	<p class="grepos-fallback">My public repositories are listed on
	<a href="https://github.com/yilincaii">github.com/yilincaii</a>.</p>
</github-repos>
```

The paragraph inside the tags is what shows up if JavaScript never runs, or if the fetch fails and there's nothing to display instead. It just stays there in the regular DOM the whole time — I only hide it with CSS once the component successfully has real data to show (`github-repos[state="ready"] .grepos-fallback { display: none; }`).

The element reflects what it's doing through a `state` attribute — `loading`, `ready`, or `error` — so I can style each state in plain CSS without touching the JS again.

A few things I want to explain here, since I had to actually think these through:

- I don't touch `innerHTML` anywhere with data that came from GitHub. The `<template>` at the top uses `innerHTML` once, but that's just a fixed skeleton I typed myself — no live data goes into it. Every repo name, language, and date gets added with `document.createElement` and `textContent` instead. Here's why that matters: if someone named a repo something like `<img src=x onerror=alert(1)>`, and I dumped that straight into `innerHTML`, the browser would actually try to run it as real HTML. `textContent` just prints it as plain text on the screen, so nothing ever executes.
- Every fetch has a 5-second timeout using `AbortController`. If GitHub's API ever hangs, the widget doesn't sit there spinning forever — it switches to an error state with a retry button instead.
- I cache results in `sessionStorage` for 10 minutes. That way I'm not pinging the GitHub API constantly while I'm just reloading the page over and over working on the site.

## Part 3: Static Site Generator

I picked Eleventy over Astro mostly because it felt closer to what I already knew. My HW2 site was just plain HTML and CSS, and Eleventy's templates are basically that same HTML with a few extra tags sprinkled in

**What the conversion actually removed:** the header, nav, and footer used to be pasted into all nine of my HTML files by hand. Now they live in `_includes/header.njk` and `_includes/footer.njk` once, and every page just pulls them in. Same thing for the site title, nav links, and copyright year — those used to be typed out nine separate times and now live in one data file, `_data/site.js`. My three blog-style notes posts also used to be three nearly-identical hand-written files. Now they're markdown files with a bit of front matter, and one shared layout (`_includes/note.njk`) generates all three pages.

**What it cost me:** honestly, a learning curve I wasn't expecting. I spent a while just confused about why my `.njk` files "weren't showing up" before I understood that `.njk` isn't something a browser opens directly — it only becomes real HTML after I run the build command. I also had a bug where I accidentally created a duplicate set of templates in the wrong folder, and Eleventy was silently ignoring the correct ones. Debugging that took actual time. There's a real setup cost before any of the "less repetition" payoff kicks in.

**What I wouldn't use an SSG for:** if I were just making a single one-page site, or something with no real repeated structure, I don't think I'd bother. The whole point of an SSG is cutting down repetition across many pages, and if there's nothing to repeat, I'd just be adding a build step and a learning curve for no real reason. Plain HTML would honestly be faster to ship.

## Extra Credit: Pagefind Search

I added full-text search using Pagefind, and it runs automatically every time I build. My `npm run build` command is `eleventy && pagefind --site _site`, so Eleventy makes the site first, then Pagefind scans the finished HTML and builds a search index right on top of it. 

**What actually gets built:** Pagefind drops a `/pagefind/` folder into `_site/` full of index files and a small JS runtime. My search page imports that runtime with a dynamic `import()` at runtime, since the file doesn't even exist until after the build finishes running.

**How big the index is:** pretty tiny. My last build indexed 9 pages and about 750 words total, and Pagefind chunks that into a handful of small files instead of one giant blob, so only the pieces a search actually needs get downloaded.

**Why it doesn't need a server:** Pagefind does all the searching right in the browser. Instead of sending my query off to some backend and waiting on a response, the browser just pulls down the small index files and runs the search locally with JavaScript.

I scoped the indexing with `data-pagefind-body` on the `<main>` of every page, so only the actual page content gets indexed. Nav links and the footer never show up in results, and every result actually points to something different.