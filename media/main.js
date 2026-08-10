// GitFlow Assistant — Chat Webview Frontend
// Multi-Provider Support, No Emoji, IDE-native

(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  // Provider data for dynamic UI updates
  const PROVIDER_DATA = {
    groq: {
      models: [
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'deepseek-r1-distill-llama-70b',
        'qwen-2.5-coder-32b-instruct',
        'qwen-2.5-32b',
        'gemma2-9b-it',
        'mixtral-8x7b-32768',
        'llama-3.2-11b-vision-instruct',
        'llama-3.2-3b-preview',
        'llama-3.2-1b-preview',
        'custom'
      ],
      defaultModel: 'llama-3.3-70b-versatile',
      keyPlaceholder: 'gsk_...',
      consoleUrl: 'console.groq.com'
    },
    openai: {
      models: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'custom'],
      defaultModel: 'gpt-4o-mini',
      keyPlaceholder: 'sk-...',
      consoleUrl: 'platform.openai.com'
    },
    anthropic: {
      models: ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'custom'],
      defaultModel: 'claude-3-7-sonnet-20250219',
      keyPlaceholder: 'sk-ant-...',
      consoleUrl: 'console.anthropic.com'
    },
    gemini: {
      models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'custom'],
      defaultModel: 'gemini-2.5-flash',
      keyPlaceholder: 'AIza...',
      consoleUrl: 'aistudio.google.com'
    }
  };

  // DOM Elements
  var chatMessages = document.getElementById('chat-messages');
  var messageInput = document.getElementById('message-input');
  var sendButton = document.getElementById('send-button');
  var loadingIndicator = document.getElementById('loading-indicator');
  var apiConfigSetup = document.getElementById('api-config-setup');
  var providerSelect = document.getElementById('provider-select');
  var apiKeyInput = document.getElementById('api-key-input');
  var modelSelect = document.getElementById('model-select');
  var configSubmit = document.getElementById('config-submit');
  var consoleLink = document.getElementById('console-link');
  var consoleHint = document.getElementById('console-hint');
  var chatContainer = document.getElementById('chat-container');
  var inputArea = document.getElementById('input-area');
  var branchBadges = document.getElementById('branch-badges');
  var personaSelect = document.getElementById('persona-select');
  var langSelect = document.getElementById('lang-select');
  var dictToggleBtn = document.getElementById('dict-toggle-btn');

  // --- Language Switcher ---
  if (langSelect) {
    langSelect.addEventListener('change', function () {
      vscode.postMessage({ type: 'setLanguage', lang: langSelect.value });
    });
  }
  var dictToggleBtn = document.getElementById('dict-toggle-btn');
  var dictModal = document.getElementById('dict-modal');
  var dictCloseBtn = document.getElementById('dict-close-btn');
  var dictSearch = document.getElementById('dict-search');
  var dictList = document.getElementById('dict-list');
  var quickChips = document.getElementById('quick-chips');

  // --- Kamus Awam Data (60+ istilah) ---
  var GIT_DICTIONARY = [
    { term: 'Commit', meaning: 'Foto snapshot keadaan proyek saat ini.', command: 'git commit -m "..."' },
    { term: 'Branch', meaning: 'Meja kerja terpisah agar tidak mengganggu meja utama.', command: 'git branch / git checkout -b' },
    { term: 'Push', meaning: 'Kirim paket hasil kerjaan dari komputer lokal ke server internet.', command: 'git push' },
    { term: 'Pull', meaning: 'Ambil dan gabungkan paket perubahan terbaru dari server internet.', command: 'git pull' },
    { term: 'Merge', meaning: 'Gabungkan hasil kerja dari satu branch meja kerja ke branch lain.', command: 'git merge' },
    { term: 'Staging Area', meaning: 'Kotak kardus tempat mengumpulkan berkas sebelum disepakati foto snapshot (commit).', command: 'git add .' },
    { term: 'Repository (Repo)', meaning: 'Buku diari / folder raksasa penyimpan seluruh sejarah perubahan proyek.', command: 'git init / git clone' },
    { term: 'Clone', meaning: 'Duplikat / unduh seluruh isi buku diari proyek dari server internet ke komputer.', command: 'git clone' },
    { term: 'Checkout', meaning: 'Berpindah duduk dari satu meja kerja (branch) ke meja kerja lain.', command: 'git checkout <branch>' },
    { term: 'Fetch', meaning: 'Intip dan cek apakah ada paket perubahan baru di server tanpa langsung mengelompokkannya.', command: 'git fetch' },
    { term: 'Revert', meaning: 'Buat foto snapshot baru yang isinya membatalkan foto snapshot lama.', command: 'git revert' },
    { term: 'Reset', meaning: 'Putar balik mesin waktu ke masa lalu (hati-hati berkas bisa hilang).', command: 'git reset --hard' },
    { term: 'Stash', meaning: 'Laci rahasia tempat menyembunyikan kerjaan setengah jadi saat mau pindah meja kerja.', command: 'git stash / git stash pop' },
    { term: 'Conflict (Merge Conflict)', meaning: 'Bentrokan dua perubahan berbeda pada baris berkas yang sama yang harus dipilih manual.', command: 'Resolusi manual <<<<<<<' },
    { term: 'Main Branch', meaning: 'Etalase toko rilis produk yang siap dipakai pengguna umum.', command: 'main' },
    { term: 'Dev Branch', meaning: 'Dapur utama tempat mengumpulkan semua masakan fitur dari tim pengembang.', command: 'dev' },
    { term: 'Staging Branch', meaning: 'Ruang Uji Coba QA sebelum produk dilepas ke etalase utama.', command: 'staging' },
    { term: 'Feat Branch', meaning: 'Meja sketsa fitur baru yang sedang dirancang.', command: 'feat/nama-fitur' },
    { term: 'Hotfix Branch', meaning: 'Tim Penambal Darurat untuk memperbaiki bug kritis di etalase utama.', command: 'hotfix/bug-kritis' }
  ];

  // Render Kamus List
  function renderDictionary(filter) {
    if (!dictList) return;
    dictList.innerHTML = '';
    var q = (filter || '').toLowerCase();
    var filtered = GIT_DICTIONARY.filter(function (item) {
      return item.term.toLowerCase().indexOf(q) !== -1 || item.meaning.toLowerCase().indexOf(q) !== -1;
    });

    if (filtered.length === 0) {
      dictList.innerHTML = '<p class="dict-empty">Tidak ada istilah yang cocok dengan "' + filter + '"</p>';
      return;
    }

    filtered.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'dict-item';
      div.innerHTML = '<strong>' + item.term + '</strong><p>' + item.meaning + '</p><code>' + item.command + '</code>';
      dictList.appendChild(div);
    });
  }

  // Toggle Dictionary Drawer
  if (dictToggleBtn && dictModal && dictCloseBtn) {
    dictToggleBtn.addEventListener('click', function () {
      renderDictionary('');
      dictModal.classList.remove('hidden');
    });
    dictCloseBtn.addEventListener('click', function () {
      dictModal.classList.add('hidden');
    });
    dictSearch.addEventListener('input', function () {
      renderDictionary(dictSearch.value);
    });
  }

  // --- Quick Action Chips Listener ---
  if (quickChips) {
    quickChips.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip-btn');
      if (btn) {
        var cmd = btn.getAttribute('data-cmd');
        if (cmd) {
          vscode.postMessage({ type: 'sendMessage', content: cmd });
        }
      }
    });
  }

  // --- Persona Switcher ---
  if (personaSelect) {
    personaSelect.addEventListener('change', function () {
      vscode.postMessage({ type: 'setPersona', persona: personaSelect.value });
    });
  }

  var customModelField = document.getElementById('custom-model-field');
  var customModelInput = document.getElementById('custom-model-input');

  // --- Model Select Change ---
  if (modelSelect) {
    modelSelect.addEventListener('change', function () {
      if (modelSelect.value === 'custom') {
        if (customModelField) customModelField.classList.remove('hidden');
      } else {
        if (customModelField) customModelField.classList.add('hidden');
      }
    });
  }

  // --- Provider Dropdown Change ---
  providerSelect.addEventListener('change', function () {
    var provider = providerSelect.value;
    var data = PROVIDER_DATA[provider];
    if (!data) return;

    modelSelect.innerHTML = '';
    data.models.forEach(function (m) {
      var opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m === 'custom' ? 'Custom (Input Manual...)' : m;
      if (m === data.defaultModel) opt.selected = true;
      modelSelect.appendChild(opt);
    });

    if (customModelField) customModelField.classList.add('hidden');

    apiKeyInput.placeholder = data.keyPlaceholder;
    apiKeyInput.value = '';

    consoleLink.href = 'https://' + data.consoleUrl;
    consoleLink.textContent = data.consoleUrl;
  });

  // --- Send Chat Message ---
  function sendMessage() {
    var content = messageInput.value.trim();
    if (!content) return;
    vscode.postMessage({ type: 'sendMessage', content: content });
    messageInput.value = '';
    messageInput.style.height = 'auto';
  }

  sendButton.addEventListener('click', sendMessage);

  messageInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  messageInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 110) + 'px';
  });

  // --- Save Config ---
  configSubmit.addEventListener('click', function () {
    var key = apiKeyInput.value.trim();
    var provider = providerSelect.value;
    var model = modelSelect.value;
    if (model === 'custom' && customModelInput) {
      model = customModelInput.value.trim() || (PROVIDER_DATA[provider] ? PROVIDER_DATA[provider].defaultModel : 'llama-3.3-70b-versatile');
    }
    if (!key) {
      showError('Silakan ketik atau tempel API Key Anda terlebih dahulu pada kolom API KEY.');
      apiKeyInput.focus();
      return;
    }
    configSubmit.textContent = 'Menyimpan...';
    vscode.postMessage({
      type: 'saveConfig',
      apiKey: key,
      provider: provider,
      model: model
    });
  });

  apiKeyInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      configSubmit.click();
    }
  });

  // --- Receive Messages from Extension ---
  window.addEventListener('message', function (event) {
    var data = event.data;

    switch (data.type) {
      case 'receiveMessage':
        appendMessage(data.message);
        break;
      case 'loadHistory':
        chatMessages.innerHTML = '';
        if (Array.isArray(data.history)) {
          data.history.forEach(function (m) { appendMessage(m); });
        }
        break;
      case 'branchUpdate':
        updateBranchBadges(data.branchStatus);
        updateVisualPipeline(data.branchStatus);
        break;
      case 'loading':
        toggleLoading(data.isLoading);
        break;
      case 'error':
        showError(data.error);
        break;
      case 'configStatus':
        toggleConfigSetup(!data.hasApiKey);
        break;
      case 'personaUpdate':
        if (personaSelect && data.persona) {
          personaSelect.value = data.persona;
        }
        break;
    }
  });

  // --- Render Chat Message ---
  function appendMessage(msg) {
    if (!msg) return;
    var wrapper = document.createElement('div');
    wrapper.classList.add('message', msg.role);
    var html = '';

    if (msg.tag) {
      var tagLabels = {
        'OUTBOUND': 'OUTBOUND',
        'BRANCH_MOVEMENT': 'BRANCH MOVEMENT',
        'WARNING': 'WARNING',
        'SUGGESTION': 'SUGGESTION',
        'STRUCTURE': 'STRUCTURE',
        'PROGRESS': 'PROGRESS',
        'HEALTH_CHECK': 'HEALTH CHECK'
      };
      html += '<span class="message-tag tag-' + msg.tag + '">' + (tagLabels[msg.tag] || msg.tag) + '</span>';
    }

    html += '<div class="bubble"><div class="bubble-content">' + renderMarkdown(msg.content) + '</div></div>';

    var time = new Date(msg.timestamp);
    var timeStr = time.getHours().toString().padStart(2, '0') + ':' + time.getMinutes().toString().padStart(2, '0');
    html += '<span class="message-time">' + timeStr + '</span>';

    wrapper.innerHTML = html;

    // Attach 1-Click Copy Buttons to code blocks
    var pres = wrapper.querySelectorAll('pre');
    pres.forEach(function (pre) {
      var copyBtn = document.createElement('button');
      copyBtn.className = 'copy-code-btn';
      copyBtn.textContent = 'Salin';
      copyBtn.title = 'Salin Kode ke Clipboard';
      copyBtn.addEventListener('click', function () {
        var codeElem = pre.querySelector('code');
        var text = codeElem ? codeElem.innerText : pre.innerText;
        navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Tersalin!';
        setTimeout(function () { copyBtn.textContent = 'Salin'; }, 2000);
      });
      pre.style.position = 'relative';
      pre.appendChild(copyBtn);
    });

    chatMessages.appendChild(wrapper);
    scrollToBottom();
  }

  // --- Basic Markdown Renderer ---
  function renderMarkdown(text) {
    if (!text) return '';
    var html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    html = html.replace(/```([\s\S]*?)```/g, function (match, code) {
      return '<pre><code>' + code.trim() + '</code></pre>';
    });
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    html = html.replace(/^### (.+)$/gm, '<strong style="font-size:13px;">$1</strong>');
    html = html.replace(/^## (.+)$/gm, '<strong style="font-size:14px;">$1</strong>');
    html = html.replace(/^# (.+)$/gm, '<strong style="font-size:15px;">$1</strong>');
    html = html.replace(/^[\s]*[-\u2022] (.+)$/gm, '  \u00b7 $1');
    html = html.replace(/^(\d+)\. (.+)$/gm, '  $1. $2');
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  // --- Update Branch Badges ---
  function updateBranchBadges(status) {
    if (!status) return;
    var badges = branchBadges.querySelectorAll('.badge');
    var currentType = status.currentType;
    badges.forEach(function (badge) {
      var type = badge.getAttribute('data-type');
      badge.classList.remove('active');
      if (type === currentType) badge.classList.add('active');
    });
    badges.forEach(function (badge) {
      var type = badge.getAttribute('data-type');
      if (type === currentType) {
        var dot = badge.querySelector('.dot');
        var dotHtml = dot ? dot.outerHTML : '';
        badge.innerHTML = dotHtml + ' ' + status.current;
      }
    });
  }

  // --- Update Visual Pipeline Map ---
  function updateVisualPipeline(status) {
    if (!status) return;
    var steps = document.querySelectorAll('.pipeline-step');
    var type = status.currentType;
    steps.forEach(function (s) {
      s.classList.remove('active');
      if (s.getAttribute('data-step') === type) {
        s.classList.add('active');
      }
    });
  }

  function toggleLoading(show) {
    if (show) {
      loadingIndicator.classList.remove('hidden');
      scrollToBottom();
    } else {
      loadingIndicator.classList.add('hidden');
    }
  }

  function showError(errorText) {
    var errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = errorText;
    chatMessages.appendChild(errorDiv);
    scrollToBottom();
    setTimeout(function () {
      if (errorDiv.parentNode) errorDiv.parentNode.removeChild(errorDiv);
    }, 8000);
  }

  function toggleConfigSetup(show) {
    if (configSubmit) configSubmit.textContent = 'Simpan';
    if (show) {
      apiConfigSetup.classList.remove('hidden');
      chatContainer.classList.add('hidden');
      inputArea.classList.add('hidden');
      if (quickChips) quickChips.classList.add('hidden');
    } else {
      apiConfigSetup.classList.add('hidden');
      chatContainer.classList.remove('hidden');
      inputArea.classList.remove('hidden');
      if (quickChips) quickChips.classList.remove('hidden');
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(function () {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  vscode.postMessage({ type: 'ready' });
})();
