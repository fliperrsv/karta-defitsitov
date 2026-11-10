/* ============================================================
   Карта дефицитов — сборка PDF (финальная версия)
   ============================================================ */

const HTML2CANVAS_SRC = [
  'js/vendor/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

const JSPDF_SRC = [
  'js/vendor/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

/* ── Плашка статуса и ошибок ── */
function getStatusEl() {
  let el = document.getElementById('pdf-status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pdf-status';
    el.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;' +
      'background:#1e2a44;color:#fff;padding:10px 14px;border-radius:10px;' +
      'font:14px sans-serif;z-index:9999;display:none;text-align:center;';
    document.body.appendChild(el);
  }
  return el;
}
function setStatus(text) { const el = getStatusEl(); el.textContent = text; el.style.display = 'block'; }
function hideStatus() { const el = getStatusEl(); el.style.display = 'none'; }

window.addEventListener('error', (e) => {
  if (e && e.message) setStatus('Ошибка: ' + e.message);
});

function loadScript(srcList) {
  return srcList.reduce((chain, src) => chain.catch(() => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  })), Promise.reject());
}

/* ── Дождаться загрузки всех картинок ── */
function waitForImages() {
  const imgs = Array.from(document.querySelectorAll('.page img'));
  return Promise.all(imgs.map(img => {
    img.loading = 'eager';
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
  }));
}

/* ── Подготовка картинок к захвату ──
   html2canvas не поддерживает object-fit: cover (фото растягивалось)
   и mix-blend-mode (фото пропадало). Заменяем <img> на div с
   background-size: cover — это html2canvas рисует правильно.
   Размеры копируем из оригинала, иначе div схлопнется в ноль
   (селекторы CSS вида .photo img { height: ... } на div не действуют).
   Заодно конвертируем <canvas> (QR-код) в <img> с явными размерами. */
function prepareImagesForPdf() {
  const fixes = [];

  document.querySelectorAll('.page canvas').forEach(cv => {
    try {
      const dataUrl = cv.toDataURL('image/png');
      const img = document.createElement('img');
      img.src = dataUrl;
      img.className = cv.className;
      const r = cv.getBoundingClientRect();
      img.style.display = 'block';
      img.style.width = r.width + 'px';
      img.style.height = r.height + 'px';
      cv.parentNode.insertBefore(img, cv);
      cv.style.display = 'none';
      fixes.push({ canvas: cv, imgEl: img });
    } catch (e) { /* пустой холст — пропускаем */ }
  });

  document.querySelectorAll('.page img').forEach(img => {
    const src = img.currentSrc || img.src || '';
    if (!src) return;
    const cs = getComputedStyle(img);
    const r = img.getBoundingClientRect();
    const holder = document.createElement('div');
    holder.className = img.className;
    holder.style.display = 'block';
    holder.style.width = r.width + 'px';
    holder.style.height = r.height + 'px';
    holder.style.backgroundImage = 'url("' + src + '")';
    holder.style.backgroundSize = 'cover';
    holder.style.backgroundPosition = 'center';
    holder.style.backgroundRepeat = 'no-repeat';
    holder.style.borderRadius = cs.borderRadius;
    holder.style.overflow = 'hidden';
    img.parentNode.insertBefore(holder, img);
    img.style.display = 'none';
    fixes.push({ img, holder });
  });

  return fixes;
}

function restoreImages(fixes) {
  fixes.forEach(f => {
    if (f.canvas) {
      f.canvas.style.display = '';
      if (f.imgEl) f.imgEl.remove();
    } else {
      f.img.style.display = '';
      if (f.holder) f.holder.remove();
    }
  });
}

/* ── Снять страницу в canvas, с повторной попыткой ── */
async function capturePage(pageEl, scale) {
  const options = { scale: scale, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', logging: false };
  try {
    return await html2canvas(pageEl, options);
  } catch (e) {
    await new Promise(r => setTimeout(r, 300));
    return await html2canvas(pageEl, options);
  }
}

/* ── Основная сборка ── */
async function buildPDF() {
  const btn = document.querySelector('#btn-pdf, #download-pdf, [data-action="download-pdf"]');
  if (btn) btn.disabled = true;

  document.body.classList.add('pdf-mode');
  setStatus('Подготовка…');

  let fixes = [];
  try {
    if (typeof html2canvas === 'undefined') await loadScript(HTML2CANVAS_SRC);
    if (typeof html2canvas === 'undefined') throw new Error('не загрузился html2canvas');
    if (!window.jspdf || !window.jspdf.jsPDF) await loadScript(JSPDF_SRC);
    const jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) throw new Error('не загрузился jsPDF');
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
     

    await waitForImages();
    fixes = prepareImagesForPdf();

    const pages = Array.from(document.querySelectorAll('.page'));
    if (!pages.length) throw new Error('страницы .page не найдены');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    let first = true, skipped = 0;

    for (let i = 0; i < pages.length; i++) {
      setStatus(`Сборка ${i + 1} из ${pages.length}…`);
      const canvas = await capturePage(pages[i], 2);
      if (!canvas || canvas.width < 10 || canvas.height < 10) { skipped++; continue; }
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      if (!first) doc.addPage();
      first = false;
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
      const w = canvas.width * ratio, h = canvas.height * ratio;
      doc.addImage(imgData, 'JPEG', (pageW - w) / 2, 0, w, h);
    }

    setStatus('Сохранение файла…');
    doc.save('Карта_дефицитов.pdf');
    setStatus(skipped ? `Готово, но ${skipped} страниц не снялось — повторите сборку.` : 'Готово! PDF скачан.');
    setTimeout(hideStatus, 4000);

  } catch (err) {
    console.error(err);
    setStatus('Ошибка сборки: ' + (err && err.message ? err.message : 'неизвестная'));
  } finally {
    restoreImages(fixes);
    document.body.classList.remove('pdf-mode');
    if (btn) btn.disabled = false;
  }
}

/* ── Подключение кнопки: по id, data-атрибуту и по тексту ── */
function attachButton() {
  let btn = document.querySelector('#btn-pdf, #download-pdf, [data-action="download-pdf"]');

  if (!btn) {
    const candidates = Array.from(document.querySelectorAll('button, a, div[role="button"], .btn'));
    btn = candidates.find(el => /скачать\s*pdf|download\s*pdf/i.test(el.textContent || ''));
  }

  if (btn && !btn.dataset.pdfBound) {
    btn.dataset.pdfBound = '1';
    btn.addEventListener('click', (e) => { e.preventDefault(); buildPDF(); });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachButton);
} else {
  attachButton();
}

/* Псевдоним для app.js, который вызывает downloadPDF */
window.downloadPDF = buildPDF;
