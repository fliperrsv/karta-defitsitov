/* ============================================================
   Карта дефицитов — сборка PDF
   Требования: html2canvas + jsPDF (локально в корне или с CDN)
   ============================================================ */

const HTML2CANVAS_SRC = [
  'html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

const JSPDF_SRC = [
  'jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

/* ── Загрузчик внешних скриптов с резервными адресами ── */
function loadScript(srcList) {
  return srcList.reduce((chain, src) => chain.catch(() => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  })), Promise.reject());
}

/* ── Дождаться загрузки всех картинок внутри отчёта ── */
function waitForImages() {
  const imgs = Array.from(document.querySelectorAll('.page img'));
  return Promise.all(imgs.map(img => {
    img.loading = 'eager';
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve; // битая картинка не должна вешать сборку
    });
  }));
}

/* ── Снять одну страницу в canvas, с одной повторной попыткой ── */
async function capturePage(pageEl, scale) {
  const options = {
    scale: scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false
  };
  try {
    return await html2canvas(pageEl, options);
  } catch (e) {
    // вторая попытка: бывает, первый захват падает на ещё не отрисованных шрифтах
    await new Promise(r => setTimeout(r, 300));
    return await html2canvas(pageEl, options);
  }
}

/* ── Основная сборка ── */
async function buildPDF() {
  const statusEl = document.getElementById('pdf-status');
  const setStatus = (text) => { if (statusEl) statusEl.textContent = text; };

  const btn = document.getElementById('btn-pdf');
  if (btn) btn.disabled = true;

  document.body.classList.add('pdf-mode');
  setStatus('Подготовка…');

  try {
    // библиотеки
    if (typeof html2canvas === 'undefined') await loadScript(HTML2CANVAS_SRC);
    if (typeof html2canvas === 'undefined') throw new Error('Не загрузился html2canvas');
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) await loadScript(JSPDF_SRC);

    // ждём картинки, пока включён pdf-mode (без mix-blend-mode)
    await waitForImages();

    const pages = Array.from(document.querySelectorAll('.page'));
    if (!pages.length) throw new Error('Страницы отчёта не найдены');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    let first = true;
    let skipped = 0;

    for (let i = 0; i < pages.length; i++) {
      setStatus(`Сборка ${i + 1} из ${pages.length}…`);

      const canvas = await capturePage(pages[i], 2);
      if (!canvas || canvas.width < 10 || canvas.height < 10) {
        skipped++;
        continue; // пустой лист вместо сорвавшейся страницы не вставляем
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      if (!first) doc.addPage();
      first = false;

      // вписываем по высоте, сохраняя пропорции
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      const x = (pageW - w) / 2;
      const y = 0;

      doc.addImage(imgData, 'JPG', x, y, w, h);
    }

    setStatus('Сохранение файла…');
    doc.save('Карта_дефицитов.pdf');

    if (skipped > 0) {
      setStatus(`Готово, но ${skipped} страниц(ы) не удалось снять — обновите страницу и повторите.`);
    } else {
      setStatus('Готово! PDF скачан.');
    }

  } catch (err) {
    console.error(err);
    setStatus('Ошибка сборки: ' + (err && err.message ? err.message : 'неизвестная') + '. Обновите страницу и попробуйте ещё раз.');
  } finally {
    document.body.classList.remove('pdf-mode');
    if (btn) btn.disabled = false;
  }
}

/* ── Подключение кнопки ── */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-pdf');
  if (btn) btn.addEventListener('click', buildPDF);
});
