import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRevealController, setupPortrait } from '../assets/portrait.js';

function fixture() {
  let now = 0, nextId = 0;
  const pending = new Map(), states = [];
  const timers = {
    setTimeout(fn, delay) { const id = ++nextId; pending.set(id, { at: now + delay, fn }); return id; },
    clearTimeout(id) { pending.delete(id); }
  };
  const controller = createRevealController((stage, holding) => states.push({stage, holding}), timers);
  return { controller, states, tick(ms) {
    now += ms;
    for (const [id, task] of pending) if (task.at <= now) { pending.delete(id); task.fn(); }
  } };
}
test('initial hold cannot bypass the avatar; click shows the dog and requires a fresh full hold', () => {
  const {controller:c,tick} = fixture();
  c.startHold();tick(3000);assert.equal(c.stage,0);
  c.click();assert.equal(c.stage,1);
  c.click();c.click();assert.equal(c.stage,1);
  c.startHold();tick(1999);assert.equal(c.stage,1);
  tick(1);assert.equal(c.stage,2);
  c.cancelHold();c.click();assert.equal(c.stage,2);
});
test('interrupted holds reset instead of accumulating; repeated starts do not create extra timers', () => {
  const {controller:c,tick,states} = fixture();
  c.click();c.startHold();tick(1500);c.cancelHold();tick(2000);assert.equal(c.stage,1);
  c.startHold();tick(1000);c.startHold();tick(999);assert.equal(c.stage,1);
  tick(1);assert.equal(c.stage,2);
  assert.deepEqual(states.at(-1),{stage:2,holding:false});
});

function viewFixture(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const button = new EventTarget(), document = new EventTarget();
  const attrs = new Map(), classes = new Set();
  button.setAttribute = (name,value) => attrs.set(name,value);
  document.defaultView = new EventTarget();
  document.hidden = false;
  const images = [{hidden:false},{hidden:true},{hidden:true}], status = {textContent:'Click'};
  const root = {
    ownerDocument: document,
    dataset:{stage:'0',hint0:'Click',hint1:'Hold',hint2:'Zhitao Liu',label0:'Avatar',label1:'Dog',label2:'Portrait'},
    classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);}},
    querySelector(selector){return selector==='.portrait-button'?button:status;},
    querySelectorAll(){return images;}
  };
  setupPortrait(root);
  const send = (target,type,props={}) => {
    const event = new Event(type,{cancelable:true});
    for(const [key,value] of Object.entries(props))Object.defineProperty(event,key,{value});
    target.dispatchEvent(event);
  };
  const down = (pointerType='mouse') => send(button,'pointerdown',{isPrimary:true,button:0,pointerId:7,clientX:40,clientY:40,pointerType});
  return {button,document,root,images,status,attrs,classes,send,down,tick:ms=>t.mock.timers.tick(ms)};
}

test('mouse and touch: click reveals dog, short holds cancel, uninterrupted hold reveals portrait', t => {
  const f=viewFixture(t);
  f.send(f.button,'click');assert.deepEqual(f.images.map(i=>i.hidden),[true,false,true]);
  f.down();f.tick(1500);f.send(f.document,'pointerup',{pointerId:7});f.tick(2000);
  assert.equal(f.root.dataset.stage,'1');
  f.down('touch');f.tick(1999);assert.equal(f.root.dataset.stage,'1');
  f.tick(1);assert.equal(f.root.dataset.stage,'2');
  assert.deepEqual(f.images.map(i=>i.hidden),[true,true,false]);
  assert.equal(f.attrs.get('aria-label'),'Portrait');
  assert.equal(f.attrs.get('aria-disabled'),'true');
  f.send(f.document,'pointerup',{pointerId:7});f.send(f.button,'click');
  assert.equal(f.root.dataset.stage,'2');
});

test('movement, pointer leave/cancel, focus loss and hidden tabs each cancel the hold', t => {
  const f=viewFixture(t);f.send(f.button,'click');
  const interruptions=[
    ()=>f.send(f.button,'pointermove',{pointerId:7,clientX:40,clientY:70}),
    ()=>f.send(f.button,'pointerleave'),
    ()=>f.send(f.document,'pointercancel',{pointerId:7}),
    ()=>f.send(f.button,'blur'),
    ()=>f.send(f.document.defaultView,'blur'),
    ()=>{f.document.hidden=true;f.send(f.document,'visibilitychange');f.document.hidden=false;}
  ];
  for(const interrupt of interruptions){f.down('touch');f.tick(1700);interrupt();f.tick(3000);assert.equal(f.root.dataset.stage,'1');assert.equal(f.classes.has('is-holding'),false);}
});

test('keyboard: a fresh hold is required, autorepeat does not restart it, early keyup cancels', t => {
  const f=viewFixture(t);f.send(f.button,'click');
  f.send(f.button,'keydown',{key:'Enter',repeat:true});f.tick(3000);assert.equal(f.root.dataset.stage,'1');
  f.send(f.button,'keydown',{key:' ',repeat:false});f.tick(1500);f.send(f.button,'keyup',{key:' '});f.tick(3000);assert.equal(f.root.dataset.stage,'1');
  f.send(f.button,'keydown',{key:'Enter',repeat:false});f.tick(1000);f.send(f.button,'keydown',{key:'Enter',repeat:true});f.tick(1000);
  assert.equal(f.root.dataset.stage,'2');
});
