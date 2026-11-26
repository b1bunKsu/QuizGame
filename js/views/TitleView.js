// タイトル画面の描画と操作
class TitleView {
  constructor(container, createButton, escape) {
    this.container = container;
    this.createButton = createButton;
    this.escape = escape;
  }

  render({ name, bestScore, message }) {
  this.container.innerHTML = `
    <div class="center title-screen screen-enter">
      <div class="title">ノンジャンル検定</div>
      <div class="subtitle">ジャンルを問わず様々な問題が出題されるクイズゲームです</div>

      <input
        id="name"
        class="name"
        maxlength="8"
        placeholder="名前を入力"
        value="${this.escape(name === 'PLAYER' ? '' : name)}"
      >

      <div class="btns mode-buttons">
        ${this.createButton('スタンダード', 'standard')}
        ${this.createButton('ハイスピード', 'highspeed')}
        ${this.createButton('100問チャレンジ', 'hundred')}
      </div>
      
      ${this.createButton('設定', 'settings', 'settings-button')}

      <!-- 自己ベスト表示 -->
      <div class="title-best-score">
        <span class="title-best-label">スタンダードのベストスコア</span>
      </div>
      <div class="title-best-score">
        <span class="title-best-value">${bestScore}</span>
      </div>

      ${message ? `<div id="message">${this.escape(message)}</div>` : ''}
    </div>
  `;

  }

  bind({ onStart, onSettings, onTutorial }) {
    const modes = { standard: 'STANDARD', highspeed: 'HIGH_SPEED', hundred: 'HUNDRED_CHALLENGE' };
    this.container.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', () => {
        const action = el.dataset.action;
        if (Object.hasOwn(modes, action)) onStart(modes[action]);
        else if (action === 'tutorial') onTutorial(this.container.querySelector('#name').value.trim() || 'PLAYER');
        else if (action === 'settings') onSettings(this.container.querySelector('#name').value.trim() || 'PLAYER');
      });
    });
  }
}
