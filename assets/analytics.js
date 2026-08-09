window.dataLayer = window.dataLayer || [];

function gtag() {
  window.dataLayer.push(arguments);
}

gtag("consent", "default", {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "denied",
  personalization_storage: "denied",
  security_storage: "granted",
});

gtag("consent", "update", {
  analytics_storage: "granted",
});

gtag("js", new Date());
gtag("config", "G-72ZE2LZPZM", {
  anonymize_ip: true,
  allow_google_signals: false,
  allow_ad_personalization_signals: false,
});

const pagePath = window.location.pathname || "/";
const canonicalPath = document.querySelector('link[rel="canonical"]')?.pathname || pagePath;

function conciseText(value, maximumLength = 100) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maximumLength);
}

function trackEvent(name, parameters = {}) {
  gtag("event", name, {
    page_path: pagePath,
    ...parameters,
  });
}

const campaignParameters = new URLSearchParams(window.location.search);
const campaignSource = conciseText(campaignParameters.get("utm_source"));
const campaignMedium = conciseText(campaignParameters.get("utm_medium"));
const campaignName = conciseText(campaignParameters.get("utm_campaign"));
const campaignContent = conciseText(campaignParameters.get("utm_content"));

if (campaignSource && campaignMedium && campaignName) {
  trackEvent("campaign_landing", {
    campaign_source: campaignSource,
    campaign_medium: campaignMedium,
    campaign_name: campaignName,
    campaign_content: campaignContent,
  });
}

function linkLocation(link) {
  if (link.closest(".site-header")) return "header";
  if (link.closest(".site-footer")) return "footer";
  if (link.closest(".cta")) return "cta";
  if (link.closest(".article-main")) return "article";
  return "content";
}

function articleId() {
  return canonicalPath.split("/").filter(Boolean).pop()?.replace(/\.html$/, "") || "startseite";
}

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const target = event.target.closest("a, button");
  if (!target) return;

  if (target.matches("[data-copy-link]")) {
    trackEvent("article_share", { method: "copy_link", content_id: articleId() });
    return;
  }

  if (target.matches("[data-native-share]")) {
    trackEvent("article_share", { method: "native_share", content_id: articleId() });
    return;
  }

  if (!(target instanceof HTMLAnchorElement)) return;

  const href = target.getAttribute("href") || "";
  const linkText = conciseText(target.textContent);
  const location = linkLocation(target);

  if (target.closest("[data-share-panel]")) {
    const method = target.classList.contains("share-action-linkedin") ? "linkedin" : "email";
    trackEvent("article_share", { method, content_id: articleId() });
    return;
  }

  if (href.startsWith("tel:")) {
    trackEvent("contact_click", { contact_method: "phone", link_location: location });
    return;
  }

  if (href.startsWith("mailto:")) {
    trackEvent("contact_click", { contact_method: "email", link_location: location });
    return;
  }

  let linkUrl;
  try {
    linkUrl = new URL(target.href, window.location.href);
  } catch {
    return;
  }

  if (linkUrl.hostname === "cal.com") {
    trackEvent("pilot_check_click", {
      link_location: location,
      link_text: linkText,
    });
    return;
  }

  const isPilotPage = linkUrl.origin === window.location.origin
    && linkUrl.pathname.endsWith("/baeckerei-pilot.html");

  if (isPilotPage && !pagePath.endsWith("/baeckerei-pilot.html")) {
    trackEvent("pilot_offer_click", {
      link_location: location,
      link_text: linkText,
    });
  }
});

const article = document.querySelector(".article-main");

if (article) {
  let articleReadTracked = false;

  function trackArticleRead() {
    if (articleReadTracked) return;

    const articleTop = window.scrollY + article.getBoundingClientRect().top;
    const visibleArticleHeight = window.scrollY + window.innerHeight - articleTop;
    const readingProgress = visibleArticleHeight / article.scrollHeight;

    if (readingProgress < 0.75) return;

    articleReadTracked = true;
    trackEvent("article_read", {
      content_id: articleId(),
      reading_progress: 75,
    });
    window.removeEventListener("scroll", trackArticleRead);
  }

  window.addEventListener("scroll", trackArticleRead, { passive: true });
  trackArticleRead();
}
