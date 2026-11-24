(() => {
  const frame = document.getElementById('game-frame');
  const button = document.getElementById('fullscreen-toggle');
  if (!frame || !button) return;
  // F11には標準化された検出APIがないため、画面寸法で近似する。
  function syncBrowserFullscreen() {
    const full = !document.fullscreenElement &&
      Math.abs(window.innerHeight - screen.height) <= 2 &&
      Math.abs(window.innerWidth - screen.width) <= 2 &&
      !matchMedia('(pointer: coarse)').matches;
    document.body.classList.toggle('portal-fullscreen', full);
  }
  button.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (frame.requestFullscreen) await frame.requestFullscreen();
      else alert('このブラウザでは全画面ボタンに対応していません。');
    } catch (error) { console.warn(error); alert('全画面表示に切り替えられませんでした。'); }
  });
  document.addEventListener('fullscreenchange', () => {
    button.textContent = document.fullscreenElement ? '全画面を解除' : '⛶ フルスクリーン';
    syncBrowserFullscreen();
  });
  window.addEventListener('resize', syncBrowserFullscreen);
  syncBrowserFullscreen();
})();
