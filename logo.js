(function () {
  var SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="12" r="6.5" stroke="#5a7b6b" stroke-width="1.2" fill="none"/><circle cx="15" cy="12" r="6.5" stroke="#7a9b8b" stroke-width="1.2" fill="none" opacity="0.6"/><path d="M12 6.2C13.6 7.8 13.6 16.2 12 17.8C10.4 16.2 10.4 7.8 12 6.2Z" fill="#5a7b6b" opacity="0.28"/></svg>';

  function s(el, prop, val) {
    el.style.setProperty(prop, val, 'important');
  }

  function logoStyle(el) {
    el.innerHTML = SVG + '<span>Noctaras</span>';
    s(el, 'display', 'flex');
    s(el, 'align-items', 'center');
    s(el, 'gap', '8px');
    s(el, 'text-decoration', 'none');
    s(el, 'font-family', 'Inter, system-ui, sans-serif');
    s(el, 'font-size', '14px');
    s(el, 'font-weight', '600');
    s(el, 'letter-spacing', '0.15em');
    s(el, 'text-transform', 'uppercase');
    s(el, 'color', 'inherit');
    s(el, 'background', 'none');
    s(el, 'border', 'none');
    s(el, 'padding', '0');
    s(el, 'cursor', 'pointer');
    var span = el.querySelector('span');
    if (span) {
      s(span, 'font-family', 'Inter, system-ui, sans-serif');
      s(span, 'font-size', '14px');
      s(span, 'font-weight', '600');
      s(span, 'letter-spacing', '0.15em');
      s(span, 'text-transform', 'uppercase');
    }
    var svg = el.querySelector('svg');
    if (svg) {
      s(svg, 'width', '24px');
      s(svg, 'height', '24px');
      s(svg, 'flex-shrink', '0');
    }
  }

  function barStyle(bar) {
    s(bar, 'padding-top', '20px');
    s(bar, 'padding-bottom', '20px');
    s(bar, 'padding-left', '48px');
    s(bar, 'padding-right', '48px');
  }

  function run() {
    // 1. Standard nav (index, contact, blog, privacy, terms...)
    var nav = document.querySelector('nav');
    if (nav) {
      barStyle(nav);
      var logo = nav.querySelector('.logo, .nav-logo, .auth-logo, .j-logo');
      if (logo) {
        if (logo.parentElement !== nav) {
          s(logo.parentElement, 'padding-left', '0');
          s(logo.parentElement, 'margin-left', '0');
        }
        logoStyle(logo);
      }
    }

    // 2. app.html — chat topbar
    var topbar = document.querySelector('.chat-topbar');
    if (topbar) {
      barStyle(topbar);
      var tLogo = topbar.querySelector('.logo, .nav-logo');
      if (tLogo) logoStyle(tLogo);
    }

    // 3. app.html — auth screen back button used as logo
    var authLogo = document.querySelector('.btn-ghost-back');
    if (authLogo) {
      logoStyle(authLogo);
      s(authLogo, 'position', 'absolute');
      s(authLogo, 'top', '20px');
      s(authLogo, 'left', '48px');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
