(() => {
  const stars = document.querySelector("[data-repository-stars]");
  const updated = document.querySelector("[data-repository-updated]");
  const release = document.querySelector("[data-repository-release]");
  const releaseLink = document.querySelector("[data-repository-release-link]");
  const releaseDate = document.querySelector("[data-repository-release-date]");
  const heartbeat = document.querySelector("[data-repository-heartbeat]");

  if (!stars || !updated || !release || !releaseLink || !releaseDate || !heartbeat) {
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

  const activityPath = (commits) => {
    const weekCount = 20;
    const counts = Array(weekCount).fill(0);
    const now = Date.now();

    commits.forEach((item) => {
      const committedAt = new Date(item.commit?.author?.date).getTime();
      const ageInWeeks = Math.floor((now - committedAt) / (7 * 24 * 60 * 60 * 1000));
      if (Number.isFinite(ageInWeeks) && ageInWeeks >= 0 && ageInWeeks < weekCount) {
        counts[weekCount - 1 - ageInWeeks] += 1;
      }
    });

    const peak = Math.max(...counts, 1);
    return counts.map((count, index) => {
      const x = (280 * index) / (weekCount - 1);
      const y = 70 - (62 * count) / peak;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  };

  Promise.allSettled([
    fetchJson("https://api.github.com/repos/mech-lang/mech"),
    fetchJson("https://api.github.com/repos/mech-lang/mech/releases/latest"),
    fetchJson("https://api.github.com/repos/mech-lang/mech/commits?per_page=100"),
  ]).then(([repositoryResult, releaseResult, commitsResult]) => {
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

    if (commitsResult.status === "fulfilled" && Array.isArray(commitsResult.value)) {
      heartbeat.setAttribute("d", activityPath(commitsResult.value));
    }
  });
})();
