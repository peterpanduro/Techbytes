(function(){
  // Push-and-wait simulator for workshop 10. Every .w10-demo on the page is an independent copy;
  // data-branch, data-xtext and data-go on the element choose the starting toggles.
  var SHA='sha-3f9c2ab',SPEED=70;
  var OPTS=[
    {k:'branch',label:'Branch',v:[['greeting','greeting'],['main','main']]},
    {k:'xtext',label:'x/text version',v:[['0.3.7','v0.3.7'],['0.3.8','v0.3.8']]},
    {k:'go',label:'Runner Go',v:[['1.27.1','cached 1.27.1'],['1.27.2','check-latest · 1.27.2']]}
  ];
  function plan(s){
    var vulnText=s.xtext==='0.3.7',vulnGo=s.go==='1.27.1',red=vulnText||vulnGo,main=s.branch==='main';
    var why=[];
    if(vulnText)why.push('GO-2022-1059: hello.greet calls language.ParseAcceptLanguage (x/text v0.3.7, fixed in v0.3.8)');
    if(vulnGo)why.push('5 standard-library findings in go1.27.1, e.g. GO-2026-6617: hello.main calls http.ListenAndServe (fixed in go1.27.2)');
    var test=[['Set up job',6,1],['actions/checkout',2,1],['actions/setup-go · go'+s.go,s.go==='1.27.2'?9:1,1],['go test ./...',12,1],
      ['govulncheck ./...',38,red?0:1,red?'exit status 3':'No vulnerabilities found.']];
    var build=[['Set up job',5,1],['actions/checkout',2,1],['docker/login-action · ghcr.io',1,1],['docker/metadata-action · '+s.branch+', '+SHA,1,1],
      ['docker/build-push-action · build',45,1],[main?'push · ghcr.io/you/ci-lab:main, :'+SHA:'push · skipped: push is false off main',main?6:0,1]];
    var verdict=red
      ?'<b>Red.</b> '+why.join('; ')+'. <b>build</b> skipped (needs: test). '+(main?'Nothing published, but the commit is already on main: that is what the ruleset prevents.':'Merge blocked by the ruleset.')
      :(main?'<b>Green.</b> ghcr.io/you/ci-lab:main and :'+SHA+' pushed with the job’s own GITHUB_TOKEN.':'<b>Green.</b> The image was built and thrown away (push: false off main). Merge allowed.');
    return {test:test,build:build,red:red,verdict:verdict};
  }
  function init(root){
    var app=root.querySelector('.w10-app');if(!app)return;
    var st={branch:root.dataset.branch||'greeting',xtext:root.dataset.xtext||'0.3.8',go:root.dataset.go||'1.27.2'},timer=null;
    var html='<div class="w10-ctl">';
    OPTS.forEach(function(o){html+='<div class="seg" role="group" aria-label="'+o.label+'">'+o.v.map(function(v){return '<button type="button" data-k="'+o.k+'" data-v="'+v[0]+'">'+v[1]+'</button>'}).join('')+'</div>'});
    html+='<button type="button" class="w10-push">git push</button></div><div class="w10-jobs"><div class="w10-job"><p class="w10-jt"><b>test</b><span class="w10-tt"></span></p><ol class="w4-checks"></ol></div><div class="w10-job"><p class="w10-jt"><b>build</b> <span>needs: test</span><span class="w10-tt"></span></p><ol class="w4-checks"></ol></div></div><p class="note w10-verdict" aria-live="polite"></p><p class="note w10-fine">Seconds are illustrative, not measured.</p>';
    app.innerHTML=html;
    var lists=app.querySelectorAll('.w4-checks'),tots=app.querySelectorAll('.w10-tt'),verdict=app.querySelector('.w10-verdict');
    function sync(){app.querySelectorAll('.seg button').forEach(function(b){b.setAttribute('aria-pressed',String(st[b.dataset.k]===b.dataset.v))})}
    function li(cls,icon,name,sec){return '<li class="'+cls+'"><i>'+icon+'</i><span>'+name+'</span><span class="w10-s">'+sec+'</span></li>'}
    function draw(p,t){
      var clock=0;
      [p.test,p.build].forEach(function(steps,j){
        var out='',sum=0,off=j===1&&p.red&&t>=clock,stop=false;
        steps.forEach(function(x){
          var a=clock,b=clock+x[1];
          if(off||stop)out+=li('w10-skip','–',x[0],'');
          else if(t>=b){out+=li(x[2]?'ok':'bad',x[2]?'✓':'✗',x[0]+(x[3]?' · '+x[3]:''),x[1]+' s');sum+=x[1];clock=b;stop=!x[2]}
          else if(t>=a){out+=li('w10-run','…',x[0],Math.floor(t-a)+' s');sum+=t-a;clock=b}
          else{out+=li('w10-wait','·',x[0],'');clock=b}
        });
        lists[j].innerHTML=out;tots[j].textContent=sum?Math.floor(sum)+' s':'';
      });
      return clock;
    }
    function render(){
      if(timer){clearInterval(timer);timer=null}
      sync();var p=plan(st);draw(p,-1);verdict.innerHTML='Press <b>git push</b>.';
    }
    function push(){
      if(timer)clearInterval(timer);
      var p=plan(st),end=draw(p,1e9),t=0;
      if(matchMedia('(prefers-reduced-motion: reduce)').matches){verdict.innerHTML=p.verdict;return}
      verdict.textContent='queued…';
      timer=setInterval(function(){t+=1;draw(p,t);if(t>=end){clearInterval(timer);timer=null;draw(p,1e9);verdict.innerHTML=p.verdict}},SPEED);
    }
    app.querySelectorAll('.seg button').forEach(function(b){b.addEventListener('click',function(){st[b.dataset.k]=b.dataset.v;render()})});
    app.querySelector('.w10-push').addEventListener('click',push);
    render();
  }
  document.querySelectorAll('.w10-demo').forEach(init);
})();
