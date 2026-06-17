/**
 * AIA Tab Mode Controller v1.0
 * Handles: inline nav switching, mode conflict detection, collapse/pop-out,
 * context edit modal, view preference, BroadcastChannel listening.
 * Loaded only by tab.html (after sidepanel.js).
 */
(function() {
  'use strict';

  /* ===== INLINE NAV SWITCHING ===== */
  var navTabs = document.querySelectorAll('.nav.nav-inline .nav-tab');
  var panels = document.querySelectorAll('.panel');

  function switchTab(tabId) {
    // Deactivate all nav tabs
    navTabs.forEach(function(t) { t.classList.remove('active'); });
    // Activate clicked
    var target = document.querySelector('.nav.nav-inline .nav-tab[data-tab="' + tabId + '"]');
    if (target) target.classList.add('active');
    // Panels
    panels.forEach(function(p) {
      p.classList.toggle('active', p.id === 'tab-' + tabId);
    });
    // Also sync sidepanel.js nav if it exists (the bottom nav)
    var spNav = document.querySelectorAll('.nav:not(.nav-inline) .nav-tab');
    spNav.forEach(function(t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
    });
  }

  navTabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      switchTab(this.getAttribute('data-tab'));
    });
  });

  /* ===== SWITCH TO SIDE PANEL ===== */
  var collapseBtn = document.getElementById('btn-collapse');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', function() {
      var isExtension = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
      if (window.AIA) AIA.modeSwitch.switchToSidePanel();
      if (isExtension) {
        // Background opens sidepanel and closes this tab automatically
        chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
      } else {
        // Standalone / file:// : open sidepanel.html directly
        window.open('sidepanel.html', '_blank');
      }
    });
  }

  /* ===== CONTEXT EDIT MODAL ===== */
  var ctxEditBtn = document.getElementById('ctx-edit-btn');
  var ctxEditModal = document.getElementById('ctx-edit-modal');
  var ctxEditClose = document.getElementById('ctx-edit-close');
  var ctxEditSave = document.getElementById('ctx-edit-save');

  function showCtxModal() {
    if (!ctxEditModal) return;
    // Pre-fill with current manual context
    var ctx = (window.AIA && AIA.context.getManual()) || {};
    var nameInput = document.getElementById('ctx-edit-name');
    var anidInput = document.getElementById('ctx-edit-anid');
    var stageInput = document.getElementById('ctx-edit-stage');
    if (nameInput) nameInput.value = ctx.name || '';
    if (anidInput) anidInput.value = ctx.anid || '';
    if (stageInput) stageInput.value = ctx.stage || 'build';
    ctxEditModal.style.display = 'block';
  }

  function hideCtxModal() {
    if (ctxEditModal) ctxEditModal.style.display = 'none';
  }

  function saveCtxModal() {
    var nameInput = document.getElementById('ctx-edit-name');
    var anidInput = document.getElementById('ctx-edit-anid');
    var stageInput = document.getElementById('ctx-edit-stage');
    var ctx = {
      name: (nameInput && nameInput.value.trim()) || '',
      anid: (anidInput && anidInput.value.trim()) || '',
      stage: (stageInput && stageInput.value) || 'build'
    };
    if (window.AIA) AIA.context.setManual(ctx);
    // Update context bar display
    applyContext(ctx);
    hideCtxModal();
  }

  function applyContext(ctx) {
    var ctxName = document.getElementById('ctx-name');
    var ctxId = document.getElementById('ctx-id');
    var ctxAvatar = document.querySelector('.ctx-avatar-text');
    var ctxStageText = document.getElementById('ctx-stage-text');
    if (ctxName && ctx.name) ctxName.textContent = ctx.name;
    if (ctxId && ctx.anid) ctxId.textContent = ctx.anid;
    if (ctxAvatar && ctx.name) {
      var initials = ctx.name.split(/\s+/).slice(0, 2).map(function(w) { return w[0]; }).join('').toUpperCase();
      ctxAvatar.textContent = initials || '--';
    }
    if (ctxStageText && ctx.stage) {
      ctxStageText.textContent = ctx.stage.charAt(0).toUpperCase() + ctx.stage.slice(1);
    }
  }

  if (ctxEditBtn) ctxEditBtn.addEventListener('click', showCtxModal);
  if (ctxEditClose) ctxEditClose.addEventListener('click', hideCtxModal);
  if (ctxEditSave) ctxEditSave.addEventListener('click', saveCtxModal);

  // Show edit button only in web app mode or when no Ariba tab detected
  if (window.AIA && AIA.env.isWebApp && ctxEditBtn) {
    ctxEditBtn.style.display = 'inline-flex';
  }

  // Load stored manual context on init
  if (window.AIA) {
    var storedCtx = AIA.context.getManual();
    if (storedCtx && storedCtx.name) applyContext(storedCtx);
  }

  /* ===== VIEW PREFERENCE ===== */
  var viewPrefSelect = document.getElementById('settings-view-pref');
  if (viewPrefSelect && window.AIA) {
    viewPrefSelect.value = AIA.mode.preference.get();
    viewPrefSelect.addEventListener('change', function() {
      AIA.mode.preference.set(this.value);
    });
  }

  /* ===== SETTINGS / ACTIVITY OVERLAY (supplement sidepanel.js wiring) ===== */
  var settingsBtn = document.getElementById('btn-settings');
  var settingsOverlay = document.getElementById('settings-overlay');
  var settingsClose = document.getElementById('settings-close');
  var activityBtn = document.getElementById('btn-activity');
  var activityOverlay = document.getElementById('activity-overlay');
  var activityClose = document.getElementById('activity-close');

  function toggleOverlay(overlay) {
    if (!overlay) return;
    var isVisible = overlay.style.display !== 'none';
    // Hide all overlays first
    [settingsOverlay, activityOverlay, ctxEditModal].forEach(function(o) {
      if (o) o.style.display = 'none';
    });
    if (!isVisible) overlay.style.display = 'block';
  }

  if (settingsBtn) settingsBtn.addEventListener('click', function() { toggleOverlay(settingsOverlay); });
  if (settingsClose) settingsClose.addEventListener('click', function() { if (settingsOverlay) settingsOverlay.style.display = 'none'; });
  if (activityBtn) activityBtn.addEventListener('click', function() { toggleOverlay(activityOverlay); });
  if (activityClose) activityClose.addEventListener('click', function() { if (activityOverlay) activityOverlay.style.display = 'none'; });

  /* ===== DARK MODE TOGGLE ===== */
  var darkToggle = document.getElementById('settings-darkmode');
  if (darkToggle) {
    // Load preference
    var isDark = localStorage.getItem('aia_dark_mode') === '1';
    darkToggle.checked = isDark;
    if (isDark) document.body.classList.add('dark');

    darkToggle.addEventListener('change', function() {
      if (this.checked) {
        document.body.classList.add('dark');
        localStorage.setItem('aia_dark_mode', '1');
      } else {
        document.body.classList.remove('dark');
        localStorage.setItem('aia_dark_mode', '0');
      }
    });
  }

  /* ===== REFRESH / RELOAD BUTTONS ===== */
  var refreshBtn = document.getElementById('btn-refresh');
  var reloadBtn = document.getElementById('btn-reload');
  if (refreshBtn) refreshBtn.addEventListener('click', function() {
    // Trigger same refresh as sidepanel
    if (typeof window.refreshDashboard === 'function') window.refreshDashboard();
  });
  if (reloadBtn) reloadBtn.addEventListener('click', function() { location.reload(); });

  /* ===== EXPORT BUTTON (same as sidepanel) ===== */
  var exportBtn = document.getElementById('btn-export');
  if (exportBtn) exportBtn.addEventListener('click', function() {
    // Trigger sidepanel export if available
    if (typeof window.exportData === 'function') window.exportData();
  });

  /* ===== INITIAL MODE REGISTRATION ===== */
  if (window.AIA) {
    AIA.mode.set('tab');
    checkConflict();
  }

  /* ===== GUIDE SUB-TABS (wire if sidepanel.js didn't catch them in wide mode) ===== */
  document.querySelectorAll('.sub-tabs .sub-tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var parent = this.closest('.panel') || this.closest('#tab-guides') || this.closest('#tab-cig');
      if (!parent) return;
      var viewId = this.getAttribute('data-view');
      // Deactivate siblings
      this.parentElement.querySelectorAll('.sub-tab').forEach(function(s) { s.classList.remove('active'); });
      this.classList.add('active');
      // Toggle sub-views
      var container = parent.querySelector('.pscroll') || parent;
      container.querySelectorAll('.sub-view').forEach(function(v) {
        v.classList.toggle('active', v.id === viewId);
      });
    });
  });

  /* ===== DASHBOARD BUYER/SUPPLIER TOGGLE ===== */
  document.querySelectorAll('.dash-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var mode = this.getAttribute('data-mode');
      document.querySelectorAll('.dash-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      document.querySelectorAll('.dash-view').forEach(function(v) {
        v.classList.toggle('active', v.id === 'dash-' + mode);
      });
    });
  });

  /* ===== INTEGRATION BUYER/SUPPLIER TOGGLE ===== */
  document.querySelectorAll('.int-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var mode = this.getAttribute('data-mode');
      document.querySelectorAll('.int-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      document.querySelectorAll('.int-content').forEach(function(v) {
        v.classList.toggle('active', v.id === 'int-' + mode);
      });
    });
  });

})();
