const LS_KEY = "deficit-map-data-v2";
const $ = id => document.getElementById(id);
const escAttr = s => String(s).replace(/"/g, "&quot;");
const escVal  = s => String(s).replace(/</g, "&lt;");

/* ── динамические строки ── */
function analysisRow(a = {}) {
  return `
  <div class="dyn-row">
    <div class="dyn-grid">
      <label>Заголовок <input class="a-title" value="${escAttr(a.title || "")}"></label>
      <label>Что сдать <input class="a-what" value="${escAttr(a.what || "")}"></label>
    </div>
    <label>Описание
      <textarea class="a-text" rows="2">${escVal(a.text || "")}</textarea></label>
    <button type="button" class="del-btn" onclick="this.parentNode.remove()">Удалить</button>
  </div>`;
}

function deficitRow(d = {}) {
  return `
  <div class="dyn-row">
    <div class="dyn-grid">
      <label>Название <input class="d-name" value="${escAttr(d.name || "")}"></label>
      <label>Уровень
        <select class="d-level">
          <option value="insufficient" ${d.level === "insufficient" ? "selected" : ""}>Недостаточно</option>
          <option value="significant" ${d.level === "significant" ? "selected" : ""}>Значительно снижен</option>
          <option value="severe" ${d.level === "severe" ? "selected" : ""}>Выраженный недостаток</option>
        </select></label>
    </div>
    <label>Короткая строка (под бейджем)
      <input class="d-what" value="${escAttr(d.what || "")}"></label>
    <label>Описание карточки
      <textarea class="d-text" rows="2">${escVal(d.text || "")}</textarea></label>
    <button type="button" class="del-btn" onclick="this.parentNode.remove()">Удалить</button>
  </div>`;
}

function excessRow(e = {}) {
  return `
  <div class="dyn-row">
    <div class="dyn-grid">
      <label>Название <input class="e-name" value="${escAttr(e.name || "")}"></label>
      <label>Уровень
        <select class="e-level">
          <option value="elevated" ${e.level === "elevated" ? "selected" : ""}>Повышено</option>
          <option value="high" ${e.level === "high" ? "selected" : ""}>Значительно повышены</option>
          <option value="severe" ${e.level === "severe" ? "selected" : ""}>Выраженный избыток</option>
        </select></label>
    </div>
    <label>Описание карточки
      <textarea class="e-text" rows="2">${escVal(e.text || "")}</textarea></label>
    <button type="button" class="del-btn" onclick="this.parentNode.remove()">Удалить</button>
  </div>`;
}

function resourceRow(r = {}) {
  return `
  <div class="dyn-row">
    <label>Заголовок <input class="r-title" value="${escAttr(r.title || "")}"></label>
    <label>Текст <textarea class="r-text" rows="2">${escVal(r.text || "")}</textarea></label>
  </div>`;
}

/* ── заполнение формы ── */
function fillForm(d) {
  $("f-name").value   = d.client.name;
  $("f-age").value    = d.client.age;
  $("f-height").value = d.client.height;
  $("f-weight").value = d.client.weight;
  $("f-imt").value    = d.client.imt;
  $("f-strengths").value = d.strengths.join("\n");
  $("f-w-main").value    = d.weaknesses.main.join("\n");
  $("f-w-excess").value  = d.weaknesses.excess.join("\n");
  $("f-w-def").value     = d.weaknesses.deficits.join("\n");
  $("f-resources").innerHTML = d.resourceCards.map(resourceRow).join("");
  $("f-verdict-title").value = d.resourceVerdict.title;
  $("f-verdict-text").value  = d.resourceVerdict.text;
  $("f-excesses").innerHTML  = d.excesses.map(excessRow).join("");
  $("f-def-intro").value     = d.deficitsIntro;
  $("f-deficits").innerHTML  = d.deficits.map(deficitRow).join("");
  $("f-analyses").innerHTML  = d.analyses.map(analysisRow).join("");
  $("f-plan-lead").value = d.plan.overview.lead;
  $("f-plan-text").value = d.plan.overview.text;
  $("f-step1-lead").value = d.plan.step1.lead;  $("f-step1").value = d.plan.step1.items.join("\n");
  $("f-step2-lead").value = d.plan.step2.lead;  $("f-step2").value = d.plan.step2.items.join("\n");
  $("f-step4-lead").value = d.plan.step4.lead;  $("f-step4").value = d.plan.step4.items.join("\n");
  $("f-rec-lead").value  = d.plan.recommendations.lead; $("f-rec").value  = d.plan.recommendations.items.join("\n");
  $("f-work-lead").value = d.plan.work.lead;            $("f-work").value = d.plan.work.items.join("\n");
  $("f-next-lead").value = d.plan.next.lead;            $("f-next").value = d.plan.next.text;
}

/* ── сборка данных из формы ── */
function collect() {
  const lines = t => t.value.split("\n").map(s => s.trim()).filter(Boolean);
  return {
    client: {
      name: $("f-name").value.trim(), age: $("f-age").value.trim(),
      height: $("f-height").value.trim(), weight: $("f-weight").value.trim(),
      imt: $("f-imt").value.trim()
    },
    strengths: lines($("f-strengths")),
    weaknesses: {
      main: lines($("f-w-main")),
      excess: lines($("f-w-excess")),
      deficits: lines($("f-w-def"))
    },
    resourceCards: [...document.querySelectorAll("#f-resources .dyn-row")].map(r => ({
      title: r.querySelector(".r-title").value.trim(),
      text: r.querySelector(".r-text").value.trim()
    })).filter(c => c.title || c.text),
    resourceVerdict: {
      title: $("f-verdict-title").value.trim(),
      text: $("f-verdict-text").value.trim()
    },
    excesses: [...document.querySelectorAll("#f-excesses .dyn-row")].map(r => ({
      name: r.querySelector(".e-name").value.trim(),
      level: r.querySelector(".e-level").value,
      layout: "half",
      text: r.querySelector(".e-text").value.trim()
    })).filter(e => e.name),
    deficitsIntro: $("f-def-intro").value.trim(),
    deficits: [...document.querySelectorAll("#f-deficits .dyn-row")].map(r => ({
      name: r.querySelector(".d-name").value.trim(),
      level: r.querySelector(".d-level").value,
      layout: "half",
      what: r.querySelector(".d-what").value.trim(),
      text: r.querySelector(".d-text").value.trim()
    })).filter(d => d.name),
    analyses: [...document.querySelectorAll("#f-analyses .dyn-row")].map((r, i) => ({
      n: i + 1,
      title: r.querySelector(".a-title").value.trim(),
      what: r.querySelector(".a-what").value.trim(),
      text: r.querySelector(".a-text").value.trim()
    })).filter(a => a.title),
    plan: {
      overview: { lead: $("f-plan-lead").value.trim(), text: $("f-plan-text").value.trim() },
      step1: { lead: $("f-step1-lead").value.trim(), items: lines($("f-step1")) },
      step2: { lead: $("f-step2-lead").value.trim(), items: lines($("f-step2")) },
      step4: { lead: $("f-step4-lead").value.trim(), items: lines($("f-step4")) },
      recommendations: { lead: $("f-rec-lead").value.trim(), items: lines($("f-rec")) },
      work:  { lead: $("f-work-lead").value.trim(),  items: lines($("f-work")) },
      next:  { lead: $("f-next-lead").value.trim(),  text: $("f-next").value.trim() }
    }
  };
}

/* ── события ── */
$("btn-editor").addEventListener("click", () => {
  const ed = $("editor");
  ed.style.display = ed.style.display === "none" ? "block" : "none";
  if (ed.style.display === "block") window.scrollTo({ top: 0, behavior: "smooth" });
});

$("btn-apply").addEventListener("click", () => {
  const data = collect();
  Object.assign(report, data);
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  render();
  $("editor").style.display = "none";
});

$("btn-reset").addEventListener("click", () => {
  localStorage.removeItem(LS_KEY);
  Object.assign(report, JSON.parse(JSON.stringify(baseData)));
  fillForm(baseData);
  render();
});

document.querySelectorAll(".add-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const box = { analyses: $("f-analyses"), deficits: $("f-deficits"), excesses: $("f-excesses") }[btn.dataset.add];
    box.insertAdjacentHTML("beforeend",
      btn.dataset.add === "analyses" ? analysisRow() :
      btn.dataset.add === "deficits" ? deficitRow() : excessRow());
  });
});

/* ── старт: сохранённые данные или демо ── */
const baseData = JSON.parse(JSON.stringify({
  client: report.client,
  strengths: report.strengths,
  weaknesses: report.weaknesses,
  resourceCards: report.resourceCards,
  resourceVerdict: report.resourceVerdict,
  excesses: report.excesses,
  deficitsIntro: report.deficitsIntro,
  deficits: report.deficits,
  analyses: report.analyses,
  plan: report.plan
}));

const saved = localStorage.getItem(LS_KEY);
if (saved) {
  try {
    const d = JSON.parse(saved);
    const merged = {
      ...baseData, ...d,
      client: { ...baseData.client, ...(d.client || {}) },
      weaknesses: { ...baseData.weaknesses, ...(d.weaknesses || {}) },
      plan: { ...baseData.plan, ...(d.plan || {}) }
    };
    Object.assign(report, merged);
    fillForm(merged);
    render();
  } catch { fillForm(baseData); }
} else {
  fillForm(baseData);
}
