const navigationToggle = document.querySelector("[data-nav-toggle]");
const mobileNavigation = document.querySelector("[data-mobile-nav]");

document.querySelectorAll(".desktop-nav, .mobile-nav").forEach((navigation) => {
  if (navigation.querySelector('a[href$="search.html"]')) return;
  const searchLink = document.createElement("a");
  searchLink.href = "/search.html";
  searchLink.textContent = "Suche";
  navigation.appendChild(searchLink);
});

function setNavigation(open) {
  if (!navigationToggle || !mobileNavigation) return;
  navigationToggle.setAttribute("aria-expanded", String(open));
  mobileNavigation.classList.toggle("is-open", open);
  mobileNavigation.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("nav-open", open);
}

navigationToggle?.addEventListener("click", () => {
  setNavigation(navigationToggle.getAttribute("aria-expanded") !== "true");
});

mobileNavigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setNavigation(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setNavigation(false);
});

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

document.querySelectorAll(".footer-links").forEach((footerLinks) => {
  if (!footerLinks.querySelector('a[href$="search.html"]')) {
    const searchLink = document.createElement("a");
    searchLink.href = "/search.html";
    searchLink.textContent = "Suche";
    footerLinks.prepend(searchLink);
  }

  if (footerLinks.querySelector("[data-open-consent]")) return;
  const consentButton = document.createElement("button");
  consentButton.className = "footer-consent-link";
  consentButton.type = "button";
  consentButton.dataset.openConsent = "";
  consentButton.textContent = "Cookie-Einstellungen";
  consentButton.addEventListener("click", () => window.UC_UI?.showSecondLayer());
  footerLinks.appendChild(consentButton);
});

function articleShareData(element) {
  const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href || window.location.href;
  return {
    title: element.dataset.shareTitle || document.title,
    text: element.dataset.shareText || "",
    url: element.dataset.shareUrl || canonicalUrl,
  };
}

function showShareStatus(panel, message) {
  const status = panel?.querySelector("[data-share-status]");
  if (status) status.textContent = message;
}

async function copyArticleLink(button) {
  const panel = button.closest("[data-share-panel]");
  const shareData = articleShareData(panel || button);

  try {
    await navigator.clipboard.writeText(shareData.url);
  } catch {
    const temporaryInput = document.createElement("textarea");
    temporaryInput.value = shareData.url;
    temporaryInput.setAttribute("readonly", "");
    temporaryInput.style.position = "fixed";
    temporaryInput.style.opacity = "0";
    document.body.appendChild(temporaryInput);
    temporaryInput.select();
    document.execCommand("copy");
    temporaryInput.remove();
  }

  const originalLabel = button.textContent;
  button.textContent = "Link kopiert";
  showShareStatus(panel, "Der Link wurde in die Zwischenablage kopiert.");
  window.setTimeout(() => {
    button.textContent = originalLabel;
  }, 2200);
}

document.querySelectorAll("[data-copy-link]").forEach((button) => {
  button.addEventListener("click", () => copyArticleLink(button));
});

document.querySelectorAll("[data-native-share]").forEach((button) => {
  if (!navigator.share) return;
  button.hidden = false;
  button.addEventListener("click", async () => {
    const panel = button.closest("[data-share-panel]");
    try {
      await navigator.share(articleShareData(panel || button));
      showShareStatus(panel, "Die Teilen-Optionen wurden geöffnet.");
    } catch (error) {
      if (error.name !== "AbortError") showShareStatus(panel, "Teilen war auf diesem Gerät nicht möglich.");
    }
  });
});
