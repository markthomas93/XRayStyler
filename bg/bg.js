const cache = {};
let code = fetch('/content/page.js')
  .then(_ => _.text())
  .then(_ => (code = _));
export const hosts = chrome.runtime.getManifest().permissions.filter(p => p.includes('/'));

chrome.webNavigation.onBeforeNavigate.addListener(prefetchTheme, {
  url: hosts.map(h => ({urlPrefix: h})),
});

chrome.runtime.onMessage.addListener((msg, {tab}, sendResponse) => {
  const theme = prefetchTheme(tab);
  const data = [code, theme];
  if (code instanceof Promise || theme instanceof Promise) {
    Promise.all(data).then(sendResponse);
    return true;
  } else {
    sendResponse(data);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  (await import('./bg-install.js')).onInstalled();
});

function prefetchTheme({url}) {
  const host = new URL(url).hostname.replace(/^www\./, '');
  return cache[host] || (cache[host] = getTheme(host));
}

function getTheme(host) {
  return new Promise(resolve => {
    chrome.storage.local.get(host, async data => {
      const theme = cache[host] =
        data[host] ||
        (await import('./bg-theme.js')).fromSource(host);
      resolve(theme);
    });
  });
}
