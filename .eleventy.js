module.exports = function (eleventyConfig) {

	eleventyConfig.addPassthroughCopy("src/styles");
	eleventyConfig.addPassthroughCopy("src/images");
	eleventyConfig.addPassthroughCopy("src/fonts");
	eleventyConfig.addPassthroughCopy("src/videos");
	eleventyConfig.addPassthroughCopy("src/js");
	eleventyConfig.addPassthroughCopy("src/resume.pdf");
	eleventyConfig.addFilter("groupByCategory", (items) => {
		const groups = {};
		items.forEach((item) => {
			const category = item.data.category || "Uncategorized";
			if (!groups[category]) {
				groups[category] = [];
			}
			groups[category].push(item);
		});
		return groups;
	});

	return {
		dir: {
			input: "src",
			output: "_site",
			includes: "_includes",
			data: "_data"
		}
	};
};