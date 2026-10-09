
(function(){
  // copy buttons
  document.querySelectorAll('pre').forEach(function(pre){
    var b=document.createElement('button');b.className='cp';b.type='button';b.textContent='Copy';
    b.addEventListener('click',function(){
      var txt=pre.querySelector('code').innerText;
      try{navigator.clipboard.writeText(txt).then(function(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1200)})}
      catch(e){var r=document.createRange();r.selectNodeContents(pre.querySelector('code'));var s=window.getSelection();s.removeAllRanges();s.addRange(r);}
    });
    pre.appendChild(b);
  });

  // toc highlighting
  var links=[].slice.call(document.querySelectorAll('nav.toc a[href^="#"]'));
  var targets=links.map(function(a){return document.querySelector(a.getAttribute('href'))}).filter(Boolean);
  function mark(){
    var y=window.scrollY+120,cur=targets[0];
    targets.forEach(function(t){if(t.offsetTop<=y)cur=t});
    links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+cur.id)});
  }
  window.addEventListener('scroll',mark,{passive:true});mark();

  // live TOTP demo with the RFC 6238 test secret
  var KEY=new TextEncoder().encode('12345678901234567890');
  var els={code:document.getElementById('d-code'),bar:document.getElementById('d-bar'),time:document.getElementById('d-time'),
           ctr:document.getElementById('d-ctr'),mac:document.getElementById('d-mac'),off:document.getElementById('d-off'),int:document.getElementById('d-int')};
  var keyP=(window.crypto&&crypto.subtle)?crypto.subtle.importKey('raw',KEY,{name:'HMAC',hash:'SHA-1'},false,['sign']):null;
  var lastCtr=-1;
  function hex(b){return Array.prototype.map.call(b,function(x){return ('0'+x.toString(16)).slice(-2)}).join('')}
  async function tick(){
    var now=Math.floor(Date.now()/1000),ctr=Math.floor(now/30),left=30-(now%30);
    els.time.textContent=now;
    els.bar.style.width=(left/30*100)+'%';
    if(ctr===lastCtr)return;
    lastCtr=ctr;
    if(!keyP){els.code.textContent='no crypto';return}
    var msg=new Uint8Array(8),c=ctr;
    for(var i=7;i>=0;i--){msg[i]=c%256;c=Math.floor(c/256)}
    var mac=new Uint8Array(await crypto.subtle.sign('HMAC',await keyP,msg));
    var off=mac[19]&0x0f;
    var n=((mac[off]&0x7f)<<24|mac[off+1]<<16|mac[off+2]<<8|mac[off+3])>>>0;
    var code=String(n%1000000).padStart(6,'0');
    els.code.textContent=code;
    els.ctr.textContent=ctr+'  (0x'+ctr.toString(16).padStart(16,'0')+')';
    var h=hex(mac),parts='';
    for(var j=0;j<20;j++){
      var by=h.substr(j*2,2),cls=(j===19)?'h1':(j>=off&&j<off+4)?'h2':'';
      parts+=cls?'<span class="'+cls+'">'+by+'</span>':by;
    }
    els.mac.innerHTML=parts;
    els.off.textContent=off+'  (last byte 0x'+h.substr(38,2)+' & 0x0F)';
    els.int.textContent=n+'  → mod 10⁶ = '+code;
  }
  if(els.code){tick();setInterval(tick,1000);}

  // ---- view toggle (instructor / student) ----
  var root=document.documentElement;
  function setView(v){root.dataset.view=v;try{localStorage.setItem('tb-view',v)}catch(e){}
    document.querySelectorAll('.sitebar .seg button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.view===v))});}
  document.querySelectorAll('.sitebar .seg button').forEach(function(b){b.addEventListener('click',function(){setView(b.dataset.view)})});
  setView(root.dataset.view||'instructor');

  // ---- checkpoints ----
  var page=location.pathname.replace(/index\.html$/,'');
  var checks=[].slice.call(document.querySelectorAll('#lab .call.check'));
  var prog=document.getElementById('cp-progress');
  function key(i){return 'tb-cp:'+page+':'+i}
  function paint(){var n=checks.filter(function(c){return c.classList.contains('is-done')}).length;
    if(prog){prog.innerHTML='checkpoints '+n+' / '+checks.length+(n?' · <button type="button" id="cp-reset">reset</button>':'');prog.classList.toggle('ok',n===checks.length&&n>0);
      var r=document.getElementById('cp-reset');if(r)r.addEventListener('click',function(){checks.forEach(function(c,i){c.classList.remove('is-done');c.querySelector('input').checked=false;try{localStorage.removeItem(key(i))}catch(e){}});paint();});}}
  checks.forEach(function(c,i){
    var lbl=c.querySelector('.lbl');if(!lbl)return;
    var row=document.createElement('div');row.className='lblrow';lbl.parentNode.insertBefore(row,lbl);row.appendChild(lbl);
    var l=document.createElement('label');l.className='done';var cb=document.createElement('input');cb.type='checkbox';cb.id='cp'+i;
    l.appendChild(cb);l.appendChild(document.createTextNode('Done'));row.appendChild(l);
    var saved=false;try{saved=localStorage.getItem(key(i))==='1'}catch(e){}
    cb.checked=saved;c.classList.toggle('is-done',saved);
    cb.addEventListener('change',function(){c.classList.toggle('is-done',cb.checked);try{cb.checked?localStorage.setItem(key(i),'1'):localStorage.removeItem(key(i))}catch(e){}paint();});
  });
  paint();

  // ---- lab clock ----
  var clock=document.getElementById('clock');
  if(clock){
    var rows=[].slice.call(document.querySelectorAll('.timeline .row'));
    var start=null;try{start=Number(localStorage.getItem('tb-clock:'+page))||null}catch(e){}
    var out=clock.querySelector('.now'),go=clock.querySelector('.go'),rs=clock.querySelector('.rs');
    function fmt(s){var m=Math.floor(s/60),x=s%60;return m+':'+String(x).padStart(2,'0')}
    function tickClock(){
      if(!start){out.textContent='not started';rows.forEach(function(r){r.classList.remove('cur','past')});go.hidden=false;rs.hidden=true;return}
      var el=Math.floor((Date.now()-start)/1000);out.textContent='elapsed '+fmt(el)+' of 90:00';go.hidden=true;rs.hidden=false;
      rows.forEach(function(r){var a=Number(r.dataset.from)*60,b=Number(r.dataset.to)*60;r.classList.toggle('cur',el>=a&&el<b);r.classList.toggle('past',el>=b)});
    }
    go.addEventListener('click',function(){start=Date.now();try{localStorage.setItem('tb-clock:'+page,String(start))}catch(e){}tickClock()});
    rs.addEventListener('click',function(){start=null;try{localStorage.removeItem('tb-clock:'+page)}catch(e){}tickClock()});
    tickClock();setInterval(tickClock,1000);
  }
})();