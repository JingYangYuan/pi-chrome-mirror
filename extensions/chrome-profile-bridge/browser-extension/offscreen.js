setInterval(() => {
  chrome.runtime.sendMessage({ type: "keepalive" }).catch(() => {});
}, 10000);
