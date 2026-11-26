
// Phase 11: answer feedback timing and screen transitions.

const BASE = 'https://raw.githubusercontent.com/b1bunKsu/QuizQuestions/main/questions/';

const gameExtension = globalThis.QuizGameExtension ?? {};

const app = document.querySelector('#app');
const stage = document.querySelector('#stage');

// ============================================================
// ランク共通設定
// ============================================================



const state = {
  name: 'PLAYER',
  questions: [],
  index: 0,
  score: 0,
  correct: 0,
  remaining: 20,
  deadline: 0,
  timer: null,
  locked: false,
  mode: 'STANDARD',
  history: [],
  advanceTimer: null,
  feedbackTimer: null,
  scoreAnimation: null,
  lives: 5,
  streak: 0,
  questionPool: [],
  qwerty: false,
  masterVolume: 1,
  bgmVolume: 0.5,
  seVolume: 0.5,
  lastCountdownSecond: null,
  inputEnabled: false
};

const timerManager = new TimerManager(state, {
  onUpdate: (remaining, limit) => new QuestionView(app).updateTimer(remaining, limit),
  onCountdown: () => SoundManager.playSe('countdown'),
  onTimeout: () => answer(null)
});

// 既存モードクラスとの互換用
function rank(score) { return ScoreManager.rank(score); }
function rankDisplayName(score) { return ScoreManager.rankDisplayName(score); }
function nextRankTarget(score) { return ScoreManager.nextRankTarget(score); }
function animateScore(el, from, to) { ScoreManager.animateScore(state, el, from, to); }

function updateModeBackground() {
  const background = GameModeManager.current.background;

  document.documentElement.style.setProperty(
    '--game-background',
    `url("${background}")`
  );
}

function setQuestionInputEnabled(enabled) {
  state.inputEnabled = enabled;

  const ui = app.querySelector('#question-ui');

  if (ui) {
    ui.style.pointerEvents = enabled ? 'auto' : 'none';
  }
}

// 出題アニメーション中は物理キーボード入力を遮断
document.addEventListener('keydown', event => {
  if (!app.querySelector('.quiz-shell')) return;
  if (state.inputEnabled) return;

  event.stopImmediatePropagation();
}, true);

