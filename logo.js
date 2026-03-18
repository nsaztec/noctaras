// Single source of truth for the Noctaras logo.
// Edit ONLY this file to change the logo across all pages.
(function () {
  const LOGO_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="flex-shrink:0"><circle cx="9" cy="12" r="6.5" stroke="#5a7b6b" stroke-width="1.2" fill="none"/><circle cx="15" cy="12" r="6.5" stroke="#7a9b8b" stroke-width="1.2" fill="none" opacity="0.6"/><path d="M12 6.2C13.6 7.8 13.6 16.2 12 17.8C10.4 16.2 10.4 7.8 12 6.2Z" fill="#5a7b6b" opacity="0.28"/></svg>`;
  const LOGO_TEXT = 'Noctaras';
  const LOGO_STYLE = [
    'display:flex',
    'align-items:center',
    'gap:8px',
    'text-decoration:none',
    'font-family:Inter,system-ui,sans-serif',
    'font-size:14px',
    'font-weight:600',
    'letter-spacing:0.15em',
    'text-transform:uppercase',
    'color:inherit',
    'flex-shrink:0',
  ].join(';');

  function applyLogo() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    // Force consistent nav padding so logo is always 48px from edge
    nav.style.setProperty('padding-left', '48px', 'important');
    nav.style.setProperty('padding-right', '48px', 'important');

    // Find the logo element (any known variant)
    const logo = nav.querySelector('.logo, .nav-logo, .auth-logo, .j-logo, .f-logo');
    if (!logo) return;

    // Rebuild logo innerHTML to be exactly the same on every page
    logo.innerHTML = LOGO_SVG + `<span style="font-family:Inter,system-ui,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase">${LOGO_TEXT}</span>`;

    // Force logo element styles directly — no CSS cascade can interfere
    logo.setAttribute('style', LOGO_STYLE);

    // If logo is wrapped (e.g. nav-left), remove the wrapper's left offset
    if (logo.parentElement !== nav) {
      logo.parentElement.style.setProperty('padding-left', '0', 'important');
      logo.parentElement.style.setProperty('margin-left', '0', 'important');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLogo);
  } else {
    applyLogo();
  }
})();
