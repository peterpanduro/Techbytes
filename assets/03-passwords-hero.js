(function(){
  var box=document.getElementById('w3-calc');if(!box)return;
  var rate=document.getElementById('w3-rate'),iter=document.getElementById('w3-iter'),len=document.getElementById('w3-len');
  var rateV=document.getElementById('w3-rate-v'),iterV=document.getElementById('w3-iter-v'),pwV=document.getElementById('w3-pw-v'),
      rateWhy=document.getElementById('w3-rate-why'),iterWhy=document.getElementById('w3-iter-why'),pwWhy=document.getElementById('w3-pw-why'),
      effEl=document.getElementById('w3-eff'),wordEl=document.getElementById('w3-word'),bruteEl=document.getElementById('w3-brute'),noteEl=document.getElementById('w3-note');
  var setBtns=[].slice.call(box.querySelectorAll('button[data-set]'));
  // landmarks: [log10 value, short label, explanation]
  // landmarks: [log10 position, tick label, spoken name, exact value, explanation]
  var RATE=[
    [6.62,'laptop core','one laptop core',4.2e6,'one laptop CPU core: about 4 million SHA-256 per second, measured with the Go loop from step 2'],
    [7.5,'whole laptop','a whole laptop',3e7,'all eight cores of a laptop: about 30 million per second'],
    [10.34,'gaming GPU','one gaming GPU',2.19755e10,'one gaming graphics card (RTX 4090): 22 billion per second, hashcat\'s published benchmark'],
    [11.25,'8-GPU rig','an 8-GPU rig',1.758e11,'a hobbyist cracking rig: eight of those cards, 176 billion per second'],
    [13.34,'1,000 GPUs','a thousand GPUs',2.19755e13,'a data-centre row of a thousand gaming GPUs: 22 trillion per second'],
    [21,'all Bitcoin miners','every Bitcoin miner on Earth',1e21,'every Bitcoin miner on Earth, about 10²¹ SHA-256 per second: the largest SHA-256 computer that exists, and nothing else comes close']
  ];
  var ITER=[
    [0,'SHA-256 once','SHA-256 once',1,'what step 2 stores: one SHA-256, so a guess costs one hash'],
    [4,'10,000','10,000 rounds',10000,'PBKDF2 with 10,000 rounds: a guess costs about 20,000 hashes'],
    [5.78,'600,000 · OWASP','600,000 rounds, OWASP\'s number',600000,'PBKDF2 with 600,000 rounds, OWASP\'s current recommendation: a guess costs about 1.2 million hashes'],
    [7,'10 million','10 million rounds',1e7,'10 million rounds: a login takes seconds, which users will not accept']
  ];
  function scale(el,marks,min,max){
    el.innerHTML='';
    marks.forEach(function(m,i){
      var x=(m[0]-min)/(max-min)*100;
      var t=document.createElement('span');t.className='w3-tick'+(i%2?' w3-tick-b':'');t.style.left=x+'%';t.textContent=m[1];el.appendChild(t);
    });
  }
  scale(document.getElementById('w3-rate-scale'),RATE,6.6,21);
  scale(document.getElementById('w3-iter-scale'),ITER,0,7);
  function near(marks,v){
    var best=marks[0],d=1e9;marks.forEach(function(m){var x=Math.abs(m[0]-v);if(x<d){d=x;best=m}});
    if(d<0.2)return {t:best[2],why:best[4],snap:best[3]};
    var lo=null,hi=null;marks.forEach(function(m){if(m[0]<=v)lo=m;if(m[0]>v&&!hi)hi=m});
    if(!lo)return {t:'less than '+hi[2],why:hi[4],snap:null};
    if(!hi)return {t:'beyond '+lo[2],why:lo[4],snap:null};
    return {t:'between '+lo[2]+' and '+hi[2],why:'more than '+lo[2]+', less than '+hi[2],snap:null};
  }
  var SUP={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
  function si(n){
    if(n>=1e24){var e=Math.floor(Math.log10(n)),m=n/Math.pow(10,e);return m.toFixed(1)+' × 10'+String(e).replace(/\d/g,function(c){return SUP[c]})}
    var u=[[1e21,'sextillion'],[1e18,'quintillion'],[1e15,'quadrillion'],[1e12,'trillion'],[1e9,'billion'],[1e6,'million'],[1e3,'thousand']];
    for(var i=0;i<u.length;i++)if(n>=u[i][0])return (n/u[i][0]).toFixed(n/u[i][0]<10?1:0)+' '+u[i][1];
    return n.toFixed(n<10?1:0);
  }
  function human(s){
    if(s<1e-3)return 'under a millisecond';
    if(s<1)return (s*1e3).toFixed(0)+' ms';
    if(s<90)return s.toFixed(1)+' seconds';
    if(s<5400)return (s/60).toFixed(1)+' minutes';
    if(s<172800)return (s/3600).toFixed(1)+' hours';
    if(s<3.15576e7)return (s/86400).toFixed(0)+' days';
    var y=s/3.15576e7;
    if(y<1e3)return y.toFixed(0)+' years';
    if(y<1e6)return (y/1e3).toFixed(0)+' thousand years';
    if(y<1e9)return (y/1e6).toFixed(0)+' million years';
    if(y<1.38e10)return (y/1e9).toFixed(1)+' billion years';
    return (y/1.38e10).toFixed(0)+' × the age of the universe';
  }
  function draw(){
    var nr=near(RATE,parseFloat(rate.value)),ni=near(ITER,parseFloat(iter.value));
    var r=nr.snap||Math.pow(10,parseFloat(rate.value));
    var it=ni.snap||Math.max(1,Math.round(Math.pow(10,parseFloat(iter.value))));
    var L=parseInt(len.value,10);
    var sb=setBtns.filter(function(b){return b.getAttribute('aria-pressed')==='true'})[0];
    var N=parseInt(sb.dataset.set,10);
    var space=Math.pow(N,L);
    var perGuess=it<=1?1:2*it, eff=r/perGuess;
    rateV.textContent=si(r)+' hashes / s · '+nr.t; rateWhy.textContent=nr.why;
    iterV.textContent=(it<=1?'one SHA-256':'PBKDF2, '+si(it)+' rounds')+' · '+ni.t; iterWhy.textContent=ni.why;
    pwV.textContent=L+' characters, '+sb.dataset.name;
    pwWhy.textContent=N+'^'+L+' = '+si(space)+' possible passwords, if it is truly random. A password from a wordlist is one of a few hundred million, whatever its length.';
    effEl.textContent=si(eff)+' / s';
    wordEl.textContent=human(300/eff);
    bruteEl.textContent=human(space/eff);
    var yrs=space/eff/3.15576e7;
    noteEl.textContent=it<=1
      ? (yrs>100?'Even a fast hash holds if the password is long and random. The wordlist attack is what breaks real users, and it takes '+human(300/eff)+' per salted account.':'Stored as one fast hash, this password shape falls to this attacker in '+human(space/eff)+'. The wordlist falls at once.')
      : (yrs>100?'Slow hashing and a long random password: this attacker is out of the game for the lifetime of the service.':'Slow hashing helps ('+si(perGuess)+' hashes per guess), but a short password is still short. Move the password slider.');
  }
  [rate,iter,len].forEach(function(el){el.addEventListener('input',draw)});
  setBtns.forEach(function(b){b.addEventListener('click',function(){setBtns.forEach(function(x){x.setAttribute('aria-pressed','false')});b.setAttribute('aria-pressed','true');draw();})});
  draw();
})();
