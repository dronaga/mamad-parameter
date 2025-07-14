let allParams = [];
let filteredParams = [];
let searchTerm = '';

function renderParams(params) {
  const paramsList = document.getElementById('paramsList');
  const paramCount = document.getElementById('paramCount');
  if (!params || params.length === 0) {
    paramsList.innerHTML = '<em>No parameters found.</em>';
    paramCount.textContent = '0 parameters found';
    return;
  }
  paramCount.textContent = params.length + (params.length === 1 ? ' parameter found' : ' parameters found');
  paramsList.innerHTML = params.map(p =>
    `<div class="param-item">
      <span class="param-name">${p.name}</span>
      <span class="param-type type-${p.type}">${p.type.toUpperCase()}</span>
    </div>`
  ).join('');
}

function getSelectedTypes() {
  return Array.from(document.querySelectorAll('.type-filter:checked')).map(cb => cb.value);
}

function filterParams() {
  const selectedTypes = getSelectedTypes();
  filteredParams = allParams.filter(p => selectedTypes.includes(p.type) && (!searchTerm || p.name.toLowerCase().includes(searchTerm)));
  renderParams(filteredParams);
}

function showCopiedFeedback() {
  const msg = document.getElementById('copiedMsg');
  const box = document.getElementById('randomStringBox');
  msg.style.display = 'block';
  box.classList.add('copied-flash');
  setTimeout(() => {
    msg.style.display = 'none';
    box.classList.remove('copied-flash');
  }, 900);
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "getParams"}, function(response) {
      if (chrome.runtime.lastError) {
        renderParams([]);
        allParams = [];
        filteredParams = [];
        return;
      }
      allParams = response && response.params || [];
      filterParams();
      window._params = allParams;
    });
  });

  document.getElementById('copyRandomBtn').onclick = function() {
    if (!filteredParams || filteredParams.length === 0) return;
    const prefix = document.getElementById('randPrefix').value || '';
    const type = document.getElementById('randType').value;
    function randomNum() { return Math.floor(100000 + Math.random() * 900000); }
    function randomStr() { return Math.random().toString(36).substring(2, 10); }
    function uuid() { return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)); }
    let randomString = filteredParams.map((p, i) => {
      let val = '';
      if (type === 'seq') val = prefix + (i+1);
      else if (type === 'randnum') val = prefix + randomNum();
      else if (type === 'randstr') val = prefix + randomStr();
      else if (type === 'uuid') val = prefix + uuid();
      else val = prefix + (i+1);
      return `${encodeURIComponent(p.name)}=${val}`;
    }).join('&');
    document.getElementById('randomStringBox').textContent = randomString;
    navigator.clipboard.writeText(randomString);
    showCopiedFeedback();
  };

  document.querySelectorAll('.type-filter').forEach(cb => {
    cb.addEventListener('change', filterParams);
  });

  document.getElementById('searchBox').addEventListener('input', function(e) {
    searchTerm = e.target.value.trim().toLowerCase();
    filterParams();
  });

  // Export Text
  document.getElementById('exportTextBtn').onclick = function() {
    if (!filteredParams || filteredParams.length === 0) return;
    const text = filteredParams.map(p => p.name).join('\n');
    const blob = new Blob([text], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'params.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  };

  // Copy All
  document.getElementById('copyAllBtn').onclick = function() {
    if (!filteredParams || filteredParams.length === 0) return;
    const text = filteredParams.map(p => p.name).join('\n');
    navigator.clipboard.writeText(text);
    showCopiedFeedback();
  };

  // Import Text
  document.getElementById('importTextBtn').onclick = function() {
    document.getElementById('importTextInput').click();
  };
  document.getElementById('importTextInput').onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      const lines = evt.target.result.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      allParams = lines.map(name => ({ name, type: 'imported' }));
      filterParams();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  document.getElementById('resetBtn').onclick = function() {
    // Reset all type filters to checked
    document.querySelectorAll('.type-filter').forEach(cb => cb.checked = true);
    // Reset search box
    document.getElementById('searchBox').value = '';
    searchTerm = '';
    // Reset prefix and type
    document.getElementById('randPrefix').value = 'XNLV';
    document.getElementById('randType').value = 'seq';
    // Clear output box
    document.getElementById('randomStringBox').textContent = '';
    filterParams();
  };

  document.getElementById('rescanBtn').onclick = function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "getParams", force: true}, function(response) {
        if (chrome.runtime.lastError) {
          renderParams([]);
          allParams = [];
          filteredParams = [];
          return;
        }
        allParams = response && response.params || [];
        filterParams();
        window._params = allParams;
      });
    });
  };

  // Listen for real-time parameter updates from content.js
  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.action === 'paramsUpdate' && Array.isArray(msg.params)) {
      allParams = msg.params;
      filterParams();
      window._params = allParams;
    }
  });
}); 