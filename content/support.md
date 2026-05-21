---
title: Support Mohibul Hassan
url: "/support"
hidemeta: true
disableShare: true
summary: Support Mohibul Hassan's writing, open-source work, and software engineering projects.
---

{{< rawhtml >}}
<section class="support-shell" aria-label="Support Mohibul Hassan">
  <header class="support-hero">
    <p class="support-kicker">Support my work</p>
    <p class="support-name">Mohibul Hassan</p>
    <p class="support-role">Software Engineer and Technical Writer</p>
    <p class="support-intro">
      I write about software engineering, Java, JavaScript, cloud platforms, and AI.
      If the writing or projects here helped you, you can support the work or start a professional conversation.
    </p>
    <div class="support-actions" aria-label="Primary support links">
      <a class="support-button support-button-primary" href="https://www.supportkori.com/mohibulhassan" target="_blank" rel="noopener noreferrer">
        SupportKori
      </a>
      <a class="support-button support-button-primary" href="https://www.buymeacoffee.com/celurian92c" target="_blank" rel="noopener noreferrer">
        Buy Me a Coffee
      </a>
      <button class="support-button support-button-secondary support-button-reset" type="button" onclick="switchSupportTab('intl')">
        nSave
      </button>
      <a class="support-button support-button-secondary" href="mailto:mohibulhassan100@gmail.com">
        Email Me
      </a>
    </div>
  </header>

  <nav class="support-tabs" aria-label="Payment categories">
    <button id="tab-local" class="support-tab support-tab-active" type="button" onclick="switchSupportTab('local')">
      Local Payments
    </button>
    <button id="tab-intl" class="support-tab" type="button" onclick="switchSupportTab('intl')">
      International
    </button>
  </nav>

  <section id="support-sec-local" class="support-panel">
    <div class="support-grid">
      <article class="support-card">
        <div class="support-card-icon support-card-icon-bkash" aria-hidden="true">bK</div>
        <div>
          <p class="support-card-label">Mobile payment</p>
          <h2>bKash</h2>
          <p>Personal account. The phone number is intentionally not published.</p>
          <p class="support-detail">QR code coming soon</p>
        </div>
        <div class="support-card-actions">
          <button class="support-copy support-copy-muted" type="button" disabled>
            QR pending
          </button>
        </div>
      </article>

      <article class="support-card support-card-featured">
        <div class="support-card-icon support-card-icon-bank" aria-hidden="true">BB</div>
        <div>
          <p class="support-card-label">Bank transfer</p>
          <h2>BRAC Bank PLC</h2>
          <p>Use these details for local bank transfers in Bangladesh.</p>
        </div>
        <div class="support-card-actions">
          <button class="support-card-link support-button-reset" type="button" onclick="copyAllBank()">
            Copy all bank details
          </button>
        </div>
        <div class="support-payment-list">
          <div class="support-payment-row">
            <div>
              <span>Account Name</span>
              <strong>MOHIBUL HASSAN CHOWDHURY</strong>
            </div>
            <button class="support-copy" type="button" data-copy="MOHIBUL HASSAN CHOWDHURY" data-label="Account name">Copy</button>
          </div>
          <div class="support-payment-row">
            <div>
              <span>Account Number</span>
              <strong>1043831890002</strong>
            </div>
            <button class="support-copy" type="button" data-copy="1043831890002" data-label="Account number">Copy</button>
          </div>
          <div class="support-payment-row">
            <div>
              <span>Branch Name</span>
              <strong>SATMASJID ROAD BRANCH</strong>
            </div>
            <button class="support-copy" type="button" data-copy="SATMASJID ROAD BRANCH" data-label="Branch name">Copy</button>
          </div>
          <div class="support-payment-row">
            <div>
              <span>Routing Number</span>
              <strong>060276074</strong>
            </div>
            <button class="support-copy" type="button" data-copy="060276074" data-label="Routing number">Copy</button>
          </div>
          <div class="support-payment-row">
            <div>
              <span>SWIFT Code</span>
              <strong>BRAKBDDH</strong>
            </div>
            <button class="support-copy" type="button" data-copy="BRAKBDDH" data-label="SWIFT code">Copy</button>
          </div>
        </div>
      </article>

      <article class="support-card">
        <div class="support-card-icon support-card-icon-supportkori" aria-hidden="true">S</div>
        <div>
          <p class="support-card-label">Local support</p>
          <h2>SupportKori</h2>
          <p>Use this for local one-time support.</p>
          <p class="support-detail">supportkori.com/mohibulhassan</p>
        </div>
        <div class="support-card-actions">
          <a class="support-card-link" href="https://www.supportkori.com/mohibulhassan" target="_blank" rel="noopener noreferrer">
            Support now
          </a>
          <button class="support-copy" type="button" data-copy="https://www.supportkori.com/mohibulhassan" data-label="SupportKori link">
            Copy link
          </button>
          <button class="support-copy" type="button" onclick="showSupportQR('SupportKori', 'supportkori.com/mohibulhassan', 'https://api.qrserver.com/v1/create-qr-code/?size=280x280&color=b7791f&bgcolor=ffffff&data=https://www.supportkori.com/mohibulhassan&qzone=2')">
            QR
          </button>
        </div>
      </article>

      <article class="support-card">
        <div class="support-card-icon" aria-hidden="true">B</div>
        <div>
          <p class="support-card-label">Direct support</p>
          <h2>Buy Me a Coffee</h2>
          <p>Use this for one-time support for articles, Java notes, and side projects.</p>
        </div>
        <div class="support-card-actions">
          <a class="support-card-link" href="https://www.buymeacoffee.com/celurian92c" target="_blank" rel="noopener noreferrer">
            Buy a coffee
          </a>
          <button class="support-copy" type="button" data-copy="https://www.buymeacoffee.com/celurian92c" data-label="Support link">
            Copy link
          </button>
          <button class="support-copy" type="button" onclick="showSupportQR('Buy Me a Coffee', 'buymeacoffee.com/celurian92c', 'https://api.qrserver.com/v1/create-qr-code/?size=280x280&color=b7791f&bgcolor=ffffff&data=https://www.buymeacoffee.com/celurian92c&qzone=2')">
            QR
          </button>
        </div>
      </article>
    </div>
  </section>

  <section id="support-sec-intl" class="support-panel" hidden>
    <div class="support-grid">
      <article class="support-card support-card-featured">
        <div class="support-card-icon support-card-icon-nsave" aria-hidden="true">ns</div>
        <div>
          <p class="support-card-label">International support</p>
          <h2>nSave</h2>
          <p>Use this tag or link for international support.</p>
          <p class="support-detail">@chowdhu_mohibul</p>
        </div>
        <div class="support-card-actions">
          <a class="support-card-link" href="https://web.nsave.com/app?path=accounts?ntag=chowdhu_mohibul" target="_blank" rel="noopener noreferrer">
            Open nSave
          </a>
          <button class="support-copy" type="button" data-copy="@chowdhu_mohibul" data-label="nSave tag">
            Copy tag
          </button>
          <button class="support-copy" type="button" data-copy="https://web.nsave.com/app?path=accounts?ntag=chowdhu_mohibul" data-label="nSave link">
            Copy link
          </button>
          <button class="support-copy" type="button" onclick="showSupportQR('nSave', '@chowdhu_mohibul', 'https://api.qrserver.com/v1/create-qr-code/?size=280x280&color=dc2626&bgcolor=ffffff&data=https://web.nsave.com/app?path=accounts?ntag=chowdhu_mohibul&qzone=2')">
            QR
          </button>
        </div>
      </article>

      <article class="support-card">
        <div class="support-card-icon support-card-icon-mail" aria-hidden="true">M</div>
        <div>
          <p class="support-card-label">Professional contact</p>
          <h2>Email</h2>
          <p>For consulting, writing, collaboration, invoices, or private payment details.</p>
          <p class="support-detail">mohibulhassan100@gmail.com</p>
        </div>
        <div class="support-card-actions">
          <a class="support-card-link" href="mailto:mohibulhassan100@gmail.com">Send email</a>
          <button class="support-copy" type="button" data-copy="mohibulhassan100@gmail.com" data-label="Email address">
            Copy email
          </button>
        </div>
      </article>
    </div>
  </section>

  <h2 class="support-section-title">Profiles</h2>
  <div class="support-grid">
    <article class="support-card">
      <div class="support-card-icon support-card-icon-code" aria-hidden="true">G</div>
      <div>
        <p class="support-card-label">Open source</p>
        <h2>GitHub</h2>
        <p>Review the site source, projects, and experiments I share publicly.</p>
        <p class="support-detail">github.com/dhrubo55</p>
      </div>
      <div class="support-card-actions">
        <a class="support-card-link" href="https://github.com/dhrubo55" target="_blank" rel="noopener noreferrer">
          Visit GitHub
        </a>
        <button class="support-copy" type="button" data-copy="https://github.com/dhrubo55" data-label="GitHub link">
          Copy link
        </button>
      </div>
    </article>

    <article class="support-card">
      <div class="support-card-icon support-card-icon-linkedin" aria-hidden="true">in</div>
      <div>
        <p class="support-card-label">Network</p>
        <h2>LinkedIn</h2>
        <p>Connect for engineering roles, technical writing work, and professional updates.</p>
        <p class="support-detail">linkedin.com/in/mohibulhassan</p>
      </div>
      <div class="support-card-actions">
        <a class="support-card-link" href="https://www.linkedin.com/in/mohibulhassan" target="_blank" rel="noopener noreferrer">
          Open LinkedIn
        </a>
        <button class="support-copy" type="button" data-copy="https://www.linkedin.com/in/mohibulhassan" data-label="LinkedIn link">
          Copy link
        </button>
      </div>
    </article>
  </div>

  <p class="support-note">
    Wise and WhatsApp are intentionally not listed. bKash number is private for now; I will add the QR code when it is ready.
  </p>

  <div id="support-qr-overlay" class="support-qr-overlay" onclick="closeSupportQR(event)" hidden>
    <div class="support-qr-modal">
      <button class="support-qr-close" type="button" onclick="closeSupportQR(event, true)" aria-label="Close QR modal">x</button>
      <p class="support-card-label">Scan QR</p>
      <p id="support-qr-title" class="support-qr-heading">QR code</p>
      <p id="support-qr-sub" class="support-detail"></p>
      <img id="support-qr-img" src="" alt="Payment QR code" loading="lazy">
    </div>
  </div>

  <div class="support-toast" role="status" aria-live="polite" hidden></div>
