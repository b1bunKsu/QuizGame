// ロード画面の描画のみを担当する。
class LoadingView {
  constructor(container) { this.container = container; }
  renderQuestions() {
    this.container.innerHTML = `
    <div class="center">
      <div class="title" style="font-size:50px">
        問題を読み込み中…
      </div>
      <div class="note">
        GitHubから問題を取得しています。
      </div>
    </div>
  `;
  }
  renderStartup() {
    this.container.innerHTML = `
    <div class="startup-loading">

      <div class="startup-loading-status">
        LOADING...
      </div>

      <div class="startup-loading-bar">
        <div
          class="startup-loading-progress"
          id="load-progress"
        ></div>
      </div>

      <div
        class="startup-loading-percent"
        id="load-percent"
      >
        0%
      </div>

      <div
        class="startup-loading-detail"
        id="load-detail"
      >
        読み込みを準備しています...
      </div>

    </div>
  `;
  }
  updateProgress(percentage) {
    this.container.querySelector('#load-progress').style.width = `${percentage}%`;
    this.container.querySelector('#load-percent').textContent = `${percentage}%`;
  }
  setDetail(text) { this.container.querySelector('#load-detail').textContent = text; }
  finish() { this.container.querySelector('#load-progress').style.width = '100%'; }
  renderError() { this.container.innerHTML = '<div class="startup-loading"><div class="startup-loading-status">LOADING ERROR</div></div>'; }
}
