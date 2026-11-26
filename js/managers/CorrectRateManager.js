class CorrectRateManager {
  constructor() {
    this.api = 'https://b1bunksu-quizgame.netlify.app/.netlify/functions/correct-rate';
    this.sequence = 0;
    this.snapshot = null;
  }
  reset() { ++this.sequence; this.snapshot = null; }
  freeze() { ++this.sequence; return this.snapshot; }
  key(q) {
    const type = String(q?.type ?? '');
    const id = String(q?.id ?? '');
    return /^[A-Z][A-Z0-9_-]{0,39}$/.test(type) && /^[1-9]\d{0,11}$/.test(id)
      ? { type, id } : null;
  }

  async load(q, isLocked) {
    const seq = ++this.sequence;
    this.snapshot = null;
    const key = this.key(q);
    if (!key) return;
    try {
      const query = new URLSearchParams(key);
      const response = await fetch(`${this.api}?${query}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (seq === this.sequence && !isLocked() && data.success) {
        this.snapshot = Number.isInteger(data.rate) ? data.rate : null;
      }
    } catch (error) {
      console.warn('全国正解率の取得に失敗:', error);
    }
  }

  submit(q, correct, timeout) {
    const key = this.key(q);
    if (!key) return;
    const requestId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return fetch(this.api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...key, correct: Boolean(correct), timeout: Boolean(timeout), requestId }),
      keepalive: true
    }).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    }).catch(error => console.warn('全国正解率の送信に失敗:', error));
  }

}
