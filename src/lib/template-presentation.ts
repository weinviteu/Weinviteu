const royalWedding = 'c0c8e07c-38f0-450d-8a24-c77e494b20bc.html';

/** Presentation fixes for stored templates, shared by previews and newly customized invitations. */
export function applyTemplatePresentation(filename: string, html: string): string {
  const name = filename.split('/').pop()?.split('?')[0];
  if (name !== royalWedding || html.includes('id="royal-wedding-open-label"')) return html;
  return html.replace('</head>', `<style id="royal-wedding-open-label">
    #door .door-seal::after {
      content: "Tap to open";
      position: absolute;
      top: calc(100% + 24px);
      left: 50%;
      transform: translateX(-50%);
      width: max-content;
      padding: 9px 17px;
      border: 1px solid rgba(243, 217, 160, .65);
      border-radius: 999px;
      background: rgba(42, 4, 11, .9);
      color: #fbecc4;
      font: 500 12px/1.4 var(--caps);
      letter-spacing: 1.4px;
      text-shadow: 0 1px 3px #1c0206;
      box-shadow: 0 3px 14px rgba(0, 0, 0, .3);
    }
    #door > .door-bottom { display: none; }
  </style></head>`);
}
