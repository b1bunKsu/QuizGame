// One class per question type; central registry keeps QuizGame independent of UI details.
class QuestionManager {
    static types = new Map([
        ['OX', OXQuestion],
        ['CHOICE', ChoiceQuestion],
        ['ONE_WAY', OneWayQuestion],
        ['RENSOU', RensouQuestion],
        ['MULTIPLE_CHOICE', MultipleChoiceQuestion],
        ['ORDER', OrderQuestion],
        ['ORDER-A', OrderAQuestion],
        ['NUMBER', NumberQuestion],
        ['KANA', KanaQuestion],
        ['KATAKANA', KatakanaQuestion],
        ['EFFECT', EffectQuestion],
        ['POLYHEDRON', PolyhedronQuestion],
        ['CHARACTER_PANEL', CharacterPanelQuestion],
        ['REARRANGEMENT', RearrangementQuestion],
        ['GROUP', GroupQuestion],
        ['SLOT', SlotQuestion],
        ['LINE_MATCHING', LineMatchingQuestion],
        ['IMAGE_TOUCH', ImageTouchQuestion],
    ]);
    static create(q, ui) { const Type = this.types.get(q.type); if (!Type) throw new Error(`Unsupported question type: ${q.type}`); return new Type(q, ui); }
}
