class HighSpeedMode extends BaseGameMode {
    get name() { return 'ハイスピード'; }
    get background() { return 'assets/images/high_speed.jpg'; }
    get timeLimit() { return 5; }
    get questionCount() { return 15; }
    get wipeSpeed() { return 3; }
    filterQuestions(questions) {
        const types = new Set(['OX', 'CHOICE', 'ONE_WAY', 'RENSOU', 'IMAGE_TOUCH', 'MULTIPLE_CHOICE']);
        return questions.filter(q => types.has(q.type));
    }
}
