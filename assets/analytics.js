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

const analyticsScript = document.createElement("script");
analyticsScript.async = true;
analyticsScript.src = "https://www.googletagmanager.com/gtag/js?id=G-72ZE2LZPZM";
document.head.appendChild(analyticsScript);
