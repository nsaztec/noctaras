// Single source of truth for the Noctaras logo.
// Edit ONLY this file to change the logo across all pages.
(function () {
  var LOGO_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;width:24px;height:24px"><circle cx="9" cy="12" r="6.5" stroke="#5a7b6b" stroke-width="1.2" fill="none"/><circle cx="15" cy="12" r="6.5" stroke="#7a9b8b" stroke-width="1.2" fill="none" opacity="0.6"/><path d="M12 6.2C13.6 7.8 13.6 16.2 12 17.8C10.4 16.2 10.4 7.8 12 6.2Z" fill="#5a7b6b" opacity="0.28"/></svg>';
  var LOGO_SPAN = '<span style="font-family:Inter,system-ui,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;line-height:1">Noctaras</span>';

  function styleLogo(el) {
    if (!el) return;
    el.innerHTML = LOGO_SVG + LOGO_SPAN;
    el.style.cssText = 'display:flex !important;align-items:center !important;gap:8px !important;text-decoration:none !important;font-family:Inter,system-ui,sans-serif !important;font-size:14px !important;font-weight:600 !important;letter-spacing:0.15em !important;text-transform:uppercase !important;color:inherit !important;flex-shrink:0 !important;background:none !important;border:none !important;padding:0 !important;cursor:pointer !important;';
  }

  function run() {
    // ── 1. Standard <nav> pages (index, contact, blog, privacy, terms…) ──
    var nav = document.querySelector('nav');
    if (nav) {
      nav.style.setProperty('padding-top',    '20px', 'important');
      nav.style.setProperty('padding-bottom', '20px', 'important');
      nav.style.setProperty('padding-left',   '48px', 'important');
      nav.style.setProperty('padding-right',  '48px', 'important');

      var navLogo = nav.querySelector('.logo,.nav-logo,.auth-logo,.j-logo');
      if (navLogo) {
        // Remove nav-left offset if logo is wrapped
        if (navLogo.parentElement !== nav) {
          navLogo.parentElement.style.setProperty('padding-left', '0', 'important');
          navLogo.parentElement.style.setProperty('margin-left',  '0', 'important');
        }
        styleLogo(navLogo);
      }
    }

    // ── 2. app.html chat topbar ──
    var topbar = document.querySelector('.chat-topbar');
    if (topbar) {
      topbar.style.setProperty('padding-top',    '20px', 'important');
      topbar.style.setProperty('padding-bottom', '20px', 'important');
      topbar.style.setProperty('padding-left',   '48px', 'important');
      topbar.style.setProperty('padding-right',  '48px', 'important');
      styleLogo(topbar.querySelector('.logo,.nav-logo'));
    }

    // ── 3. app.html auth screen (btn-ghost-back) ──
    var authLogo = document.querySelector('.btn-ghost-back');
    if (authLogo) {
      authLogo.style.cssText = 'position:absolute !important;top:20px !important;left:48px !important;display:flex !important;align-items:center !important;gap:8px !important;text-decoration:none !important;font-family:Inter,system-ui,sans-serif !important;font-size:14px !important;font-weight:600 !important;letter-spacing:0.15em !important;text-transform:uppercase !important;color:inherit !important;background:none !important;border:none !important;padding:0 !important;';
      authLogo.innerHTML = LOGO_SVG + LOGO_SPAN;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
