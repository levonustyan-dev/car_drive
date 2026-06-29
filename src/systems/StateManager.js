export const States = {
  LOADING:          'LOADING',
  MENU:             'MENU',
  PLAYING:          'PLAYING',
  PAUSED:           'PAUSED',
  MISSION_COMPLETE: 'MISSION_COMPLETE',
  GAME_OVER:        'GAME_OVER',
};

export class StateManager {
  constructor() {
    this._state      = null;
    this._enter      = {};
    this._exit       = {};
    this._overlay    = document.getElementById('overlay');
    this._menuPanel  = document.getElementById('overlay-menu');
    this._pausePanel = document.getElementById('overlay-pause');
  }

  getState() { return this._state; }

  setState(next) {
    const prev = this._state;
    if (prev) (this._exit[prev]  || []).forEach(cb => cb());
    this._state = next;
    this._syncOverlay();
    (this._enter[next] || []).forEach(cb => cb());
  }

  onEnter(state, cb) {
    (this._enter[state] = this._enter[state] || []).push(cb);
  }

  onExit(state, cb) {
    (this._exit[state] = this._exit[state] || []).push(cb);
  }

  _syncOverlay() {
    this._menuPanel.style.display  = 'none';
    this._pausePanel.style.display = 'none';
    if (this._state === States.MENU) {
      this._overlay.style.display = 'flex';
      this._menuPanel.style.display = 'block';
    } else if (this._state === States.PAUSED) {
      this._overlay.style.display = 'flex';
      this._pausePanel.style.display = 'block';
    } else {
      this._overlay.style.display = 'none';
    }
  }
}
