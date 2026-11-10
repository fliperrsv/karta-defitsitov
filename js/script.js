// ══════════════════════════════════════════════
// ЛОГИКА — раскладывает REPORT по странице.
// Один на все отчёты, не редактируется.
// ══════════════════════════════════════════════
'use strict';

(() => {

  const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
  <rect width="640" height="400" fill="#d9b98a"/>
  <circle cx="500" cy="90" r="70" fill="#c9a877"/>
  <circle cx="90" cy="330" r="80" fill="#e2c49a"/>
  <ellipse cx="320" cy="210" rx="170" ry="70" fill="#f5f0e0"/>
  <ellipse cx="310" cy="205" rx="90" ry="38" fill="#e07856"/>
  <circle cx="415" cy="205" r="26" fill="#9ab973"/>
  <circle cx="415" cy="205" r="7" fill="#5a4632"/>
  <ellipse cx="245" cy="245" rx="9" ry="5" fill="#5a7a3a"/>
  <ellipse cx="268" cy="252" rx="9" ry="5" fill="#5a7a3a"/>
  <ellipse cx="290" cy="244" rx="9" ry="5" fill="#5a7a3a"/>
  <circle cx="345" cy="248" r="5" fill="#c94f42"/>
  <circle cx="356" cy="255" r="5" fill="#c94f42"/>
  <path d="M120 215 L165 215 M165 200 L165 230 M120 200 L120 230 M120 200 L165 200" stroke="#8a8f7e" stroke-width="6" fill="none" stroke-linecap="round"/>
</svg>`);

  const setPhotoFallback = (photoEl) => {
    if (photoEl.dataset.fallback) return;
    photoEl.dataset.fallback = '1';
    photoEl.src = PLACEHOLDER;
  };

  // Заголовок — теперь просто текст (переносы делает CSS)
  const titleEl = document.querySelector('[data-field="title"]');
  if (titleEl) titleEl.textContent = REPORT.title;

  const calloutEl = document.querySelector('[data-field="calloutHtml"]');
  if (calloutEl) calloutEl.innerHTML = REPORT.calloutHtml;

  document.querySelectorAll('[data-field]').forEach((el) => {
    const key = el.dataset.field;
    if (key === 'title' || key === 'calloutHtml') return;
    if (REPORT[key] !== undefined) el.textContent = REPORT[key];
  });

  // Фото: ловим и ошибку загрузки, и уже сломавшуюся картинку
  // (картинка может упасть до того, как сработает script.js)
  const photoEl = document.querySelector('[data-photo]');
  if (photoEl) {
    photoEl.addEventListener('error', () => setPhotoFallback(photoEl));
    if (photoEl.complete && photoEl.naturalWidth === 0) setPhotoFallback(photoEl);
  }

})();