// マウスやタッチ操作も遮断
for (const type of ['pointerdown', 'click']) {
  document.addEventListener(type, event => {
    if (state.inputEnabled) return;

    const ui = app.querySelector('#question-ui');
    if (!ui || !ui.contains(event.target)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
}


// 1280×720のゲーム画面を、スマホ横画面を含む表示領域内に収める。
// visualViewportでモバイルブラウザのアドレスバー変化にも追従する。
const rotateNotice = document.querySelector('#rotate-notice');
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

function resize() {
  const viewport = window.visualViewport;
  const frame = document.querySelector('#game-frame');
  const width = frame ? frame.clientWidth : (viewport ? viewport.width : window.innerWidth);
  const height = frame ? frame.clientHeight : (viewport ? viewport.height : window.innerHeight);
  const offsetLeft = frame ? 0 : (viewport ? viewport.offsetLeft : 0);
  const offsetTop = frame ? 0 : (viewport ? viewport.offsetTop : 0);

  const scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
  stage.style.transform = `scale(${scale})`;
  // PC・スマホともにゲーム画面を中央配置
  stage.style.left = `${offsetLeft + (width - GAME_WIDTH * scale) / 2}px`;

  // 縦方向は中央配置を維持
  stage.style.top = `${offsetTop + (height - GAME_HEIGHT * scale) / 2}px`;

  // タッチ主体の小型端末だけ縦向き案内を表示。PCの縦長ウィンドウは対象外。
  // 縦画面でもゲームを表示する
  if (rotateNotice) {
    rotateNotice.hidden = true;
  }

  stage.style.visibility = 'visible';
}

addEventListener('resize', resize);
addEventListener('orientationchange', resize);
document.addEventListener('fullscreenchange', resize);
const gameFrame = document.querySelector('#game-frame');
if (gameFrame && typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(resize).observe(gameFrame);
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resize);
  window.visualViewport.addEventListener('scroll', resize);
}
resize();

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

const button = (label, action, extra = '') =>
  `<button class="btn ${extra}" data-action="${action}">${esc(label)}</button>`;

function bind(actions) {
  app.querySelectorAll('[data-action]').forEach(el =>
    el.addEventListener('click', () => actions[el.dataset.action]?.(el))
  );
}

const FILES = [
  'choices.json',
  'ox.json',
  'multiple_choice.json',
  'one_way.json',
  'number.json',
  'kana.json',
  'katakana.json',
  'character_panel.json',
  'slot.json',
  'group.json',
  'order.json',
  'rearrangement.json',
  'line_matching.json',
  'rensou.json',
  'effect.json',
  'polyhedron.json',
  'image_touch.json'
];


function readSettings() {
  try {
    const x = JSON.parse(
      localStorage.getItem('quizgame_web_settings') || '{}'
    );

    state.qwerty = Boolean(x.qwerty);
    state.masterVolume = Number.isFinite(x.masterVolume)
      ? Math.max(0, Math.min(1, x.masterVolume)) : 1;
    state.bgmVolume = Number.isFinite(x.bgmVolume)
      ? x.bgmVolume
      : 0.5;
    state.seVolume = Number.isFinite(x.seVolume)
      ? x.seVolume
      : 0.5;

  } catch (e) {
    console.warn(e);
  }
}

function saveSettings() {
  try {
    localStorage.setItem(
      'quizgame_web_settings',
      JSON.stringify({
        qwerty: state.qwerty,
        masterVolume: state.masterVolume,
        bgmVolume: state.bgmVolume,
        seVolume: state.seVolume
      })
    );
  } catch (e) {
    console.warn(e);
  }
}

function title(message = '') {

  SoundManager.playBgm('TITLE');
  clearTimer();

  // ========================================
  // スタンダードモードの自己ベスト取得
  // ========================================

  let bestScore = 0;

  try {
    bestScore = Number(
      localStorage.getItem('quizgame_web_best_STANDARD')
    ) || 0;
  } catch (e) {
    console.warn(e);
  }

  if (state.activeQuestion) {
    state.activeQuestion.dispose();
    state.activeQuestion = null;
  }

  if (state.typingKeyHandler) {
    document.removeEventListener('keydown', state.typingKeyHandler);
    state.typingKeyHandler = null;
  }

  const view = new TitleView(app, button, esc);
  view.render({ name: state.name, bestScore, message });
  gameExtension.onTitle?.();
  view.bind({
    onStart: startFromTitle,
    onTutorial: name => { state.name = name; TutorialManager.menu(); },
    onSettings: name => {
      state.name = name;
      settings();
    }
  });
}


const QUIZ_INTRO_DURATION = 3000;
const QUIZ_WHITE_FADE_DURATION = 1000;





async function startFromTitle(mode) {

  SoundManager.init();
  SoundManager.stopBgm();

  state.name =
    document.querySelector('#name').value.trim() || 'PLAYER';

  state.mode = mode;

  // 連打防止
  app.querySelectorAll('button').forEach(btn => {
    btn.disabled = true;
  });

  // 白フェード用レイヤー
  const fade = document.createElement('div');
  fade.className = 'quiz-white-fade';
  stage.appendChild(fade);

  // 1回目：タイトル画面 → 完全な白画面
  const fadeOut = fade.animate(
    [
      { opacity: 0 },
      { opacity: 1 }
    ],
    {
      duration: QUIZ_WHITE_FADE_DURATION,
      easing: 'ease-in-out',
      fill: 'forwards'
    }
  );

  await fadeOut.finished;

  // 完全に白くなった状態を固定
  fade.style.opacity = '1';
  fadeOut.cancel();

  // ★ 画面が完全に白くなった瞬間に背景を切り替える
  updateModeBackground();

  // イントロ画面へ切り替え
  showQuizIntro(mode);

  // 2回目：白画面 → イントロ画面
  const fadeIn = fade.animate(
    [
      { opacity: 1 },
      { opacity: 0 }
    ],
    {
      duration: QUIZ_WHITE_FADE_DURATION,
      easing: 'ease-in-out',
      fill: 'forwards'
    }
  );

  await fadeIn.finished;

  // 白いレイヤーを削除
  fade.remove();

  // ★ 2回目のフェード完了直後にクイズBGMを再生！
  SoundManager.playBgm(mode);
}



function showQuizIntro(mode) {
  const modeName = GameModeManager.get(mode).name;

  app.innerHTML = `
        <div class="quiz-intro-screen">
            <div class="quiz-intro-box">
                <div class="quiz-intro-mode">
                    ${esc(modeName)}
                </div>
            </div>
        </div>
    `;

  // イントロ表示中に問題を読み込む
  loadAndStart(true);
}


function settings() {
  clearTimer();
  new SettingsView(app, button).render(state, {
    onMaster: value => {
      state.masterVolume = value;
      SoundManager.setMasterVolume(value);
      saveSettings();
    },
    onBgm: value => {
      state.bgmVolume = value;
      SoundManager.setBgmVolume(value);
      saveSettings();
    },
    onSe: value => {
      state.seVolume = value;
      SoundManager.setSeVolume(value);
      saveSettings();
    },
    onQwerty: value => {
      state.qwerty = value;
      saveSettings();
    },
    onBack: () => title()
  });
}

function loading() {
  new LoadingView(app).renderQuestions();
}

// ============================================================
// 問題JSONの読み込み・正規化・バリデーション
// ============================================================

async function loadSupportedQuestions() {

  const sets = await Promise.all(
    FILES.map(async f => {

      const r = await fetch(BASE + f, {
        cache: 'no-store'
      });

      if (!r.ok) {
        throw Error(`${f}: HTTP ${r.status}`);
      }

      const data = await r.json();

      if (!Array.isArray(data)) {
        throw Error(`${f}: 配列ではありません`);
      }

      return data;

    })
  );

  const supported = sets.flat()

    // ========================================
    // 問題形式・解答データの正規化
    // ========================================

    .map(q => {

      if (!q) return q;

      const type = q.type === 'CUBE'
        ? 'POLYHEDRON'
        : q.type === 'MULTI_CHOICE'
          ? 'MULTIPLE_CHOICE'
          : q.type;

      const answers =
        type === 'MULTIPLE_CHOICE' ||
          ['NUMBER', 'KANA', 'KATAKANA', 'EFFECT', 'POLYHEDRON'].includes(type)
          ? (
            Array.isArray(q.answers) && q.answers.length
              ? q.answers
              : Array.isArray(q.answer)
                ? q.answer
                : typeof q.answer === 'string'
                  ? [q.answer]
                  : []
          )
          : q.answers;

      return {
        ...q,
        type,
        answers,
        imagePath: q.imagePath ?? q.image
      };

    })

    // ========================================
    // 出題可能な問題のみ抽出
    // ========================================

    .filter(q =>
      q && (

        (q.type === 'CHOICE' &&
          Array.isArray(q.choices) &&
          q.choices.length >= 2) ||

        (q.type === 'OX' &&
          ['O', 'X'].includes(String(q.answer).toUpperCase())) ||

        (q.type === 'MULTIPLE_CHOICE' &&
          Array.isArray(q.answers) &&
          q.answers.length >= 1 &&
          q.answers.length <= 5 &&
          Array.isArray(q.choices)) ||

        (q.type === 'ONE_WAY' &&
          Array.isArray(q.choices) &&
          q.choices.length >= 2) ||

        validCharacter(q) ||
        validSlot(q) ||
        validGroup(q) ||
        validOrdering(q) ||
        validRearrangement(q) ||
        validLineMatching(q) ||
        validRensou(q) ||
        validEffect(q) ||
        validPolyhedron(q) ||
        validImageTouch(q) ||

        (
          ['NUMBER', 'KANA', 'KATAKANA'].includes(q.type) &&
          Array.isArray(q.answers) &&
          q.answers.length > 0 &&
          q.answers.every(a =>
            typeof a === 'string' && a.length > 0
          )
        )

      )
    );

  return supported;

}

async function loadAndStart(fromIntro = false) {

  const introStart = performance.now();

  // イントロ経由の場合はBGMを停止しない
  if (!fromIntro) {
    SoundManager.stopBgm();
    loading();
  }

  try {

    // ========================================
    // 共通関数から問題を取得
    // ========================================

    const supported = await loadSupportedQuestions();

    // ========================================
    // ゲームモードごとの問題抽出
    // ========================================

    const custom = gameExtension.prepareQuestions?.(supported);
    if (custom) {
      state.questionPool = custom.questions;
      state.questions = custom.questions;
      state.index = custom.index;
    } else {
      GameModeManager.current.prepareQuestions(supported);
    }

    // ========================================
    // ゲーム状態の初期化
    // ========================================

    state.score = 0;
    state.correct = 0;
    state.history = [];
    GameModeManager.current.reset();

    // ========================================
    // イントロ画面の表示時間を確保
    // ========================================

    if (fromIntro) {

      const elapsed = performance.now() - introStart;

      const remaining = Math.max(
        0,
        QUIZ_INTRO_DURATION - elapsed
      );

      if (remaining > 0) {

        await new Promise(resolve => {
          setTimeout(resolve, remaining);
        });

      }

    }

    // イントロ経由の場合は既にBGMが再生されている
    if (!fromIntro) {
      SoundManager.playBgm(state.mode);
    }

    // ========================================
    // 出題開始
    // ========================================

    showQuestion();

  } catch (e) {

    console.error(e);

    if (!gameExtension.onLoadError?.(e)) {
      title('問題の読み込みに失敗しました。ネット接続とGitHubのJSON公開状態を確認してください。詳細: ' + e.message);
    }

  }

}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clearHintTimers() {
  if (state.hintTimers) {
    state.hintTimers.forEach(clearTimeout);
    state.hintTimers = [];
  }
}

function clearTimer() {
  if (state.feedbackTimer !== null) {
    clearTimeout(state.feedbackTimer);
    state.feedbackTimer = null;
  }

  if (state.scoreAnimation !== null) {
    cancelAnimationFrame(state.scoreAnimation);
    state.scoreAnimation = null;
  }

  clearHintTimers();

  if (state.visualCleanup) {
    state.visualCleanup();
    state.visualCleanup = null;
  }

  timerManager.stop();

  if (state.advanceTimer !== null) {
    clearTimeout(state.advanceTimer);
    state.advanceTimer = null;
  }

  // 問題文ワイプを停止
  if (state.questionWipeCleanup) {
    state.questionWipeCleanup();
    state.questionWipeCleanup = null;
  }
}



function progressMarkup() {
  return Array.from(
    { length: state.questions.length },
    (_, i) => {
      const h = state.history[i];

      return `
        <span class="progress-mark ${!h ? 'pending' : h.correct ? 'correct' : 'incorrect'
        }">
          ${!h ? '・' : h.correct ? '○' : '×'}
        </span>
      `;
    }
  ).join('');
}

// ========================================
// 問題文ワイプ設定
// ========================================

const QUESTION_WIPE = {
  maxWidth: 640,
  font: 'bold 25px "Noto JP", sans-serif',
  msPerPixel: 2,
  waitMs: 1000,
  pageWaitMs: 1000,
  pageFadeMs: 500,
  specialFadeMs: 1000,
  specialOpacity: 0.5,
  lineHeight: 1.45
};

// ========================================
// 問題文を非表示にする
// ========================================


function hideQuestionText() {

  // ========================================
  // 問題文ワイプを停止
  // ========================================

  if (state.questionWipeCleanup) {
    state.questionWipeCleanup();
    state.questionWipeCleanup = null;
  }

  new QuestionView(app).hideText();
}


// ========================================
// 問題文ワイプ
// ========================================

function startQuestionWipe() {

  const wipeSpeed = GameModeManager.current.wipeSpeed;

  const question = app.querySelector(
    '.quiz-shell .question-center .question'
  );

  if (!question) return;

  // ========================================
  // ワイプ開始と同時に操作受付開始
  // ========================================

  setQuestionInputEnabled(true);


  const q = state.questions[state.index];

  // 前回のアニメーションを停止
  if (state.questionWipeCleanup) {
    state.questionWipeCleanup();
    state.questionWipeCleanup = null;
  }

  const source = String(q.question ?? '');

  // JavaFX版と同様に制御文字を解釈
  const pages = source.split('\\c');

  const measureCanvas = document.createElement('canvas');
  const ctx = measureCanvas.getContext('2d');

  ctx.font = QUESTION_WIPE.font;

  const textWidth = text => ctx.measureText(text).width;

  // 既存のCSSアニメーションがあれば無効化
  question.classList.remove('question-wipe-active');

  question.style.animation = 'none';
  question.style.clipPath = 'none';
  question.style.opacity = '1';

  question.replaceChildren();

  question.classList.add('question-wipe-container');

  let cancelled = false;
  let activeAnimation = null;
  let pendingTimeout = null;

  const sleep = ms => new Promise(resolve => {

    if (cancelled) {
      resolve();
      return;
    }

    pendingTimeout = setTimeout(() => {
      pendingTimeout = null;
      resolve();
    }, ms / wipeSpeed);
  });


  function animate(element, keyframes, duration) {

    if (cancelled) return Promise.resolve();

    const animation = element.animate(keyframes, {
      duration: Math.max(0, duration / wipeSpeed),
      easing: 'linear',
      fill: 'forwards'
    });

    activeAnimation = animation;

    return animation.finished
      .then(() => {

        if (cancelled) return;

        // 最終フレームのスタイルを通常のCSSに反映
        const lastFrame = keyframes[keyframes.length - 1];

        for (const [property, value] of Object.entries(lastFrame)) {
          if (property !== 'offset' && property !== 'easing') {
            element.style[property] = value;
          }
        }

        // アニメーションを残さず終了
        animation.cancel();

      })
      .catch(() => { })
      .finally(() => {

        if (activeAnimation === animation) {
          activeAnimation = null;
        }

      });
  }


  // ========================================
  // ページを行と待機位置に分解
  // ========================================

  function parsePage(page) {

    const lines = [{ text: '', waits: [] }];

    let current = lines[0];

    // \n（文字列）と実際の改行を統一
    const normalized = page
      .replace(/\\n/g, '\n')
      .replace(/\r\n?/g, '\n');

    const tokens = normalized.split(/(\\w|\n)/);

    for (const token of tokens) {

      if (token === '\\w') {

        current.waits.push(current.text.length);
        continue;
      }

      if (token === '\n') {

        current = { text: '', waits: [] };
        lines.push(current);
        continue;
      }

      // 結合文字や絵文字を途中で分割しない
      const characters =
        typeof Intl.Segmenter === 'function'
          ? Array.from(
            new Intl.Segmenter('ja', {
              granularity: 'grapheme'
            }).segment(token),
            item => item.segment
          )
          : Array.from(token);

      for (const char of characters) {

        const candidate = current.text + char;

        if (
          current.text.length > 0 &&
          textWidth(candidate) > QUESTION_WIPE.maxWidth - 10
        ) {

          current = { text: '', waits: [] };
          lines.push(current);
        }

        current.text += char;
      }
    }

    return lines;
  }

  // ========================================
  // 1行のワイプ
  // ========================================

  async function wipeLine(lineData, element) {

    const fullText = lineData.text;
    const fullWidth = textWidth(fullText);

    const positions = lineData.waits;

    let previousPosition = 0;

    // ワイプ開始前は完全に非表示
    element.style.clipPath = 'inset(0 100% 0 0)';

    // 以下、既存処理

    for (const position of positions) {

      if (cancelled) return;

      if (position > previousPosition) {

        const fromWidth = textWidth(
          fullText.slice(0, previousPosition)
        );

        const toWidth = textWidth(
          fullText.slice(0, position)
        );

        await animate(element, [
          {
            clipPath:
              `inset(0 ${Math.max(0, fullWidth - fromWidth)}px 0 0)`
          },
          {
            clipPath:
              `inset(0 ${Math.max(0, fullWidth - toWidth)}px 0 0)`
          }
        ], (toWidth - fromWidth) * QUESTION_WIPE.msPerPixel);

      }

      if (cancelled) return;

      // \w：1秒停止
      await sleep(QUESTION_WIPE.waitMs);

      previousPosition = position;
    }

    if (cancelled) return;

    const fromWidth = textWidth(
      fullText.slice(0, previousPosition)
    );

    await animate(element, [
      {
        clipPath:
          `inset(0 ${Math.max(0, fullWidth - fromWidth)}px 0 0)`
      },
      {
        clipPath: 'inset(0 0px 0 0)'
      }
    ], (fullWidth - fromWidth) * QUESTION_WIPE.msPerPixel);

    if (!cancelled) {
      element.style.clipPath = 'none';
    }
  }

  // ========================================
  // ページ表示
  // ========================================

  async function showPage(page) {

    const lines = parsePage(page);

    const pageWidth = Math.max(
      1,
      ...lines.map(line => textWidth(line.text) + 10)
    );

    question.innerHTML = '';
    question.style.opacity = '1';

    const pageElement = document.createElement('div');

    pageElement.className = 'question-wipe-page';
    pageElement.style.width = `${pageWidth}px`;

    question.append(pageElement);

    const elements = [];

    for (const line of lines) {

      const row = document.createElement('div');

      row.className = 'question-wipe-line';
      row.textContent = line.text || '\u00a0';
      row.style.clipPath = 'inset(0 100% 0 0)';

      pageElement.append(row);
      elements.push(row);
    }

    // 行ごとに順番に表示
    for (let i = 0; i < lines.length; i++) {

      if (cancelled) return;

      await wipeLine(lines[i], elements[i]);
    }
  }

  // ========================================
  // アニメーション本体
  // ========================================

  async function run() {

    for (let i = 0; i < pages.length; i++) {

      if (cancelled) return;

      await showPage(pages[i]);

      if (cancelled) return;

      // 最終ページ以外はページチェンジ
      if (i < pages.length - 1) {

        await sleep(QUESTION_WIPE.pageWaitMs);

        if (cancelled) return;

        await animate(question, [
          { opacity: 1 },
          { opacity: 0 }
        ], QUESTION_WIPE.pageFadeMs);

        if (cancelled) return;
      }
    }

    if (cancelled) return;


    // EFFECT / POLYHEDRON限定
    // 問題文を表示し終えたら半透明にする
    if (['EFFECT', 'POLYHEDRON'].includes(q.type)) {

      await animate(question, [
        { opacity: 1 },
        { opacity: QUESTION_WIPE.specialOpacity }
      ], QUESTION_WIPE.specialFadeMs);

    }

  }


  // ========================================
  // 終了処理
  // ========================================

  state.questionWipeCleanup = () => {

    cancelled = true;

    if (pendingTimeout !== null) {
      clearTimeout(pendingTimeout);
      pendingTimeout = null;
    }

    if (activeAnimation) {
      activeAnimation.cancel();
      activeAnimation = null;
    }
  };

  run().catch(console.error);
}

const correctRateManager = new CorrectRateManager();

function loadNationalRate(q) {
  return correctRateManager.load(q, () => state.locked);
}

function finalizeNationalRate(q, correct, timeout) {
  const frozenRate = correctRateManager.freeze();
  const rateValue = app.querySelector('#national-rate')?.querySelector('.national-rate-value');
  if (rateValue) rateValue.textContent = frozenRate === null ? '-' : String(frozenRate);
  if (!gameExtension.isPractice?.()) correctRateManager.submit(q, correct, timeout);
}

function showQuestion() {

  // ========================================
  // 最終問題の出題開始SE
  // ========================================

  if (
    !TutorialManager.active && !gameExtension.isPractice?.() &&
    GameModeManager.current.isFinalQuestion()
  ) {
    SoundManager.playSe('final');
  }

  clearTimer();

  if (state.activeQuestion) {
    state.activeQuestion.dispose();
    state.activeQuestion = null;
  }

  if (state.typingKeyHandler) {
    document.removeEventListener('keydown', state.typingKeyHandler);
    state.typingKeyHandler = null;
  }

  state.locked = false;

  // 新しい問題の出題中は入力禁止
  state.inputEnabled = false;
  const q = state.questions[state.index];

  if (!q) {
    result();
    return;
  }

  if (!TutorialManager.active) void loadNationalRate(q);

  const limit = GameModeManager.current.timeLimit;

  timerManager.reset(limit);

  const view = new QuestionView(app);
  view.render({
    type: q.type, limit,
    rankCaption: gameExtension.rankCaption?.() ?? GameModeManager.current.rankCaption(),
    rankClass: GameModeManager.current.rankClass,
    rankTarget: gameExtension.rankTarget?.(q, true) ?? GameModeManager.current.rankTarget(),
    questionCaption: GameModeManager.current.questionCaption(),
    playerCaption: gameExtension.playerCaption?.() ?? GameModeManager.current.playerCaption(),
    playerScore: GameModeManager.current.playerScore(),
    progress: !gameExtension.isPractice?.() && GameModeManager.current.showProgress ? progressMarkup() : null
  });

  if (TutorialManager.active) new TutorialView(app).instruction(q);

  const ui = app.querySelector('#question-ui');
  const questionInstance = QuestionManager.create(q, ui);

  questionInstance.render();
  state.activeQuestion = questionInstance;

  const quitButton = app.querySelector('#quit-button');

  if (quitButton) {
    quitButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      SoundManager.playSe("kaitou");
      console.log('中断ボタンが押されました');

      quitGame();
    });
  }


  gameExtension.onQuestion?.(q);

  SoundManager.playSe('syutsudai');

  // ========================================
  // フェード終了後に出題開始
  // ========================================

  let questionStarted = false;

  const startQuestion = () => {

    if (questionStarted) return;

    // 別の問題へ移動していたら実行しない
    if (
      !ui.isConnected ||
      state.activeQuestion !== questionInstance ||
      state.locked
    ) {
      return;
    }

    questionStarted = true;

    // 問題文ワイプ開始と同時に選択肢の内容を公開
    ui.closest('.quiz-shell')?.classList.remove('options-concealed');

    // ========================================
    // キューブ・エフェクト・連想ヒント開始
    // ========================================

    if (typeof questionInstance.startAnimation === 'function') {
      questionInstance.startAnimation();
    }

    // ========================================
    // 問題文ワイプ開始
    // ========================================

    startQuestionWipe();

    // ========================================
    // タイマー開始
    // ========================================

    if (!TutorialManager.active && !gameExtension.overrideTimer?.()) {
      timerManager.start(limit);
    }
  };

  // ========================================
  // フェード終了を待つ
  // ========================================

  ui.addEventListener('animationend', event => {

    if (
      event.target === ui &&
      event.animationName === 'question-ui-fade-in'
    ) {
      startQuestion();
    }

  });

  // CSSのフェード時間を取得
  const style = getComputedStyle(ui);

  const parseTime = value => {
    const s = value.trim();
    const n = parseFloat(s);
    if (!Number.isFinite(n)) return 0;
    return s.endsWith('ms') ? n : n * 1000;
  };

  const durations = style.animationDuration.split(',').map(parseTime);
  const delays = style.animationDelay.split(',').map(parseTime);

  const fadeIndex = style.animationName
    .split(',')
    .map(x => x.trim())
    .indexOf('question-ui-fade-in');

  if (fadeIndex === -1) {

    // フェード設定がない場合は即時開始
    startQuestion();

  } else {

    const duration = durations[fadeIndex % durations.length] || 0;
    const delay = delays[fadeIndex % delays.length] || 0;

    if (duration === 0) {
      startQuestion();
    } else {
      // animationend が発生しない場合の保険
      setTimeout(startQuestion, Math.max(0, duration + delay) + 100);
    }
  }
}

