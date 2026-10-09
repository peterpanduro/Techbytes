
(function(){
  var slides=[].slice.call(document.querySelectorAll('.stage .slide'));
  var n=slides.length,i=0,deckId=document.body.dataset.deck;
  var plan=slides.map(function(s){return Number(s.dataset.minutes)||0});
  var cum=[];plan.reduce(function(a,m,k){cum[k]=a;return a+m},0);
  var bar=document.querySelector('.deck-ui i'),num=document.querySelector('.deck-num');
  var pres=document.querySelector('.pres'),nextBox=pres.querySelector('.next'),notes=pres.querySelector('.notes .txt'),clockEl=pres.querySelector('.clock');
  var chan=null;try{chan=new BroadcastChannel('tb-deck-'+deckId)}catch(e){}
  function fit(){
    var w=innerWidth,h=innerHeight,el=document.querySelector('.stage');
    if(document.body.classList.contains('presenter')){var r=el.getBoundingClientRect();w=r.width;h=r.height}
    var s=Math.min(w/1280,h/720);el.style.setProperty('--s',s);
    if(nextBox){var r2=nextBox.getBoundingClientRect();nextBox.style.setProperty('--s',Math.min(r2.width/1280,r2.height/720))}
  }
  function show(k,quiet,user){
    k=Math.max(0,Math.min(n-1,k));i=k;
    slides.forEach(function(s,j){s.classList.toggle('on',j===i)});
    bar.style.width=((i+1)/n*100)+'%';num.textContent=(i+1)+' / '+n;
    try{history.replaceState(null,'','#'+(i+1))}catch(e){}
    if(user&&i>0)startClock();
    renderPresenter();
    if(!quiet){try{chan&&chan.postMessage({i:i})}catch(e){}try{localStorage.setItem('tb-deck-pos:'+deckId,JSON.stringify({i:i,t:Date.now()}))}catch(e){}}
  }
  function renderPresenter(){
    if(!document.body.classList.contains('presenter'))return;
    nextBox.innerHTML='<span class="lbl">'+(i+1<n?'next':'end')+'</span>';
    if(i+1<n){var c=slides[i+1].cloneNode(true);c.classList.add('on');c.removeAttribute('id');nextBox.appendChild(c)}
    var s=slides[i];notes.innerHTML='<p class="s-kicker" style="font-size:.75rem">'+(i+1)+' · '+(s.dataset.title||'')+' · '+plan[i]+' min</p>'+(s.dataset.notes||'');
    fit();
  }
  var t0=null;try{t0=Number(sessionStorage.getItem('tb-deck-t0:'+deckId))||null}catch(e){}
  function startClock(){if(!t0){t0=Date.now();try{sessionStorage.setItem('tb-deck-t0:'+deckId,String(t0))}catch(e){}}}
  function fmt(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
  function tick(){
    if(!document.body.classList.contains('presenter'))return;
    var el=t0?(Date.now()-t0)/1000:0,p=cum[i]*60,d=el-p;
    clockEl.innerHTML='<span>elapsed</span><b>'+fmt(el)+'</b><span>this slide is planned to start at</span><span class="plan">'+fmt(p)+'</span>'+
      (t0?'<span class="'+(d>60?'over':'under')+'">'+(d>=0?'+':'−')+fmt(Math.abs(d))+' vs plan</span>':'<span>clock starts on the first advance</span>')+
      '<button type="button" id="clk-reset">reset clock</button>';
    var b=document.getElementById('clk-reset');if(b)b.onclick=function(){t0=null;try{sessionStorage.removeItem('tb-deck-t0:'+deckId)}catch(e){}tick()};
  }
  setInterval(tick,1000);
  function togglePresenter(){document.body.classList.toggle('presenter');renderPresenter();tick();fit()}
  var help=document.querySelector('.deck-help');
  addEventListener('keydown',function(e){
    if(e.target&&/INPUT|TEXTAREA|BUTTON/.test(e.target.tagName)&&e.key!=='Escape')return;
    switch(e.key){
      case 'ArrowRight':case ' ':case 'PageDown':case 'n':show(i+1,false,true);e.preventDefault();break;
      case 'ArrowLeft':case 'PageUp':case 'p':show(i-1,false,true);e.preventDefault();break;
      case 'Home':show(0);break;case 'End':show(n-1);break;
      case 'f':if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();break;
      case 's':togglePresenter();break;
      case 't':var r=document.documentElement,d=r.dataset.theme==='dark';r.dataset.theme=d?'light':'dark';break;
      case '?':help.classList.toggle('on');break;
      case 'Escape':if(help.classList.contains('on'))help.classList.remove('on');else if(document.body.classList.contains('presenter'))togglePresenter();break;
    }
  });
  help.addEventListener('click',function(){help.classList.remove('on')});
  if(chan)chan.onmessage=function(m){if(m.data&&typeof m.data.i==='number'&&m.data.i!==i)show(m.data.i,true)};
  addEventListener('storage',function(e){if(e.key==='tb-deck-pos:'+deckId&&e.newValue){try{var v=JSON.parse(e.newValue);if(v.i!==i)show(v.i,true)}catch(x){}}});
  addEventListener('resize',fit);
  addEventListener('hashchange',function(){var h=parseInt((location.hash||'#1').slice(1),10);if(!isNaN(h)&&h-1!==i)show(h-1)});
  var h=parseInt((location.hash||'#1').slice(1),10);show(isNaN(h)?0:h-1,true);fit();
})();
