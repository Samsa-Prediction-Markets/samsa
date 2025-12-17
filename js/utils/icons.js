// ============================================================================
// SAMSA - SVG ICON UTILITIES
// Centralized gold SVG icons for consistent styling
// ============================================================================

const GOLD_COLOR = 'rgb(212, 175, 55)';

// SVG Icon definitions organized by category
const SVG_ICONS = {
  
  // ============================================================================
  // SPORTS
  // ============================================================================
  
  soccer: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z"/><path d="M12 22l-2-4-4-1 3-3-1-4 4 2 4-2-1 4 3 3-4 1z"/></svg>`,
  
  basketball: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12c3-3 7-3 10 0s7 3 10 0"/><path d="M2 12c3 3 7 3 10 0s7-3 10 0"/></svg>`,
  
  tennis: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M12 14v7"/><path d="M8 21h8"/><path d="M6 8c0 3.314 2.686 6 6 6s6-2.686 6-6"/></svg>`,
  
  baseball: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M5 5c1.5 2 1.5 5 0 7s-1.5 5 0 7"/><path d="M19 5c-1.5 2-1.5 5 0 7s1.5 5 0 7"/></svg>`,
  
  volleyball: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2v10"/><path d="M12 12l8.66 5"/><path d="M12 12l-8.66 5"/></svg>`,
  
  cricket: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M5 19L19 5"/><rect x="3" y="17" width="6" height="4" rx="1" transform="rotate(-45 3 17)"/><circle cx="18" cy="6" r="3"/></svg>`,
  
  football: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="5" transform="rotate(-30 12 12)"/><path d="M7 9l10 6"/><path d="M9 7v2m2-1v2m2-1v2m2-1v2"/></svg>`,
  
  hockey: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 3v15c0 2 2 3 3 3h1"/><path d="M6 18h6"/><circle cx="17" cy="17" r="3"/></svg>`,
  
  golf: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 2v16"/><path d="M12 2l8 4-8 4"/><ellipse cx="12" cy="20" rx="4" ry="2"/></svg>`,
  
  boxing: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M5 10c0-2 1-4 4-4h2c3 0 4 2 4 4v6c0 2-1 4-4 4H9c-3 0-4-2-4-4v-6z"/><path d="M9 10h2"/><circle cx="10" cy="13" r="1.5"/></svg>`,
  
  racing: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 18h18"/><path d="M5 14l2-6h10l2 6"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M7 11h10"/></svg>`,
  
  cycling: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="M5 17l4-7h4l3 4h3"/><circle cx="12" cy="7" r="2"/></svg>`,
  
  rugby: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="5" transform="rotate(-30 12 12)"/><path d="M7 9l10 6"/></svg>`,
  
  trophy: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 9H3a1 1 0 00-1 1v1a4 4 0 004 4"/><path d="M18 9h3a1 1 0 011 1v1a4 4 0 01-4 4"/><path d="M6 4h12v7a6 6 0 11-12 0V4z"/><path d="M12 15v3"/><path d="M8 21h8"/><path d="M9 21v-3h6v3"/></svg>`,
  
  handball: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="9" cy="4" r="2"/><path d="M9 6v4l4 4"/><path d="M6 14l3-4"/><path d="M15 18l-2-4"/><circle cx="17" cy="9" r="2.5"/></svg>`,
  
  lacrosse: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 20L20 4"/><ellipse cx="17" cy="5" rx="3" ry="4" transform="rotate(-20 17 5)"/><path d="M16 8c-1 1-2 1-3 0"/></svg>`,
  
  softball: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M5 7c2 2.5 2 7.5 0 10"/><path d="M19 7c-2 2.5-2 7.5 0 10"/></svg>`,

  // ============================================================================
  // POLITICS & GOVERNMENT
  // ============================================================================
  
  // Capitol Building with dome, columns, and steps
  government: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <path d="M2 22h20"/>
    <path d="M3 20h18v2H3z"/>
    <path d="M4 20v-1h16v1"/>
    <path d="M5 19v-1h14v1"/>
    <path d="M6 18V12"/>
    <path d="M9 18V12"/>
    <path d="M12 18V12"/>
    <path d="M15 18V12"/>
    <path d="M18 18V12"/>
    <path d="M5.5 12h1v.5h-1z"/>
    <path d="M8.5 12h1v.5h-1z"/>
    <path d="M11.5 12h1v.5h-1z"/>
    <path d="M14.5 12h1v.5h-1z"/>
    <path d="M17.5 12h1v.5h-1z"/>
    <path d="M4 12h16v-1H4z"/>
    <path d="M4 11l8-4 8 4"/>
    <path d="M5 11l7-3.5 7 3.5"/>
    <ellipse cx="12" cy="5" rx="3" ry="2"/>
    <path d="M12 3v-1"/>
    <path d="M12 2h2v1h-2"/>
  </svg>`,
  
  // Thought bubble with brain pattern for ideology
  ideology: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <path d="M20 10c0 4.418-3.582 8-8 8a8.06 8.06 0 01-3.2-.66L4 19l1.34-3.54A7.96 7.96 0 014 10c0-4.418 3.582-8 8-8s8 3.582 8 8z"/>
    <path d="M9 8c0-1 1-2 2-2s2 1 2 0 1-2 2-2"/>
    <path d="M8 10c1 0 2 1 2 2s-1 2-2 2"/>
    <path d="M16 10c-1 0-2 1-2 2s1 2 2 2"/>
    <path d="M10 10c0 1.5 1 2.5 2 2.5s2-1 2-2.5"/>
    <path d="M12 6v-.5"/>
    <path d="M9.5 6.5l-.5-.5"/>
    <path d="M14.5 6.5l.5-.5"/>
  </svg>`,
  
  // Podium with microphone for political actors
  people: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <circle cx="12" cy="4" r="2.5"/>
    <path d="M8 10c0-1.5 2-3 4-3s4 1.5 4 3"/>
    <path d="M6 12h12v8H6z"/>
    <path d="M7 13h10"/>
    <path d="M7 19h10"/>
    <circle cx="12" cy="16" r="2"/>
    <path d="M12 8v4"/>
    <ellipse cx="12" cy="8" rx="1" ry="1.5"/>
    <path d="M7 20v2"/>
    <path d="M17 20v2"/>
  </svg>`,
  
  // Detailed scales of justice
  scale: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <path d="M8 22h8"/>
    <path d="M10 22v-2h4v2"/>
    <path d="M12 20V6"/>
    <path d="M11 19h2"/>
    <path d="M11 17h2"/>
    <path d="M4 6h16"/>
    <circle cx="12" cy="5" r="1.5"/>
    <path d="M5 6v2"/>
    <path d="M4 6v2"/>
    <path d="M6 6v2"/>
    <path d="M19 6v2"/>
    <path d="M18 6v2"/>
    <path d="M20 6v2"/>
    <path d="M2 8c0 2 1.5 3 3 3s3-1 3-3"/>
    <ellipse cx="5" cy="8" rx="3" ry="1"/>
    <path d="M16 8c0 2 1.5 3 3 3s3-1 3-3"/>
    <ellipse cx="19" cy="8" rx="3" ry="1"/>
    <circle cx="5" cy="9" r="0.5"/>
    <circle cx="19" cy="9" r="0.5"/>
  </svg>`,
  
  // Newspaper with headlines
  news: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <path d="M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"/>
    <path d="M3 7h18"/>
    <path d="M8 5.5h8" stroke-width="1.5"/>
    <path d="M5 9h14" stroke-width="1.3"/>
    <path d="M5 11h10"/>
    <rect x="5" y="13" width="5" height="4"/>
    <path d="M6 15l1.5-1 1.5 1.5 1-1"/>
    <path d="M12 13h7"/>
    <path d="M12 14.5h7"/>
    <path d="M12 16h5"/>
    <path d="M5 18.5h14"/>
  </svg>`,
  
  // Globe with continents
  globe: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <ellipse cx="12" cy="12" rx="10" ry="4"/>
    <ellipse cx="12" cy="12" rx="4" ry="10"/>
    <path d="M4 8c2.5 1 5 1.5 8 1.5s5.5-.5 8-1.5"/>
    <path d="M4 16c2.5-1 5-1.5 8-1.5s5.5.5 8 1.5"/>
    <path d="M8 7c1 1 2 1 3 0"/>
    <path d="M14 9c.5.5 1.5.5 2 0"/>
    <path d="M6 13c1 .5 2 .5 3 0"/>
    <path d="M15 15c.5.5 1 .5 1.5 0"/>
  </svg>`,
  
  // US Flag for US Politics
  flag: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 22V4"/><path d="M4 4l12 4-12 6"/></svg>`,
  
  // White House - Detailed presidential residence
  whitehouse: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <path d="M2 22h20"/>
    <path d="M3 20h18v2H3z"/>
    <path d="M4 20V14"/>
    <path d="M20 20V14"/>
    <path d="M4 14h16"/>
    <path d="M4 14l8-4 8 4"/>
    <rect x="6" y="14" width="12" height="6"/>
    <path d="M8 16v4"/>
    <path d="M10 16v4"/>
    <path d="M14 16v4"/>
    <path d="M16 16v4"/>
    <rect x="11" y="15" width="2" height="5"/>
    <ellipse cx="12" cy="11" rx="2" ry="1.5"/>
    <path d="M11 10h2v1h-2z"/>
  </svg>`,
  
  // Ballot Box for Elections
  ballot: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <rect x="4" y="8" width="16" height="14" rx="1"/>
    <path d="M8 8V6a4 4 0 018 0v2"/>
    <path d="M9 11h6"/>
    <rect x="8" y="2" width="8" height="4" rx="1"/>
    <path d="M10 4h4"/>
    <path d="M10 14l2 2 4-4"/>
    <path d="M4 18h16"/>
  </svg>`,
  
  // Bank for Federal Reserve / Banking
  bank: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <path d="M3 21h18"/>
    <path d="M4 21v-1h16v1"/>
    <path d="M6 20v-8"/>
    <path d="M10 20v-8"/>
    <path d="M14 20v-8"/>
    <path d="M18 20v-8"/>
    <path d="M4 12h16"/>
    <path d="M4 12l8-8 8 8"/>
    <circle cx="12" cy="8" r="1.5"/>
    <path d="M10.5 8h3"/>
  </svg>`,
  
  // Passport/ID for Immigration
  passport: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <circle cx="12" cy="9" r="3"/>
    <path d="M8 15h8"/>
    <path d="M9 17h6"/>
    <path d="M6 5h2"/>
    <path d="M16 5h2"/>
    <path d="M12 4v1"/>
  </svg>`,
  
  // Dollar Bill for Taxation
  dollar: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 9v6"/>
    <path d="M10.5 10c0-.5.5-1 1.5-1s1.5.5 1.5 1c0 1-3 1-3 2 0 .5.5 1 1.5 1s1.5-.5 1.5-1"/>
    <circle cx="5" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
  </svg>`,
  
  // Lock for Cybersecurity
  lock: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <rect x="5" y="11" width="14" height="10" rx="2"/>
    <path d="M8 11V7a4 4 0 018 0v4"/>
    <circle cx="12" cy="16" r="1.5"/>
    <path d="M12 17.5v2"/>
  </svg>`,
  
  // Computer for Big Tech
  computer: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <path d="M2 14h20"/>
    <path d="M8 21h8"/>
    <path d="M12 17v4"/>
    <circle cx="12" cy="9" r="3"/>
    <path d="M10 8l1 2h2l1-2"/>
  </svg>`,
  
  // Phone for Social Media
  phone: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <rect x="6" y="2" width="12" height="20" rx="2"/>
    <path d="M10 5h4"/>
    <circle cx="12" cy="18" r="1"/>
    <rect x="8" y="7" width="8" height="8" rx="1"/>
    <path d="M9 10h2"/>
    <path d="M9 12h4"/>
  </svg>`,
  
  // Electric Car
  electriccar: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <path d="M5 17h14v-5l-2-4H7l-2 4v5z"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
    <path d="M5 12h14"/>
    <path d="M10 4l-1 4"/>
    <path d="M14 4l1 4"/>
    <path d="M11 6h2"/>
    <path d="M10 2v2"/>
    <path d="M14 2v2"/>
  </svg>`,
  
  // Graduation Cap for Education
  graduation: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <path d="M12 3L2 9l10 6 10-6-10-6z"/>
    <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/>
    <path d="M22 9v7"/>
    <circle cx="22" cy="17" r="1"/>
  </svg>`,
  
  // Hard Hat for Labor
  hardhat: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <path d="M4 18c0 1 1 2 2 2h12c1 0 2-1 2-2"/>
    <path d="M4 18v-2c0-4 3.5-7 8-7s8 3 8 7v2"/>
    <path d="M12 9V5"/>
    <path d="M8 13h8"/>
    <ellipse cx="12" cy="5" rx="3" ry="1.5"/>
  </svg>`,
  
  // Fist for Civil Rights
  fist: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <path d="M7 11c0-1 1-2 2-2h1V7c0-1 1-2 2-2s2 1 2 2v2h1c1 0 2 1 2 2v7c0 2-2 4-5 4s-5-2-5-4v-7z"/>
    <path d="M10 9V6"/>
    <path d="M14 9V6"/>
    <path d="M7 14h10"/>
    <path d="M9 17h6"/>
  </svg>`,
  
  // Brain for Mental Health
  brain: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <path d="M12 4c-1.5 0-3 1-3 3 0-2-1.5-3-3-3-2 0-3 2-3 4s2 4 4 5c-2 1-3 2-3 4s1 3 3 3c1.5 0 2-1 3-2"/>
    <path d="M12 4c1.5 0 3 1 3 3 0-2 1.5-3 3-3 2 0 3 2 3 4s-2 4-4 5c2 1 3 2 3 4s-1 3-3 3c-1.5 0-2-1-3-2"/>
    <path d="M12 4v16"/>
    <path d="M9 10c1 0 2 1 3 1s2-1 3-1"/>
    <path d="M9 15c1 0 2-1 3-1s2 1 3 1"/>
  </svg>`,

  // ============================================================================
  // INTERNATIONAL RELATIONS
  // ============================================================================
  
  // UN-style emblem with olive branches
  un: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="10" r="5"/>
    <ellipse cx="12" cy="10" rx="5" ry="2"/>
    <ellipse cx="12" cy="10" rx="2" ry="5"/>
    <path d="M4 18c2-2 3-4 4-6"/>
    <path d="M5 16c-.5-.5-1-1.5-.5-2"/>
    <path d="M6 14c-.5-.5-1-1.5-.5-2"/>
    <path d="M7 12c-.3-.5-.5-1-.3-1.5"/>
    <path d="M20 18c-2-2-3-4-4-6"/>
    <path d="M19 16c.5-.5 1-1.5.5-2"/>
    <path d="M18 14c.5-.5 1-1.5.5-2"/>
    <path d="M17 12c.3-.5.5-1 .3-1.5"/>
    <path d="M10 20h4"/>
  </svg>`,
  
  // NATO compass star
  shield: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <path d="M12 2l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5z"/>
    <path d="M12 6l.75 4.25L17 12l-4.25.75L12 17l-.75-4.25L7 12l4.25-.75z"/>
    <circle cx="12" cy="12" r="1"/>
  </svg>`,
  
  // EU flag with stars
  eu: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 4l.3.9h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1z"/>
    <path d="M16 5l.3.9h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1z"/>
    <path d="M19 8l.3.9h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1z"/>
    <path d="M20 12l.3.9h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1z"/>
    <path d="M19 16l.3.9h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1z"/>
    <path d="M16 19l.3.9h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1z"/>
    <path d="M12 20l.3.9h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1z"/>
    <path d="M8 19l.3.9h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1z"/>
    <path d="M5 16l.3.9h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1z"/>
    <path d="M4 12l.3.9h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1z"/>
    <path d="M5 8l.3.9h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1z"/>
    <path d="M8 5l.3.9h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1z"/>
  </svg>`,
  
  // Currency/trade
  currency: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <rect x="4" y="7" width="16" height="10" rx="1"/>
    <path d="M12 9v6"/>
    <path d="M10 10c0-1 1-1.5 2-1.5s2 .5 2 1.5c0 1.5-4 1.5-4 3 0 1 1 1.5 2 1.5s2-.5 2-1.5"/>
    <circle cx="6" cy="12" r="1.5"/>
    <circle cx="18" cy="12" r="1.5"/>
    <path d="M7 18h4l-1.5-1.5"/>
    <path d="M7 18l1.5 1.5"/>
    <path d="M17 18h-4l1.5-1.5"/>
    <path d="M17 18l-1.5 1.5"/>
  </svg>`,
  
  // Treaty scroll
  document: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <path d="M6 4c0-1 1-2 2-2h8c1 0 2 1 2 2"/>
    <ellipse cx="6" cy="4" rx="2" ry="2"/>
    <path d="M4 4v16c0 1 1 2 2 2h12c1 0 2-1 2-2V4"/>
    <path d="M8 8h8"/>
    <path d="M8 10h8"/>
    <path d="M8 12h6"/>
    <circle cx="15" cy="17" r="2.5"/>
    <path d="M15 15.5v-1"/>
    <path d="M14 16l-1-1"/>
    <path d="M16 16l1-1"/>
    <path d="M13 19l-1 2"/>
    <path d="M17 19l1 2"/>
    <ellipse cx="18" cy="20" rx="2" ry="2"/>
  </svg>`,
  
  // Conflicts - Crossed swords
  bomb: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
    <path d="M3 21l7-7"/>
    <path d="M3 21l1-3 2 2-3 1"/>
    <path d="M10 14l8-8"/>
    <path d="M17 5l2 1-1 2"/>
    <path d="M21 21l-7-7"/>
    <path d="M21 21l-1-3-2 2 3 1"/>
    <path d="M14 14l-8-8"/>
    <path d="M7 5l-2 1 1 2"/>
    <circle cx="12" cy="12" r="2"/>
    <path d="M12 8v-2"/>
    <path d="M12 16v2"/>
    <path d="M8 12h-2"/>
    <path d="M16 12h2"/>
    <path d="M9 9l-1.5-1.5"/>
    <path d="M15 9l1.5-1.5"/>
    <path d="M9 15l-1.5 1.5"/>
    <path d="M15 15l1.5 1.5"/>
  </svg>`,

  // ============================================================================
  // FINANCE
  // ============================================================================
  
  chart: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 5-6"/><circle cx="20" cy="10" r="1.5"/></svg>`,
  
  bitcoin: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9 8h4c1.5 0 2.5 1 2.5 2.5S14.5 13 13 13H9V8z"/><path d="M9 13h4.5c1.5 0 2.5 1 2.5 2.5s-1 2.5-2.5 2.5H9v-5z"/><path d="M10 6v2"/><path d="M13 6v2"/><path d="M10 18v-2"/><path d="M13 18v-2"/></svg>`,
  
  home: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/></svg>`,
  
  oil: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 2c-2 4-6 6-6 11a6 6 0 1012 0c0-5-4-7-6-11z"/><path d="M12 19a3 3 0 01-3-3c0-2 3-5 3-5s3 3 3 5a3 3 0 01-3 3z"/></svg>`,
  
  gamepad: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4"/><path d="M8 10v4"/><circle cx="16" cy="10" r="1"/><circle cx="18" cy="12" r="1"/><circle cx="16" cy="14" r="1"/><circle cx="14" cy="12" r="1"/></svg>`,

  // ============================================================================
  // ENVIRONMENT
  // ============================================================================
  
  tree: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 22V13"/><path d="M17 13l-5-10-5 10h10z"/><path d="M15 8l-3-5-3 5h6z"/></svg>`,
  
  battery: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><path d="M6 11v2"/><path d="M10 11v2"/><path d="M14 11v2"/></svg>`,
  
  leaf: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 21c4-4 7-10 15-14-4 8-6 12-15 14z"/><path d="M6 21c0-6 3-11 9-13"/></svg>`,
  
  recycle: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M7 19l-3-5.5 3-5.5"/><path d="M4 13.5h8"/><path d="M17 5l3 5.5-3 5.5"/><path d="M20 10.5h-8"/><path d="M12 22l-4-3 4-3"/><path d="M12 2l4 3-4 3"/></svg>`,
  
  clipboard: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3h6v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V3z"/><path d="M9 11h6"/><path d="M9 15h4"/></svg>`,

  // ============================================================================
  // CLIMATE
  // ============================================================================
  
  thermometer: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 2a2 2 0 00-2 2v10a4 4 0 104 0V4a2 2 0 00-2-2z"/><circle cx="12" cy="18" r="2"/><path d="M12 14V8"/></svg>`,
  
  wind: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9.59 4.59A2 2 0 1011 8H2"/><path d="M12.59 19.41A2 2 0 1014 16H2"/><path d="M17.74 9.26A2.5 2.5 0 1019.5 14H2"/></svg>`,
  
  wave: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M2 12c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0"/><path d="M2 17c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0"/><path d="M2 7c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0"/></svg>`,

  // ============================================================================
  // SCIENCE & TECHNOLOGY
  // ============================================================================
  
  rocket: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
  
  beaker: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M8 3h8"/><path d="M9 3v6l-4 8h14l-4-8V3"/><path d="M6 17h12"/></svg>`,
  
  dna: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 3c0 3 1.5 5 3 6.5S12 12 12 15s-1.5 5-3 6.5"/><path d="M18 3c0 3-1.5 5-3 6.5S12 12 12 15s1.5 5 3 6.5"/><path d="M6 7h12"/><path d="M6 12h12"/><path d="M6 17h12"/></svg>`,
  
  robot: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4"/><circle cx="12" cy="4" r="2"/><circle cx="9" cy="13" r="1.5"/><circle cx="15" cy="13" r="1.5"/><path d="M9 17h6"/></svg>`,

  // ============================================================================
  // HEALTH
  // ============================================================================
  
  pill: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M10.5 20.5l10-10a4.95 4.95 0 10-7-7l-10 10a4.95 4.95 0 107 7z"/><path d="M8.5 8.5l7 7"/></svg>`,
  
  syringe: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M18 2l4 4"/><path d="M15 5l-11 11"/><path d="M7 13l4 4"/><path d="M4 16l4 4"/><path d="M20 8l-5-5"/><path d="M3 21l2-2"/></svg>`,
  
  virus: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>`,
  
  hospital: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M12 5v5"/><path d="M10 12v5"/><path d="M14 12v5"/><path d="M10 15h4"/></svg>`,

  // ============================================================================
  // ENTERTAINMENT & ARTS
  // ============================================================================
  
  film: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20"/><path d="M2 16h20"/><path d="M6 4v4"/><path d="M10 4v4"/><path d="M14 4v4"/><path d="M18 4v4"/><path d="M6 16v4"/><path d="M10 16v4"/><path d="M14 16v4"/><path d="M18 16v4"/></svg>`,
  
  mic: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0014 0"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>`,
  
  music: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  
  palette: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="8" r="1.5"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/><circle cx="10" cy="16" r="1.5"/><path d="M19 14c-1 2-3 4-7 4"/></svg>`,

  // ============================================================================
  // MISCELLANEOUS
  // ============================================================================
  
  sparkles: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.962 0L14.063 8.5a2 2 0 001.437 1.437l6.135 1.582a.5.5 0 010 .962L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.962 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/></svg>`,
  
  fire: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 22c4-3 7-6 7-11 0-6-5-9-7-9s-7 3-7 9c0 5 3 8 7 11z"/><path d="M12 22c-2-2-3-4-3-6s2-4 3-4 3 2 3 4-1 4-3 6z"/></svg>`,
  
  star: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  
  default: `<svg class="w-full h-full" style="color: ${GOLD_COLOR};" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`
};

