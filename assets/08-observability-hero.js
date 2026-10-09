(function(){
  var root=document.getElementById('w8-demo');if(!root)return;
  var EDGES=[0.1,0.25,0.5,1,2.5,Infinity],LBL=['≤0.1 s','≤0.25','≤0.5','≤1','≤2.5','+Inf'];
  var samples=[],timer=null,rate=140;
  var elN=document.getElementById('w8-n'),elAvg=document.getElementById('w8-avg'),elP95=document.getElementById('w8-p95'),elEst=document.getElementById('w8-est'),
      hist=document.getElementById('w8-hist'),btn=document.getElementById('w8-run'),reset=document.getElementById('w8-reset'),note=document.getElementById('w8-note'),last=document.getElementById('w8-last');
  var bars=[];hist.innerHTML='';
  LBL.forEach(function(l){var d=document.createElement('div');d.className='w8-bar';d.innerHTML='<i></i><b>0</b><span>'+l+'</span>';hist.appendChild(d);bars.push(d)});
  // a fake /checkout: 300 ms plus jitter, and one call in ten takes 2 s longer
  function fake(){var s=0.3+(Math.random()-0.5)*0.08;if(Math.random()<0.1)s+=2;return s}
  function bucket(s){for(var i=0;i<EDGES.length;i++)if(s<=EDGES[i])return i;return EDGES.length-1}
  function fmt(s){return s>=1?s.toFixed(2)+' s':Math.round(s*1000)+' ms'}
  function render(){
    var n=samples.length;elN.textContent=n;
    if(!n){elAvg.textContent=elP95.textContent=elEst.textContent='–';bars.forEach(function(b){b.querySelector('i').style.height='0%';b.querySelector('b').textContent='0'});note.textContent='Press start. Each fake request lands in one bucket.';return}
    var sum=0,counts=[0,0,0,0,0,0];samples.forEach(function(s){sum+=s;counts[bucket(s)]++});
    var sorted=samples.slice().sort(function(a,b){return a-b}),p95=sorted[Math.min(n-1,Math.ceil(0.95*n)-1)];
    // what Prometheus would say: cumulative buckets, linear interpolation inside the bucket that crosses 95%
    var cum=0,est=NaN,target=0.95*n,lo=0;
    for(var i=0;i<counts.length;i++){var prev=cum;cum+=counts[i];if(cum>=target){var hi=EDGES[i];if(!isFinite(hi)){est=EDGES[i-1]}else{est=lo+(hi-lo)*((target-prev)/(counts[i]||1))}break}lo=EDGES[i]}
    elAvg.textContent=fmt(sum/n);elP95.textContent=fmt(p95);elEst.textContent=isNaN(est)?'–':'≈ '+fmt(est);
    var max=Math.max.apply(null,counts)||1;
    bars.forEach(function(b,i){b.querySelector('i').style.height=Math.round(counts[i]/max*100)+'%';b.querySelector('b').textContent=counts[i];b.classList.toggle('w8-hot',i>=4&&counts[i]>0)});
    var slow=counts[4]+counts[5];
    var pct=Math.round(slow/n*100);
    note.textContent=n<20?'Watch the two right-hand buckets.':slow/n>=0.05?'The average is '+fmt(sum/n)+', which looks fine. But '+slow+' of '+n+' customers ('+pct+'%) waited over two seconds; the average hides them and p95 does not.':slow+' of '+n+' customers ('+pct+'%) waited over two seconds. Fewer than one in twenty so far, so even p95 still hides them: a percentile only shows a tail bigger than its own gap.';
  }
  function tick(){var s=fake();samples.push(s);if(samples.length>400)samples.shift();last.textContent=fmt(s);last.classList.toggle('w8-hot',s>1);render()}
  function run(on){if(on&&!timer){timer=setInterval(tick,rate);btn.textContent='Pause';btn.setAttribute('aria-pressed','true')}else if(!on&&timer){clearInterval(timer);timer=null;btn.textContent='Start';btn.setAttribute('aria-pressed','false')}}
  btn.addEventListener('click',function(){run(!timer)});
  reset.addEventListener('click',function(){samples=[];last.textContent='–';last.classList.remove('w8-hot');render()});
  document.addEventListener('visibilitychange',function(){if(document.hidden)run(false)});
  render();
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduce)run(true);
})();
