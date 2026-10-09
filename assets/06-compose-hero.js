(function(){
  var svg=document.getElementById('w6-demo');if(!svg)return;
  var NS='http://www.w3.org/2000/svg',dots=document.getElementById('w6-dots'),qlen=document.getElementById('w6-qlen'),stat=document.getElementById('w6-stat');
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ease=reduce?1:0.18,WORK=1000,DEAD=900;
  var LAY={1:[[60,110]],3:[[38,50],[98,50],[158,50]]};      // y, height of each worker box
  var jobs=[],queue=[],workers=[],done=0,lost=0,nextId=1,killAt=0;
  function el(id){return document.getElementById(id)}
  function setWorkers(n){
    workers=[];
    for(var i=0;i<3;i++){var g=el('w6-wk'+i);var on=i<n;g.classList.remove('w6-busy','w6-dead');g.querySelector('.w6-state').textContent='idle';if(on)g.removeAttribute('hidden');else g.setAttribute('hidden','');
      if(on){var L=LAY[n][i],r=g.querySelector('rect'),t=g.querySelectorAll('text');r.setAttribute('y',L[0]);r.setAttribute('height',L[1]);
        var mid=L[0]+L[1]/2;t[0].setAttribute('y',n===1?90:mid-4);t[1].setAttribute('y',n===1?114:mid+16);t[2].setAttribute('y',n===1?136:mid+16);
        t[1].style.display=n===1?'':'none';workers.push({g:g,cy:n===1?115:mid,job:null,deadUntil:0,state:t[2]});}
    }
    jobs.forEach(function(j){if(j.phase==='out'||j.phase==='work'){j.phase='in';j.worker=null;}});// re-home in-flight dots
    jobs.filter(function(j){return j.phase==='in'&&j.worker===null&&queue.indexOf(j)<0}).forEach(function(j){queue.unshift(j)});
    document.querySelectorAll('#w6-demo .seg button').forEach(function(b){b.setAttribute('aria-pressed',String(Number(b.dataset.w)===n))});
  }
  function post(){
    var c=document.createElementNS(NS,'circle');c.setAttribute('r','7');c.setAttribute('class','w6-dot');c.setAttribute('cx',148);c.setAttribute('cy',115);dots.appendChild(c);
    var j={id:nextId++,el:c,x:148,y:115,tx:148,ty:115,phase:'in',worker:null,t:0};jobs.push(j);queue.unshift(j);   // LPUSH: new job at the head (left)
  }
  function slotX(k,n){ // k = 0 for the oldest (right end); slots run from x=337 leftwards, 17 apart
    return Math.max(219,337-k*17);
  }
  function tick(now){
    var q=queue.length;qlen.textContent=q+' waiting';
    // hand the oldest job to any idle worker (BRPOP takes from the right end)
    workers.forEach(function(w){
      if(w.job||now<w.deadUntil||!queue.length)return;
      if(w.deadUntil){w.g.classList.remove('w6-dead');w.deadUntil=0;}
      var j=queue.pop();w.job=j;j.worker=w;j.phase='out';j.tx=428;j.ty=w.cy;w.g.classList.add('w6-busy');w.state.textContent='working';
    });
    workers.forEach(function(w){if(!w.job&&w.deadUntil&&now>=w.deadUntil){w.g.classList.remove('w6-dead');w.deadUntil=0;w.state.textContent='idle';}});
    var working=0;
    jobs.forEach(function(j){
      if(j.phase==='in'){var k=queue.indexOf(j);j.tx=slotX(queue.length-1-k,queue.length);j.ty=116;}
      j.x+=(j.tx-j.x)*ease;j.y+=(j.ty-j.y)*ease;
      if(j.phase==='out'&&Math.abs(j.tx-j.x)<1&&Math.abs(j.ty-j.y)<1){j.phase='work';j.t=now;}
      if(j.phase==='work'){working++;if(now-j.t>=WORK){j.phase='done';j.t=now;done++;j.worker.job=null;j.worker.g.classList.remove('w6-busy');j.worker.state.textContent='idle';j.el.classList.add('w6-done');}}
      if(j.phase==='lost'){j.ty=215;j.el.classList.add('w6-lost');if(now-j.t>DEAD)j.phase='gone';}
      if(j.phase==='done'&&now-j.t>400)j.phase='gone';
      j.el.setAttribute('cx',j.x.toFixed(1));j.el.setAttribute('cy',j.y.toFixed(1));
    });
    jobs=jobs.filter(function(j){if(j.phase==='gone'){j.el.remove();return false}return true});
    stat.textContent='queue '+q+' · working '+working+' · done '+done+' · lost '+lost;
    requestAnimationFrame(tick);
  }
  function kill(){
    var w=null;workers.forEach(function(c){if(!w&&c.job&&c.job.phase==='work')w=c});
    if(!w){stat.textContent='no worker is busy right now: post a job first, then kill';return}
    var j=w.job;j.phase='lost';j.t=performance.now();lost++;w.job=null;w.deadUntil=performance.now()+DEAD;w.g.classList.remove('w6-busy');w.g.classList.add('w6-dead');w.state.textContent='killed';
  }
  el('w6-post').addEventListener('click',post);
  el('w6-burst').addEventListener('click',function(){for(var i=0;i<8;i++)post()});
  el('w6-kill').addEventListener('click',kill);
  document.querySelectorAll('#w6-demo .seg button').forEach(function(b){b.addEventListener('click',function(){setWorkers(Number(b.dataset.w))})});
  setWorkers(1);requestAnimationFrame(tick);
})();
