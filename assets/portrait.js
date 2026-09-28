// Each visit starts with the avatar. A separate, uninterrupted two-second hold
// is required after the first click; short or interrupted holds do not add up.
export function createRevealController(onChange, timers = globalThis) {
  let stage = 0;
  let timer = null;
  const cancelHold = () => {
    if (timer !== null) timers.clearTimeout(timer);
    timer = null;
    onChange(stage, false);
  };
  return {
    get stage() { return stage; },
    click() {
      if (stage !== 0) return;
      stage = 1;
      onChange(stage, false);
    },
    startHold() {
      if (stage !== 1 || timer !== null) return;
      onChange(stage, true);
      timer = timers.setTimeout(() => {
        timer = null;
        stage = 2;
        onChange(stage, false);
      }, 2000);
    },
    cancelHold
  };
}

export function setupPortrait(root) {
  const button = root.querySelector('.portrait-button');
  const layers = [...root.querySelectorAll('.portrait-layer')];
  const status = root.querySelector('.portrait-status');
  let activeInput = null;
  const controller = createRevealController((stage, holding) => {
    root.dataset.stage = String(stage);
    root.classList.toggle('is-holding', holding);
    layers.forEach((image, index) => { image.hidden = index !== stage; });
    status.textContent = root.dataset[`hint${stage}`];
    button.setAttribute('aria-label', root.dataset[`label${stage}`]);
    button.setAttribute('aria-disabled', String(stage === 2));
  });
  const cancel = () => {
    activeInput = null;
    controller.cancelHold();
  };
  button.addEventListener('click', () => controller.click());
  button.addEventListener('pointerdown', event => {
    if (controller.stage !== 1 || activeInput || !event.isPrimary || event.button !== 0) return;
    activeInput = { type: 'pointer', id: event.pointerId, x: event.clientX, y: event.clientY };
    controller.startHold();
  });
  button.addEventListener('pointermove', event => {
    if (activeInput?.type !== 'pointer' || activeInput.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - activeInput.x, event.clientY - activeInput.y) > 12) cancel();
  });
  for (const type of ['pointerup', 'pointercancel']) {
    root.ownerDocument.addEventListener(type, event => {
      if (activeInput?.type === 'pointer' && activeInput.id === event.pointerId) cancel();
    });
  }
  button.addEventListener('pointerleave', () => {
    if (activeInput?.type === 'pointer') cancel();
  });
  button.addEventListener('contextmenu', event => event.preventDefault());
  button.addEventListener('dragstart', event => event.preventDefault());
  button.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key) || controller.stage === 0) return;
    event.preventDefault();
    if (event.repeat || activeInput || controller.stage !== 1) return;
    activeInput = { type: 'key', key: event.key };
    controller.startHold();
  });
  button.addEventListener('keyup', event => {
    if (activeInput?.type === 'key' && activeInput.key === event.key) {
      event.preventDefault();
      cancel();
    }
  });
  button.addEventListener('blur', cancel);
  root.ownerDocument.addEventListener('visibilitychange', () => {
    if (root.ownerDocument.hidden) cancel();
  });
  root.ownerDocument.defaultView.addEventListener('blur', cancel);
}

if (typeof document !== 'undefined') {
  document.querySelectorAll('.portrait-reveal').forEach(setupPortrait);
}
