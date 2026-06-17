// Sidepanel-specific: "Full Tab" button opens tab.html and closes sidepanel
(function() {
  var popout = document.getElementById('btn-popout');
  if (!popout) return;

  popout.addEventListener('click', function() {
    var isExtension = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);

    if (isExtension) {
      chrome.runtime.sendMessage({ type: 'OPEN_TAB' }, function() {
        if (window.AIA) AIA.modeSwitch.switchToTab();
        window.close();
      });
    } else {
      if (window.AIA) AIA.modeSwitch.switchToTab();
      window.open('tab.html', '_blank');
    }
  });
})();
