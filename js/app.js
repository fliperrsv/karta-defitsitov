const root = document.getElementById('report');

/* ── helpers ── */
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ul = items => items.map(t => `<li>${esc(t)}</li>`).join('');

/* ── иконки (инлайн-SVG, как в макете Марии) ── */
const ICONS = {
  sprout: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M12 21v-8"/><path d="M12 13C12 9 9 7 5 7c0 4 3 6 7 6z" fill="#fff" stroke="none"/><path d="M12 11c0-3 2.5-5 6-5 0 3-2.5 5-6 5z" fill="#fff" stroke="none"/></svg>`,
  check: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>`,
  warn: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#e8a33d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3L2 21h20L12 3z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="18" r="0.6" fill="#e8a33d"/></svg>`,
  flame: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#e8543a"><path d="M12 2c1 4-4 5-4 10a4 4 0 0 0 8 0c0-2-1-3-1-3s3 1 3 4a6 6 0 0 1-12 0C6 8 11 7 12 2z"/></svg>`,
  scales: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M12 4v16M6 20h12M12 6l-5 5 2.5 4h5L17 11 12 6z"/></svg>`,
  pill: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2"><rect x="4" y="9" width="16" height="7" rx="3.5" transform="rotate(-30 12 12)"/><line x1="10" y1="8" x2="14" y2="14"/></svg>`,
  alert: `<svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="18" fill="#e8543a"/><text x="20" y="27" font-size="20" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Georgia">!</text></svg>`,
  quote: `<svg viewBox="0 0 40 24" width="40" height="24" fill="#4a7c2f"><path d="M0 24V14C0 6 4 1 12 0l1 4c-4 1-6 4-6 8h7v12H0zm18 0V14c0-8 4-13 12-14l1 4c-4 1-6 4-6 8h7v12H18z"/></svg>`,
  tg: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#4a7c2f" stroke-width="1.8" stroke-linejoin="round"><path d="M21 3L3 11l6 2 2 6 4-5 5 3L21 3z"/></svg>`,
  ig: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#4a7c2f" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#4a7c2f" stroke="none"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#4a7c2f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17c5 2 10-1 12-7"/><path d="M12 9l4-2 2 4"/></svg>`,
};

const DEF_LABELS = { insufficient: "Недостаточно", significant: "Значительно снижен", severe: "Выраженный недостаток" };
const EXC_LABELS = { elevated: "Повышено", high: "Значительно повышены", severe: "Выраженный избыток" };

/* ── шапка страницы: росток · название · линия · раздел · номер ── */
function head(num, section) {
  return `
  <div class="page-head">
    <span class="logo">${ICONS.sprout}</span>
    <span class="brand">Карта дефицитов</span>
    <span class="head-line"></span>
    <span class="section">${esc(section)}</span>
    <span class="page-num">${String(num).padStart(2,'0')}</span>
  </div>`;
}

/* ── сборщик страницы ── */
function shell(title, kicker, inner, opts = {}) {
  const num = report.pagesTitles.indexOf(title) + 1;
  return `
  <section class="page${opts.noHead ? ' title-page' : ''}">
    ${opts.noHead ? '' : head(num, kicker)}
    <h1 class="title">${esc(title)}</h1>
    ${inner}
    <div class="page-end"><span></span></div>
  </section>`;
}

/* ── 01: титул ── */
function page01() {
  const c = report.client;
  return `
  <section class="page title-page">
    <div class="title-kicker">Персональный анализ питания</div>
    <h1 class="title">${esc(report.pagesTitles[0])}</h1>
    <div class="client-name">${esc(c.name)}</div>
    <div class="chips">
      <div class="chip"><span>Возраст:</span><b>${esc(c.age)}</b></div>
      <div class="chip"><span>Рост:</span><b>${esc(c.height)}</b></div>
      <div class="chip"><span>Вес:</span><b>${esc(c.weight)}</b></div>
      <div class="chip"><span>ИМТ:</span><b>${esc(c.imt)}</b></div>
    </div>
    <p class="lead">${esc(report.intro1)}</p>
    <p class="lead italic">${esc(report.intro2)}</p>
    <div class="callout green"><b>Карта поможет</b> увидеть особенности вашего рациона, определить недостаточное и избыточное поступление питательных веществ и получить последовательный план коррекции питания.</div>
    <figure class="photo"><img src="assets/photo.jpg" alt="Блюдо с лососем и овощами"></figure>
    <div class="page-end"><span></span></div>
  </section>`;
}

