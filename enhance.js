(function(){
  "use strict";
  var D=document, root=D.documentElement;

  /* ---------- theme switcher ---------- */
  var THEMES={
    jade:{a:"#2be3b0",a2:"#14c3c9",rgb:"43,227,176",l2:"#5cf2cf"},
    blue:{a:"#3da5ff",a2:"#00d1ff",rgb:"61,165,255",l2:"#8fd3ff"},
    violet:{a:"#b07cff",a2:"#7c5cff",rgb:"176,124,255",l2:"#d4b8ff"},
    coral:{a:"#ff6a3d",a2:"#ff9a3d",rgb:"255,106,61",l2:"#ffb08f"}
  };
  function applyTheme(name){
    var t=THEMES[name]||THEMES.jade;
    root.style.setProperty("--accent",t.a);
    root.style.setProperty("--accent-2",t.a2);
    root.style.setProperty("--accentRGB",t.rgb);
    root.style.setProperty("--lime",t.a);
    root.style.setProperty("--lime-2",t.l2);
    try{localStorage.setItem("siteTheme",name);}catch(e){}
  }
  try{ var saved=localStorage.getItem("siteTheme"); if(saved&&saved!=="jade"&&THEMES[saved]) applyTheme(saved); }catch(e){}

  /* ---------- injected styles ---------- */
  var css=
  "#cmdk-fab{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:130;display:flex;align-items:center;gap:8px;"+
  "font-family:var(--mono,monospace);font-size:12px;color:var(--ink,#edf2ef);background:rgba(7,16,14,.7);backdrop-filter:blur(10px);"+
  "border:1px solid var(--line-2,rgba(255,255,255,.2));padding:9px 15px;border-radius:100px;cursor:pointer;transition:transform .15s,border-color .2s;}"+
  "#cmdk-fab:hover{transform:translateX(-50%) translateY(-2px);border-color:var(--accent,#2be3b0);}"+
  "#cmdk-fab b{color:var(--accent,#2be3b0);font-weight:500;}"+
  "#cmdk-fab kbd{font-family:inherit;background:rgba(255,255,255,.08);border:1px solid var(--line,rgba(255,255,255,.1));border-radius:5px;padding:1px 6px;font-size:11px;}"+
  "@media(max-width:640px){#cmdk-fab kbd{display:none;}}"+
  "#cmdk-ov{position:fixed;inset:0;z-index:200;display:none;align-items:flex-start;justify-content:center;padding:14vh 16px 16px;background:rgba(3,8,7,.6);backdrop-filter:blur(6px);}"+
  "#cmdk-ov.on{display:flex;}"+
  "#cmdk{width:100%;max-width:560px;background:#0b1714;border:1px solid var(--line-2,rgba(255,255,255,.2));border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6);animation:cmdkin .2s ease;}"+
  "@keyframes cmdkin{from{opacity:0;transform:translateY(-10px) scale(.98);}to{opacity:1;transform:none;}}"+
  "#cmdk input{width:100%;border:none;outline:none;background:transparent;color:var(--ink,#edf2ef);font-family:var(--body,sans-serif);font-size:17px;padding:18px 20px;border-bottom:1px solid var(--line,rgba(255,255,255,.1));}"+
  "#cmdk-list{max-height:52vh;overflow:auto;padding:8px;}"+
  "#cmdk-list .row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;border-radius:11px;cursor:pointer;color:var(--ink,#edf2ef);font-size:15px;}"+
  "#cmdk-list .row .g{font-family:var(--mono,monospace);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint,#7c8b84);}"+
  "#cmdk-list .row[aria-selected=true]{background:rgba(var(--accentRGB,43,227,176),.14);}"+
  "#cmdk-list .row[aria-selected=true] .g{color:var(--accent,#2be3b0);}"+
  "#cmdk-empty{padding:22px;color:var(--faint,#7c8b84);font-size:14px;text-align:center;}"+
  "#cmdk-foot{display:flex;gap:16px;padding:10px 16px;border-top:1px solid var(--line,rgba(255,255,255,.1));font-family:var(--mono,monospace);font-size:11px;color:var(--faint,#7c8b84);}"+
  "#xtoast{position:fixed;left:50%;bottom:80px;transform:translate(-50%,16px);z-index:210;opacity:0;pointer-events:none;background:var(--accent,#2be3b0);color:#07100e;"+
  "font-family:var(--mono,monospace);font-size:13px;font-weight:500;padding:11px 18px;border-radius:100px;transition:opacity .3s,transform .3s;}"+
  "#xtoast.on{opacity:1;transform:translate(-50%,0);}"+
  "#xcurtain{position:fixed;inset:0;z-index:300;background:var(--accent,#2be3b0);transform:translateY(100%);pointer-events:none;}"+
  "#xcurtain.go{transform:translateY(0);transition:transform .42s cubic-bezier(.76,0,.24,1);}"+
  ".gh-list{display:grid;gap:10px;}"+
  ".gh-item{display:block;border:1px solid var(--line,rgba(255,255,255,.1));border-radius:14px;padding:16px 18px;transition:border-color .25s,transform .2s,background .25s;background:rgba(11,23,20,.5);}"+
  ".gh-item:hover{border-color:rgba(var(--accentRGB,43,227,176),.4);transform:translateY(-3px);background:rgba(var(--accentRGB,43,227,176),.05);}"+
  ".gh-item .n{font-family:var(--display,sans-serif);font-weight:600;font-size:18px;color:var(--ink,#edf2ef);letter-spacing:-.01em;}"+
  ".gh-item .d{font-size:14px;color:var(--muted,#93a8a1);margin-top:6px;}"+
  ".gh-item .m{font-family:var(--mono,monospace);font-size:11.5px;color:var(--faint,#7c8b84);margin-top:10px;display:flex;gap:14px;}"+
  ".gh-item .m b{color:var(--accent,#2be3b0);font-weight:400;}"+
  "@media(prefers-reduced-motion:reduce){#xcurtain,#cmdk{transition:none;animation:none;}}";
  var st=D.createElement("style"); st.textContent=css; D.head.appendChild(st);

  /* ---------- toast + curtain ---------- */
  var toast=D.createElement("div"); toast.id="xtoast"; D.body.appendChild(toast); var tT;
  function showToast(m){ toast.textContent=m; toast.classList.add("on"); clearTimeout(tT); tT=setTimeout(function(){toast.classList.remove("on");},2600); }
  var curtain=D.createElement("div"); curtain.id="xcurtain"; D.body.appendChild(curtain);
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  function goTo(url){
    if(reduce){ location.href=url; return; }
    curtain.classList.add("go");
    setTimeout(function(){ location.href=url; },420);
  }

  /* ---------- page transitions on internal links ---------- */
  D.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest("a"); if(!a) return;
    if(a.target==="_blank"||a.hasAttribute("download")) return;
    var href=a.getAttribute("href")||"";
    if(!href||href[0]==="#"||href.indexOf("mailto:")===0||href.indexOf("tel:")===0) return;
    if(/^https?:\/\//i.test(href) && a.host!==location.host) return;
    if(!/\.html(\?|#|$)/.test(href) && !/\/$/.test(href)) return; // only html docs
    if(a.pathname===location.pathname && a.hash) return; // same page anchor
    e.preventDefault(); goTo(a.href);
  },true);

  /* ---------- command palette ---------- */
  var ITEMS=[
    {t:"Home",g:"Go",u:"index.html"},
    {t:"Selected work",g:"Go",u:"index.html#work"},
    {t:"About",g:"Go",u:"index.html#about"},
    {t:"Experience",g:"Go",u:"index.html#career"},
    {t:"Writing / Blog",g:"Go",u:"blog.html"},
    {t:"Playground game",g:"Go",u:"index.html#play"},
    {t:"Get in touch",g:"Go",u:"index.html#contact"},
    {t:"Web3 & on-chain",g:"Topic",u:"web3.html"},
    {t:"AI & agents",g:"Topic",u:"ai.html"},
    {t:"Full-stack & performance",g:"Topic",u:"full-stack.html"},
    {t:"Game dev",g:"Topic",u:"game-dev.html"},
    {t:"Career & building in public",g:"Topic",u:"career.html"},
    {t:"Hire a senior Web3 engineer",g:"Hire",u:"hire-senior-web3-engineer.html"},
    {t:"Hire a freelance DeFi developer",g:"Hire",u:"hire-freelance-defi-developer.html"},
    {t:"Hire a remote full-stack engineer",g:"Hire",u:"hire-remote-fullstack-engineer.html"},
    {t:"Hire an AI engineer",g:"Hire",u:"hire-ai-engineer.html"},
    {t:"Shiba Inu case study",g:"Work",u:"shiba-inu.html"},
    {t:"OpenSpeaker case study",g:"Work",u:"openspeaker.html"},
    {t:"GatheredHere case study",g:"Work",u:"gatheredhere.html"},
    {t:"ElasticSwap case study",g:"Work",u:"elasticswap.html"},
    {t:"Koji case study",g:"Work",u:"koji.html"},
    {t:"Aftertutor case study",g:"Work",u:"aftertutor.html"},
    {t:"Download resume",g:"File",u:"Harman-Kamboj-Resume.pdf"},
    {t:"Copy email address",g:"Action",run:function(){ try{navigator.clipboard.writeText("playcivil@gmail.com");showToast("Email copied to clipboard");}catch(e){showToast("playcivil@gmail.com");} }},
    {t:"Email Harman",g:"Action",run:function(){ location.href="mailto:playcivil@gmail.com"; }},
    {t:"GitHub profile",g:"Link",run:function(){ window.open("https://github.com/hammyasf","_blank","noopener"); }},
    {t:"LinkedIn profile",g:"Link",run:function(){ window.open("https://linkedin.com/in/hammyasf","_blank","noopener"); }},
    {t:"Theme: Jade (default)",g:"Theme",run:function(){ applyTheme("jade");showToast("Theme: Jade"); }},
    {t:"Theme: Electric blue",g:"Theme",run:function(){ applyTheme("blue");showToast("Theme: Electric blue"); }},
    {t:"Theme: Violet",g:"Theme",run:function(){ applyTheme("violet");showToast("Theme: Violet"); }},
    {t:"Theme: Coral",g:"Theme",run:function(){ applyTheme("coral");showToast("Theme: Coral"); }},
    {t:"Toggle sound",g:"Action",run:function(){ var s=D.getElementById("snd"); if(s){s.click();showToast("Sound toggled");} else showToast("Sound is on the home page"); }},
    {t:"Play the bug-smash game",g:"Action",run:function(){ var b=D.getElementById("g-start"); if(b){ var p=D.getElementById("play"); if(p)p.scrollIntoView({behavior:reduce?"auto":"smooth"}); setTimeout(function(){b.click();},reduce?0:600); closeP(); } else { goTo("index.html#play"); } }}
  ];
  var ov,inp,list,sel=0,filtered=ITEMS.slice(),built=false;
  function build(){
    if(built) return; built=true;
    ov=D.createElement("div"); ov.id="cmdk-ov";
    ov.innerHTML='<div id="cmdk" role="dialog" aria-label="Command menu"><input id="cmdk-in" type="text" placeholder="Type a command or jump to..." aria-label="Command menu" autocomplete="off" spellcheck="false"><div id="cmdk-list" role="listbox"></div><div id="cmdk-foot"><span>&#8593;&#8595; navigate</span><span>&#8629; select</span><span>esc close</span></div></div>';
    D.body.appendChild(ov);
    inp=D.getElementById("cmdk-in"); list=D.getElementById("cmdk-list");
    ov.addEventListener("click",function(e){ if(e.target===ov) closeP(); });
    inp.addEventListener("input",function(){ filter(inp.value); });
    inp.addEventListener("keydown",function(e){
      if(e.key==="ArrowDown"){e.preventDefault();sel=Math.min(sel+1,filtered.length-1);render();}
      else if(e.key==="ArrowUp"){e.preventDefault();sel=Math.max(sel-1,0);render();}
      else if(e.key==="Enter"){e.preventDefault();choose(filtered[sel]);}
      else if(e.key==="Escape"){e.preventDefault();closeP();}
    });
  }
  function filter(q){
    q=(q||"").toLowerCase().trim();
    filtered=q?ITEMS.filter(function(i){return (i.t+" "+i.g).toLowerCase().indexOf(q)>-1;}):ITEMS.slice();
    sel=0; render();
  }
  function render(){
    if(!filtered.length){ list.innerHTML='<div id="cmdk-empty">No matches</div>'; return; }
    var h="";
    for(var i=0;i<filtered.length;i++){ var it=filtered[i];
      h+='<div class="row" role="option" data-i="'+i+'" aria-selected="'+(i===sel)+'"><span>'+it.t+'</span><span class="g">'+it.g+'</span></div>';
    }
    list.innerHTML=h;
    var rows=list.querySelectorAll(".row");
    rows.forEach(function(r){
      r.addEventListener("mouseenter",function(){ sel=+r.getAttribute("data-i"); markSel(); });
      r.addEventListener("click",function(){ choose(filtered[+r.getAttribute("data-i")]); });
    });
    var s=list.querySelector('[aria-selected=true]'); if(s&&s.scrollIntoView)s.scrollIntoView({block:"nearest"});
  }
  function markSel(){ var rows=list.querySelectorAll(".row"); rows.forEach(function(r){ r.setAttribute("aria-selected", (+r.getAttribute("data-i"))===sel); }); }
  function choose(it){ if(!it) return; if(it.run){ it.run(); if(it.g!=="Action"||it.t.indexOf("Play")===0){} closeP(); } else if(it.u){ closeP(); goTo(it.u); } }
  function openP(){ build(); ov.classList.add("on"); inp.value=""; filter(""); setTimeout(function(){inp.focus();},30); }
  function closeP(){ if(ov) ov.classList.remove("on"); }
  window.addEventListener("keydown",function(e){
    if((e.metaKey||e.ctrlKey)&&(e.key==="k"||e.key==="K")){ e.preventDefault(); if(ov&&ov.classList.contains("on"))closeP(); else openP(); }
  });

  /* ---------- launcher ---------- */
  var fab=D.createElement("button"); fab.id="cmdk-fab"; fab.type="button"; fab.setAttribute("aria-label","Open command menu");
  fab.innerHTML='<b>&#8984;</b> Menu <kbd>&#8984;K</kbd>';
  fab.addEventListener("click",openP); D.body.appendChild(fab);

  /* ---------- live GitHub activity (homepage only, lazy) ---------- */
  function loadGH(){
    var host=D.getElementById("gh-live"); if(!host) return;
    fetch("https://api.github.com/users/hammyasf/repos?sort=pushed&per_page=12")
      .then(function(r){ return r.ok?r.json():Promise.reject(); })
      .then(function(repos){
        if(!Array.isArray(repos)) return;
        var top=repos.filter(function(r){return !r.fork;}).slice(0,4);
        if(!top.length){ top=repos.slice(0,4); }
        if(!top.length) return;
        var h='<div class="gh-list">';
        top.forEach(function(r){
          var when=r.pushed_at?new Date(r.pushed_at).toLocaleDateString("en-US",{month:"short",year:"numeric"}):"";
          h+='<a class="gh-item" href="'+r.html_url+'" target="_blank" rel="noopener"><div class="n">'+esc(r.name)+'</div>'+
             (r.description?'<div class="d">'+esc(r.description)+'</div>':'')+
             '<div class="m">'+(r.language?'<b>'+esc(r.language)+'</b>':'')+(when?'<span>updated '+when+'</span>':'')+(typeof r.stargazers_count==="number"&&r.stargazers_count>0?'<span>&#9733; '+r.stargazers_count+'</span>':'')+'</div></a>';
        });
        h+='</div>';
        host.innerHTML=h;
        var sec=host.closest("section"); if(sec) sec.style.display="";
      })
      .catch(function(){ var sec=host.closest("section"); if(sec) sec.style.display="none"; });
  }
  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function idle(fn){ if("requestIdleCallback" in window) requestIdleCallback(fn,{timeout:2500}); else setTimeout(fn,1200); }
  if(D.getElementById("gh-live")){ if(D.readyState!=="loading") idle(loadGH); else window.addEventListener("load",function(){idle(loadGH);}); }
})();