function quitGame() {

  console.log('ゲームを中断します');

  // 二重クリック防止
  const quitButton = app.querySelector('#quit-button');

  if (quitButton) {
    quitButton.disabled = true;
  }

  // 入力を停止
  state.locked = true;
  setQuestionInputEnabled(false);

  // タイマー・待機処理・アニメーションを停止
  clearTimer();

  // 問題固有の処理を終了
  if (state.activeQuestion) {
    state.activeQuestion.dispose();
    state.activeQuestion = null;
  }

  // キーボードイベントを解除
  if (state.typingKeyHandler) {
    document.removeEventListener(
      'keydown',
      state.typingKeyHandler
    );
    state.typingKeyHandler = null;
  }

  // 全国正解率の取得結果を無効化
  correctRateManager.reset();

  // リザルト画面へ
  if (TutorialManager.active) TutorialManager.menu();
  else result(true);
}









function disableQuestionButtons() {

  const quiz = app.querySelector('.quiz-shell');

  if (!quiz) return;

  // 解答後の見た目を適用
  quiz.classList.add('answer-disabled');

  // 中断ボタン以外を無効化
  quiz.querySelectorAll('button').forEach(button => {

    if (button.id === 'quit-button') return;

    button.disabled = true;

  });

}



function answer(value) {

  if (state.locked || !state.inputEnabled) return;

  // 二重解答防止
  state.locked = true;

  // 入力禁止
  setQuestionInputEnabled(false);

  // すべてのボタンを無効化
  disableQuestionButtons();

  // 以下、既存の正誤判定処理


  state.locked = true;

  const visualCleanup = state.visualCleanup;
  const hintTimers = state.hintTimers;
  const questionWipeCleanup = state.questionWipeCleanup;

  state.visualCleanup = null;
  state.hintTimers = [];
  state.questionWipeCleanup = null;

  try {
    clearTimer();
  } finally {
    state.visualCleanup = visualCleanup;
    state.hintTimers = hintTimers;
    state.questionWipeCleanup = questionWipeCleanup;
  }

  if (value !== null) {
    SoundManager.playSe('kaitou');
  }

  const q = state.questions[state.index];

  const correct = value !== null && (
    q.type === 'OX'
      ? String(value).toUpperCase() === String(q.answer).toUpperCase()

      : q.type === 'MULTIPLE_CHOICE'
        ? (
          Array.isArray(value) &&
          Array.isArray(state.activeAnswers) &&
          value.length === state.activeAnswers.length &&
          state.activeAnswers.every(a => value.includes(a))
        )

        : q.type === 'LINE_MATCHING'
          ? value === true

          : q.type === 'IMAGE_TOUCH'
            ? value === true

            : q.type === 'GROUP'
              ? value === true

              : q.type === 'ORDER' || q.type === 'ORDER-A'
                ? value === true

                : q.type === 'REARRANGEMENT'
                  ? String(value) === String(q.answer)

                  : q.type === 'EFFECT'
                    ? acceptedAnswers(q).includes(String(value))

                    : q.type === 'POLYHEDRON'
                      ? String(value) === String(q.answer)

                      : ['NUMBER', 'KANA', 'KATAKANA'].includes(q.type)
                        ? acceptedAnswers(q).includes(String(value))

                        : q.type === 'CHARACTER_PANEL'
                          ? String(value) === String(q.answer)

                          : value === q.choices[0]
  );

  if (TutorialManager.active) {
    state.feedbackTimer = setTimeout(() => {
      state.feedbackTimer = null;

      SoundManager.playSe(correct ? "correct" : "incorrect");

      hideQuestionText();

      new QuestionView(app).showFeedback(correct, false);

      TutorialManager.feedback(correct);
    }, 1000);

    return;
  }
  finalizeNationalRate(q, correct, value === null);

  const earned = correct ? ScoreManager.points(q, state.timeLimit, state.remaining) : 0;

  if (correct) {
    state.correct++;

    if (!gameExtension.isPractice?.()) {
      state.score += earned;
    }
  }

  const mode = GameModeManager.current;
  const lifeUp = mode.onAnswer(correct);

  app.querySelectorAll('#question-ui button')
    .forEach(b => b.disabled = true);

  const feedback = document.querySelector('#feedback');

  if (feedback) {
    feedback.textContent = '';
    feedback.className = 'feedback';
  }

  // ========================================
  // 結果表示処理
  // ========================================

  const showFeedback = () => {

    state.feedbackTimer = null;

    SoundManager.playSe(
      value === null
        ? 'timeout'
        : correct
          ? 'correct'
          : 'incorrect'
    );


    const scoreEl = document.querySelector('#player-score');

    if (scoreEl) mode.updateScore(scoreEl);

    const rankEl = document.querySelector('#rank-name');

    if (rankEl) {
      rankEl.textContent = gameExtension.rankCaption?.() ?? GameModeManager.current.rankCaption();
    }

    const targetEl = document.querySelector('#rank-target');

    if (targetEl) {
      targetEl.textContent = gameExtension.rankTarget?.(q, false) ??
        GameModeManager.current.rankTarget();

      mode.onFeedback(lifeUp);
    }

    state.history.push({
      correct,
      timeout: value === null,
      earned
    });

    const progressEl = document.querySelector('#progress-web');

    if (progressEl) {
      progressEl.innerHTML = progressMarkup();
    }

    // ========================================
    // 問題文を消して結果を表示
    // ========================================

    hideQuestionText();

    new QuestionView(app).showFeedback(correct, value === null);
  };

  // ========================================
  // 結果表示までの待機時間
  // ========================================

  if (value === null) {

    // 時間切れ：待機なしで即表示
    showFeedback();

  } else {

    // 正解・不正解：1秒待ってから表示
    state.feedbackTimer = setTimeout(
      showFeedback,
      1000
    );
  }

  // ========================================
  // 次の問題へ進む
  // ========================================

  const advanceDelay = value === null ? 2000 : 3000;

  state.advanceTimer = setTimeout(() => {
    state.advanceTimer = null;

    if (gameExtension.advance?.()) return;


    state.index++;

    mode.advance();


  }, advanceDelay);
}








