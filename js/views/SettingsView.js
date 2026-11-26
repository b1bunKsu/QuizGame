// 設定画面の描画と入力イベント
class SettingsView {
  constructor(container, createButton) {
    this.container = container;
    this.createButton = createButton;
  }

  render({ masterVolume, bgmVolume, seVolume, qwerty }, { onMaster, onBgm, onSe, onQwerty, onBack }) {
    this.container.innerHTML = `
    <div class="center settings-screen screen-enter">
      <div class="settings-title">設定</div>

      <label class="settings-label" for="master-volume">
        MASTER音量
        <output id="master-value">${Math.round(masterVolume * 100)}%</output>
      </label>

      <input
        id="master-volume"
        type="range"
        min="0"
        max="100"
        value="${Math.round(masterVolume * 100)}"
      >

      <label class="settings-label" for="bgm-volume">
        BGM音量
        <output id="bgm-value">${Math.round(bgmVolume * 100)}%</output>
      </label>

      <input
        id="bgm-volume"
        type="range"
        min="0"
        max="100"
        value="${Math.round(bgmVolume * 100)}"
      >

      <label class="settings-label" for="se-volume">
        SE音量
        <output id="se-value">${Math.round(seVolume * 100)}%</output>
      </label>

      <input
        id="se-volume"
        type="range"
        min="0"
        max="100"
        value="${Math.round(seVolume * 100)}"
      >

      <label class="settings-check">
        <input
          id="qwerty"
          type="checkbox"
          ${qwerty ? 'checked' : ''}
        >
        英数字キーボードをQWERTY配列にする
      </label>

      ${this.createButton('戻る', 'back', 'settings-button')}

    </div>
  `;

    const root = this.container;
    root.querySelector('#master-volume').addEventListener('input', e => {
      onMaster(Number(e.target.value) / 100);
      root.querySelector('#master-value').textContent = e.target.value + '%';
    });
    root.querySelector('#bgm-volume').addEventListener('input', e => {
      onBgm(Number(e.target.value) / 100);
      root.querySelector('#bgm-value').textContent = e.target.value + '%';
    });
    root.querySelector('#se-volume').addEventListener('input', e => {
      onSe(Number(e.target.value) / 100);
      root.querySelector('#se-value').textContent = e.target.value + '%';
    });
    root.querySelector('#qwerty').addEventListener('change', e => onQwerty(e.target.checked));
    root.querySelector('[data-action="back"]').addEventListener('click', onBack);
  }
}
