(() => {
  const citations = [
    { key: "montella2026mech03beta", author: "Montella, Corey", note: "Mech Blog" },
    { key: "montella2025mechdownbeta", author: "Montella, Corey", note: "Mech Blog" },
    { key: "montella2025llms", author: "Montella, Corey", note: "Mech Blog" },
    { key: "montella2022fallupdate", author: "Montella, Corey", note: "Mech Blog" },
    { key: "montella2022springupdate", author: "Montella, Corey", note: "Mech Blog" },
    { key: "montella2022databaseRobot", author: "Montella, Corey", note: "HYTRADBOI 2022 talk" },
    { key: "montella2022mech2021review", author: "Montella, Corey", note: "Mech Blog" },
    { key: "pontier2020forwardRobotics", author: "Pontier, Sarah", note: "Mech Blog" },
    {
      key: "montella2019mechLive",
      type: "inproceedings",
      author: "Montella, Corey",
      booktitle: "LIVE 2019: Workshop on Live Programming Systems, co-located with SPLASH 2019",
      address: "Athens, Greece",
      organization: "ACM SIGPLAN",
      note: "Presented at LIVE 2019",
    },
    { key: "montella2019mech002", author: "Montella, Corey", note: "Mech v0.0.2 release" },
    { key: "montella2019mech001", author: "Montella, Corey", note: "Mech Blog" },
    { key: "montella2018helloWorld", author: "Montella, Corey", note: "Mech Blog" },
  ];

  const months = {
    January: "jan",
    February: "feb",
    March: "mar",
    April: "apr",
    May: "may",
    June: "jun",
    July: "jul",
    August: "aug",
    September: "sep",
    October: "oct",
    November: "nov",
    December: "dec",
  };

  const dialog = document.getElementById("bibtex-dialog");
  const code = document.getElementById("bibtex-code");
  const copyButton = dialog?.querySelector(".bibtex-copy");
  const copyStatus = dialog?.querySelector(".bibtex-copy-status");

  if (!dialog || !code || !copyButton || !copyStatus) {
    return;
  }

  let activeTrigger = null;
  let copyResetTimer = null;

  const escapeBibtex = (value) =>
    value.replace(/[&%$#_{}]/g, (character) => `\\${character}`);

  const makeBibtex = (section, details) => {
    const titleLink = section.querySelector(".mech-program-subtitle-link");
    const dateLine = section.querySelector(".mech-paragraph:first-of-type");
    const title = titleLink?.textContent.trim() || "Mech Blog Post";
    const url = titleLink?.href || "https://mech-lang.org/blog/";
    const dateText = dateLine?.textContent.replace(/^Date:\s*/i, "").trim() || "";
    const date = dateText.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
    const month = date && months[date[1]] ? months[date[1]] : null;
    const day = date ? date[2] : null;
    const year = date ? date[3] : "n.d.";

    return [
      `@${details.type || "misc"}{${details.key},`,
      `  author = {${escapeBibtex(details.author)}},`,
      `  title = {{${escapeBibtex(title)}}},`,
      `  year = {${year}},`,
      ...(month ? [`  month = ${month},`] : []),
      ...(day ? [`  day = {${day}},`] : []),
      ...(details.booktitle ? [`  booktitle = {${escapeBibtex(details.booktitle)}},`] : []),
      ...(details.address ? [`  address = {${escapeBibtex(details.address)}},`] : []),
      ...(details.organization ? [`  organization = {${escapeBibtex(details.organization)}},`] : []),
      `  url = {${escapeBibtex(url)}},`,
      `  note = {${escapeBibtex(details.note)}}`,
      "}",
    ].join("\n");
  };

  const openCitation = (button, bibtex) => {
    activeTrigger = button;
    code.textContent = bibtex;
    copyStatus.textContent = "";
    copyButton.textContent = "Copy BibTeX";
    dialog.showModal();
  };

  const fallbackCopy = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.append(textArea);
    textArea.select();
    const copied = document.execCommand("copy");
    textArea.remove();
    return copied;
  };

  document.querySelectorAll(".blog-index-page .mech-program-section").forEach((section, index) => {
    const details = citations[index];
    const heading = section.querySelector(".mech-program-subtitle");
    const title = section.querySelector(".mech-program-subtitle-link")?.textContent.trim();

    if (!details || !heading || !title) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "bibtex-trigger";
    button.textContent = "BibTeX";
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-label", `Show BibTeX for ${title}`);

    const bibtex = makeBibtex(section, details);
    button.addEventListener("click", () => openCitation(button, bibtex));
    heading.append(button);
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener("close", () => {
    activeTrigger?.focus();
    activeTrigger = null;
  });

  copyButton.addEventListener("click", async () => {
    let copied = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code.textContent);
        copied = true;
      } else {
        copied = fallbackCopy(code.textContent);
      }
    } catch {
      copied = fallbackCopy(code.textContent);
    }

    if (!copied) {
      copyStatus.textContent = "Select the citation and copy it manually.";
      return;
    }

    copyButton.textContent = "Copied";
    copyStatus.textContent = "BibTeX copied to the clipboard.";
    window.clearTimeout(copyResetTimer);
    copyResetTimer = window.setTimeout(() => {
      copyButton.textContent = "Copy BibTeX";
      copyStatus.textContent = "";
    }, 1800);
  });
})();
