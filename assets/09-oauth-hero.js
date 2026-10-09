(function(){
  var svg=document.getElementById('w9-svg'),wire=document.getElementById('w9-wire'),checks=document.getElementById('w9-checks'),verdict=document.getElementById('w9-verdict');
  if(!svg)return;
  var NS='http://www.w3.org/2000/svg',X={b:70,a:260,g:450};
  // [hop, from, to, y, label, back channel?]
  var A=[[1,'b','a',66,'GET /',0],
    [2,'a','b',98,'302 + Set-Cookie',0],[2,'b','g',122,'GET /login/oauth/authorize',0],
    [3,'b','g',156,'you sign in and approve',0],
    [4,'g','b',190,'302 to /callback',0],[4,'b','a',214,'GET /callback?code&state',0],
    [5,'a','g',248,'POST access_token',1],[5,'g','a',272,'access_token',1],
    [6,'a','g',306,'GET /user',1],[6,'g','a',330,'octocat',1]];
  // [check number, lane, y, hops where it runs, x offset from the lane]
  var B=[[1,'a',214,[4],14],[2,'g',122,[2],14],[2,'g',248,[5],14],[3,'g',248,[5],36]];
  var W={
    1:'GET http://127.0.0.1:8000/\n\nThe app makes two random strings: state, and a PKCE verifier. Nothing has left the laptop yet.',
    2:'302 Found\nLocation: https://github.com/login/oauth/authorize\n  ?client_id=Ov23…&redirect_uri=http://127.0.0.1:8000/callback\n  &scope=read:user&state=Qx3v…\n  &code_challenge=E9Melhoa…&code_challenge_method=S256\nSet-Cookie: oauth=Qx3v….dBjf…; HttpOnly; SameSite=Lax;\n  Max-Age=600; Path=/callback',
    3:'github.com shows its own sign-in page, then\n"Authorize TechBytes OAuth lab": read:user.\n\nThe password goes to github.com and nowhere else.',
    4:'302 Found\nLocation: http://127.0.0.1:8000/callback?code=5f1c…&state=Qx3v…\n\nGET /callback?code=5f1c…&state=Qx3v…\nCookie: oauth=Qx3v….dBjf…',
    5:'POST https://github.com/login/oauth/access_token\nAccept: application/json\n\nclient_id=Ov23…&client_secret=••••••&code=5f1c…\n&redirect_uri=http://127.0.0.1:8000/callback&code_verifier=dBjf…\n\n{"access_token":"gho_…","token_type":"bearer",\n "scope":"read:user","expires_in":28800,…}',
    6:'GET https://api.github.com/user\nAuthorization: Bearer gho_…\n\n{"login":"octocat","name":"The Octocat",…}\n\nPage: Signed in as octocat'
  };
  // per hop: [state, exact redirect, PKCE]; w = not yet, a = armed, n = runs now, k = passed
  var S={1:'www',2:'ana',3:'aka',4:'nka',5:'knn',6:'kkk'};
  var T=[
    ['state.',{w:'Not made yet.',a:'In the URL and in an HttpOnly cookie; waiting for the trip back.',n:'The app compares the query to the cookie. Missing or different: 400, and the login stops.',k:'Matched, and the cookie is cleared after use.'}],
    ['Exact redirect.',{w:'Not sent yet.',a:'',n:'GitHub compares redirect_uri exactly: with the registered callback at hop 2, with the code’s own at hop 5. Different: no code, no token.',k:'Matched the registered callback.'}],
    ['PKCE.',{w:'Not made yet.',a:'The challenge went to GitHub; the verifier stayed in the cookie.',n:'GitHub hashes the verifier and compares it with the challenge. No match: no token.',k:'The code was redeemed by the app that asked for it.'}]];
  var V={
    1:'<b>Front channel.</b> An ordinary page load in your browser.',
    2:'<b>Front channel.</b> The app answers with a redirect; everything in that URL is visible in the address bar and the history. GitHub checks the redirect_uri at once.',
    3:'<b>Front channel, GitHub only.</b> The app is not involved and never sees the password.',
    4:'<b>Front channel.</b> The code rides back in a URL. That is why it expires after ten minutes and is bound to state and PKCE; the fake GitHub also refuses a second use.',
    5:'<b>Back channel.</b> Server to server, never through the browser: the secret and the verifier travel here.',
    6:'<b>Back channel.</b> GitHub issues no ID token. The app learns who you are by asking the API with the token.'
  };
  function el(n,a,t){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(t!=null)e.textContent=t;return e}
  function draw(hop){
    while(svg.firstChild)svg.removeChild(svg.firstChild);
    var d=el('defs');['p','n'].forEach(function(k){var m=el('marker',{id:'w9-m'+k,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'});m.appendChild(el('path',{d:'M0 0 L10 5 L0 10 z','class':'w9-tip'+(k==='n'?' w9-now':'')}));d.appendChild(m)});svg.appendChild(d);
    [['b','Browser'],['a','Your app'],['g','GitHub']].forEach(function(l){
      svg.appendChild(el('line',{x1:X[l[0]],y1:40,x2:X[l[0]],y2:344,'class':'w9-life'}));
      svg.appendChild(el('rect',{x:X[l[0]]-56,y:8,width:112,height:28,rx:5,'class':'w9-head'}));
      svg.appendChild(el('text',{x:X[l[0]],y:27,'text-anchor':'middle','class':'w9-ht'},l[1]));
    });
    A.forEach(function(r){
      var st=r[0]<hop?' w9-past':r[0]===hop?' w9-now':' w9-next',x1=X[r[1]],x2=X[r[2]],dir=x2>x1?1:-1;
      svg.appendChild(el('line',{x1:x1+dir*4,y1:r[3],x2:x2-dir*4,y2:r[3],'class':'w9-hop'+(r[5]?' w9-back':' w9-front')+st,'marker-end':'url(#w9-m'+(r[0]===hop?'n':'p')+')'}));
      svg.appendChild(el('text',{x:(x1+x2)/2,y:r[3]-6,'text-anchor':'middle','class':'w9-lbl'+st},r[4]));
    });
    B.forEach(function(c){
      var on=c[3].indexOf(hop)>=0,g=el('g',{'class':'w9-badge'+(on?' w9-now':'')});
      g.appendChild(el('circle',{cx:X[c[1]]+c[4],cy:c[2],r:9}));
      g.appendChild(el('text',{x:X[c[1]]+c[4],y:c[2]+4,'text-anchor':'middle'},String(c[0])));
      svg.appendChild(g);
    });
  }
  function go(hop){
    draw(hop);
    wire.textContent=W[hop];
    checks.innerHTML=T.map(function(t,i){var s=S[hop][i],txt=t[1][s]||t[1].w;
      return '<li class="w9-'+s+'"><i>'+(i+1)+'</i><span><b>'+t[0]+'</b> '+txt+'</span></li>'}).join('');
    verdict.innerHTML=V[hop];
    document.querySelectorAll('#w9-demo .seg button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.hop===String(hop)))});
  }
  document.querySelectorAll('#w9-demo .seg button').forEach(function(b){b.addEventListener('click',function(){go(Number(b.dataset.hop))})});
  go(1);
})();
