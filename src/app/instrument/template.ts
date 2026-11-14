// Static markup for the device, the reel picker and the toast. Text lives in
// [data-t] nodes and is filled in by the controller (see WORDS there), so this
// file never changes with language or mode.

const icon = (cls: string, body: string) =>
  `<svg class="ic ${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const ICONS = {
  copy: icon("", '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
  save: icon("", '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>'),
  lang: icon("", '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>'),
  soundOn: icon("on", '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
  soundOff: icon("off", '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>'),
};

const channel = (ri: number) => `
  <div class="ch" data-ri="${ri}">
    <span class="ch-name" data-t="reel${ri}"></span>
    <div class="reel" tabindex="0" role="button" aria-roledescription="reel"><div class="strip"></div><i class="pay l"></i><i class="pay r"></i></div>
    <div class="side">
      <button class="sbtn" type="button" data-lock aria-pressed="false"><span class="led"></span><span data-t="lock"></span></button>
      <button class="sbtn" type="button" data-browse data-t="browse"></button>
    </div>
  </div>`;

export const DEVICE_HTML = `
<section class="device" data-t-label="machine">
  <div class="panel">
    <div class="dial"><div class="dial-in"><canvas data-el="glyph" role="img" data-t-label="glyph"></canvas></div></div>
    <div class="keys">
      <button class="key" type="button" data-el="copy">${ICONS.copy}<span class="kl" data-t="copy"></span></button>
      <button class="key" type="button" data-el="save">${ICONS.save}<span class="kl" data-t="save"></span></button>
      <button class="key" type="button" data-el="lang">${ICONS.lang}<span class="kl" data-t="lang"></span></button>
      <button class="key" type="button" data-el="sound" aria-pressed="false">${ICONS.soundOn}${ICONS.soundOff}<span class="led"></span><span class="kl" data-t="sound"></span></button>
    </div>
    <div class="grille" aria-hidden="true"></div>
    <button class="roll" type="button" data-el="roll"><span data-el="rollLabel"></span></button>
    <div class="bezel">${channel(0)}${channel(1)}${channel(2)}</div>
  </div>
</section>

<section class="recent" data-t-label="recent">
  <header><span class="tiny" data-t="recent"></span></header>
  <ol data-el="recent"></ol>
  <button class="recent-more" type="button" data-el="recentMore" aria-expanded="false" hidden></button>
</section>

<dialog class="picker" data-el="picker" aria-labelledby="im-pk-title">
  <div class="pk-head">
    <h2 id="im-pk-title" data-el="pkTitle"></h2>
    <button class="pk-btn" type="button" data-el="pkClose" data-t="close"></button>
  </div>
  <label class="pk-search"><input data-el="pkSearch" type="search" autocomplete="off" spellcheck="false"></label>
  <div class="pk-cats" data-el="pkCats"></div>
  <div class="pk-list" data-el="pkList" role="listbox" aria-labelledby="im-pk-title" tabindex="-1"></div>
  <div class="pk-foot">
    <label class="pk-lock"><input type="checkbox" data-el="pkLock"><span class="led"></span><span data-t="lockAfter"></span></label>
    <button class="pk-btn" type="button" data-el="pkRand" data-t="random"></button>
  </div>
</dialog>

<dialog class="saver" data-el="saver" aria-labelledby="im-sv-title">
  <div class="pk-head">
    <h2 id="im-sv-title" data-t="saveTitle"></h2>
    <button class="pk-btn" type="button" data-el="svClose" data-t="close"></button>
  </div>
  <div class="sv-stage" data-el="svStage"><div class="sv-fit" data-el="svFit"></div></div>
  <div class="pk-foot">
    <span class="tiny" data-t="saveHint"></span>
    <button class="sv-go" type="button" data-el="svGo">${ICONS.save}<span data-el="svGoLabel"></span></button>
  </div>
</dialog>

<div class="toast" data-el="toast" role="status" aria-live="polite"></div>
<p class="sr" data-el="sr" aria-live="polite"></p>
`;