// ============================================================================
// NAME TO ICON KEY MAPPINGS
// ============================================================================

const ICON_MAPPINGS = {
  // ----- SPORTS -----
  'Soccer': 'soccer', 
  'Football': 'soccer', 
  'Association Football': 'soccer',
  'Basketball': 'basketball',
  'Tennis': 'tennis',
  'Baseball': 'baseball',
  'Volleyball': 'volleyball',
  'Cricket': 'cricket',
  'American Football': 'football', 
  'Canadian Football': 'football',
  'Ice Hockey': 'hockey',
  'Golf': 'golf',
  'Combat': 'boxing', 
  'Boxing': 'boxing', 
  'MMA': 'boxing',
  'Auto Racing': 'racing', 
  'F1': 'racing', 
  'NASCAR': 'racing',
  'Cycling': 'cycling',
  'Rugby': 'rugby', 
  'Rugby Union': 'rugby', 
  'Rugby League': 'rugby',
  'Multi-Sports': 'trophy',
  'Handball': 'handball',
  'Lacrosse': 'lacrosse', 
  'Indoor Lacrosse': 'lacrosse', 
  'Field Lacrosse': 'lacrosse',
  'Softball': 'softball',
  
  // ----- POLITICS -----
  'Government': 'government',
  'Political Ideology': 'ideology',
  'Political Actors': 'people',
  'Political Issues': 'scale',
  'Mass Media': 'news',
  'Global Issues': 'globe',
  'US Politics': 'flag',
  
  // ----- US POLITICS -----
  'Congress': 'government',
  'White House': 'whitehouse',
  'Supreme Court': 'scale',
  'US Elections': 'ballot',
  'Legislation': 'document',
  'Federal Reserve': 'bank',
  'Immigration': 'passport',
  'State Governors': 'government',
  
  // ----- INTERNATIONAL -----
  'United Nations': 'un',
  'NATO': 'shield',
  'European Union': 'eu',
  'Global Trade': 'currency',
  'Human Rights': 'scale',
  'International Treaty': 'document',
  'Conflicts': 'bomb',
  
  // ----- FINANCE -----
  'Stock Markets': 'chart',
  'Cryptocurrencies': 'bitcoin', 
  'Cryptocurrency': 'bitcoin',
  'Real Estate': 'home',
  'Commodities': 'oil',
  'Video Games': 'gamepad',
  'Banking': 'bank',
  'Taxation': 'dollar',
  
  // ----- ENVIRONMENT -----
  'Conservation': 'tree',
  'Renewable Energy': 'battery',
  'Biodiversity': 'leaf',
  'Sustainable Development': 'recycle',
  'Environmental Policy': 'clipboard',
  
  // ----- CLIMATE -----
  'Global Warming': 'thermometer',
  'Carbon Emissions': 'wind',
  'Climate Agreements': 'document',
  'Climate Change Impacts': 'wave',
  'Climate': 'globe',
  
  // ----- SCIENCE & TECHNOLOGY -----
  'Space Exploration': 'rocket',
  'Medicine': 'pill',
  'Biology': 'dna',
  'Genetics': 'dna',
  'Artificial Intelligence': 'robot', 
  'AI & Tech': 'robot',
  'Cybersecurity': 'lock',
  'Big Tech': 'computer',
  'Social Media': 'phone',
  'Electric Vehicles': 'electriccar',
  
  // ----- HEALTH -----
  'Vaccine': 'syringe',
  'Disease': 'virus',
  'Public Health': 'hospital',
  'Mental Health': 'brain',
  'Pharmaceuticals': 'pill',
  
  // ----- SOCIAL -----
  'Education': 'graduation',
  'Labor & Unions': 'hardhat',
  'Housing': 'home',
  'Crime & Justice': 'scale',
  'Civil Rights': 'fist',
  
  // ----- ENTERTAINMENT & ARTS -----
  'Film': 'film', 
  'Movies': 'film',
  'Concert Tours': 'mic',
  'Music Awards': 'trophy', 
  'Music': 'music',
  'Art': 'palette',
  
  // ----- CATEGORY KEYS (lowercase) -----
  'politics': 'government',
  'sports': 'trophy',
  'finance': 'chart',
  'crypto': 'bitcoin',
  'environment': 'tree',
  'climate': 'thermometer',
  'science': 'rocket',
  'health': 'hospital',
  'entertainment': 'film',
  'arts_and_culture': 'palette',
  'international': 'globe',
  'technology': 'robot',
  'social': 'fist',
  'economics': 'chart',
  'law': 'scale'
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get SVG icon by name
 * @param {string} name - Icon name or category/sport name
 * @param {string} size - Size class (e.g., 'w-6 h-6')
 * @returns {string} SVG HTML string
 */
function getIcon(name, size = '') {
  const iconKey = ICON_MAPPINGS[name] || ICON_MAPPINGS[name.toLowerCase()] || 'default';
  let svg = SVG_ICONS[iconKey] || SVG_ICONS.default;
  
  if (size) {
    svg = svg.replace('class="w-full h-full"', `class="${size}"`);
  }
  
  return svg;
}

/**
 * Get icon wrapped in a container
 * @param {string} name - Icon name
 * @param {string} containerClass - Container div classes
 * @param {string} iconSize - Icon size class
 * @returns {string} HTML string with icon in container
 */
function getIconContainer(name, containerClass = '', iconSize = 'w-6 h-6') {
  const icon = getIcon(name, iconSize);
  if (containerClass) {
    return `<div class="${containerClass}">${icon}</div>`;
  }
  return icon;
}

// ============================================================================
// EXPORTS
// ============================================================================

window.SamsaIcons = {
  getIcon,
  getIconContainer,
  SVG_ICONS,
  ICON_MAPPINGS,
  GOLD_COLOR
};
