const SYSTEMS={
  linear:{initial:{A:4,B:7,C:2,D:6,E:3,F:8},resource:12},
  nonlinear:{initial:{A:4,B:6,C:3,D:5,E:3,F:7},resource:14}
};
let version='linear', state={...SYSTEMS.linear.initial}, resource=SYSTEMS.linear.resource;
let cMode='I', dMode='I', attempt=1, log=[], locked=false;
const nodesEl=document.querySelector('#nodes'), goalsEl=document.querySelector('#goals');
const resourceEl=document.querySelector('#resource'), meterEl=document.querySelector('#meter');
const toast=document.querySelector('#toast'), dialog=document.querySelector('#win-dialog');

function effectFor(key,delta,before){
  const changes={[key]:delta};
  if(version==='linear'){
    if(key==='A') changes.B=-delta;
    if(key==='C') changes.A=delta;
    if(key==='D'||key==='E') changes.F=delta;
  }else{
    if(key==='A') changes.B=-delta;
    if(key==='B') changes.A=-delta;
    if(key==='C') changes[cMode==='I'?'A':'B']=delta;
    if(key==='D'&&dMode==='I') changes.F=delta;
    if(key==='F'&&delta>0&&before.E<4) changes.D=1;
  }
  return changes;
}

function act(key,delta){
  if(locked||resource<=0)return;
  const before={...state}, changes=effectFor(key,delta,before);
  const next={...state}; Object.entries(changes).forEach(([k,v])=>next[k]+=v);
  resource--;
  const valid=Object.values(next).every(v=>v>=1&&v<=10);
  if(valid){
    state=next;
    if(version==='nonlinear'&&key==='F'){
      if(delta>0&&state.E>=4){cMode='II';dMode='II'}
      else if(delta<0&&state.E<4){cMode='I';dMode='I'}
    }
  }
  log.unshift({attempt,action:`${key} ${delta>0?'+1':'−1'}`,before,after:{...state},valid,changes});
  render(valid?Object.keys(changes):[]);
  if(!valid) notify('Ход отклонён: значение вышло за диапазон 1–10');
  if(isWin()){locked=true;setTimeout(win,350)}
}

function isWin(){return goalData().every(([,met])=>met)}
function goalData(){
  const goals=[[`A ≥ 7`,state.A>=7]];
  if(version==='nonlinear') goals.push([`B ≥ 7`,state.B>=7]);
  goals.push([`D ≤ 3`,state.D<=3]);
  goals.push(version==='nonlinear'?[`F ≥ 7`,state.F>=7]:[`F ≥ 6`,state.F>=6]);
  goals.push([`R ≥ 3`,resource>=3]);
  return goals;
}
function stateText(s){return Object.entries(s).map(([k,v])=>`${k}${v}`).join('  ')}
function render(changed=[]){
  document.querySelector('#system-rule').innerHTML=version==='linear'
    ? 'Эффекты подчиняются <strong>постоянным связям</strong>: одинаковое действие всегда даёт одинаковый результат.'
    : 'Результат действия может <strong>зависеть от текущего состояния</strong>. Одинаковое полное состояние и действие всегда дают одинаковый результат.';
  nodesEl.innerHTML=Object.keys(state).map(k=>`<article class="node ${changed.includes(k)?'changed':''}"><span class="node-letter">ПАРАМЕТР ${k}</span><div class="node-value">${state[k]}</div><div class="controls"><button aria-label="Уменьшить ${k}" data-k="${k}" data-d="-1">−</button><button aria-label="Увеличить ${k}" data-k="${k}" data-d="1">+</button></div></article>`).join('');
  const resourceMax=SYSTEMS[version].resource;
  resourceEl.textContent=resource;document.querySelector('#resource-max').textContent=resourceMax;
  meterEl.style.width=`${Math.max(0,resource)/resourceMax*100}%`;
  const goals=goalData();goalsEl.innerHTML=goals.map(([t,m])=>`<li class="${m?'met':''}"><span>${t}</span><span class="goal-icon">${m?'✓':'·'}</span></li>`).join('');
  document.querySelector('#goal-count').textContent=`${goals.filter(x=>x[1]).length} / ${goals.length}`;
  document.querySelector('.attempt-label').textContent=`ПОПЫТКА ${String(attempt).padStart(2,'0')}`;
  document.querySelector('#log').innerHTML=log.length?log.map(e=>`<div class="entry ${e.valid?'':'failed'}"><span>П${String(e.attempt).padStart(2,'0')}</span><span class="action">${e.action}</span><span class="effect">${stateText(e.before)} → ${stateText(e.after)}</span><span>${e.valid?'ПРИНЯТО':'ОТКЛОНЕНО'}</span></div>`).join(''):'<p class="empty">Совершите действие, чтобы начать исследование.</p>';
}
function resetSystem(newAttempt=true){
  if(newAttempt) attempt++;
  state={...SYSTEMS[version].initial};resource=SYSTEMS[version].resource;cMode='I';dMode='I';locked=false;
}
function restart(){resetSystem();dialog.close();render();notify(`Попытка ${String(attempt).padStart(2,'0')} начата`)}
function notify(text){toast.textContent=text;toast.classList.add('show');clearTimeout(notify.t);notify.t=setTimeout(()=>toast.classList.remove('show'),2400)}
function win(){document.querySelector('#win-copy').textContent=`Вы нашли решение за ${SYSTEMS[version].resource-resource} действий. Остаток ресурса: ${resource}.`;dialog.showModal()}
nodesEl.addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(b)act(b.dataset.k,Number(b.dataset.d))});
document.querySelector('#restart').addEventListener('click',restart);document.querySelector('#win-restart').addEventListener('click',restart);
document.querySelectorAll('.mode-btn').forEach(b=>b.addEventListener('click',()=>{version=b.dataset.version;attempt=1;log=[];resetSystem(false);document.querySelectorAll('.mode-btn').forEach(x=>x.classList.toggle('active',x===b));render();notify(version==='linear'?'Система 01 загружена':'Система 02 загружена')}));
document.querySelector('#toggle-log').addEventListener('click',e=>{const l=document.querySelector('#log');const hidden=l.hidden;l.hidden=!hidden;e.target.textContent=hidden?'СВЕРНУТЬ ↑':'РАЗВЕРНУТЬ ↓'});
render();
