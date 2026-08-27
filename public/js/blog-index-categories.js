(() => {
  const categories = [
    { label: "Announcement" },
    { label: "Devlog" },
    { label: "Essay" },
    { label: "Devlog" },
    { label: "Devlog" },
    { label: "HYTRADBOI'22", url: "https://www.hytradboi.com/2022/i-tried-rubbing-a-database-on-a-robot/" },
    { label: "Devlog" },
    { label: "Devlog" },
    { label: "LIVE'19", url: "https://2019.splashcon.org/details/live/6/Mech-A-Programming-Language-for-Data-Driven-Reactive-Systems" },
    { label: "Announcement" },
    { label: "Announcement" },
    { label: "Announcement" },
  ];

  document.querySelectorAll(".blog-index-page .mech-program-section").forEach((section, index) => {
    const category = categories[index];
    const heading = section.querySelector(".mech-program-subtitle");
    if (!category || !heading) return;

    const row = document.createElement("p");
    row.className = "blog-entry-category";

    const pill = document.createElement(category.url ? "a" : "span");
    pill.className = "blog-category-pill";
    pill.textContent = category.label;
    if (category.url) pill.href = category.url;

    row.append(pill);
    heading.after(row);
  });
})();
