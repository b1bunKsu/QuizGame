class ScoreManager {
  static thresholds = [
    { rank: 'D', minScore: 0 },
    { rank: 'C', minScore: 1000 },
    { rank: 'B', minScore: 2000 },
    { rank: 'A', minScore: 3000 },
    { rank: 'S', minScore: 3500 },
    { rank: 'SS', minScore: 4000 },
    { rank: 'SSS', minScore: 4500 }
  ];

  static nextRankTarget(score) {

    // 次のランクの必要点数を取得
    const nextRank = this.thresholds.find(
      item => score < item.minScore
    );

    if (nextRank) {
      return nextRank.minScore;
    }

    // 最高ランク到達後は自己ベストを表示
    let bestScore = 0;

    try {

      bestScore = Number(
        localStorage.getItem('quizgame_web_best_STANDARD')
      ) || 0;

    } catch (e) {

      console.warn(e);

    }

    return bestScore > 0 ? bestScore : 'BEST';
  }

  static multiplier(d) {
    return ({
      EASY: 1,
      NORMAL: 1.1,
      HARD: 1.2
    })[String(d ?? '').toUpperCase()] ?? 1;
  }

  static points(q, timeLimit, remaining) {
    const elapsed = timeLimit - remaining;

    const rate = Math.max(
      0,
      Math.min(
        1,
        elapsed <= 3
          ? 1
          : .97 * (timeLimit - elapsed) /
          Math.max(1, timeLimit - 3)
      )
    );

    return Math.round(
      200 * this.multiplier(q.difficulty) * rate
    );
  }

  static animateScore(state, el, from, to) {
    if (state.scoreAnimation !== null) {
      cancelAnimationFrame(state.scoreAnimation);
      state.scoreAnimation = null;
    }

    if (from === to) {
      el.textContent = String(to);
      return;
    }

    const start = performance.now();
    const duration = 1000;

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);

      el.textContent = String(
        Math.round(from + (to - from) * ease)
      );

      if (t < 1) {
        state.scoreAnimation = requestAnimationFrame(frame);
      } else {
        state.scoreAnimation = null;
        el.textContent = String(to);
      }
    }

    state.scoreAnimation = requestAnimationFrame(frame);
  }

  static rank(score) {

    for (let i = this.thresholds.length - 1; i >= 0; i--) {

      if (score >= this.thresholds[i].minScore) {
        return this.thresholds[i].rank;
      }
    }

    return this.thresholds[0].rank;
  }

  static rankDisplayName(score) {

    const nextRank = this.thresholds.find(
      item => score < item.minScore
    );

    return nextRank
      ? nextRank.rank + 'ランク'
      : '自己ベスト';
  }
}
