(function () {
  var html = document.documentElement;

  function applyTheme(isDark) {
    if (isDark) {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  function syncCheckboxes() {
    var dark = html.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('.theme-switch__checkbox').forEach(function (cb) {
      cb.checked = dark;
    });
  }

  // Apply theme immediately (prevents flash)
  var saved = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved === 'dark' || (!saved && prefersDark));

  // Sync checkbox visual state after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncCheckboxes);
  } else {
    syncCheckboxes();
  }

  // Event delegation — no DOMContentLoaded needed for interaction
  document.addEventListener('change', function (e) {
    if (e.target.classList.contains('theme-switch__checkbox')) {
      applyTheme(e.target.checked);
      syncCheckboxes();
    }
  });

  window.__setTheme = applyTheme;
})();
