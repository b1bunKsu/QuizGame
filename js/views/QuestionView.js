// 共通クイズ画面の描画。ゲームルールやタイマーの進行は main.js に残す。
class QuestionView {
  constructor(container) { this.container = container; }
  render({ type, limit, rankCaption, rankClass, rankTarget, questionCaption, playerCaption, playerScore, progress }) {
    const names = {
      OX: 'OXクイズ',
      CHOICE: '四択クイズ',
      MULTIPLE_CHOICE: '一問多答クイズ',
      ONE_WAY: '一方通行クイズ',
      NUMBER: 'タイピングクイズ',
      KANA: 'タイピングクイズ',
      KATAKANA: 'タイピングクイズ',
      CHARACTER_PANEL: '文字パネルクイズ',
      SLOT: 'スロットクイズ',
      GROUP: 'グループ分けクイズ',
      ORDER: '順番当てクイズ',
      'ORDER-A': '順番当てクイズ',
      REARRANGEMENT: '並べ替えクイズ',
      LINE_MATCHING: '線結びクイズ',
      RENSOU: '連想クイズ',
      EFFECT: 'エフェクトクイズ',
      POLYHEDRON: 'キューブクイズ',
      IMAGE_TOUCH: '画像タッチクイズ'
    };

    this.container.innerHTML = `
    <div class="quiz-shell screen-enter options-concealed">
      <header class="quiz-header">

              <button
          id="quit-button"
          class="quit-button"
          type="button"
        >
          中断
        </button>

        <div class="hud-panel rank-panel-web">
          <div class="hud-caption" id="rank-name">
            ${rankCaption

      }
          </div>

          <div class="hud-number ${rankClass}" id="rank-target">
            ${rankTarget
      }
          </div>
        </div>

        <div class="quiz-heading">
          <div class="question-count">
            ${questionCaption
      }
          </div>

          <div class="qtype">
            ${names[type] || esc(type)}
          </div>
          <div class="national-rate" id="national-rate"><span>正解率</span><span class="national-rate-value">？</span><span>%</span></div>
        </div>

        <div class="hud-panel player-panel-web">
          <div class="hud-caption">
            ${playerCaption
      }
          </div>

          <div class="hud-number" id="player-score">
            ${playerScore
      }
          </div>
        </div>

      </header>

      <section class="question-center">
        <div class="board">
          <div class="question question-wipe-container"></div>
        </div>

        <div class="timer-area-web">
          <span id="clock">${limit.toFixed(2)}</span>
          <div class="bar">
            <div class="fill" id="fill"></div>
          </div>
        </div>
      </section>

      <section class="answer-bottom">

        ${progress !== null
        ? `
              <div class="progress-web" id="progress-web">
                ${progress}
              </div>
            `
        : ''
      }

        <div id="question-ui"></div>

      </section>

      <div class="feedback" id="feedback" role="status"></div>

    </div>
  `;

  }
  updateTimer(remaining, timeLimit) {
    const clock = this.container.querySelector('#clock');
    const fill = this.container.querySelector('#fill');

    if (clock) {
      clock.textContent = remaining.toFixed(2);
    }

    if (fill) {
      fill.style.width =
        (remaining / timeLimit * 100) + '%';


      fill.classList.toggle(
        'timer-yellow',
        remaining < 17.00 &&
        remaining >= 5
      );

      fill.classList.toggle(
        'timer-red',
        remaining < 5
      );

    }

  }
  hideText() {
    // ========================================
    // 通常の問題文を非表示
    // ========================================

    const question = this.container.querySelector(
      '.quiz-shell .question-center .question'
    );

    if (question) {
      question.style.visibility = 'hidden';
    }

    // ========================================
    // 連想クイズのヒントを非表示
    // ========================================

    const rensouHints = this.container.querySelector(
      '.quiz-shell .rensou-java-hints'
    );

    if (rensouHints) {
      rensouHints.style.visibility = 'hidden';
    }
  }
  showFeedback(correct, timeout) {
    const feedback = this.container.querySelector('#feedback');
    if (feedback) {

      feedback.textContent = timeout
        ? '時間切れ'
        : correct
          ? '正解'
          : '不正解';

      feedback.classList.add(
        'feedback-visible',
        timeout
          ? 'feedback-timeout'
          : correct
            ? 'feedback-correct'
            : 'feedback-incorrect'
      );
    }

    const board = this.container.querySelector('.quiz-shell .board');

    if (board) {
      board.classList.add(
        correct ? 'board-correct' : 'board-incorrect'
      );
    }
  }
}
