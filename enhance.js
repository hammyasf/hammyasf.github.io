(function(){
  "use strict";
  var D=document, root=D.documentElement;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* ===== theme ===== */
  var THEMES={
    jade:{a:"#2be3b0",a2:"#14c3c9",rgb:"43,227,176",l2:"#5cf2cf"},
    blue:{a:"#3da5ff",a2:"#00d1ff",rgb:"61,165,255",l2:"#8fd3ff"},
    violet:{a:"#b07cff",a2:"#7c5cff",rgb:"176,124,255",l2:"#d4b8ff"},
    coral:{a:"#ff6a3d",a2:"#ff9a3d",rgb:"255,106,61",l2:"#ffb08f"}
  };
  var THEME_ORDER=["jade","blue","violet","coral"];
  function applyTheme(name){
    var t=THEMES[name]||THEMES.jade;
    root.style.setProperty("--accent",t.a); root.style.setProperty("--accent-2",t.a2);
    root.style.setProperty("--accentRGB",t.rgb); root.style.setProperty("--lime",t.a); root.style.setProperty("--lime-2",t.l2);
    try{localStorage.setItem("siteTheme",name);}catch(e){}
    try{ var tr=JSON.parse(localStorage.getItem("themesTried")||"[]"); if(tr.indexOf(name)<0){tr.push(name);localStorage.setItem("themesTried",JSON.stringify(tr));} if(tr.length>=4) unlock("themer"); }catch(e){}
    window.__accentRGB=t.rgb.split(",").map(function(n){return +n/255;});
    try{ var ic=document.querySelector('link[rel="icon"]'); if(!ic){ic=document.createElement("link");ic.setAttribute("rel","icon");document.head.appendChild(ic);} ic.setAttribute("href","data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="26" fill="'+t.a+'"/><text x="50" y="72" font-size="60" font-family="Arial,sans-serif" font-weight="800" fill="#07100e" text-anchor="middle">H</text></svg>')); }catch(e){}
    try{ window.dispatchEvent(new Event("themechange")); }catch(e){}
  }
  function currentTheme(){ try{return localStorage.getItem("siteTheme")||"jade";}catch(e){return "jade";} }
  function cycleTheme(){ var i=THEME_ORDER.indexOf(currentTheme()); var n=THEME_ORDER[(i+1)%THEME_ORDER.length]; applyTheme(n); showToast("Theme: "+n.charAt(0).toUpperCase()+n.slice(1)); }
  try{ var saved=localStorage.getItem("siteTheme"); if(saved&&saved!=="jade"&&THEMES[saved]) applyTheme(saved); }catch(e){}

  /* ===== styles ===== */
  var css=
  "#cmdk-fab{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:130;display:flex;align-items:center;gap:8px;font-family:var(--mono,monospace);font-size:12px;color:var(--ink,#edf2ef);background:rgba(7,16,14,.7);backdrop-filter:blur(10px);border:1px solid var(--line-2,rgba(255,255,255,.2));padding:9px 15px;border-radius:100px;cursor:pointer;transition:transform .15s,border-color .2s;}"+
  "#cmdk-fab:hover{transform:translateX(-50%) translateY(-2px);border-color:var(--accent,#2be3b0);}"+
  "#cmdk-fab b{color:var(--accent,#2be3b0);font-weight:500;}#cmdk-fab kbd{font-family:inherit;background:rgba(255,255,255,.08);border:1px solid var(--line,rgba(255,255,255,.1));border-radius:5px;padding:1px 6px;font-size:11px;}"+
  "@media(max-width:640px){#cmdk-fab kbd{display:none;}}"+
  ".ov{position:fixed;inset:0;z-index:200;display:none;align-items:flex-start;justify-content:center;padding:14vh 16px 16px;background:rgba(3,8,7,.6);backdrop-filter:blur(6px);}"+
  ".ov.on{display:flex;}"+
  "#cmdk{width:100%;max-width:560px;background:#0b1714;border:1px solid var(--line-2,rgba(255,255,255,.2));border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6);animation:ci .2s ease;}"+
  "@keyframes ci{from{opacity:0;transform:translateY(-10px) scale(.98);}to{opacity:1;transform:none;}}"+
  "#cmdk input{width:100%;border:none;outline:none;background:transparent;color:var(--ink,#edf2ef);font-family:var(--body,sans-serif);font-size:17px;padding:18px 20px;border-bottom:1px solid var(--line,rgba(255,255,255,.1));}"+
  "#cmdk-list{max-height:52vh;overflow:auto;padding:8px;}"+
  "#cmdk-list .row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;border-radius:11px;cursor:pointer;color:var(--ink,#edf2ef);font-size:15px;}"+
  "#cmdk-list .row .g{font-family:var(--mono,monospace);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint,#7c8b84);}"+
  "#cmdk-list .row[aria-selected=true]{background:rgba(var(--accentRGB,43,227,176),.14);}#cmdk-list .row[aria-selected=true] .g{color:var(--accent,#2be3b0);}"+
  "#cmdk-empty{padding:22px;color:var(--faint,#7c8b84);font-size:14px;text-align:center;}"+
  ".ovfoot{display:flex;gap:16px;padding:10px 16px;border-top:1px solid var(--line,rgba(255,255,255,.1));font-family:var(--mono,monospace);font-size:11px;color:var(--faint,#7c8b84);flex-wrap:wrap;}"+
  "#xtoast{position:fixed;left:50%;bottom:80px;transform:translate(-50%,16px);z-index:260;opacity:0;pointer-events:none;background:var(--accent,#2be3b0);color:#07100e;font-family:var(--mono,monospace);font-size:13px;font-weight:500;padding:11px 18px;border-radius:100px;transition:opacity .3s,transform .3s;max-width:90vw;text-align:center;}"+
  "#xtoast.on{opacity:1;transform:translate(-50%,0);}"+
  "#xcurtain{position:fixed;inset:0;z-index:300;background:var(--accent,#2be3b0);transform:translateY(100%);pointer-events:none;}"+
  "#xcurtain.go{transform:translateY(0);transition:transform .42s cubic-bezier(.76,0,.24,1);}"+
  "#xmatrix{position:fixed;inset:0;z-index:250;pointer-events:none;opacity:0;transition:opacity .4s;}#xmatrix.on{opacity:.85;}"+
  /* terminal */
  "#term{width:100%;max-width:680px;height:min(70vh,560px);background:rgba(5,12,10,.97);border:1px solid var(--line-2,rgba(255,255,255,.2));border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(0,0,0,.6);font-family:var(--mono,monospace);animation:ci .2s ease;}"+
  "#term .bar{display:flex;align-items:center;gap:8px;padding:11px 14px;border-bottom:1px solid var(--line,rgba(255,255,255,.1));font-size:12px;color:var(--faint,#7c8b84);}"+
  "#term .bar i{width:11px;height:11px;border-radius:50%;display:inline-block;}#term .bar .r{background:#ff5f56;}#term .bar .y{background:#ffbd2e;}#term .bar .g{background:var(--accent,#2be3b0);}"+
  "#term-out{flex:1;overflow:auto;padding:16px;font-size:13.5px;line-height:1.6;color:#cdd8d3;white-space:pre-wrap;word-break:break-word;}"+
  "#term-out .a{color:var(--accent,#2be3b0);}#term-out .m{color:var(--faint,#7c8b84);}#term-out a{color:var(--accent,#2be3b0);}"+
  "#term-line{display:flex;align-items:center;gap:8px;padding:10px 16px;border-top:1px solid var(--line,rgba(255,255,255,.1));}"+
  "#term-line span{color:var(--accent,#2be3b0);font-size:13.5px;}#term-in{flex:1;background:transparent;border:none;outline:none;color:#edf2ef;font-family:var(--mono,monospace);font-size:13.5px;}"+
  /* cheat sheet */
  "#cheat{width:100%;max-width:460px;background:#0b1714;border:1px solid var(--line-2,rgba(255,255,255,.2));border-radius:16px;padding:22px 24px;box-shadow:0 30px 80px rgba(0,0,0,.6);font-family:var(--mono,monospace);animation:ci .2s ease;}"+
  "#cheat h3{font-family:var(--display,sans-serif);font-weight:600;font-size:20px;color:var(--ink,#edf2ef);margin:0 0 14px;}"+
  "#cheat .k{display:flex;justify-content:space-between;gap:14px;padding:8px 0;border-bottom:1px solid var(--line,rgba(255,255,255,.08));font-size:13px;color:#cdd8d3;}"+
  "#cheat .k:last-child{border-bottom:none;}#cheat .k kbd{background:rgba(var(--accentRGB,43,227,176),.14);color:var(--accent,#2be3b0);border-radius:5px;padding:2px 8px;font-size:12px;}"+
  /* github */
  ".gh-list{display:grid;gap:10px;}"+
  ".gh-bar{display:flex;height:10px;border-radius:6px;overflow:hidden;margin:0 0 8px;border:1px solid var(--line,rgba(255,255,255,.08));}"+
  ".gh-bar i{height:100%;}.gh-leg{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:18px;font-family:var(--mono,monospace);font-size:11.5px;color:var(--muted,#93a8a1);}"+
  ".gh-leg span b{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px;vertical-align:middle;}"+
  ".gh-item{display:block;border:1px solid var(--line,rgba(255,255,255,.1));border-radius:14px;padding:16px 18px;transition:border-color .25s,transform .2s,background .25s;background:rgba(11,23,20,.5);}"+
  ".gh-item:hover{border-color:rgba(var(--accentRGB,43,227,176),.4);transform:translateY(-3px);background:rgba(var(--accentRGB,43,227,176),.05);}"+
  ".gh-item .n{font-family:var(--display,sans-serif);font-weight:600;font-size:18px;color:var(--ink,#edf2ef);letter-spacing:-.01em;}"+
  ".gh-item .d{font-size:14px;color:var(--muted,#93a8a1);margin-top:6px;}.gh-item .m{font-family:var(--mono,monospace);font-size:11.5px;color:var(--faint,#7c8b84);margin-top:10px;display:flex;gap:14px;}.gh-item .m b{color:var(--accent,#2be3b0);font-weight:400;}"+
  "@media(prefers-reduced-motion:reduce){#xcurtain,#cmdk,#term,#cheat{transition:none;animation:none;}}";
  var st=D.createElement("style"); st.textContent=css; D.head.appendChild(st);

  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  /* ===== toast / curtain ===== */
  var toast=D.createElement("div"); toast.id="xtoast"; D.body.appendChild(toast); var tT;
  function showToast(m){ toast.textContent=m; toast.classList.add("on"); clearTimeout(tT); tT=setTimeout(function(){toast.classList.remove("on");},2800); }
  var curtain=D.createElement("div"); curtain.id="xcurtain"; D.body.appendChild(curtain);
  function goTo(url){ if(reduce){location.href=url;return;} curtain.classList.add("go"); setTimeout(function(){location.href=url;},420); }

  /* ===== achievements ===== */
  var ACH={explorer:"Opened the command palette",terminal:"Opened the terminal",konami:"Found the Konami code",matrix:"Entered the matrix",themer:"Tried every theme",gamer:"Played the bug hunt"};
  function getAchv(){ try{return JSON.parse(localStorage.getItem("achv")||"[]");}catch(e){return[];} }
  function unlock(id){ var a=getAchv(); if(a.indexOf(id)<0){ a.push(id); try{localStorage.setItem("achv",JSON.stringify(a));}catch(e){} showToast("Achievement unlocked: "+(ACH[id]||id)); } }
  function achvText(){ var a=getAchv(); var lines=["Achievements  "+a.length+" / "+Object.keys(ACH).length,""]; Object.keys(ACH).forEach(function(k){ lines.push((a.indexOf(k)>-1?"[x] ":"[ ] ")+ACH[k]); }); return lines.join("\n"); }

  /* ===== page transitions ===== */
  D.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest("a"); if(!a) return;
    if(a.target==="_blank"||a.hasAttribute("download")) return;
    var href=a.getAttribute("href")||"";
    if(!href||href[0]==="#"||href.indexOf("mailto:")===0||href.indexOf("tel:")===0) return;
    if(/^https?:\/\//i.test(href) && a.host!==location.host) return;
    if(!/\.html(\?|#|$)/.test(href) && !/\/$/.test(href)) return;
    if(a.pathname===location.pathname && a.hash) return;
    e.preventDefault(); goTo(a.href);
  },true);

  /* ===== command palette ===== */
  var ITEMS=[
    {t:"Home",g:"Go",u:"index.html"},{t:"Selected work",g:"Go",u:"index.html#work"},{t:"About",g:"Go",u:"index.html#about"},
    {t:"Experience",g:"Go",u:"index.html#career"},{t:"Writing / Blog",g:"Go",u:"blog.html"},{t:"Playground game",g:"Go",u:"index.html#play"},
    {t:"Get in touch",g:"Go",u:"index.html#contact"},
    {t:"Open terminal",g:"Tool",run:function(){openTerm();}},
    {t:"Keyboard shortcuts",g:"Tool",run:function(){openCheat();}},
    {t:"View achievements",g:"Tool",run:function(){openTerm(); termPrint(achvText());}},
    {t:"Web3 & on-chain",g:"Topic",u:"web3.html"},{t:"AI & agents",g:"Topic",u:"ai.html"},{t:"Full-stack & performance",g:"Topic",u:"full-stack.html"},
    {t:"Game dev",g:"Topic",u:"game-dev.html"},{t:"Career & building in public",g:"Topic",u:"career.html"},
    {t:"Hire a senior Web3 engineer",g:"Hire",u:"hire-senior-web3-engineer.html"},{t:"Hire a freelance DeFi developer",g:"Hire",u:"hire-freelance-defi-developer.html"},
    {t:"Hire a remote full-stack engineer",g:"Hire",u:"hire-remote-fullstack-engineer.html"},{t:"Hire an AI engineer",g:"Hire",u:"hire-ai-engineer.html"},
    {t:"Shiba Inu case study",g:"Work",u:"shiba-inu.html"},{t:"OpenSpeaker case study",g:"Work",u:"openspeaker.html"},{t:"GatheredHere case study",g:"Work",u:"gatheredhere.html"},
    {t:"ElasticSwap case study",g:"Work",u:"elasticswap.html"},{t:"Koji case study",g:"Work",u:"koji.html"},{t:"Aftertutor case study",g:"Work",u:"aftertutor.html"},
    {t:"Download resume",g:"File",u:"Harman-Kamboj-Resume.pdf"},
    {t:"Copy email address",g:"Action",run:function(){ try{navigator.clipboard.writeText("playcivil@gmail.com");showToast("Email copied");}catch(e){showToast("playcivil@gmail.com");} }},
    {t:"Email Harman",g:"Action",run:function(){location.href="mailto:playcivil@gmail.com";}},
    {t:"GitHub profile",g:"Link",run:function(){window.open("https://github.com/hammyasf","_blank","noopener");}},
    {t:"LinkedIn profile",g:"Link",run:function(){window.open("https://linkedin.com/in/hammyasf","_blank","noopener");}},
    {t:"Theme: Jade",g:"Theme",run:function(){applyTheme("jade");showToast("Theme: Jade");}},
    {t:"Theme: Electric blue",g:"Theme",run:function(){applyTheme("blue");showToast("Theme: Electric blue");}},
    {t:"Theme: Violet",g:"Theme",run:function(){applyTheme("violet");showToast("Theme: Violet");}},
    {t:"Theme: Coral",g:"Theme",run:function(){applyTheme("coral");showToast("Theme: Coral");}},
    {t:"Toggle sound",g:"Action",run:function(){var s=D.getElementById("snd");if(s){s.click();showToast("Sound toggled");}else showToast("Sound is on the home page");}},
    {t:"Play the bug-smash game",g:"Action",run:function(){playGame();}}
  ];
  var ov,inp,list,sel=0,filtered=ITEMS.slice(),built=false;
  function build(){
    if(built)return; built=true;
    ov=D.createElement("div"); ov.id="cmdk-ov"; ov.className="ov";
    ov.innerHTML='<div id="cmdk" role="dialog" aria-label="Command menu"><input id="cmdk-in" type="text" placeholder="Type a command or jump to..." aria-label="Command menu" autocomplete="off" spellcheck="false"><div id="cmdk-list" role="listbox"></div><div class="ovfoot"><span>&#8593;&#8595; navigate</span><span>&#8629; select</span><span>esc close</span></div></div>';
    D.body.appendChild(ov); inp=D.getElementById("cmdk-in"); list=D.getElementById("cmdk-list");
    ov.addEventListener("click",function(e){ if(e.target===ov) closeP(); });
    inp.addEventListener("input",function(){ filter(inp.value); });
    inp.addEventListener("keydown",function(e){
      if(e.key==="ArrowDown"){e.preventDefault();sel=Math.min(sel+1,filtered.length-1);render();}
      else if(e.key==="ArrowUp"){e.preventDefault();sel=Math.max(sel-1,0);render();}
      else if(e.key==="Enter"){e.preventDefault();choose(filtered[sel]);}
      else if(e.key==="Escape"){e.preventDefault();closeP();}
    });
  }
  function filter(q){ q=(q||"").toLowerCase().trim(); filtered=q?ITEMS.filter(function(i){return (i.t+" "+i.g).toLowerCase().indexOf(q)>-1;}):ITEMS.slice(); sel=0; render(); }
  function render(){
    if(!filtered.length){ list.innerHTML='<div id="cmdk-empty">No matches</div>'; return; }
    var h=""; for(var i=0;i<filtered.length;i++){ var it=filtered[i]; h+='<div class="row" role="option" data-i="'+i+'" aria-selected="'+(i===sel)+'"><span>'+esc(it.t)+'</span><span class="g">'+it.g+'</span></div>'; }
    list.innerHTML=h;
    list.querySelectorAll(".row").forEach(function(r){ r.addEventListener("mouseenter",function(){sel=+r.getAttribute("data-i");mark();}); r.addEventListener("click",function(){choose(filtered[+r.getAttribute("data-i")]);}); });
    var s=list.querySelector('[aria-selected=true]'); if(s&&s.scrollIntoView)s.scrollIntoView({block:"nearest"});
  }
  function mark(){ list.querySelectorAll(".row").forEach(function(r){ r.setAttribute("aria-selected",(+r.getAttribute("data-i"))===sel); }); }
  function choose(it){ if(!it)return; if(it.run){ closeP(); it.run(); } else if(it.u){ closeP(); goTo(it.u); } }
  function openP(){ build(); ov.classList.add("on"); inp.value=""; filter(""); setTimeout(function(){inp.focus();},30); unlock("explorer"); }
  function closeP(){ if(ov) ov.classList.remove("on"); }

  /* ===== terminal ===== */
  var termOv,termOut,termIn,termBuilt=false,hist=[],hi=0;
  function buildTerm(){
    if(termBuilt)return; termBuilt=true;
    termOv=D.createElement("div"); termOv.className="ov"; termOv.id="term-ov";
    termOv.innerHTML='<div id="term" role="dialog" aria-label="Terminal"><div class="bar"><i class="r"></i><i class="y"></i><i class="g"></i> &nbsp;harman@portfolio: ~</div><div id="term-out"></div><div id="term-line"><span>&#10095;</span><input id="term-in" autocomplete="off" spellcheck="false" aria-label="Terminal input"></div></div>';
    D.body.appendChild(termOv); termOut=D.getElementById("term-out"); termIn=D.getElementById("term-in");
    termOv.addEventListener("click",function(e){ if(e.target===termOv) closeTerm(); });
    termIn.addEventListener("keydown",function(e){
      if(e.key==="Enter"){ var v=termIn.value; termIn.value=""; if(v.trim()){hist.push(v);hi=hist.length;} runCmd(v); }
      else if(e.key==="Escape"){ closeTerm(); }
      else if(e.key==="ArrowUp"){ e.preventDefault(); if(hi>0){hi--;termIn.value=hist[hi]||"";} }
      else if(e.key==="ArrowDown"){ e.preventDefault(); if(hi<hist.length-1){hi++;termIn.value=hist[hi]||"";}else{hi=hist.length;termIn.value="";} }
    });
    termPrint("Harman Kamboj — portfolio shell. Type 'help' for commands.\n");
  }
  function termPrint(s,cls){ var d=D.createElement("div"); if(cls)d.className=cls; d.innerHTML=s; termOut.appendChild(d); termOut.scrollTop=termOut.scrollHeight; }
  function openTerm(){ buildTerm(); termOv.classList.add("on"); setTimeout(function(){termIn.focus();},30); unlock("terminal"); }
  function closeTerm(){ if(termOv) termOv.classList.remove("on"); }
  var CMDS={
    help:function(){return "Commands:\n  about     who I am\n  work      selected projects\n  skills    my stack\n  hire      how to work with me\n  contact   reach me\n  email     copy my email\n  resume    download CV\n  blog      open the writing\n  gh        my recent github repos\n  theme x   jade|blue|violet|coral\n  game      play the bug hunt\n  achievements   what you have unlocked\n  matrix    ...\n  clear     wipe the screen";},
    about:function(){return "Senior full-stack engineer, 12+ years, coding since age 7.\nShipped the web platform for a top-10 crypto, enterprise systems, DeFi, and apps with hundreds of thousands of installs.\nFully remote, available now.";},
    whoami:function(){return "harman — senior full-stack / Web3 / AI engineer.";},
    work:function(){return "Shiba Inu, OpenSpeaker (Endeavor), GatheredHere, ElasticSwap, Koji (Gometa), Aftertutor.\nType the name or run 'open work' to see them.";},
    skills:function(){return "Go, TypeScript, JavaScript, PHP, Python, Java, Kotlin, Swift, C#\nReact, Next.js, Svelte, Node, Laravel, GraphQL, The Graph, Subsquid\nUnity, Godot, Three.js, Phaser, React Native, Postgres, Mongo, Redis";},
    stack:function(){return CMDS.skills();},
    hire:function(){return "Open to senior full-stack, Web3, or AI roles, fully remote.\nRun 'contact' or 'email'. Opening the hire page...";},
    contact:function(){setTimeout(function(){goTo("index.html#contact");},500);return "playcivil@gmail.com — opening contact...";},
    email:function(){try{navigator.clipboard.writeText("playcivil@gmail.com");return "Copied playcivil@gmail.com to your clipboard.";}catch(e){return "playcivil@gmail.com";}},
    resume:function(){setTimeout(function(){window.open("Harman-Kamboj-Resume.pdf","_blank");},300);return "Opening resume...";},
    blog:function(){setTimeout(function(){goTo("blog.html");},500);return "Opening the writing...";},
    achievements:function(){return achvText();},
    clear:function(){termOut.innerHTML="";return "";},
    sudo:function(){return "Nice try. You already have root here.";},
    ls:function(){return "about  work  skills  blog  hire  contact  resume  gh  game  matrix";},
    exit:function(){setTimeout(closeTerm,200);return "bye.";}
  };
  function runCmd(raw){
    var line=(raw||"").trim(); termPrint('<span class="a">&#10095;</span> '+esc(raw));
    if(!line) return;
    var parts=line.split(/\s+/), cmd=parts[0].toLowerCase(), arg=parts[1]||"";
    if(cmd==="theme"){ if(THEMES[arg]){applyTheme(arg);termPrint("Theme set to "+arg);}else termPrint('<span class="m">usage: theme jade|blue|violet|coral</span>'); return; }
    if(cmd==="game"){ termPrint("Launching bug hunt..."); playGame(); setTimeout(closeTerm,300); return; }
    if(cmd==="gh"){ termPrint('<span class="m">fetching from github...</span>'); fetch("https://api.github.com/users/hammyasf/repos?sort=pushed&per_page=6").then(function(r){return r.json();}).then(function(rp){ if(Array.isArray(rp)&&rp.length){ rp.slice(0,6).forEach(function(x){ termPrint('<span class="a">'+esc(x.name)+'</span>  <span class="m">'+esc(x.language||"")+'</span>'); }); } else termPrint('<span class="m">no public repos found</span>'); }).catch(function(){termPrint('<span class="m">could not reach github</span>');}); return; }
    if(cmd==="matrix"){ termPrint("Wake up..."); unlock("matrix"); setTimeout(function(){closeTerm();matrix();},400); return; }
    if(cmd==="open"){ var map={work:"index.html#work",blog:"blog.html",about:"index.html#about",contact:"index.html#contact"}; if(map[arg]){setTimeout(function(){goTo(map[arg]);},300);termPrint("opening "+arg+"...");}else termPrint('<span class="m">usage: open work|blog|about|contact</span>'); return; }
    if(CMDS[cmd]){ var out=CMDS[cmd](); if(out) termPrint(out); }
    else termPrint('<span class="m">command not found: '+esc(cmd)+". type 'help'</span>");
  }

  /* ===== matrix rain ===== */
  var mcv,mctx,mraf,mtimer;
  function matrix(){
    if(reduce){showToast("Matrix mode skipped (reduced motion)");return;}
    if(!mcv){ mcv=D.createElement("canvas"); mcv.id="xmatrix"; D.body.appendChild(mcv); mctx=mcv.getContext("2d"); }
    function size(){ mcv.width=window.innerWidth; mcv.height=window.innerHeight; }
    size();
    var chars="01<>/{}[]()$#*+=abcdefABCDEF0123456789".split(""); var fs=15; var cols=Math.floor(mcv.width/fs); var drops=[]; for(var i=0;i<cols;i++)drops[i]=Math.random()*-50;
    mcv.classList.add("on");
    var acc=getComputedStyle(root).getPropertyValue("--accent").trim()||"#2be3b0";
    function draw(){ mctx.fillStyle="rgba(5,12,10,.10)"; mctx.fillRect(0,0,mcv.width,mcv.height); mctx.fillStyle=acc; mctx.font=fs+"px monospace";
      for(var i=0;i<drops.length;i++){ var c=chars[Math.floor(Math.random()*chars.length)]; mctx.fillText(c,i*fs,drops[i]*fs); if(drops[i]*fs>mcv.height&&Math.random()>.975)drops[i]=0; drops[i]++; }
      mraf=requestAnimationFrame(draw);
    }
    draw();
    clearTimeout(mtimer); mtimer=setTimeout(function(){ cancelAnimationFrame(mraf); mcv.classList.remove("on"); setTimeout(function(){ if(mctx)mctx.clearRect(0,0,mcv.width,mcv.height); },500); },6500);
  }

  /* ===== cheat sheet ===== */
  var cheatOv,cheatBuilt=false;
  function buildCheat(){
    if(cheatBuilt)return; cheatBuilt=true;
    cheatOv=D.createElement("div"); cheatOv.className="ov"; cheatOv.id="cheat-ov";
    var rows=[["&#8984;K / Ctrl+K","Command palette"],["`","Terminal"],["?","This cheat sheet"],["t","Cycle theme"],["p","Play the game"],["g then h","Home"],["g then w","Work"],["g then b","Blog"],["g then c","Contact"],["esc","Close"]];
    cheatOv.innerHTML='<div id="cheat" role="dialog" aria-label="Keyboard shortcuts"><h3>Keyboard shortcuts</h3>'+rows.map(function(r){return '<div class="k"><span>'+r[1]+'</span><kbd>'+r[0]+'</kbd></div>';}).join("")+'</div>';
    D.body.appendChild(cheatOv); cheatOv.addEventListener("click",function(e){ if(e.target===cheatOv) cheatOv.classList.remove("on"); });
  }
  function openCheat(){ buildCheat(); cheatOv.classList.toggle("on"); }

  /* ===== actions ===== */
  function playGame(){ var b=D.getElementById("g-start"); if(b){ var p=D.getElementById("play"); if(p)p.scrollIntoView({behavior:reduce?"auto":"smooth"}); setTimeout(function(){b.click();unlock("gamer");},reduce?0:600); } else { goTo("index.html#play"); } }

  /* ===== launcher ===== */
  var fab=D.createElement("button"); fab.id="cmdk-fab"; fab.type="button"; fab.setAttribute("aria-label","Open command menu");
  fab.innerHTML='<b>&#8984;</b> Menu <kbd>&#8984;K</kbd>'; fab.addEventListener("click",openP); D.body.appendChild(fab);

  /* ===== keyboard shortcuts ===== */
  var gPending=false,gT;
  window.addEventListener("keydown",function(e){
    if((e.metaKey||e.ctrlKey)&&(e.key==="k"||e.key==="K")){ e.preventDefault(); if(ov&&ov.classList.contains("on"))closeP(); else openP(); return; }
    var ae=D.activeElement, typing=ae&&(ae.tagName==="INPUT"||ae.tagName==="TEXTAREA"||ae.isContentEditable);
    if(typing) return;
    if(e.metaKey||e.ctrlKey||e.altKey) return;
    var k=e.key;
    if(gPending){ gPending=false; clearTimeout(gT);
      var nav={h:"index.html",w:"index.html#work",b:"blog.html",c:"index.html#contact",a:"index.html#about",e:"index.html#career"};
      if(nav[k]){ e.preventDefault(); goTo(nav[k]); return; }
    }
    if(k==="?"){ e.preventDefault(); openCheat(); }
    else if(k==="`"){ e.preventDefault(); if(termOv&&termOv.classList.contains("on"))closeTerm(); else openTerm(); }
    else if(k==="t"){ cycleTheme(); }
    else if(k==="p"){ playGame(); }
    else if(k==="k"){ openP(); }
    else if(k==="g"){ gPending=true; clearTimeout(gT); gT=setTimeout(function(){gPending=false;},800); }
  });

  /* ===== konami (achievement) ===== */
  (function(){ var seq=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"],p=0;
    window.addEventListener("keydown",function(e){ var k=e.key; if(k===seq[p]||(k&&k.toLowerCase&&k.toLowerCase()===seq[p])){ p++; if(p===seq.length){p=0;unlock("konami");} } else { p=(k===seq[0])?1:0; } });
  })();

  /* ===== live GitHub (homepage) ===== */
  var LANGCOL=["var(--accent,#2be3b0)","var(--accent-2,#14c3c9)","#8a7bff","#ff9a3d","#5fd0ff","#c2cfca"];
  function loadGH(){
    var host=D.getElementById("gh-live"); if(!host) return;
    fetch("https://api.github.com/users/hammyasf/repos?sort=pushed&per_page=30")
      .then(function(r){ return r.ok?r.json():Promise.reject(); })
      .then(function(repos){
        if(!Array.isArray(repos)||!repos.length) return;
        var real=repos.filter(function(r){return !r.fork;}); if(!real.length) real=repos;
        var langs={}; real.forEach(function(r){ if(r.language) langs[r.language]=(langs[r.language]||0)+1; });
        var lk=Object.keys(langs).sort(function(a,b){return langs[b]-langs[a];}).slice(0,6);
        var tot=lk.reduce(function(s,k){return s+langs[k];},0)||1;
        var bar="",leg="";
        lk.forEach(function(k,i){ var pc=Math.round(langs[k]/tot*100); bar+='<i style="width:'+pc+'%;background:'+LANGCOL[i%LANGCOL.length]+'"></i>'; leg+='<span><b style="background:'+LANGCOL[i%LANGCOL.length]+'"></b>'+esc(k)+' '+pc+'%</span>'; });
        var top=real.slice(0,4); var h="";
        if(lk.length) h+='<div class="gh-bar">'+bar+'</div><div class="gh-leg">'+leg+'</div>';
        h+='<div class="gh-list">';
        top.forEach(function(r){ var when=r.pushed_at?new Date(r.pushed_at).toLocaleDateString("en-US",{month:"short",year:"numeric"}):"";
          h+='<a class="gh-item" href="'+r.html_url+'" target="_blank" rel="noopener"><div class="n">'+esc(r.name)+'</div>'+(r.description?'<div class="d">'+esc(r.description)+'</div>':'')+'<div class="m">'+(r.language?'<b>'+esc(r.language)+'</b>':'')+(when?'<span>updated '+when+'</span>':'')+(r.stargazers_count>0?'<span>&#9733; '+r.stargazers_count+'</span>':'')+'</div></a>'; });
        h+='</div>'; host.innerHTML=h;
        var sec=host.closest("section"); if(sec) sec.style.display="";
      })
      .catch(function(){ var sec=host.closest("section"); if(sec) sec.style.display="none"; });
  }
  function idle(fn){ if("requestIdleCallback" in window) requestIdleCallback(fn,{timeout:2500}); else setTimeout(fn,1200); }
  if(D.getElementById("gh-live")){ if(D.readyState!=="loading") idle(loadGH); else window.addEventListener("load",function(){idle(loadGH);}); }

  /* hook game start for achievement even if clicked directly */
  var gs=D.getElementById("g-start"); if(gs) gs.addEventListener("click",function(){unlock("gamer");});
})();
