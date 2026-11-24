(() => {

  const frame = document.getElementById('game-frame');
  const button = document.getElementById('fullscreen-toggle');

  if (!frame || !button) return;

  // ========================================
  // スマートフォン判定
  // ========================================

  function isMobile() {
    return window.matchMedia('(pointer: coarse)').matches
      && Math.min(window.screen.width, window.screen.height) <= 600;
  }

  // ========================================
  // F11によるフルスクリーン判定
  // ========================================

  function syncBrowserFullscreen() {

    const full = !document.fullscreenElement
      && Math.abs(window.innerHeight - screen.height) <= 2
      && Math.abs(window.innerWidth - screen.width) <= 2
      && !window.matchMedia('(pointer: coarse)').matches;

    document.body.classList.toggle(
      'portal-fullscreen',
      full
    );
  }

  // ========================================
  // 横画面に固定
  // ========================================

  async function lockLandscape() {

    if (!isMobile()) return;

    try {

      if (screen.orientation?.lock) {

        await screen.orientation.lock('landscape');

      }

    } catch (error) {

      console.warn(
        '画面の向きを固定できませんでした。',
        error
      );

    }
  }

  // ========================================
  // 画面の向きの固定を解除
  // ========================================

  function unlockOrientation() {

    try {

      if (screen.orientation?.unlock) {

        screen.orientation.unlock();

      }

    } catch (error) {

      console.warn(error);

    }
  }

  // ========================================
  // フルスクリーンボタン
  // ========================================

  button.addEventListener('click', async () => {

    try {

      if (document.fullscreenElement) {

        unlockOrientation();

        await document.exitFullscreen();

      } else if (frame.requestFullscreen) {

        // 先にフルスクリーンへ移行
        await frame.requestFullscreen();

        // スマートフォンの場合は横画面に固定
        await lockLandscape();

      } else {

        alert(
          'このブラウザではフルスクリーン表示に対応していません。'
        );

      }

    } catch (error) {

      console.warn(error);

      alert(
        'フルスクリーン表示に切り替えられませんでした。'
      );

    }

  });

  // ========================================
  // フルスクリーン状態の変更
  // ========================================

  document.addEventListener('fullscreenchange', () => {

    const fullscreen = !!document.fullscreenElement;

    button.textContent = fullscreen
      ? '全画面を解除'
      : '⛶ フルスクリーン';

    // ESCキーや端末操作による解除にも対応
    if (!fullscreen) {

      unlockOrientation();

    }

    syncBrowserFullscreen();

  });

  // ========================================
  // ウィンドウサイズ変更
  // ========================================

  window.addEventListener(
    'resize',
    syncBrowserFullscreen
  );

  syncBrowserFullscreen();

})();