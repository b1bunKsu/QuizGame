class BaseGameMode {
    get name() { return state.mode; }
    get background() { return 'assets/images/background.png'; }
    get timeLimit() { return 20; }
    get questionCount() { return 25; }
    get wipeSpeed() { return 1; }
    get showProgress() { return true; }
    get isChallenge() { return false; }
    filterQuestions(questions) { return questions; }
    prepareQuestions(questions) {
        const filtered = this.filterQuestions(questions);
        if (!filtered.length) throw Error('対応形式の問題がありません');
        shuffle(filtered);
        state.questionPool = filtered;
        state.questions = filtered.slice(0, this.questionCount);
        state.index = 0;
    }
    reset() { state.lives = 5; state.streak = 0; }
    onAnswer(correct) { return false; }
    rankCaption() { return rankDisplayName(state.score); }
    rankTarget() { return nextRankTarget(state.score); }
    get rankClass() { return ''; }
    playerCaption() { return esc(state.name); }
    playerScore() { return state.score; }
    updateScore(el) { animateScore(el, Number(el.textContent) || 0, state.score); }
    onFeedback(lifeUp) { }
    isFinalQuestion() { return state.index === state.questions.length - 1; }
    questionCaption() { return this.isFinalQuestion() ? '最終問題' : `第 ${state.index + 1} 問`; }
    advance() { showQuestion(); }
    onResult(abandoned) { }
}
