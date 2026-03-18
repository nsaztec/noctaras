// Single source of truth for the Noctaras logo style.
// Include this script in every page — never touch per-page logo CSS again.
(function () {
  const SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="12" r="6.5" stroke="#5a7b6b" stroke-width="1.2" fill="none"/><circle cx="15" cy="12" r="6.5" stroke="#7a9b8b" stroke-width="1.2" fill="none" opacity="0.6"/><path d="M12 6.2C13.6 7.8 13.6 16.2 12 17.8C10.4 16.2 10.4 7.8 12 6.2Z" fill="#5a7b6b" opacity="0.28"/></svg>`;

  const STYLE = `
    nav {
      padding-left: 48px !important;
      padding-right: 48px !important;
    }
    @media (max-width: 600px) {
      nav {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
    }
    .logo, .f-logo, .auth-logo, .nav-logo, .j-logo {
      font-family: 'Inter', system-ui, sans-serif !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      letter-spacing: 0.15em !important;
      text-transform: uppercase !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      text-decoration: none !important;
      color: inherit !important;
    }
    .nav-logo-text, .logo > span, .auth-logo > span, .j-logo > span {
      font-size: 14px !important;
      font-weight: 600 !important;
      letter-spacing: 0.15em !important;
      text-transform: uppercase !important;
    }
    .logo svg, .f-logo svg, .auth-logo svg, .nav-logo svg, .j-logo svg {
      width: 24px !important;
      height: 24px !important;
      flex-shrink: 0 !important;
    }
  `;

  // Inject CSS
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);
})();
