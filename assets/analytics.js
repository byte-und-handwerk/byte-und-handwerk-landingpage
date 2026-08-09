window.dataLayer = window.dataLayer || [];
const currentPagePath = window.location.pathname || "/";
const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href || window.location.href;
const canonicalPath = new URL(canonicalUrl, window.location.origin).pathname || currentPagePath;
const pagePath = canonicalPath;

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
  page_location: canonicalUrl,
  page_path: pagePath,
});

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
  if (link.closest("[data-share-panel]")) return "share_panel";
  if (link.closest(".search-results")) return "site_search";
  if (link.closest(".cta, .hero-actions")) return "cta";
  if (link.closest(".mobile-nav")) return "mobile_navigation";
  if (link.closest(".desktop-nav")) return "desktop_navigation";
  if (link.closest(".site-header")) return "header";
  if (link.closest(".site-footer")) return "footer";
  if (link.closest(".article-main")) return "article";
  return "content";
}

function privacySafeSearchTerm(value) {
  const searchTerm = conciseText(value, 80);
  const digitCount = (searchTerm.match(/\d/g) || []).length;
  const containsPersonalDataPattern = /\S+@\S+|https?:\/\/|www\.|\b\d{2,}[\s/.-]?\d{2,}/i.test(searchTerm);
  if (containsPersonalDataPattern || digitCount >= 6) return "";
  return searchTerm;
}

document.addEventListener("site:search", (event) => {
  const searchTerm = privacySafeSearchTerm(event.detail?.searchTerm);
  if (!searchTerm) return;

  const resultCount = Math.max(0, Number(event.detail?.resultCount) || 0);
  trackEvent("view_search_results", {
    search_term: searchTerm,
    search_result_count: resultCount,
  });

  if (resultCount === 0) {
    trackEvent("search_no_results", { search_term: searchTerm });
  }
});

function articleId() {
  return canonicalPath.split("/").filter(Boolean).pop()?.replace(/\.html$/, "") || "startseite";
}

function linkType(link, targetUrl) {
  const rawHref = link.getAttribute("href") || "";
  const isSamePageAnchor = targetUrl.origin === window.location.origin
    && targetUrl.pathname === window.location.pathname
    && targetUrl.search === window.location.search
    && Boolean(targetUrl.hash);

  if (rawHref.startsWith("#") || isSamePageAnchor) return "anchor";
  if (targetUrl.protocol === "mailto:") return "email";
  if (targetUrl.protocol === "tel:") return "phone";
  if (link.hasAttribute("download") || /\.(pdf|docx?|xlsx?|csv|zip)$/i.test(targetUrl.pathname)) return "download";
  if (targetUrl.origin === window.location.origin) return "internal";
  if (["http:", "https:"].includes(targetUrl.protocol)) return "outbound";
  return "other";
}

function reportableLinkUrl(targetUrl, type) {
  if (type === "email") return "mailto:";
  if (type === "phone") return "tel:";
  if (["http:", "https:"].includes(targetUrl.protocol)) {
    return `${targetUrl.origin}${targetUrl.pathname}${targetUrl.hash}`;
  }
  return targetUrl.protocol;
}

function reportableLinkText(link, type) {
  if (type === "email") return "email_link";
  if (type === "phone") return "phone_link";

  return conciseText(
    link.dataset.analyticsLabel
      || link.getAttribute("aria-label")
      || link.textContent
      || link.querySelector("img")?.alt
      || link.title
      || "unlabeled_link",
    150,
  );
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
  const location = linkLocation(target);

  let linkUrl;
  try {
    linkUrl = new URL(target.href, window.location.href);
  } catch {
    return;
  }

  const type = linkType(target, linkUrl);
  const linkText = reportableLinkText(target, type);

  trackEvent("site_link_click", {
    site_link_url: reportableLinkUrl(linkUrl, type),
    site_link_text: linkText,
    site_link_domain: linkUrl.hostname || linkUrl.protocol.replace(":", ""),
    site_link_type: type,
    site_link_location: location,
  });

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

  if (linkUrl.hostname === "cal.com") {
    trackEvent("pilot_check_click", {
      link_location: location,
      link_text: linkText,
    });
    return;
  }

  const isPilotPage = linkUrl.origin === window.location.origin
    && linkUrl.pathname.endsWith("/baeckerei-pilot");

  if (isPilotPage && !pagePath.endsWith("/baeckerei-pilot")) {
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
