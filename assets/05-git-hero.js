(function(){
  var C=[['4c42b15','README: contributing section'],['4738704','test.sh: print a summary line'],['4e88d37','Add CONTRIBUTING.md'],['95d7f26','Fix typo in README'],['4128a3a','Bump version to 1.1 in --help'],['f063a35','CHANGELOG: prepare 1.1']];
  var svg=document.getElementById('w5-graph'),logEl=document.getElementById('w5-reflog'),sum=document.getElementById('w5-sum');
  if(!svg)return;
  var NS='http://www.w3.org/2000/svg';
  var st;
  function reset(){st={main:5,rescue:-1,log:[['f063a35','commit: CHANGELOG: prepare 1.1'],['4128a3a','commit: Bump version to 1.1 in --help'],['95d7f26','commit: Fix typo in README'],['4e88d37','commit: Add CONTRIBUTING.md']],showLog:false};}
  function el(n,a,t){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(t!=null)e.textContent=t;return e}
  function label(x,y,text,cls){var g=el('g',{'class':'w5-lbl '+cls});var w=text.length*7.2+14;g.appendChild(el('rect',{x:x-w/2,y:y-11,width:w,height:20,rx:4}));g.appendChild(el('text',{x:x,y:y+4,'text-anchor':'middle'},text));return g}
  function render(){
    while(svg.firstChild)svg.removeChild(svg.firstChild);
    var top=Math.max(st.main,st.rescue),y=92;
    for(var i=0;i<6;i++){
      var x=50+i*88;
      if(i>0)svg.appendChild(el('line',{x1:x-88+11,y1:y,x2:x-11,y2:y,'class':'w5-edge'}));
      var reach=i<=top;
      svg.appendChild(el('circle',{cx:x,cy:y,r:10,'class':'w5-dot'+(reach?'':' w5-unreach')}));
      svg.appendChild(el('text',{x:x,y:y+30,'text-anchor':'middle','class':'w5-hash'+(reach?'':' w5-dim')},C[i][0]));
    }
    svg.appendChild(el('text',{x:270,y:140,'text-anchor':'middle','class':'w5-cap'},top<5?(5-top)+' commit'+(5-top>1?'s':'')+' unreachable: no label leads there. Still in .git for 30 days at least.':'every commit reachable from a label'));
    var mx=50+st.main*88;
    svg.appendChild(el('line',{x1:mx,y1:52,x2:mx,y2:78,'class':'w5-edge'}));
    svg.appendChild(label(mx,42,'main','w5-branch'));
    svg.appendChild(label(mx,14,'HEAD','w5-head'));
    if(st.rescue>=0){var rx=50+st.rescue*88;svg.appendChild(el('line',{x1:rx,y1:52,x2:rx,y2:78,'class':'w5-edge'}));svg.appendChild(label(rx,42,'rescue','w5-branch w5-rescue'))}
    logEl.hidden=!st.showLog;
    logEl.textContent=st.log.map(function(e,i){return e[0]+' HEAD@{'+i+'}: '+e[1]}).join('\n');
    var b=document.querySelector('#w5-demo [data-cmd="reset"]');if(b)b.disabled=st.main<2;
  }
  function go(cmd){
    if(cmd==='start'){reset();sum.textContent='Fresh: main and HEAD on f063a35, the top of the lab repository.';render();return}
    if(cmd==='reset'){if(st.main<2)return;var to=st.main-2;st.log.unshift([C[to][0],'reset: moving to HEAD~2']);st.main=to;st.showLog=false;
      sum.textContent='HEAD is now at '+C[to][0]+' '+C[to][1]+'. The label moved; the two commits above it did not. Your working files now match '+C[to][0]+'.';}
    if(cmd==='reflog'){st.showLog=true;sum.textContent=st.main<5?'Every move HEAD made, newest first. HEAD@{1} is where you were before the reset: that hash is the rescue.':'Every move HEAD made, newest first. Nothing to rescue yet; press reset first.';}
    if(cmd==='branch'){st.rescue=5;st.showLog=false;sum.textContent=st.main<5?'A new label on f063a35. Everything is reachable again, without copying a byte. git reset --hard HEAD@{1} would have moved main there instead.':'rescue now points at the same commit as main. Harmless: labels are cheap.';}
    render();
  }
  document.querySelectorAll('#w5-demo .w5-cmds button').forEach(function(b){b.addEventListener('click',function(){go(b.dataset.cmd)})});
  go('start');
})();
