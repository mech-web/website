(() => {
  const stars = document.querySelector("[data-repository-stars]");
  const updated = document.querySelector("[data-repository-updated]");
  const release = document.querySelector("[data-repository-release]");
  const releaseLink = document.querySelector("[data-repository-release-link]");
  const releaseDate = document.querySelector("[data-repository-release-date]");

  if (!stars || !updated || !release || !releaseLink || !releaseDate) {
    return;
  }

  const relativeTime = (dateValue) => {
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - new Date(dateValue).getTime()) / 60000));

    if (elapsedMinutes < 60) {
      return `Updated ${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
    }

    const elapsedHours = Math.round(elapsedMinutes / 60);
    if (elapsedHours < 24) {
      return `Updated ${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
    }

    const elapsedDays = Math.round(elapsedHours / 24);
    return `Updated ${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
  };

  const fetchJson = async (url) => {
    const response = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
    });

    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}`);
    }

    return response.json();
  };

  Promise.allSettled([
    fetchJson("https://api.github.com/repos/mech-lang/mech"),
    fetchJson("https://api.github.com/repos/mech-lang/mech/releases/latest"),
  ]).then(([repositoryResult, releaseResult]) => {
    if (repositoryResult.status === "fulfilled") {
      stars.textContent = new Intl.NumberFormat("en-US").format(repositoryResult.value.stargazers_count);
      updated.textContent = relativeTime(repositoryResult.value.pushed_at);
    }

    if (releaseResult.status === "fulfilled") {
      release.textContent = releaseResult.value.tag_name;
      releaseLink.href = releaseResult.value.html_url;
      const published = new Date(releaseResult.value.published_at);
      releaseDate.dateTime = published.toISOString().slice(0, 10);
      releaseDate.textContent = published.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  });
})();