// ============================================================
// 100問チャレンジ達成演出
// ============================================================



// ========================================
// プレイヤーIDの取得・生成
// ========================================

function submitRanking(score, name) {
  return RankingManager.submit(score, name);
}

function result(abandoned = false) {
  if (gameExtension.onResult?.()) return;

  clearTimer();

  const mode = GameModeManager.current;
  const data = {
    abandoned,
    challenge: mode.isChallenge,
    score: state.score,
    resultRank: rank(state.score),
    correctCount: state.correct
  };

  mode.onResult(abandoned);
  new ResultView(app, button, () => title()).render(data);
}


// ============================================================
// 起動時ロード処理
// ============================================================

// 設定を読み込み
readSettings();


// ============================================================
// プリロード対象の背景画像
// ============================================================

const PRELOAD_IMAGES = [
  ...new Set(Array.from(GameModeManager.modes.values(), mode => mode.background))
];


// ============================================================
// ロード画面表示
// ============================================================
// ============================================================
// 画像プリロード
// ============================================================

function preloadImage(src) {

  return new Promise((resolve, reject) => {

    const image = new Image();

    image.onload = async () => {

      try {

        // 可能なら画像のデコードまで完了させる
        if (typeof image.decode === 'function') {
          await image.decode();
        }

        resolve(image);

      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      reject(
        new Error(`画像の読み込みに失敗: ${src}`)
      );
    };

    image.src = src;

  });
}


// ============================================================
// 起動時ロード
// ============================================================

async function startup() {

  // ========================================
  // ロード画面表示
  // ========================================

  const view = new LoadingView(app);
  view.renderStartup();


  // ========================================
  // 読み込み対象を登録
  // ========================================

  const tasks = [

    // 背景画像
    ...PRELOAD_IMAGES.map(src => ({

      label: `画像: ${src}`,

      load: () => preloadImage(src)

    })),


    // SE
    ...Array.from(SoundManager.seNames, name => ({

      label: `SE: ${name}`,

      load: async () => {

        await SoundManager.preloadSe(name);

        // 読み込みに成功したか確認
        if (!SoundManager.effects.has(name)) {
          throw new Error(
            `SEの読み込みに失敗: ${name}`
          );
        }

      }

    })),


    // BGM
    ...Object.keys(SoundManager.music).map(mode => ({

      label: `BGM: ${mode}`,

      load: async () => {

        await SoundManager.preloadBgm(mode);

        // 読み込みに成功したか確認
        if (!SoundManager.bgmCache.has(mode)) {
          throw new Error(
            `BGMの読み込みに失敗: ${mode}`
          );
        }

      }

    }))

  ];


  // ========================================
  // 進捗管理
  // ========================================

  const total = tasks.length;

  let completed = 0;

  const errors = [];


  function updateProgress() {

    const percentage = total === 0
      ? 100
      : Math.round(completed / total * 100);

    view.updateProgress(percentage);

  }

  // ========================================
  // 全素材を並列読み込み
  // ========================================

  let lastLoadingLabel = '';

  await Promise.all(

    tasks.map(async task => {

      // 現在読み込み中のファイル名を表示
      lastLoadingLabel = task.label;
      view.setDetail(`${task.label} を読み込み中...`);

      try {

        await task.load();

        console.log(`読み込み完了: ${task.label}`);

      } catch (error) {

        console.error(`読み込み失敗: ${task.label}`, error);
        errors.push(task.label);

      } finally {

        completed++;

        updateProgress();

        // 進捗表示
        if (completed < total) {
          view.setDetail(`${task.label} の処理が完了しました`);
        } else {
          view.setDetail('読み込み完了！');
        }

      }

    })

  );


  // ========================================
  // 読み込み結果
  // ========================================

  if (errors.length > 0) {

    console.warn(
      `${errors.length}件の素材を読み込めませんでした`,
      errors
    );

  } else {

    console.log(
      'すべての素材の読み込みが完了しました'
    );

  }


  // ========================================
  // 100%表示を描画
  // ========================================

  view.finish();

  await new Promise(resolve => {

    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });

  });


  // ========================================
  // タイトル画面へ自動遷移
  // ========================================

  title();

}


// ============================================================
// 初回操作時に音声を有効化
// ============================================================

// ブラウザの自動再生制限への対応。
// ロード画面にクリック操作は要求しない。

function unlockStartupAudio() {

  document.removeEventListener(
    'pointerdown',
    unlockStartupAudio
  );

  document.removeEventListener(
    'keydown',
    unlockStartupAudio
  );

  SoundManager.init();

  // タイトル画面が表示されている場合はBGM再生
  if (
    app.querySelector('.title-screen') &&
    !SoundManager.bgm
  ) {

    SoundManager.playBgm('TITLE');

  }

}

document.addEventListener(
  'pointerdown',
  unlockStartupAudio
);

document.addEventListener(
  'keydown',
  unlockStartupAudio
);


// ============================================================
// ゲーム起動
// ============================================================

startup().catch(error => {

  console.error(
    '起動処理に失敗しました:',
    error
  );

  new LoadingView(app).renderError();

});
