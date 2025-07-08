let foundParams = [];

function extractParamsFromURL(url) {
  let params = [];
  try {
    let u = new URL(url, window.location.href);
    for (let [key] of u.searchParams) {
      params.push({name: key, type: 'get'});
    }
  } catch (e) {}
  return params;
}

function getFormParams() {
  let params = [];
  document.querySelectorAll('form').forEach(form => {
    Array.from(form.elements).forEach(el => {
      if (el.name) {
        let type = (el.type === 'hidden') ? 'hidden' : (form.method && form.method.toLowerCase() === 'post' ? 'post' : 'get');
        params.push({name: el.name, type});
      }
    });
  });
  return params;
}

function getCookieParams() {
  return document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(Boolean).map(name => ({name, type: 'cookie'}));
}

function getJSParams() {
  // Simple heuristic: look for window.var = ... or var var = ...
  let params = [];
  const scripts = Array.from(document.scripts).map(s => s.textContent).join('\n');
  const regex = /(?:var|let|const|window)\s+([a-zA-Z0-9_\$]+)\s*[=\(]/g;
  let match;
  while ((match = regex.exec(scripts)) !== null) {
    params.push({name: match[1], type: 'js'});
  }
  return params;
}

function getXHRParams() {
  // Listen for XHR/fetch and collect parameter names from URLs and bodies
  let params = [];
  if (!window._gap_xhr_hooked) {
    window._gap_xhr_hooked = true;
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      (window._gap_xhr_params = window._gap_xhr_params || []).push(...extractParamsFromURL(url));
      return origOpen.apply(this, arguments);
    };
    const origFetch = window.fetch;
    window.fetch = function(input, init) {
      let url = (typeof input === 'string') ? input : input.url;
      (window._gap_xhr_params = window._gap_xhr_params || []).push(...extractParamsFromURL(url));
      return origFetch.apply(this, arguments);
    };
  }
  params = (window._gap_xhr_params || []);
  return params;
}

function extractAllParams() {
  let params = [];
  // Links (GET)
  document.querySelectorAll('a[href]').forEach(a => {
    params.push(...extractParamsFromURL(a.href));
  });
  // Forms (POST/GET/hidden)
  params.push(...getFormParams());
  // Cookies
  params.push(...getCookieParams());
  // Inline JS variables
  params.push(...getJSParams());
  // XHR/fetch
  params.push(...getXHRParams());
  // Remove duplicates by name+type
  const seen = new Set();
  params = params.filter(p => {
    const key = p.name + ':' + p.type;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return params;
}

function notifyPopupWithParams() {
  const params = extractAllParams();
  chrome.runtime.sendMessage({action: 'paramsUpdate', params});
}

// Observe DOM changes for dynamic parameter detection
if (!window._gap_mutation_observer) {
  window._gap_mutation_observer = true;
  const observer = new MutationObserver(() => {
    notifyPopupWithParams();
  });
  observer.observe(document.body, {childList: true, subtree: true});
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getParams") {
    // If force is set, do a fresh scan and respond
    if (msg.force) {
      const params = extractAllParams();
      sendResponse({params});
      return;
    }
    // Otherwise, respond as before
    const params = extractAllParams();
    sendResponse({params});
  }
}); 