/* ── 02: об авторе ── */
function page02() {
  const a = report.about;
  return shell(report.pagesTitles[1], 'Об авторе', `
    <div class="author">
      <div class="author-text">
        <div class="script-name">${esc(a.name)}</div>
        <p class="role"><b>Врач-невролог высшей категории.</b><br>Специалист по превентивному управлению здоровьем и восстановлению организма.</p>
        <div class="qmark">${ICONS.quote}</div>
        <p class="quote">«Моя задача как врача — не просто показать ваши дефициты и избытки, а помочь разобраться, что стоит изменить в питании и какие шаги сделать, чтобы постепенно восстанавливать свою ресурсную базу».</p>
      </div>
      <figure class="author-photo"><img src="assets/author.jpg" alt="${esc(a.name)}"></figure>
    </div>
    <div class="important-row">
      <div class="important-label"><span class="ic-alert">${ICONS.alert}</span><b>Важно</b></div>
      <span class="vline"></span>
      <p>${esc(a.important)}</p>
    </div>
    <div class="bottom-row">
      <div class="contacts">
        <div class="contacts-title">Контакты</div>
        <div class="c-line">${ICONS.tg} Telegram: ${esc(a.contacts[0].split(': ')[1] || '')}</div>
        <div class="c-line">${ICONS.ig} Instagram: ${esc(a.contacts[1].split(': ')[1] || '')}</div>
      </div>
      <div class="qr-card">
        <div>
          <div class="qr-t">${esc(a.qrTitle)}</div>
          <div class="qr-n">${esc(a.qrNote)}</div>
        </div>
        <span class="qr-arrow">${ICONS.arrow}</span>
          <div class="qr-code" id="qr-box"></div>
      </div>
    </div>
  `);
}

/* ── 03: содержание ── */
function page03() {
  const parts = report.toc.parts.map(p => `
    <div class="toc-card">
      <div class="toc-left">
        <div class="toc-num">${esc(p.num)}</div>
        <span class="toc-bar"></span>
        <div class="toc-part-title">${esc(p.title)}</div>
      </div>
      <div class="toc-right">
        <p class="toc-desc">${esc(p.desc)}</p>
        <ul class="toc-list">
          ${p.pages.map(t => `<li><span class="toc-name">${esc(t)}</span><span class="toc-page">${report.pagesTitles.indexOf(t) + 1}</span></li>`).join('')}
        </ul>
      </div>
    </div>`).join('');
  return shell(report.pagesTitles[2], 'Содержание', `
    <p class="toc-intro"><b>${esc(report.toc.introBold)}</b> ${esc(report.toc.introRest)}</p>
    <p class="toc-intro2">${esc(report.toc.introSplit)}</p>
    <div class="toc">${parts}</div>
    <figure class="deco-photo"><img src="assets/berries.jpg" alt="Черника"></figure>
  `);
}

/* ── 04: ваши результаты ── */
function page04() {
  const w = report.weaknesses;
  return shell(report.pagesTitles[3], 'Анализ питания', `
    <p class="bar-lead">Анализ рациона показывает, какие питательные вещества поступают в избытке, а каких не хватает.</p>
    <div class="grid-2">
      <div class="panel green-panel">
        <div class="panel-head"><span class="ic-check">${ICONS.check}</span><span class="panel-title">Сильные стороны</span></div>
        <ul class="dots green-dots">${ul(report.strengths)}</ul>
        <figure class="panel-photo"><img src="assets/healthy.jpg" alt="Здоровое питание"></figure>
      </div>
      <div class="panel peach-panel">
        <div class="panel-head"><span class="ic-warn">${ICONS.warn}</span><span class="panel-title">Слабые стороны</span></div>
        <div class="sub-title">Основной рацион</div>
        <ul class="dots">${ul(w.main)}</ul>
        <div class="sub-title">Избытки</div>
        <ul class="dots">${ul(w.excess)}</ul>
        <div class="sub-title">Дефициты</div>
        <ul class="dots">${ul(w.deficits)}</ul>
        <figure class="panel-photo"><img src="assets/sweets.jpg" alt="Десерты"></figure>
      </div>
    </div>
  `);
}

/* ── 05: как питание влияет на ресурс ── */
function page05() {
  const meta = [
    { icon: 'flame',  cls: 'peach-panel' },
    { icon: 'scales', cls: 'green-panel' },
    { icon: 'pill',   cls: 'green-panel' }
  ];
  return shell(report.pagesTitles[4], 'Анализ питания', `
    <p class="plain-lead">Насколько рацион сбалансирован и как он влияет на ресурсный баланс организма.</p>
    <div class="grid-3">
      ${report.resourceCards.map((c, i) => `
        <div class="panel ${meta[i].cls} narrow">
          <div class="panel-head tight">
            <span class="ic-round ${meta[i].icon === 'flame' ? 'orange' : 'green'}">${ICONS[meta[i].icon]}</span>
            <span class="panel-title sm">${esc(c.title)}</span>
          </div>
          <p class="card-text">${esc(c.text)}</p>
        </div>`).join('')}
    </div>
    <div class="verdict">
      <span class="ic-alert big">${ICONS.alert}</span>
      <div class="verdict-body">
        <div class="verdict-cap">Общая оценка ресурсной базы</div>
        <div class="verdict-title">${esc(report.resourceVerdict.title)}</div>
        <p class="card-text">${esc(report.resourceVerdict.text)}</p>
      </div>
    </div>
  `);
}

