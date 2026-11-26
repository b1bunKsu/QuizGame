class TimerManager {
  constructor(state, { onUpdate, onCountdown, onTimeout }) {
    this.state = state;
    this.onUpdate = onUpdate;
    this.onCountdown = onCountdown;
    this.onTimeout = onTimeout;
  }

  reset(limit) {
    this.stop();
    this.state.remaining = limit;
    this.state.timeLimit = limit;
    this.state.lastCountdownSecond = null;
  }

  start(limit) {
    this.stop();
    this.state.deadline = performance.now() + limit * 1000;
    this.state.timer = setInterval(() => this.tick(), 30);
    this.tick();
  }

  stop() {
    if (this.state.timer !== null) {
      clearInterval(this.state.timer);
      this.state.timer = null;
    }
  }

  tick() {
    if (this.state.locked) return;

    this.state.remaining = Math.max(
      0,
      (this.state.deadline - performance.now()) / 1000
    );

    this.onUpdate(this.state.remaining, this.state.timeLimit);

    // ========================================
    // 残り5秒からカウントダウンSE
    // ========================================

    if (this.state.remaining > 0 && this.state.remaining <= 5) {

      const countdownSecond = Math.ceil(this.state.remaining);

      if (this.state.lastCountdownSecond !== countdownSecond) {

        this.state.lastCountdownSecond = countdownSecond;

        this.onCountdown();
      }
    }

    // ========================================
    // 時間切れ
    // ========================================

    if (this.state.remaining <= 0) {
      this.stop();
      this.onTimeout();
    }
  }
}
