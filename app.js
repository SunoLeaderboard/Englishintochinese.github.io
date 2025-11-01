const $ = (sel, parent = document) => parent.querySelector(sel);
const resultsEl = $('#results');
const startBtn = $('#startBtn');
const regenBtn = $('#regenBtn');
const difficultyEl = $('#difficulty');
const themeEl = $('#theme');

function readTerms() {
  const t1 = { en: $('#en1').value.trim(), zh: $('#zh1').value.trim() };
  const t2 = { en: $('#en2').value.trim(), zh: $('#zh2').value.trim() };
  return [t1, t2].filter(t => t.en && t.zh);
}

function guessIsVerbPhrase(en) {
  const s = en.trim().toLowerCase();
  if (s.startsWith('to ')) return true;
  if (s.includes(' ')) return true; // multi-word → likely phrasal verb/phrase
  const particles = ['up','down','out','off','on','away','back','in','over','through'];
  if (particles.some(p => s.endsWith(' ' + p))) return true;
  const nounish = ['tion','sion','ment','ness','ity','ship','ance','ence','ism','ist'];
  if (nounish.some(suf => s.endsWith(suf))) return false;
  return s.endsWith('ing') ? false : true; // heuristic
}

const templates = {
  verb: [
    {
      cn: name => `${name}因為太忙，不得不【使用該片語】那個邀請。`,
      en: (term) => `He had to ${term} the invitation because he was too busy.`
    },
    {
      cn: () => `老師建議我們【使用該片語】問題，再做決定。`,
      en: (term) => `The teacher suggested that we ${term} the problem before making a decision.`
    },
    {
      cn: () => `為了安全起見，他們立刻【使用該片語】電源。`,
      en: (term) => `For safety, they immediately ${term} the power.`
    },
    {
      cn: () => `她最後還是選擇【使用該片語】那個提議。`,
      en: (term) => `In the end, she decided to ${term} the proposal.`
    }
  ],
  nounAdj: [
    {
      cn: () => `這個概念對完成報告很重要，請在答案中運用它的英文表達。`,
      en: (term) => `This concept is important for completing the report; please use ${term} in your answer.`
    },
    {
      cn: () => `面對困難時，我們需要更多「它」；請用對應的英文單字完成翻譯。`,
      en: (term) => `When facing difficulties, we need more ${term}.`
    },
    {
      cn: () => `班長提出的重點與此密切相關，請在英文翻譯中納入該關鍵字。`,
      en: (term) => `The class leader's key point is closely related; include ${term} in your translation.`
    },
    {
      cn: () => `這個主題經常出現在校內演講中，翻譯時記得使用正確的英文詞彙。`,
      en: (term) => `This topic often appears in school speeches, so remember to use the correct word: ${term}.`
    }
  ]
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function resolveTheme(t) {
  const themes = ['season','climate','interest','tech','ecology','sdg'];
  return t === 'random' ? pick(themes) : t;
}

// --- Helper: render a single card ---
function renderCard(term, chinese, english) {
  const card = document.createElement('div');
  card.className = 'card';

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `目標字詞：${term.en}（中文：${term.zh}）`;
  card.appendChild(meta);

  const cn = document.createElement('div');
  cn.className = 'cn';
  cn.textContent = chinese.replace('【使用該片語】', '（請在英文答案中使用此片語）');
  card.appendChild(cn);

  const controls = document.createElement('div');
  controls.className = 'controls';

  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = '顯示答案';
  const answer = document.createElement('div');
  answer.className = 'answer';
  answer.textContent = english;

  toggleBtn.addEventListener('click', () => {
    const visible = answer.style.display === 'block';
    answer.style.display = visible ? 'none' : 'block';
    toggleBtn.textContent = visible ? '顯示答案' : '隱藏答案';
  });

  controls.appendChild(toggleBtn);
  card.appendChild(controls);
  card.appendChild(answer);

  return card;
}

// --- Fallback local generator (also fixes 'open' naming) ---
function buildItem(term, avoidCn = new Set()) {
  const isVerb = guessIsVerbPhrase(term.en);
  const theme = resolveTheme(themeEl.value);
  const diff = difficultyEl.value;

  const openings = {
    easy: {
      season: ['在春天，','在炎夏，','在寒冬，'],
      climate: ['為了減少污染，','天氣變化快速，'],
      interest: ['在社團活動中，','放學後，'],
      tech: ['在科技課上，','使用新APP時，'],
      ecology: ['在生態營隊中，','保護動物時，'],
      sdg: ['為了達成永續目標，','支持公平與環保，']
    },
    medium: {
      season: ['隨著季節更迭，','在颳風下雨的時候，'],
      climate: ['面對氣候變遷，','為了降低碳排，'],
      interest: ['培養多元興趣時，','參與社團的過程中，'],
      tech: ['當我們導入新技術時，','在資料分析的專題中，'],
      ecology: ['進行生態保育時，','在校園綠化計畫中，'],
      sdg: ['落實聯合國永續發展目標時，','在關注社會公平與環境保護的計畫中，']
    },
    hard: {
      season: ['即便氣候條件不利，','在季節交替帶來挑戰的情況下，'],
      climate: ['為了長期減緩暖化，','在制定氣候行動策略時，'],
      interest: ['在跨領域學習與實作的框架下，','為了提升自我效能與社會參與，'],
      tech: ['在負責任使用科技與資料治理的前提下，','當我們評估技術對社會的影響時，'],
      ecology: ['為了維護生物多樣性與生態平衡，','在推動循環經濟與保育政策時，'],
      sdg: ['在衡量各項SDG指標並協調利害關係人的過程中，','以系統性思維整合環境、社會與治理時，']
    }
  };

  const verbTemplates = [
    { cn: (o)=>`${o}他決定${term.zh}那項計畫，以確保資源被善用。`,
      en: (t, o)=>`${o} he decided to ${t} the plan to ensure resources are used wisely.` },
    { cn: (o)=>`${o}我們需要先${term.zh}問題，再提出可行的方案。`,
      en: (t, o)=>`${o} we need to ${t} the problem before proposing a feasible solution.` },
    { cn: (o)=>`${o}學生被要求在截止日前${term.zh}不必要的支出。`,
      en: (t, o)=>`${o} students are asked to ${t} unnecessary spending before the deadline.` }
  ];

  const nounTemplates = [
    { cn: (o)=>`${o}社區推動${term.zh}教育，鼓勵大家參與志工服務。`,
      en: (t, o)=>`${o} the community promotes ${t} education and encourages volunteer service.` },
    { cn: (o)=>`${o}要完成專題，我們需要更多${term.zh}與合作。`,
      en: (t, o)=>`${o} to finish the project, we need more ${t} and cooperation.` },
    { cn: (o)=>`${o}校方強調${term.zh}的重要性，以提升整體表現。`,
      en: (t, o)=>`${o} the school emphasizes the importance of ${t} to improve overall performance.` }
  ];

  let chinese = '';
  let english = '';
  let attempts = 0;
  while (attempts < 10) {
    const openPool = openings[diff][resolveTheme(theme)];
    const openingText = pick(openPool);
    const tpl = guessIsVerbPhrase(term.en) ? pick(verbTemplates) : pick(nounTemplates);
    chinese = tpl.cn(openingText);
    if (!avoidCn.has(chinese)) {
      english = tpl.en(term.en, openingText);
      break;
    }
    attempts++;
  }

  return { card: renderCard(term, chinese, english), chinese };
}

// --- AI generator using websim.chat ---
async function generateWithAI(terms, difficulty, theme) {
  const resolvedTheme = resolveTheme(theme);
  const system = `Respond only with JSON following this schema and no other text:
{
  "items": [
    { "cn": string, "en": string }, // item for terms[0]
    { "cn": string, "en": string }  // item for terms[1]
  ]
}
Rules:
- Produce two different Chinese sentences (cn), each tailored to its corresponding target term and reasonable in context.
- Provide the hidden English answers (en) that correctly translate the cn and MUST explicitly use the target English term as given.
- No brackets or hints inside Chinese sentences; don't reveal the English term in cn.
- Align content to the selected theme and difficulty for high-school level.
- Themes: season, climate, interest, tech, ecology, sdg.
- Difficulty: easy, medium, hard; control sentence complexity and vocab accordingly.`;

  const user = `
Target terms (exact English and their Chinese meanings):
1) ${terms[0].en} — ${terms[0].zh}
2) ${terms[1].en} — ${terms[1].zh}

Theme: ${resolvedTheme}
Difficulty: ${difficulty}

Produce items[0] about term 1 and items[1] about term 2, distinct and applicable to each term. Ensure the English answers use the exact English term string (case preserved).`;

  const completion = await websim.chat.completions.create({
    messages: [
      { role: "system", content: system },
      { role: "user", content: [{ type: "text", text: user }] }
    ],
    json: true,
  });

  const data = JSON.parse(completion.content);
  if (!data || !Array.isArray(data.items) || data.items.length !== 2) {
    throw new Error('AI_JSON_INVALID');
  }
  // Basic validation: ensure target term is included in the English answers
  const ok0 = typeof data.items[0].en === 'string' && data.items[0].en.toLowerCase().includes(terms[0].en.toLowerCase());
  const ok1 = typeof data.items[1].en === 'string' && data.items[1].en.toLowerCase().includes(terms[1].en.toLowerCase());
  if (!ok0 || !ok1) throw new Error('AI_TERM_MISSING');
  return data.items;
}

// --- Main generate flow (AI first, fallback to local) ---
async function generate() {
  resultsEl.innerHTML = '';
  const terms = readTerms();
  if (terms.length !== 2) {
    resultsEl.innerHTML = `
      <div class="card">
        <div class="meta">請完整輸入兩組：「英文單字/片語」與「中文翻譯」。</div>
      </div>`;
    regenBtn.disabled = true;
    return;
  }

  // Loading UI
  startBtn.disabled = true;
  regenBtn.disabled = true;
  const loadingCard = document.createElement('div');
  loadingCard.className = 'card';
  loadingCard.innerHTML = `<div class="meta">AI 正在產生題目與答案，請稍候…</div>`;
  resultsEl.appendChild(loadingCard);

  try {
    const items = await generateWithAI(terms, difficultyEl.value, themeEl.value);
    resultsEl.innerHTML = '';
    const firstCard = renderCard(terms[0], items[0].cn, items[0].en);
    const secondCard = renderCard(terms[1], items[1].cn, items[1].en);
    resultsEl.appendChild(firstCard);
    resultsEl.appendChild(secondCard);
  } catch (e) {
    // Fallback to local templates
    resultsEl.innerHTML = '';
    const first = buildItem(terms[0]);
    resultsEl.appendChild(first.card);
    const second = buildItem(terms[1], new Set([first.chinese]));
    resultsEl.appendChild(second.card);

    const note = document.createElement('div');
    note.className = 'card';
    note.innerHTML = `<div class="meta">AI現在正在睡覺 請稍後再使用</div>`;
    resultsEl.appendChild(note);
    console.warn('AI generation failed, fallback used:', e);
  } finally {
    startBtn.disabled = false;
    regenBtn.disabled = false;
  }
}

startBtn.addEventListener('click', () => { generate(); });
regenBtn.addEventListener('click', () => { generate(); });