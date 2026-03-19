(function () {
  var html = document.documentElement;

  function setTheme(isDark) {
    if (isDark) {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
    // sync sky-toggle checkboxes on the page
    document.querySelectorAll('.theme-switch__checkbox').forEach(function (cb) {
      cb.checked = isDark;
    });
  }

  // Apply saved / system preference immediately (before paint)
  var saved = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(saved === 'dark' || (!saved && prefersDark));

  // Wire sky-toggle after DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.theme-switch__checkbox').forEach(function (cb) {
      cb.checked = html.getAttribute('data-theme') === 'dark';
      cb.addEventListener('change', function () { setTheme(cb.checked); });
    });
  });

  window.__setTheme = setTheme;
})();
