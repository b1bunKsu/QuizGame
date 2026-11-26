class RankingManager {
  static api = 'https://b1bunksu-quizgame.netlify.app/.netlify/functions/ranking';
  static getPlayerId() {
    const key = 'quizgame_web_player_id';

    let id = localStorage.getItem(key);

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }

    return id;
  }

  // ========================================
  // 全国ランキングへのスコア送信
  // ========================================

  static async submit(score, name) {
    const response = await fetch(this.api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        playerId: this.getPlayerId(),
        name,
        score
      })
    });

    if (!response.ok) {
      throw new Error(`ランキング登録失敗: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error('ランキング登録に失敗しました');
    }

    return data;
  }

}
