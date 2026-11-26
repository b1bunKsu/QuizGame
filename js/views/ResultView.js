// リザルト画面の描画と画面内の操作を担当する。
class ResultView {
    constructor(container, createButton, onTitle) {
        this.container = container;
        this.createButton = createButton;
        this.onTitle = onTitle;
    }

    render({ abandoned, challenge, score, resultRank, correctCount }) {
        this.container.innerHTML = `
      <div class="result-simple screen-enter">

          <div class="result-simple-title">RESULT</div>

          <div class="result-simple-board">

            ${abandoned ? `
                <div class="result-simple-label">RESULT</div>
                <div class="result-simple-rank">
                    途中放棄
                </div>
            ` : challenge ? `
                <div class="result-simple-label">正解数</div>
                <div class="result-simple-rank">
                    ${correctCount}問
                </div>
            ` : `
                <div class="result-simple-label">RANK</div>
                <div class="result-simple-rank">
                    ${resultRank}
                </div>
            `}

              <div class="result-simple-label">SCORE</div>
              <div class="result-simple-score">
                  ${score}
              </div>

          </div>

          <div class="result-simple-actions">
              ${this.createButton('タイトル画面へ', 'title')}
          </div>

      </div>
  `;

        this.container.querySelector('[data-action="title"]')
            ?.addEventListener('click', () => this.onTitle());
    }
}
