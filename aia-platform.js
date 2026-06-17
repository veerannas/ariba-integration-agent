/**
 * AIA Platform Abstraction Layer v1.0
 * Detects runtime environment (Chrome Extension vs Standalone Web App)
 * and provides unified APIs for storage, messaging, URL resolution, and mode management.
 */
(function(global) {
  'use strict';

  /* ===== Environment Detection ===== */
  var isChromeExtension = !!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
  var isServiceWorker = (typeof ServiceWorkerGlobalScope !== 'undefined' && self instanceof ServiceWorkerGlobalScope);

  /* ===== Mode Management ===== */
  var MODE_KEY = 'aia_active_mode'; // 'sidepanel' | 'tab' | null
  var PREF_KEY = 'aia_view_preference'; // 'sidepanel' | 'tab' | 'ask'

  function detectCurrentMode() {
    if (!isChromeExtension) return 'webapp';
    // In extension: check URL to determine if we're sidepanel or tab
    var url = window.location.pathname || '';
    if (url.indexOf('tab.html') >= 0) return 'tab';
    if (url.indexOf('sidepanel.html') >= 0) return 'sidepanel';
    if (url.indexOf('index.html') >= 0) return 'webapp';
    // Heuristic: if window width > 600, likely tab
    return window.innerWidth > 600 ? 'tab' : 'sidepanel';
  }

  function getActiveMode() {
    return localStorage.getItem(MODE_KEY) || null;
  }

  function setActiveMode(mode) {
    localStorage.setItem(MODE_KEY, mode);
    // Broadcast to other instances
    try {
      var bc = new BroadcastChannel('aia_mode_channel');
      bc.postMessage({ type: 'MODE_CHANGED', mode: mode, timestamp: Date.now() });
      bc.close();
    } catch(e) { /* BroadcastChannel not supported */ }
  }

  function clearActiveMode() {
    localStorage.removeItem(MODE_KEY);
  }

  function getViewPreference() {
    return localStorage.getItem(PREF_KEY) || 'ask';
  }

  function setViewPreference(pref) {
    localStorage.setItem(PREF_KEY, pref);
  }

  /* ===== Storage Abstraction ===== */
  var storage = {
    get: function(keys) {
      return new Promise(function(resolve) {
        if (isChromeExtension && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(keys, function(result) {
            resolve(result || {});
          });
        } else {
          // Fallback: localStorage with JSON
          var result = {};
          var keyList = Array.isArray(keys) ? keys : (typeof keys === 'string' ? [keys] : Object.keys(keys || {}));
          keyList.forEach(function(k) {
            var raw = localStorage.getItem('aia_store_' + k);
            if (raw !== null) {
              try { result[k] = JSON.parse(raw); } catch(e) { result[k] = raw; }
            } else if (typeof keys === 'object' && !Array.isArray(keys) && keys[k] !== undefined) {
              result[k] = keys[k]; // default value
            }
          });
          resolve(result);
        }
      });
    },

    set: function(items) {
      return new Promise(function(resolve) {
        if (isChromeExtension && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set(items, function() { resolve(); });
        } else {
          Object.keys(items).forEach(function(k) {
            localStorage.setItem('aia_store_' + k, JSON.stringify(items[k]));
          });
          resolve();
        }
      });
    },

    remove: function(keys) {
      return new Promise(function(resolve) {
        var keyList = Array.isArray(keys) ? keys : [keys];
        if (isChromeExtension && chrome.storage && chrome.storage.local) {
          chrome.storage.local.remove(keyList, function() { resolve(); });
        } else {
          keyList.forEach(function(k) { localStorage.removeItem('aia_store_' + k); });
          resolve();
        }
      });
    }
  };

  /* ===== Messaging Abstraction ===== */
  // In-memory event bus for web app mode
  var eventBus = {};
  var eventListeners = {};

  var messaging = {
    send: function(message) {
      return new Promise(function(resolve) {
        if (isChromeExtension && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage(message, function(response) {
            resolve(response);
          });
        } else {
          // Web app mode: handle locally via event bus
          var handler = eventListeners[message.type];
          if (handler) {
            var result = handler(message);
            if (result && typeof result.then === 'function') {
              result.then(resolve);
            } else {
              resolve(result);
            }
          } else {
            resolve(null);
          }
        }
      });
    },

    onMessage: function(type, handler) {
      if (isChromeExtension && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
          if (msg.type === type) {
            var result = handler(msg, sender);
            if (result && typeof result.then === 'function') {
              result.then(sendResponse);
              return true; // async
            }
            sendResponse(result);
          }
        });
      }
      // Always register in event bus (for web app mode)
      eventListeners[type] = handler;
    },

    // BroadcastChannel for cross-tab/panel communication
    broadcast: function(channel, data) {
      try {
        var bc = new BroadcastChannel(channel);
        bc.postMessage(data);
        bc.close();
      } catch(e) { /* not supported */ }
    },

    onBroadcast: function(channel, callback) {
      try {
        var bc = new BroadcastChannel(channel);
        bc.onmessage = function(event) { callback(event.data); };
        return bc; // caller can bc.close() to unsubscribe
      } catch(e) { return null; }
    }
  };

  /* ===== URL Resolution ===== */
  var urls = {
    getResourceURL: function(path) {
      if (isChromeExtension && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL(path);
      }
      // Web app: relative path
      return path;
    },

    openTab: function(url) {
      if (isChromeExtension && chrome.tabs) {
        chrome.tabs.create({ url: url });
      } else {
        window.open(url, '_blank');
      }
    },

    openAIATab: function() {
      var tabUrl = isChromeExtension ? chrome.runtime.getURL('tab.html') : 'tab.html';
      if (isChromeExtension && chrome.tabs) {
        // Check if AIA tab already exists
        chrome.tabs.query({}, function(tabs) {
          var existing = tabs.find(function(t) { return t.url && t.url.indexOf('tab.html') >= 0; });
          if (existing) {
            chrome.tabs.update(existing.id, { active: true });
          } else {
            chrome.tabs.create({ url: tabUrl });
          }
        });
      } else {
        window.open(tabUrl, '_blank');
      }
    },

    closeSidePanel: function() {
      if (isChromeExtension && chrome.sidePanel) {
        // Can't programmatically close sidepanel, but can disable it
        try { chrome.sidePanel.setOptions({ enabled: false }); } catch(e) {}
      }
    }
  };

  /* ===== Mode Switching ===== */
  var modeSwitch = {
    switchToTab: function() {
      setActiveMode('tab');
      urls.openAIATab();
      // Current sidepanel will detect mode change via BroadcastChannel
    },

    switchToSidePanel: function() {
      setActiveMode('sidepanel');
      if (isChromeExtension && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
      }
      // If we're in tab, show message that sidepanel is now active
    },

    switchToWebApp: function() {
      setActiveMode('webapp');
    },

    isOtherInstanceActive: function() {
      var active = getActiveMode();
      var current = detectCurrentMode();
      return active && active !== current && active !== 'webapp';
    },

    getOtherMode: function() {
      var active = getActiveMode();
      var current = detectCurrentMode();
      if (active && active !== current) return active;
      return null;
    }
  };

  /* ===== Page Context (Manual Entry for Web App) ===== */
  var context = {
    _manual: null,

    setManual: function(ctx) {
      // ctx = { anid, name, stage, page }
      this._manual = ctx;
      localStorage.setItem('aia_manual_context', JSON.stringify(ctx));
    },

    getManual: function() {
      if (this._manual) return this._manual;
      var stored = localStorage.getItem('aia_manual_context');
      if (stored) {
        try { this._manual = JSON.parse(stored); return this._manual; } catch(e) {}
      }
      return null;
    },

    clearManual: function() {
      this._manual = null;
      localStorage.removeItem('aia_manual_context');
    },

    // Attempt to get context from content script (extension mode) or manual entry
    detect: function() {
      return new Promise(function(resolve) {
        if (isChromeExtension && chrome.tabs) {
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].url && tabs[0].url.indexOf('ariba.com') >= 0) {
              chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_CONTEXT' }, function(response) {
                if (chrome.runtime.lastError || !response) {
                  resolve(context.getManual());
                } else {
                  resolve(response);
                }
              });
            } else {
              resolve(context.getManual());
            }
          });
        } else {
          resolve(context.getManual());
        }
      });
    }
  };

  /* ===== Export ===== */
  var AIA = {
    env: {
      isChromeExtension: isChromeExtension,
      isServiceWorker: isServiceWorker,
      isWebApp: !isChromeExtension,
      mode: detectCurrentMode
    },
    storage: storage,
    messaging: messaging,
    urls: urls,
    modeSwitch: modeSwitch,
    context: context,
    mode: {
      get: getActiveMode,
      set: setActiveMode,
      clear: clearActiveMode,
      detect: detectCurrentMode,
      preference: { get: getViewPreference, set: setViewPreference }
    }
  };

  // Register on window load — set active mode
  if (typeof window !== 'undefined' && !isServiceWorker) {
    window.AIA = AIA;
    // On page load, register this instance
    window.addEventListener('load', function() {
      var currentMode = detectCurrentMode();
      setActiveMode(currentMode);
      // Listen for mode changes from other instances
      messaging.onBroadcast('aia_mode_channel', function(data) {
        if (data.type === 'MODE_CHANGED' && data.mode !== currentMode) {
          // Another instance took over — show notification
          var event = new CustomEvent('aia-mode-conflict', { detail: data });
          window.dispatchEvent(event);
        }
      });
    });
    // On page unload, clear active mode
    window.addEventListener('beforeunload', function() {
      var currentMode = detectCurrentMode();
      var active = getActiveMode();
      if (active === currentMode) {
        clearActiveMode();
      }
    });
  }

  // Also export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIA;
  }

})(typeof window !== 'undefined' ? window : self);
