(function(){
  var root=document.getElementById('w7-demo');if(!root)return;
  var podsEl=document.getElementById('w7-pods'),status=document.getElementById('w7-status'),log=document.getElementById('w7-log'),input=document.getElementById('w7-replicas'),kill=document.getElementById('w7-kill');
  var HASH='7d9f',pods=[],seq=0,entries=[];
  function rnd(){var a='bcdfghjklmnpqrstvwxz2456789',s='';for(var i=0;i<5;i++)s+=a[Math.floor(Math.random()*a.length)];return s}
  function say(t){entries.unshift(t);entries=entries.slice(0,4);log.innerHTML=entries.map(function(e){return '<li>'+e+'</li>'}).join('')}
  function desired(){var n=parseInt(input.value,10);if(isNaN(n))n=0;n=Math.max(0,Math.min(6,n));return n}
  function live(){return pods.filter(function(p){return p.state!=='Terminating'})}
  function render(){
    podsEl.innerHTML='';
    pods.forEach(function(p){
      var d=document.createElement('div');d.className='w7-pod '+p.state.toLowerCase();
      d.innerHTML='<i></i><span>'+p.name+'</span><em>'+p.state+'</em>';podsEl.appendChild(d);
    });
    var want=desired(),ready=pods.filter(function(p){return p.state==='Running'}).length;
    status.textContent='desired '+want+' · actual '+live().length+' · READY '+ready+'/'+want+(ready===want&&live().length===want?' · nothing to do':' · reconciling…');
  }
  // the controller loop: observe, compare, act. Runs forever.
  function reconcile(){
    var want=desired(),have=live();
    if(have.length<want){
      var p={name:'worker-'+HASH+'-'+rnd(),state:'ContainerCreating',id:++seq};pods.push(p);
      say('observed '+have.length+'/'+want+' → creating '+p.name);
      setTimeout(function(){if(p.state==='ContainerCreating'){p.state='Running';render()}},1400);
    }else if(have.length>want){
      var v=have[have.length-1];v.state='Terminating';
      say('observed '+have.length+'/'+want+' → terminating '+v.name);
      setTimeout(function(){pods=pods.filter(function(q){return q!==v});render()},1100);
    }
    render();
  }
  kill.addEventListener('click',function(){
    var r=pods.filter(function(p){return p.state==='Running'});
    if(!r.length){say('no Running pod to delete');return}
    var v=r[Math.floor(Math.random()*r.length)];pods=pods.filter(function(q){return q!==v});
    say('kubectl delete pod '+v.name+' → gone');render();
  });
  input.addEventListener('input',function(){say('spec.replicas set to '+desired());render()});
  setInterval(reconcile,600);
  reconcile();
})();
