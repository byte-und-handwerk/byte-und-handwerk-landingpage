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

function linkText(link) {
  const text = [
    link.dataset.analyticsLabel,
    link.getAttribute("aria-label"),
    link.textContent,
    link.querySelector("img")?.alt,
    link.title,
  ]
    .map((value) => value?.replace(/\s+/g, " ").trim())
    .find(Boolean);

  return (text || "unlabeled_link").slice(0, 150);
}

function linkType(link, targetUrl) {
  const rawHref = link.getAttribute("href") || "";
  const isSamePageAnchor =
    targetUrl.origin === window.location.origin &&
    targetUrl.pathname === window.location.pathname &&
    targetUrl.search === window.location.search &&
    Boolean(targetUrl.hash);

  if (rawHref.startsWith("#") || isSamePageAnchor) return "anchor";
  if (targetUrl.protocol === "mailto:") return "email";
  if (targetUrl.protocol === "tel:") return "phone";
  if (link.hasAttribute("download") || /\.(pdf|docx?|xlsx?|csv|zip)$/i.test(targetUrl.pathname)) return "download";
  if (targetUrl.origin === window.location.origin) return "internal";
  if (["http:", "https:"].includes(targetUrl.protocol)) return "outbound";
  return "other";
}

function linkLocation(link) {
  if (link.closest("[data-share-panel]")) return "share_panel";
  if (link.closest(".cta, .hero-actions")) return "cta";
  if (link.closest(".mobile-nav")) return "mobile_navigation";
  if (link.closest(".desktop-nav")) return "desktop_navigation";
  if (link.closest("header")) return "header";
  if (link.closest("footer")) return "footer";
  if (link.closest("main")) return "content";
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
  return linkText(link);
}

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const link = event.target.closest("a[href]");
  if (!link) return;

  const rawHref = link.getAttribute("href");
  if (!rawHref || rawHref.startsWith("javascript:") || rawHref.startsWith("data:")) return;

  const targetUrl = new URL(rawHref, window.location.href);
  const type = linkType(link, targetUrl);

  gtag("event", "site_link_click", {
    site_link_url: reportableLinkUrl(targetUrl, type),
    site_link_text: reportableLinkText(link, type),
    site_link_domain: targetUrl.hostname || targetUrl.protocol.replace(":", ""),
    site_link_type: type,
    site_link_location: linkLocation(link),
  });
});

const analyticsScript = document.createElement("script");
analyticsScript.async = true;
analyticsScript.src = "https://www.googletagmanager.com/gtag/js?id=G-72ZE2LZPZM";
document.head.appendChild(analyticsScript);
