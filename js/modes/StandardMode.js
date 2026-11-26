class StandardMode extends BaseGameMode {
    get name() { return 'スタンダード'; }
    get background() { return 'assets/images/background.jpg'; }
    onResult(abandoned) {
        const score = state.score;
        const key = 'quizgame_web_best_STANDARD';
        let previousBest = 0;
        try { previousBest = Number(localStorage.getItem(key)) || 0; }
        catch (e) { console.warn(e); }
        if (!abandoned) {

            if (score > previousBest) {
                try {
                    localStorage.setItem(key, String(score));
                } catch (e) {
                    console.warn(e);
                }
            }

            // 全国ランキングへ送信
            // 自己ベスト以外でも送信可能。
            // サーバー側で最高記録のみ保存する。
            submitRanking(score, state.name)
                .then(data => {
                    console.log('全国ランキング登録結果:', data);
                })
                .catch(error => {
                    console.warn('全国ランキング登録失敗:', error);
                });
        }
    }
}