</section>

<script>
  function switchSupportTab(tab) {
    const localPanel = document.getElementById('support-sec-local');
    const intlPanel = document.getElementById('support-sec-intl');
    const localTab = document.getElementById('tab-local');
    const intlTab = document.getElementById('tab-intl');

    const showLocal = tab === 'local';
    localPanel.hidden = !showLocal;
    intlPanel.hidden = showLocal;
    localTab.classList.toggle('support-tab-active', showLocal);
    intlTab.classList.toggle('support-tab-active', !showLocal);
  }

  function showSupportToast(message) {
    const toast = document.querySelector('.support-toast');
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(window.supportToastTimer);
    window.supportToastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 2600);
  }

  function showSupportQR(title, subtitle, qrUrl) {
    document.getElementById('support-qr-title').textContent = title;
    document.getElementById('support-qr-sub').textContent = subtitle;
    document.getElementById('support-qr-img').src = qrUrl;
    document.getElementById('support-qr-overlay').hidden = false;
  }

  function closeSupportQR(event, force) {
    const overlay = document.getElementById('support-qr-overlay');
    if (!force && event && event.target !== overlay) return;
    overlay.hidden = true;
  }

  function copyAllBank() {
    const details = [
      'Bank: BRAC Bank PLC',
      'Account Name: MOHIBUL HASSAN CHOWDHURY',
      'Account Number: 1043831890002',
      'Branch: SATMASJID ROAD BRANCH',
      'Routing Number: 060276074',
      'SWIFT Code: BRAKBDDH'
    ].join('\n');

    navigator.clipboard.writeText(details)
      .then(() => showSupportToast('Bank details copied'))
      .catch(() => showSupportToast('Copy failed. Please select manually.'));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSupportQR(null, true);
  });

  document.querySelectorAll('.support-copy').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = button.dataset.copy || '';
      const label = button.dataset.label || 'Value';

      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);
        showSupportToast(`${label} copied`);
      } catch (error) {
        showSupportToast('Copy failed. Please select the text manually.');
      }
    });
  });
</script>
{{< /rawhtml >}}
