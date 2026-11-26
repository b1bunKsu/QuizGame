class TutorialView {
 constructor(container){this.container=container;}
 menu(lessons,start,back){
 this.container.innerHTML=`<div class="center screen-enter" style="gap:12px"><div class="title" style="font-size:44px">チュートリアル</div><button class="btn" id="tutorial-all">最初から体験する</button><div style="display:grid;grid-template-columns:repeat(3,260px);gap:8px">${lessons.map((q,i)=>`<button class="btn" style="font-size:20px;height:48px;min-height:0;width:260px" data-lesson="${i}">${esc(q.label)}</button>`).join('')}</div><button class="btn" id="tutorial-back">タイトルへ戻る</button></div>`;
 this.container.querySelector('#tutorial-all').onclick=()=>start(null);
 this.container.querySelector('#tutorial-back').onclick=back;
 this.container.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>start(Number(b.dataset.lesson)));
 }
 instruction(q){const area=this.container.querySelector('.timer-area-web');if(area){area.innerHTML='';const text=document.createElement('span');text.textContent=q.instruction;Object.assign(text.style,{fontSize:'20px',color:'white',textShadow:'0 1px 3px black'});area.append(text);}this.container.querySelector('#national-rate')?.remove();}
 feedback(correct,next){const b=document.createElement('button');b.className='btn tutorial-progress-button';b.type='button';b.textContent=correct?'次へ':'もう一度';Object.assign(b.style,{position:'absolute',right:'30px',bottom:'20px',zIndex:'1000',width:'200px'});b.style.setProperty('opacity','1','important');b.style.setProperty('pointer-events','auto','important');b.style.setProperty('cursor','pointer','important');b.onclick=()=>{if(b.disabled)return;b.disabled=true;next();};this.container.querySelector('.quiz-shell').append(b);}
}
