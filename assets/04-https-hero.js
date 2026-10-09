(function(){
  var C={
    untrusted:{url:'https://localhost:8443',store:['~150 public CAs','My Lab CA is not one of them'],leaf:['CN=localhost','DNS:localhost · valid one year'],chain:false,name:true,dates:true,
      verdict:'<b>No padlock.</b> Firefox: “Warning: Potential Security Risk Ahead”, SEC_ERROR_UNKNOWN_ISSUER. curl: (60) unable to get local issuer certificate. The certificate itself is fine; nobody the browser trusts has vouched for it.'},
    trusted:{url:'https://localhost:8443',store:['~150 public CAs','+ My Lab CA (imported)'],leaf:['CN=localhost','DNS:localhost · valid one year'],chain:true,name:true,dates:true,
      verdict:'<b>Padlock.</b> “Connection secure”, verified by My Lab CA. curl --cacert ca.pem prints the page. Nothing about the server changed; only your list of who you trust did.'},
    ip:{url:'https://127.0.0.1:8443',store:['~150 public CAs','+ My Lab CA (imported)'],leaf:['CN=localhost','DNS:localhost · valid one year'],chain:true,name:false,dates:true,
      verdict:'<b>No padlock.</b> SSL_ERROR_BAD_CERT_DOMAIN. curl: no alternative certificate subject name matches target host name ‘127.0.0.1’. Same key, same CA, wrong name.'},
    expired:{url:'https://localhost:8443',store:['~150 public CAs','+ My Lab CA (imported)'],leaf:['CN=localhost','DNS:localhost · expired yesterday'],chain:true,name:true,dates:false,
      verdict:'<b>No padlock.</b> SEC_ERROR_EXPIRED_CERTIFICATE. curl: certificate has expired. A vouch has a date on it; the CA promised nothing beyond it.'}
  };
  var $=function(id){return document.getElementById(id)};
  var checks=$('w4-checks'),verdict=$('w4-verdict');
  if(!checks)return;
  function row(ok,label,detail){return '<li class="'+(ok?'ok':'bad')+'"><i>'+(ok?'✓':'✗')+'</i><span><b>'+label+'</b> '+detail+'</span></li>'}
  function go(k){
    var c=C[k];
    $('w4-url').textContent=c.url;
    $('w4-store-v').textContent=c.store[0];$('w4-store-s').textContent=c.store[1];
    $('w4-leaf-v').textContent=c.leaf[0];$('w4-leaf-s').textContent=c.leaf[1];
    $('w4-store').className='w4-node'+(c.chain?'':' off');
    $('w4-l1').className='w4-link'+(c.chain?'':' bad');$('w4-l1').textContent=c.chain?'vouches for':'does not know';
    $('w4-leaf').className='w4-node'+((c.name&&c.dates)?'':' bad');
    checks.innerHTML=row(c.chain,'Chain.',c.chain?'Signed by a CA in my trust store.':'Signed by a CA I have never heard of.')+
      row(c.name,'Name.',c.name?'The certificate names the host in the address bar.':'The certificate says localhost; the address bar says 127.0.0.1.')+
      row(c.dates,'Dates.',c.dates?'Valid today.':'Not valid today.');
    verdict.innerHTML=c.verdict;
    document.querySelectorAll('#w4-demo .seg button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.case===k))});
  }
  document.querySelectorAll('#w4-demo .seg button').forEach(function(b){b.addEventListener('click',function(){go(b.dataset.case)})});
  go('untrusted');
})();
