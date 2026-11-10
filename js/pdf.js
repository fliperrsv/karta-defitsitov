/* ── ленивая загрузка библиотек: локальные копии → зеркала CDN ── */
const HTML2CANVAS_SRC = [
  'js/vendor/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

const JSPDF_SRC = [
  'js/vendor/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(src));
    document.head.appendChild(s);
  });
}

async function loadFirst(list) {
  let lastErr;
  for (const src of list) {
    try { await loadScript(src); return src; }
    catch (e) { lastErr = e; }
  }
  throw new Error('ни один источник не ответил: ' + (lastErr && lastErr.message));
}

async function ensureLibs() {
  if (window.jspdf && window.jspdf.jsPDF && typeof html2canvas !== 'undefined') return;
  await loadFirst(HTML2CANVAS_SRC);
  await loadFirst(JSPDF_SRC);
  if (!window.jspdf || !window.jspdf.jsPDF || typeof html2canvas === 'undefined') {
    throw new Error('библиотеки загрузились, но не запустились');
  }
}



/* ── транслит для имени файла ── */
function translit(s) {
  const map = {а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',
    ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
  const t = s.toLowerCase().split('').map(ch => map[ch] !== undefined ? map[ch] : ch)
    .join('').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
  return t || 'karta_defitsitov';
}

async function downloadPDF() {
  const btn = document.getElementById('btn-pdf');
  btn.disabled = true;
  const oldText = btn.textContent;
  btn.textContent = 'Готовим PDF…';
  const hidden = [...document.querySelectorAll('.no-print')];

  function shot(el, scale) {
    return html2canvas(el, {
      scale,
      useCORS: true,
      backgroundColor: '#fffdf8',
      logging: false,
      windowWidth: 800,
      scrollY: -window.scrollY
    });
  }

  try {
    await ensureLibs();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await Promise.all([...document.images].map(img =>
      img.complete ? Promise.resolve() :
      new Promise(res => { img.onload = img.onerror = res; })
    ));
    await new Promise(r => setTimeout(r, 300));

    hidden.forEach(el => el.style.display = 'none');

    const pages = document.querySelectorAll('.page');
    if (!pages.length) throw new Error('страницы отчёта не найдены');

    // при большом числе страниц снижаем качество, чтобы не упереться в память телефона
    const scale = pages.length > 12 ? 1.5 : 2;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const PAGE_W = 210, PAGE_H = 297;

    for (let i = 0; i < pages.length; i++) {
      btn.textContent = `Готовим PDF… ${i + 1} из ${pages.length}`;

      let canvas;
      try {
        canvas = await shot(pages[i], scale);
      } catch (e1) {
        canvas = await shot(pages[i], 1.2);   // повтор на пониженном качестве
      }

      if (canvas.width < 10) throw new Error('страница ' + (i + 1) + ' отрисовалась пустой');

      const imgH = canvas.height * PAGE_W / canvas.width;

      if (imgH <= PAGE_H) {
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PAGE_W, imgH);
      } else {
        const slices = Math.ceil(imgH / PAGE_H);
        const sliceCanvas = document.createElement('canvas');
        const pxPerMm = canvas.width / PAGE_W;
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.round(PAGE_H * pxPerMm);
        const ctx = sliceCanvas.getContext('2d');

        for (let s = 0; s < slices; s++) {
          const y = Math.round(s * sliceCanvas.height);
          const h = Math.min(sliceCanvas.height, canvas.height - y);
          ctx.fillStyle = '#fffdf8';
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);

          if (i > 0 || s > 0) pdf.addPage();
          pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PAGE_W, PAGE_H);
        }
      }
    }

    pdf.save(`Karta_defitsitov_${translit(report.client.name || '')}.pdf`);
  } catch (e) {
    console.error('Ошибка сборки PDF:', e);
    const msg = (e && e.message) ? e.message : 'неизвестная ошибка';
    const goPrint = confirm(
      'Не удалось собрать PDF.\nПричина: ' + msg + '\n\n' +
      'Открыть печать (меню браузера → «Печать» → «Сохранить как PDF»)?'
    );
    if (goPrint) window.print();
  } finally {
    hidden.forEach(el => el.style.display = '');
    btn.disabled = false;
    btn.textContent = oldText;
  }
}
