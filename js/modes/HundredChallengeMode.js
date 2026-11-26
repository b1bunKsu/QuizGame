class HundredChallengeMode extends BaseGameMode {
    get name() { return '100問チャレンジ'; }
    get background() { return 'assets/images/hundred.jpg'; }
    get questionCount() { return Infinity; }
    get maxLives() { return 5; }
    get recoveryStreak() { return 7; }
    get targetCorrect() { return 100; }
    get showProgress() { return false; }
    get isChallenge() { return true; }
    reset() { state.lives = this.maxLives; state.streak = 0; }
    onAnswer(correct) {
        if (!correct) { state.streak = 0; state.lives = Math.max(0, state.lives - 1); return false; }
        if (++state.streak >= this.recoveryStreak) {
            state.streak = 0;
            if (state.lives < this.maxLives) { state.lives++; return true; }
        }
        return false;
    }
    rankCaption() { return 'ライフ'; }
    rankTarget() { return '♥'.repeat(state.lives) + '♡'.repeat(this.maxLives - state.lives); }
    get rankClass() { return 'life-hearts'; }
    playerCaption() { return '正解数'; }
    playerScore() { return state.correct + '問'; }
    updateScore(el) { el.textContent = this.playerScore(); }
    onFeedback(lifeUp) { if (lifeUp) SoundManager.playSe('oneUp'); }
    animateLifeLoss(el, targetText, correct) {
        if (
            correct ||
            !/^♥*♡*$/.test(targetText) ||
            targetText.length !== this.maxLives ||
            state.lives < 0 ||
            state.lives >= this.maxLives
        ) return false;

        const DURATION = 480;
        const PARTICLE_COUNT = 9;
        const PARTICLE_DISTANCE = 42;
        const PARTICLE_SIZE = 10;
        const index = state.lives;
        const fragment = document.createDocumentFragment();
        let heart;
        Array.from(targetText).forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char;
            if (i === index) {
                span.className = 'life-loss-heart';
                heart = span;
            }
            fragment.append(span);
        });
        el.replaceChildren(fragment);
        const full = document.createElement('span');
        full.className = 'life-loss-full';
        full.textContent = '♥';
        heart.append(full);
        SoundManager.playSe('crack');
        full.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(1.4)', opacity: 1, offset: .22 },
            { transform: 'scale(.15)', opacity: 0 }
        ], { duration: DURATION, fill: 'forwards', easing: 'ease-out' });
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const particle = document.createElement('span');
            particle.className = 'life-loss-particle';
            particle.textContent = '◆';
            particle.style.fontSize = `${PARTICLE_SIZE}px`;
            heart.append(particle);
            const angle = i * Math.PI * 2 / PARTICLE_COUNT;
            const x = Math.cos(angle) * PARTICLE_DISTANCE;
            const y = Math.sin(angle) * PARTICLE_DISTANCE;
            particle.animate([
                { transform: 'translate(-50%, -50%) scale(.2)', opacity: 0 },
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: .22 },
                { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(180deg) scale(.3)`, opacity: 0 }
            ], { duration: DURATION, fill: 'forwards', easing: 'ease-out' });
        }
        setTimeout(() => {
            if (el.isConnected && el.contains(heart)) el.textContent = targetText;
        }, DURATION);
        return true;
    }
    isFinalQuestion() { return false; }
    advance() {
        if (state.correct >= this.targetCorrect) { this.showClear(); return; }
        if (state.lives <= 0) { result(); return; }
        if (state.index >= state.questions.length) {
            const nextBatch = [...state.questionPool];
            shuffle(nextBatch);
            const previous = state.questions[state.index - 1];
            if (nextBatch.length > 1 && nextBatch[0] === previous) {
                [nextBatch[0], nextBatch[1]] = [nextBatch[1], nextBatch[0]];
            }
            state.questions.push(...nextBatch);
        }
        showQuestion();
    }
    showClear() {

        SoundManager.playSe("applause");

        // タイマー停止
        clearTimer();

        // ========================================
        // 「正解」の判定表示を消す
        // ========================================

        const feedback = app.querySelector('#feedback');

        if (feedback) {

            feedback.textContent = '';
            feedback.className = 'feedback';
            feedback.style.display = 'none';

        }

        // ========================================
        // 問題板に達成メッセージを表示
        // ========================================

        const board = app.querySelector('.quiz-shell .board');

        if (!board) {
            result();
            return;
        }

        board.innerHTML = `
    <div class="hundred-clear-message">
      ${this.targetCorrect}問正解達成!!
    </div>
  `;

        // ========================================
        // 解答UIを非表示
        // ========================================

        const questionUI = app.querySelector('#question-ui');

        if (questionUI) {
            questionUI.style.visibility = 'hidden';
        }

        // ========================================
        // 3秒後にリザルト画面へ
        // ========================================

        setTimeout(() => {
            result();
        }, 3000);

    }
}
