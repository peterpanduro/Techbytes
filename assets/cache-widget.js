(function(){
  var A=[['FROM golang:1.27','pull once',0],['WORKDIR /app','',0],['COPY . .','',1],['RUN go mod download','network',1],['RUN go build','compile',1],['CMD ["./server"]','',1]];
  var B=[['FROM golang:1.27','pull once',0],['WORKDIR /app','',0],['COPY go.mod ./','',2],['RUN go mod download','network',2],['COPY . .','',1],['RUN go build','compile',1],['CMD ["./server"]','',1]];
  // third field: what invalidates it — 0 never, 1 any file change, 2 go.mod change (and everything below a rebuilt layer rebuilds)
  function render(list,el,change){
    var rebuilt=false,cost=0;el.innerHTML='';
    list.forEach(function(l){
      var hit=(change==='main'&&l[2]===1)||(change==='mod'&&l[2]>=1);
      if(hit)rebuilt=true;
      var li=document.createElement('li');li.className=rebuilt?'re':'ok';
      li.innerHTML='<code>'+l[0]+'</code><span>'+(rebuilt?'rebuilt':'cached')+(l[1]&&rebuilt?' · '+l[1]:'')+'</span>';
      el.appendChild(li);if(rebuilt&&l[1].indexOf('network')>=0)cost+=1;
    });
    return cost;
  }
  var sum=document.getElementById('ly-sum');
  function go(change){
    var a=render(A,document.getElementById('ly-a'),change),b=render(B,document.getElementById('ly-b'),change);
    sum.textContent=change==='none'?'Nothing changed: every layer is served from the cache in both layouts; the build takes a second.':
      change==='main'?'Editing main.go: layout A re-runs everything from COPY . . down, including the dependency download. Layout B only recompiles.':
      'Editing go.mod: both layouts must re-download dependencies; that is correct, the manifest changed. It is rare, which is the point of putting it first.';
    document.querySelectorAll('#cache-demo .seg button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.change===change))});
  }
  document.querySelectorAll('#cache-demo .seg button').forEach(function(b){b.addEventListener('click',function(){go(b.dataset.change)})});
  go('none');
})();
