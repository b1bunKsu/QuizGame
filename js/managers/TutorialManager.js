class TutorialManager {
  static lessons = [
    {
      "type": "OX",
      "label": "○×",
      "instruction": "正しければ○、間違っていれば×を押します",
      "question": "日本の首都は東京都である",
      "difficulty": "EASY",
      "answer": "O"
    },
    {
      "type": "CHOICE",
      "label": "四択",
      "instruction": "正しい選択肢を1つ押します",
      "question": "日本の首都は？",
      "difficulty": "EASY",
      "choices": [
        "東京都",
        "大阪府",
        "京都府",
        "北海道"
      ]
    },
    {
      "type": "ONE_WAY",
      "label": "一方通行",
      "instruction": "正解なら選択し、違うなら不適ボタンで見送ります",
      "question": "日本の首都は？",
      "difficulty": "EASY",
      "choices": [
        "東京都",
        "大阪府",
        "京都府",
        "北海道"
      ]
    },
    {
      "type": "MULTIPLE_CHOICE",
      "label": "一問多答",
      "instruction": "正しい選択肢をすべて選んでOKを押します",
      "question": "哺乳類をすべて選びなさい",
      "difficulty": "EASY",
      "answers": [
        "イヌ",
        "ネコ",
        "クジラ"
      ],
      "choices": [
        "イヌ",
        "ネコ",
        "クジラ",
        "カエル",
        "スズメ",
        "マグロ",
        "ワニ",
        "カメ",
        "メダカ"
      ]
    },
    {
      "type": "KANA",
      "label": "ひらがな",
      "instruction": "文字を入力してOKを押します",
      "question": "犬の読みをひらがなで答えなさい",
      "difficulty": "EASY",
      "answer": "いぬ"
    },
    {
      "type": "KATAKANA",
      "label": "カタカナ",
      "instruction": "文字を入力してOKを押します",
      "question": "英語でAppleと呼ばれる果物は？",
      "difficulty": "EASY",
      "answer": "リンゴ"
    },
    {
      "type": "NUMBER",
      "label": "英数字",
      "instruction": "文字を入力してOKを押します",
      "question": "3×4はいくつ？",
      "difficulty": "EASY",
      "answer": "12"
    },
    {
      "type": "EFFECT",
      "label": "エフェクト",
      "instruction": "文字を入力してOKを押します",
      "question": "表示される漢字の読みを答えなさい",
      "difficulty": "EASY",
      "answer": "たいよう",
      "hint": "太陽"
    },
    {
      "type": "POLYHEDRON",
      "label": "キューブ",
      "instruction": "文字を入力してOKを押します",
      "question": "回転する立体の文字を並べてできる果物は？",
      "difficulty": "EASY",
      "answer": "オレンジ"
    },
    {
      "type": "CHARACTER_PANEL",
      "label": "文字パネル",
      "instruction": "文字を順に選び、OKを押します",
      "question": "日本の首都は？",
      "difficulty": "EASY",
      "answer": "東京都",
      "choices": [
        "東",
        "京",
        "都",
        "大",
        "阪",
        "府",
        "北",
        "海",
        "名",
        "古"
      ]
    },
    {
      "type": "REARRANGEMENT",
      "label": "並べ替え",
      "instruction": "文字を並べ替えて正しい言葉を作ります",
      "question": "英語でAppleと呼ばれる果物は？",
      "difficulty": "EASY",
      "answer": "リンゴ"
    },
    {
      "type": "SLOT",
      "label": "スロット",
      "instruction": "上下のボタンで文字を合わせてOKを押します",
      "question": "日本の首都は？",
      "difficulty": "EASY",
      "choices": [
        "東京",
        "大阪",
        "京都",
        "神戸"
      ]
    },
    {
      "type": "GROUP",
      "label": "グループ分け",
      "instruction": "矢印で各選択肢を正しいグループに移し、OKを押します",
      "question": "動物を分類しなさい",
      "difficulty": "EASY",
      "groups": {
        "A": {
          "name": "哺乳類",
          "choices": [
            "イヌ",
            "ネコ"
          ]
        },
        "B": {
          "name": "鳥類",
          "choices": [
            "スズメ",
            "ハト"
          ]
        }
      }
    },
    {
      "type": "ORDER",
      "label": "順番当て",
      "instruction": "指定された順に選択肢を押します",
      "question": "小さい数から順に選びなさい",
      "difficulty": "EASY",
      "choices": [
        "1",
        "2",
        "3",
        "4"
      ]
    },
    {
      "type": "ORDER-A",
      "label": "順番当て（全選択肢）",
      "instruction": "指定された順に選択肢を押します",
      "question": "小さい数から順に選びなさい",
      "difficulty": "EASY",
      "choices": [
        "1",
        "2",
        "3",
        "4"
      ]
    },
    {
      "type": "LINE_MATCHING",
      "label": "線結び",
      "instruction": "左と右の対応する選択肢を結び、OKを押します",
      "question": "計算式と答えを結びなさい",
      "difficulty": "EASY",
      "leftChoices": [
        "1+1",
        "2+2",
        "3+3"
      ],
      "rightChoices": [
        "2",
        "4",
        "6"
      ]
    },
    {
      "type": "RENSOU",
      "label": "連想",
      "instruction": "順に現れるヒントから答えを選びます",
      "question": "",
      "difficulty": "EASY",
      "hints": [
        "果物",
        "赤いものが多い",
        "青森県の特産品",
        "英語でApple"
      ],
      "choices": [
        "リンゴ",
        "ミカン",
        "バナナ",
        "ブドウ"
      ]
    },
    {
      "type": "IMAGE_TOUCH",
      "label": "画像タッチ",
      "instruction": "画像の正しい場所を押してOKを押します",
      "question": "赤い四角形を選びなさい",
      "difficulty": "EASY",
      "imagePath": "tutorial/shapes.svg",
      "answerAreas": [
        [
          {
            "x": 0,
            "y": 0
          },
          {
            "x": 0.5,
            "y": 0
          },
          {
            "x": 0.5,
            "y": 1
          },
          {
            "x": 0,
            "y": 1
          }
        ]
      ]
    }
  ];
  static get active() { return state.mode === "TUTORIAL"; }
  static typingTypes = new Set(['KANA', 'KATAKANA', 'NUMBER']);
  static orderTypes = new Set(['ORDER', 'ORDER-A']);
  static get menuLessons() {
    return this.lessons.flatMap(q => {
      if (q.type === 'KANA') return [{ type: 'TYPING', label: 'タイピング' }];
      if (this.typingTypes.has(q.type)) return [];
      if (q.type === 'ORDER') return [{ type: 'ORDER_RANDOM', label: '順番当て' }];
      if (this.orderTypes.has(q.type)) return [];
      return [q];
    });
  }
  static resolveLesson(q) {
    const types = q.type === 'TYPING' ? this.typingTypes
      : q.type === 'ORDER_RANDOM' ? this.orderTypes : null;
    if (!types) return q;
    const pool = this.lessons.filter(item => types.has(item.type));
    return pool[Math.floor(Math.random() * pool.length)];
  }
  static menu() { clearTimer(); new TutorialView(app).menu(this.menuLessons, i => this.start(i), () => title()); }
  static start(i) { state.mode = "TUTORIAL"; state.questions = (i === null ? this.menuLessons : [this.menuLessons[i]]).map(q => structuredClone(this.resolveLesson(q))); state.index = 0; state.correct = 0; state.score = 0; state.history = []; updateModeBackground(); showQuestion(); }
  static feedback(correct) { new TutorialView(app).feedback(correct, () => { if (correct) state.index++; if (state.index >= state.questions.length) this.menu(); else showQuestion(); }); }
}