/* ── страницы 06–15: каркасы ── */
function pairLayout(cards, cardHtml) {
  const rows = [];
  let buf = [];
  cards.forEach(d => {
    if (d.layout === "full") {
      if (buf.length) { rows.push(buf); buf = []; }
      rows.push([d]);
    } else { buf.push(d); if (buf.length === 2) { rows.push(buf); buf = []; } }
  });
  if (buf.length) rows.push(buf);
  return rows.map(r =>
    r.length === 1 && r[0].layout === "full" ? cardHtml(r[0])
      : `<div class="deficit-row">${r.map(cardHtml).join('')}</div>`).join('');
}

function page06() {
  const card = e => `
    <div class="card deficit ${e.layout || "half"}">
      <div class="deficit-head">
        <div class="deficit-name">${esc(e.name)}</div>
        <div class="badge ${e.level}">${EXC_LABELS[e.level] || e.level}</div>
      </div>
      <p class="card-text">${esc(e.text)}</p>
    </div>`;
  return shell(report.pagesTitles[5], 'Анализ питания', `
    <div class="deficit-grid">${pairLayout(report.excesses, card)}</div>
  `);
}

function page07() {
  const card = d => `
    <div class="card deficit ${d.layout || "half"}">
      <div class="deficit-head">
        <div class="deficit-name">${esc(d.name)}</div>
        <div class="badge ${d.level}">${DEF_LABELS[d.level] || d.level}</div>
      </div>
      <div class="deficit-what">${esc(d.what)}</div>
      <p class="card-text">${esc(d.text)}</p>
    </div>`;
  return shell(report.pagesTitles[6], 'План восстановления', `
    <p class="bar-lead">${esc(report.deficitsIntro)}</p>
    <div class="deficit-grid">${pairLayout(report.deficits, card)}</div>
  `);
}

function page08() {
  const steps = report.pagesTitles.filter(t => t.startsWith("Шаг "));
  return shell(report.pagesTitles[7], 'План восстановления', `
    <p class="plain-lead">${esc(report.plan.overview.lead)}</p>
    <div class="panel green-panel">
      <div class="panel-head"><span class="ic-check">${ICONS.check}</span><span class="panel-title">Последовательность работы</span></div>
      <ul class="dots green-dots">${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
    </div>
  `);
}

function pageItems(title, kicker, data) {
  const body = data.items && data.items.length
    ? `<div class="panel green-panel"><ul class="dots green-dots">${ul(data.items)}</ul></div>`
    : `<div class="placeholder">Блок в работе — текст придёт от автора.</div>`;
  return shell(title, kicker, `<p class="plain-lead">${esc(data.lead)}</p>${body}`);
}

function page11() {
  return shell(report.pagesTitles[10], 'План восстановления', `
    <p class="plain-lead">Анализы крови помогут проверить, как организм справляется с отклонениями в рационе.</p>
    <div class="analyses">
      ${report.analyses.map(a => `
        <div class="analysis">
          <div class="analysis-num">${a.n}</div>
          <div class="analysis-body">
            <div class="card-title green">${esc(a.title)}</div>
            <div class="analysis-what"><b>Что сдать:</b> ${esc(a.what)}</div>
            <p class="card-text">${esc(a.text)}</p>
          </div>
        </div>`).join('')}
    </div>
  `);
}

function page15() {
  const d = report.plan.next;
  return shell(report.pagesTitles[14], 'Практические шаги', `
    <p class="plain-lead">${esc(d.lead)}</p>
    ${d.text ? `<div class="panel green-panel"><p class="card-text">${esc(d.text)}</p></div>`
             : `<div class="placeholder">Блок в работе — текст придёт от автора.</div>`}
  `);
}

/* ── сборка: 15 страниц ── */
function render() {
  root.innerHTML = [
    page01(), page02(), page03(), page04(), page05(),
    page06(), page07(), page08(),
    pageItems(report.pagesTitles[8],  'План восстановления', report.plan.step1),
    pageItems(report.pagesTitles[9],  'План восстановления', report.plan.step2),
    page11(),
    pageItems(report.pagesTitles[11], 'План восстановления', report.plan.step4),
    pageItems(report.pagesTitles[12], 'Практические шаги',   report.plan.recommendations),
    pageItems(report.pagesTitles[13], 'Практические шаги',   report.plan.work),
    page15()
  ].join('');
  window.scrollTo({ top: 0 });
}
render();

/* QR-код локально, без внешних сервисов */
function renderQR(){
  const box = document.getElementById('qr-box');
  if (!box || typeof qrcode === 'undefined') return;
  const q = qrcode(0, 'M');
  q.addData('https://t.me/myfocus_club');
  q.make();
  box.innerHTML = q.createTableTag({ cellSize: 2, margin: 0 });
}
renderQR();


document.getElementById('btn-pdf').addEventListener('click', downloadPDF);
                             
