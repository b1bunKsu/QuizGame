class TutorialMode extends BaseGameMode {
 get name(){return "チュートリアル";}
 get background(){return "assets/images/background.jpg";}
 get showProgress(){return false;}
 rankCaption(){return "チュートリアル";}
 rankTarget(){return `${state.index+1} / ${state.questions.length}`;}
 playerCaption(){return "制限時間なし";}
 playerScore(){return "";}
 questionCaption(){return `練習 ${state.index+1} / ${state.questions.length}`;}
}
