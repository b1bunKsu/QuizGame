class GameModeManager {
  static modes = new Map([
    ['STANDARD', new StandardMode()],
    ['HIGH_SPEED', new HighSpeedMode()],
    ['HUNDRED_CHALLENGE', new HundredChallengeMode()]
  ]);
  static fallback = new BaseGameMode();
  static get(id) { return this.modes.get(id) ?? this.fallback; }
  static get current() { return this.get(state.mode); }
}
