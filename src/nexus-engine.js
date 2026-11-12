// NEXUS 01 — 8K Layered Paper-Cutout Kirigami Renderer, WebAudio SFX & Interactive Choreography
const $=q=>document.querySelector(q);
const $$=q=>[...document.querySelectorAll(q)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smoothstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
/* Embedded inline image atlas (`const IM = { ... }`) is compiled directly into /index.html for zero-request 8K rendering. */

/* Preload all images into fast HTMLImageElements for 60fps canvas compositing */
const IMG={};
Object.keys(IM).forEach(k=>{
  const im=new Image();
  im.src=IM[k];
  IMG[k]=im;
});

/* Bind static DOM slots */
$('#img-mist-face1').src=IM.pe_profile;
$('#img-mist-phone').src=IM.pe_relieved;
$('#img-mist-shock').src=IM.pe_shocked;
$('#img-impact-portrait').src=IM.pe_profile;
$('#img-impact-eyes').src=IM.pey_shock;
$('#img-last-mem').src=IM.p_mem;
$('#img-mono-hd').src=IM.hd_monolith;
$('#portal-hd-img').src=IM.hd_monolith;
$('#reach-hd-img').src=IM.hd_reach;
$('#step-hd-img').src=IM.hd_step;
$('#img-eye-parth').src=IM.hd_eye_parth;
$('#img-eye-god').src=IM.hd_eye_god;
$('#img-dual-god').src=IM.hd_eye_god;
$('#img-dual-parth').src=IM.hd_eye_parth;
$('#img-sanc-speaker').src=IM.ge_serene;
$('#shatter-cel-bg').src=IM.celestial;
$('#img-shatter-inset').src=IM.pe_relieved;
$('#folio-parth').src=IM.pe_confident;
$('#contact-parth').src=IM.p_idle;
$('#ref-p-img').src=IM.ref_p;
$('#ref-g-img').src=IM.ref_g;

/* ==================== WEB AUDIO + SYNCHRONIZED PART-BY-PART JAPANESE VOICE ENGINE ==================== */
const JP_CUES={
  prologue:[{who:'n',spk:'NARRATOR',jp:'序章。漆黒の向こうから、創作者パルトの暗号領域が起動する。'}],
  mist1:[{who:'n',spk:'NARRATOR',jp:'ムンバイ、午後六時四十二分。街がざわめく中、パルトは最新のビルドを本番へ送り出した。'}],
  mist2:[{who:'p',spk:'PARTH',jp:'待て…バロン全国ハッカソンの結果が出た。ガラーが準優勝！？デヴハーバーの仲間が沸いている！'}],
  mist3:[{who:'p',spk:'PARTH',jp:'まずはライブ記録を更新しよう…ちょっと待て、街の輪郭がなぜ引き裂かれている！？'}],
  impact:[{who:'n',spk:'BREACH',jp:'未知のファイアウォールが地平を切り裂く。真紅の走査線が街を飲み込み——接続が遮断された。'}],
  impact2:[{who:'n',spk:'ISOLATION',jp:'わずか一ミリ秒で街の音が消えた。雑音も遅延もない。ただ真っ白な隔離領域だけ。'}],
  void_orb:[{who:'n',spk:'MEMORY',jp:'ローカル記憶に残されたもの。稼働中のプロトタイプ、全国の表彰台、そして未完のコード。'}],
  monolith:[{who:'n',spk:'AWAKENING',jp:'隔離領域の向こう、折り紙の石階段が白銀のポートへと伸びていく。彼の足は迷わず前へ踏み出した。'}],
  mono_legs:[{who:'n',spk:'FOOTSTEPS',jp:'折り紙の階段を一歩ずつ駆け上がり、暗号の門へと確かな鼓動を刻んでいく。'}],
  portal:[{who:'n',spk:'THRESHOLD',jp:'白銀のゲートが高周波の共鳴を響かせ、あらゆる未検証プロセスを内側へと引き寄せる。'}],
  portal2:[{who:'n',spk:'THRESHOLD',jp:'データの嵐がコートを揺らす。最深部の防壁を前に、彼は右手を掲げた。'}],
  reach:[{who:'p',spk:'PARTH',jp:'恐れはない。長押しして聖域のファイアウォールを突破しろ！'}],
  step:[{who:'p',spk:'PARTH',jp:'深く息を吸い——パルトは強制突破を実行し、中核へと踏み込んだ。'}],
  curtain:[{who:'p',spk:'PARTH',jp:'ここは…単なる通信切断じゃない。真紅の柱が中核領域を囲んでいる！'}],
  curtain_god:[{who:'g',spk:'THE DIVINE',jp:'玉座の監視者が問う——侵入者よ、お前の創った技術が本物だと証明してみせろ。'}],
  medallions:[{who:'n',spk:'ESSENCES',jp:'防御、構築、創造。三つの暗号紋章が中核の前に並び立つ。'}],
  pour:[{who:'n',spk:'LIQUID MERCURY',jp:'防御と構築と創造が液体水銀へと溶け合い、揺るぎないセキュリティ技術にコンパイルされる。'}],
  vortex:[{who:'pw',spk:'PARTH · AWAKENED',jp:'ルート権限解放——遅延ゼロ、限界なし。至高の設計者が今ここに目覚める！'}],
  shatter:[{who:'n',spk:'EPILOGUE',jp:'ナビムンバイの空に真紅の防壁が砕け散る。デプロイ完了——パルトは次なる創造へと目覚める。'}],
  collection:[{who:'n',spk:'COLLECTION',jp:'ここが創作者パルト・ヴィジャイ・ギッデの検証済みアーカイブだ。'}]
};

const Sound=(()=>{
  let ctx,master,comp,warmShelf,lp,nb,windGain,windFilter,padBus,live=false,unlocked=false,declined=false,voiceOn=false,hornPlayed=false,screechPlayed=false,hitPlayed=false,lastApproachT=0,lastStepT=0;
  let jpVoices=[],speechToken=0,subHideTimer=null,activeUtt=null,cueTimer=null,lastZone='',targetMaster=0.56,isSpeaking=false;
  const setMasterLevel=(v,tc=0.22)=>{if(master&&ctx)master.gain.setTargetAtTime(live?v:0,ctx.currentTime,tc)};
  function refreshVoices(){
    if(!window.speechSynthesis)return;
    try{
      const all=speechSynthesis.getVoices()||[];
      jpVoices=all.filter(v=>/^ja/i.test(v.lang||'')||/japanese|nihongo|nanami|keita|haruka|ichiro|ayumi|sayaka|kyoko|otoya/i.test(v.name||''));
    }catch{}
  }
  refreshVoices();
  if(window.speechSynthesis&&'onvoiceschanged' in speechSynthesis){
    speechSynthesis.addEventListener('voiceschanged',refreshVoices);
  }
  function pickVoice(who){
    if(!jpVoices.length)refreshVoices();
    if(!jpVoices.length)return null;
    const lower=v=>(v.name||'').toLowerCase();
    const neural=v=>/online|natural|google|neural|nanami|keita/i.test(lower(v));
    const male=jpVoices.find(v=>neural(v)&&/keita|ichiro|otoya|takumi|hattori|male/i.test(lower(v)))||jpVoices.find(v=>/keita|ichiro|otoya|takumi|hattori|male/i.test(lower(v)));
    const fem=jpVoices.find(v=>neural(v)&&/nanami|google|haruka|ayumi|sayaka|kyoko/i.test(lower(v)))||jpVoices.find(v=>neural(v))||jpVoices[0];
    if(who==='g')return male||jpVoices[jpVoices.length-1]||fem||jpVoices[0];
    if(who==='p'||who==='pw')return (male&&male!==fem?male:fem)||jpVoices[0];
    return fem||male||jpVoices[0];
  }
  function boot(){
    if(ctx){if(ctx.state==='suspended')ctx.resume();return true}
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return false;
    ctx=new AC();
    /* Studio Mastering Bus: Warm high-shelf rolloff + clean DynamicsCompressor (zero digital clipping) */
    comp=ctx.createDynamicsCompressor();
    comp.threshold.value=-15;comp.knee.value=18;comp.ratio.value=5;comp.attack.value=0.008;comp.release.value=0.24;
    warmShelf=ctx.createBiquadFilter();
    warmShelf.type='highshelf';warmShelf.frequency.value=3400;warmShelf.gain.value=-4.0;
    master=ctx.createGain();master.gain.value=0;
    master.connect(warmShelf);warmShelf.connect(comp);comp.connect(ctx.destination);

    /* Lush Stereo-Shaped Ambient Synth Pad (A-sus2 / F#m9 atmospheric bed) */
    lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=480;lp.Q.value=0.85;
    padBus=ctx.createGain();padBus.gain.value=.24;lp.connect(padBus);padBus.connect(master);

    /* Balanced Pink-Filtered Air Noise Buffer (clean, silky, non-hissing) */
    nb=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);
    const d=nb.getChannelData(0);
    let b0=0,b1=0,b2=0;
    for(let i=0;i<d.length;i++){
      const w=Math.random()*2-1;
      b0=0.997*b0+w*0.029;
      b1=0.985*b1+w*0.032;
      b2=0.950*b2+w*0.048;
      d[i]=clamp((b0+b1+b2+w*0.06)*0.72,-0.85,0.85);
    }
    [
      [55,0.22,'sine',0.05],
      [82.41,0.16,'sine',0.07],
      [110,0.14,'triangle',0.09],
      [164.81,0.10,'sine',0.11],
      [246.94,0.06,'sine',0.14]
    ].forEach(([f,amp,type,lfoRate])=>{
      const o=ctx.createOscillator(),og=ctx.createGain(),l=ctx.createOscillator(),lg=ctx.createGain();
      o.type=type;o.frequency.value=f;og.gain.value=amp;
      l.frequency.value=lfoRate;lg.gain.value=3.2;
      l.connect(lg);lg.connect(o.detune);o.connect(og);og.connect(lp);o.start();l.start();
    });
    const wSrc=ctx.createBufferSource();wSrc.buffer=nb;wSrc.loop=true;
    windFilter=ctx.createBiquadFilter();windFilter.type='bandpass';windFilter.frequency.value=340;windFilter.Q.value=0.8;
    windGain=ctx.createGain();windGain.gain.value=0.045;
    wSrc.connect(windFilter);windFilter.connect(windGain);windGain.connect(master);
    wSrc.start();
    return true;
  }
  function resumeCtx(){if(live&&ctx&&ctx.state==='suspended')ctx.resume()}
  function updateEnv(cutoff,windAmt,windHz){
    if(!live||!ctx)return;
    const t=ctx.currentTime;
    if(lp)lp.frequency.setTargetAtTime(clamp(cutoff||420,180,1800),t,.28);
    if(windGain)windGain.gain.setTargetAtTime(clamp(windAmt||0.045,0.015,0.16),t,.25);
    if(windFilter)windFilter.frequency.setTargetAtTime(clamp(windHz||360,200,980),t,.25);
  }
  function syncUI(){
    const vb=$('#voice-btn'),sp=$('#sanc-voice-pill');
    if(vb){
      vb.classList.toggle('on',voiceOn);
      vb.setAttribute('aria-pressed',voiceOn?'true':'false');
      const s=vb.querySelector('span');if(s)s.textContent='JP 声 · '+(voiceOn?'ON':'OFF');
    }
    if(sp){
      sp.classList.toggle('on',voiceOn);
      sp.textContent='JP VOICES (日本語): '+(voiceOn?'ON':'OFF');
    }
    $('#eq-btn').classList.toggle('live',live);
  }
  function hideSub(){
    clearTimeout(subHideTimer);
    const bar=$('#jp-sub-bar');if(bar)bar.classList.remove('on');
    isSpeaking=false;
    setMasterLevel(targetMaster,0.32);
  }
  function showSub(spk,who,txt){
    clearTimeout(subHideTimer);
    const bar=$('#jp-sub-bar'),sEl=$('#jp-spk'),tEl=$('#jp-txt');
    if(!bar||!sEl||!tEl)return;
    sEl.textContent=spk||'PARTH';
    sEl.className='jp-spk '+(who==='g'?'':who==='p'||who==='pw'?'parth':'nar');
    tEl.textContent=txt;
    bar.classList.add('on');
  }
  function stopSpeech(){
    speechToken++;clearTimeout(cueTimer);
    if(window.speechSynthesis)try{speechSynthesis.cancel()}catch{}
    activeUtt=null;hideSub();
  }
  function divineHalo(){
    if(!live||!boot())return;
    const t=ctx.currentTime;
    const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=1250;
    fl.connect(master);
    [110,164.81,246.94,329.63].forEach((f,i)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type=i===0?'triangle':'sine';
      o.frequency.setValueAtTime(f,t);
      g.gain.setValueAtTime(.0001,t);
      g.gain.linearRampToValueAtTime(i===0?.085:.042,t+.28);
      g.gain.exponentialRampToValueAtTime(.0001,t+2.4);
      o.connect(g);g.connect(fl);o.start(t);o.stop(t+2.45);
    });
  }
  function setOn(on){
    unlocked=true;if(!on)declined=true;else declined=false;
    live=on;boot();
    setMasterLevel(isSpeaking?targetMaster*0.42:targetMaster,0.24);
    if(!live){stopSpeech()}
    syncUI();
  }
  function setVoice(on){
    unlocked=true;voiceOn=on;if(on)declined=false;
    boot();refreshVoices();
    if(voiceOn&&!live)setOn(true);
    if(!voiceOn)stopSpeech();
    syncUI();
    return voiceOn;
  }
  function autoUnlockIfPending(){
    if(unlocked||declined)return;
    setVoice(true);
  }
  function chime(freq=523,dur=1.4,vol=.07){
    if(!live||!boot())return;
    const t=ctx.currentTime;
    [1,2.0].forEach((mult,idx)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type='sine';o.frequency.setValueAtTime(freq*mult,t);
      const peak=clamp(vol*(idx===0?1:0.28),0.005,0.12);
      g.gain.setValueAtTime(.0001,t);
      g.gain.linearRampToValueAtTime(peak,t+.028);
      g.gain.exponentialRampToValueAtTime(.0001,t+dur*(idx===0?1:0.65));
      o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.06);
    });
  }
  function step(stone=false){
    if(!live||!boot()||!nb)return;
    const now=performance.now();if(now-lastStepT<180)return;lastStepT=now;
    const t=ctx.currentTime;
    /* Soft organic leather sole or sacred marble tap (no synthetic blip!) */
    const o=ctx.createOscillator(),og=ctx.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(stone?128:86,t);
    o.frequency.exponentialRampToValueAtTime(stone?48:34,t+.065);
    og.gain.setValueAtTime(.0001,t);
    og.gain.linearRampToValueAtTime(stone?.075:.062,t+.006);
    og.gain.exponentialRampToValueAtTime(.0001,t+.082);
    o.connect(og);og.connect(master);o.start(t);o.stop(t+.09);
    const b=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain();
    b.buffer=nb;fl.type='bandpass';fl.frequency.value=stone?480:290;fl.Q.value=0.9;
    g.gain.setValueAtTime(.0001,t);
    g.gain.linearRampToValueAtTime(stone?.052:.040,t+.004);
    g.gain.exponentialRampToValueAtTime(.0001,t+.055);
    b.connect(fl);fl.connect(g);g.connect(master);b.start(t,Math.random()*1.2,.07);
  }
  /* Cyber-Origami Firewall Breach Telemetry Pulse (replaces harsh engine drone) */
  function truckApproach(pct){
    if(!live||!boot())return;
    const now=performance.now();if(now-lastApproachT<340)return;lastApproachT=now;
    const t=ctx.currentTime;
    const sub=ctx.createOscillator(),sg=ctx.createGain();
    sub.type='sine';sub.frequency.setValueAtTime(68+pct*16,t);
    sub.frequency.exponentialRampToValueAtTime(42,t+.24);
    sg.gain.setValueAtTime(.0001,t);sg.gain.linearRampToValueAtTime(.05+pct*.07,t+.02);
    sg.gain.exponentialRampToValueAtTime(.0001,t+.28);
    sub.connect(sg);sg.connect(master);sub.start(t);sub.stop(t+.3);
    if(pct>0.25){
      const ping=ctx.createOscillator(),pg=ctx.createGain();
      ping.type='sine';ping.frequency.setValueAtTime(392+pct*220,t);
      pg.gain.setValueAtTime(.0001,t);pg.gain.linearRampToValueAtTime(.022+pct*.022,t+.015);
      pg.gain.exponentialRampToValueAtTime(.0001,t+.22);
      ping.connect(pg);pg.connect(master);ping.start(t);ping.stop(t+.24);
    }
  }
  /* Shimmering Crystalline Cipher Scan Sweep (replaces screeching sawtooth tire screech) */
  function tireScreech(){
    if(screechPlayed||!live||!boot()||!nb)return;
    screechPlayed=true;
    const t=ctx.currentTime;
    const lpS=ctx.createBiquadFilter();lpS.type='bandpass';lpS.frequency.setValueAtTime(520,t);
    lpS.frequency.exponentialRampToValueAtTime(1480,t+.55);lpS.frequency.exponentialRampToValueAtTime(680,t+1.1);
    lpS.Q.value=1.6;lpS.connect(master);
    [293.66,440.0,587.33].forEach((freq,i)=>{
      const o=ctx.createOscillator(),og=ctx.createGain();
      o.type='sine';
      o.frequency.setValueAtTime(freq,t);
      o.frequency.exponentialRampToValueAtTime(freq*1.12,t+.55);
      o.frequency.exponentialRampToValueAtTime(freq*0.96,t+1.05);
      og.gain.setValueAtTime(.0001,t);og.gain.linearRampToValueAtTime(i===0?.055:.032,t+.08);
      og.gain.exponentialRampToValueAtTime(.0001,t+1.08);
      o.connect(og);og.connect(lpS);o.start(t);o.stop(t+1.12);
    });
    const air=ctx.createBufferSource(),af=ctx.createBiquadFilter(),ag=ctx.createGain();
    air.buffer=nb;af.type='bandpass';af.frequency.setValueAtTime(950,t);af.Q.value=1.2;
    ag.gain.setValueAtTime(.0001,t);ag.gain.linearRampToValueAtTime(.055,t+.06);
    ag.gain.exponentialRampToValueAtTime(.0001,t+.82);
    air.connect(af);af.connect(ag);ag.connect(master);air.start(t);air.stop(t+.85);
  }
  /* Warm Orchestral Breach Fifth Swell (replaces blaring sawtooth horn) */
  function truckHorn(){
    if(hornPlayed||!live||!boot())return;
    hornPlayed=true;
    const t=ctx.currentTime,g=ctx.createGain(),f=ctx.createBiquadFilter();
    f.type='lowpass';f.frequency.setValueAtTime(340,t);f.frequency.linearRampToValueAtTime(760,t+.45);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.15,t+.14);
    g.gain.setValueAtTime(.14,t+.72);g.gain.exponentialRampToValueAtTime(.0001,t+1.38);
    f.connect(g);g.connect(master);
    [110,164.81,220].forEach((q,i)=>{
      const o=ctx.createOscillator();o.type=i<2?'triangle':'sine';
      o.frequency.setValueAtTime(q,t);o.frequency.linearRampToValueAtTime(q*0.985,t+1.25);
      o.connect(f);o.start(t);o.stop(t+1.42);
    });
  }
  /* Firewall Shatter & Suspension Drop (clean compressed sub + origami fracture + zero ear tinnitus!) */
  function impactHit(){
    if(hitPlayed||!live||!boot()||!nb)return;
    hitPlayed=true;buzz(75);
    const t=ctx.currentTime;
    const sub=ctx.createOscillator(),sg=ctx.createGain();
    sub.type='sine';sub.frequency.setValueAtTime(98,t);sub.frequency.exponentialRampToValueAtTime(26,t+.78);
    sg.gain.setValueAtTime(.0001,t);sg.gain.linearRampToValueAtTime(.36,t+.012);
    sg.gain.exponentialRampToValueAtTime(.0001,t+.86);
    sub.connect(sg);sg.connect(master);sub.start(t);sub.stop(t+.90);

    const cr=ctx.createBufferSource(),cf=ctx.createBiquadFilter(),cg=ctx.createGain();
    cr.buffer=nb;cf.type='bandpass';cf.frequency.setValueAtTime(740,t);cf.Q.value=0.9;
    cg.gain.setValueAtTime(.0001,t);cg.gain.linearRampToValueAtTime(.14,t+.01);
    cg.gain.exponentialRampToValueAtTime(.0001,t+.44);
    cr.connect(cf);cf.connect(cg);cg.connect(master);cr.start(t);cr.stop(t+.48);

    const gl=ctx.createBufferSource(),gf=ctx.createBiquadFilter(),gg=ctx.createGain();
    gl.buffer=nb;gf.type='highpass';gf.frequency.setValueAtTime(2100,t);
    gg.gain.setValueAtTime(.0001,t+.015);gg.gain.linearRampToValueAtTime(.095,t+.025);
    gg.gain.exponentialRampToValueAtTime(.0001,t+.46);
    gl.connect(gf);gf.connect(gg);gg.connect(master);gl.start(t+.015);gl.stop(t+.50);

    [1174.66,1479.98,1760.0,2217.46].forEach((f,i)=>{
      const sp=ctx.createOscillator(),spg=ctx.createGain();
      sp.type='sine';sp.frequency.setValueAtTime(f,t+.02+i*.045);
      spg.gain.setValueAtTime(.0001,t+.02+i*.045);
      spg.gain.linearRampToValueAtTime(.038,t+.035+i*.045);
      spg.gain.exponentialRampToValueAtTime(.0001,t+.42+i*.06);
      sp.connect(spg);spg.connect(master);sp.start(t+.02+i*.045);sp.stop(t+.48+i*.06);
    });
    [0.85,1.15,1.82].forEach(dtHb=>{
      const hb=ctx.createOscillator(),hbg=ctx.createGain();
      hb.type='sine';hb.frequency.setValueAtTime(52,t+dtHb);hb.frequency.exponentialRampToValueAtTime(28,t+dtHb+.16);
      hbg.gain.setValueAtTime(.0001,t+dtHb);hbg.gain.linearRampToValueAtTime(.12,t+dtHb+.016);
      hbg.gain.exponentialRampToValueAtTime(.0001,t+dtHb+.22);
      hb.connect(hbg);hbg.connect(master);hb.start(t+dtHb);hb.stop(t+dtHb+.25);
    });
  }
  function resetCues(){hornPlayed=false;screechPlayed=false;hitPlayed=false}
  function buzz(ms=30){if(live&&navigator.vibrate)try{navigator.vibrate(ms)}catch{}}
  function whoosh(){
    if(!live||!boot()||!nb)return;
    const t=ctx.currentTime,b=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain();
    b.buffer=nb;fl.type='bandpass';fl.Q.value=1.4;
    fl.frequency.setValueAtTime(920,t);fl.frequency.exponentialRampToValueAtTime(210,t+.36);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.095,t+.06);
    g.gain.exponentialRampToValueAtTime(.0001,t+.40);
    b.connect(fl);fl.connect(g);g.connect(master);b.start(t);b.stop(t+.42);
  }
  function boom(freq=54,vol=.24){
    if(!live||!boot())return;
    buzz(45);
    const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
    o.type='sine';o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(24,t+.72);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(clamp(vol,0.02,0.32),t+.014);
    g.gain.exponentialRampToValueAtTime(.0001,t+.82);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+.88);
  }
  function shatterFx(){
    if(!live||!boot()||!nb)return;
    boom(64,.26);buzz(65);
    const t=ctx.currentTime,b=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain();
    b.buffer=nb;fl.type='bandpass';fl.frequency.setValueAtTime(1250,t);fl.Q.value=0.9;
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.14,t+.015);
    g.gain.exponentialRampToValueAtTime(.0001,t+.56);
    b.connect(fl);fl.connect(g);g.connect(master);b.start(t);b.stop(t+.60);
    [587.33,880.0,1174.66].forEach((f,i)=>chime(f,1.1+i*0.18,0.042));
  }
  function swell(pct){
    updateEnv(280+pct*1320,0.04+pct*0.11,360+pct*540);
  }
  function portalSuck(pct){updateEnv(320+pct*980,0.05+pct*0.13,380+pct*580)}
  function mercuryFlow(pct){updateEnv(360+pct*880,0.04+pct*0.10,480+pct*340)}
  function speakSeq(lines){
    if(!voiceOn||!lines||!lines.length)return;
    stopSpeech();
    const token=++speechToken;
    isSpeaking=true;
    setMasterLevel(targetMaster*0.42,0.18);
    function playIdx(idx){
      if(token!==speechToken||!voiceOn||idx>=lines.length){
        if(token===speechToken){subHideTimer=setTimeout(hideSub,1500)}
        return;
      }
      const item=lines[idx];
      if(!item||!item.jp){playIdx(idx+1);return}
      const who=item.who||'p';
      showSub(item.spk||(who==='g'?'THE DIVINE':who==='n'?'NARRATOR':'PARTH'),who,item.jp);
      if(who==='g')divineHalo();
      if(!window.speechSynthesis){
        setTimeout(()=>playIdx(idx+1),Math.max(1800,item.jp.length*145));
        return;
      }
      try{
        speechSynthesis.cancel();
        if(speechSynthesis.paused)speechSynthesis.resume();
        const u=new SpeechSynthesisUtterance(item.jp);
        activeUtt=u;
        u.lang='ja-JP';
        const v=pickVoice(who);if(v)u.voice=v;
        u.pitch=who==='g'?0.64:who==='pw'?0.92:who==='n'?0.98:1.12;
        u.rate=who==='g'?0.84:who==='pw'?0.96:who==='n'?0.99:1.05;
        u.volume=1.0;
        let done=false;
        const safety=setTimeout(()=>{if(!done){done=true;playIdx(idx+1)}},Math.max(2400,item.jp.length*175+1100));
        u.onend=()=>{if(!done){done=true;clearTimeout(safety);playIdx(idx+1)}};
        u.onerror=()=>{if(!done){done=true;clearTimeout(safety);playIdx(idx+1)}};
        setTimeout(()=>{
          if(token!==speechToken||!voiceOn||done)return;
          try{if(speechSynthesis.paused)speechSynthesis.resume();speechSynthesis.speak(u)}catch{}
        },55);
      }catch{
        setTimeout(()=>playIdx(idx+1),Math.max(1600,item.jp.length*130));
      }
    }
    playIdx(0);
  }
  function cue(key,lines,immediate=false){
    const seq=lines||JP_CUES[key];
    if(!seq||lastZone===key)return;
    lastZone=key;
    if(!voiceOn)return;
    clearTimeout(cueTimer);
    if(immediate){speakSeq(seq)}
    else{cueTimer=setTimeout(()=>speakSeq(seq),45)}
  }
  function forceCue(key,lines){
    const seq=lines||JP_CUES[key];
    if(!seq)return;
    lastZone=key;
    if(!voiceOn)setVoice(true);
    speakSeq(seq);
  }
  return{
    enable(on){setOn(on)},
    setVoice,
    resumeCtx,
    autoUnlockIfPending,
    toggle(){setOn(!unlocked?true:!live)},
    toggleVoice(){return setVoice(!voiceOn)},
    isVoice(){return voiceOn},
    hasCompressor(){return !!comp},
    chime,step,truckApproach,tireScreech,truckHorn,impactHit,whoosh,boom,shatterFx,buzz,resetCues,swell,portalSuck,mercuryFlow,updateEnv,divineHalo,
    speakSeq,cue,forceCue,
    speak(txt,who='p'){speakSeq([{who,spk:who==='g'?'THE DIVINE':'PARTH',jp:String(txt||'').replace(/<[^>]+>/g,'')}])}
  };
})();
addEventListener('pointerdown',()=>Sound.autoUnlockIfPending(),{once:true,passive:true});

let moviePlaying=false;
function setMovieMode(on){
  moviePlaying=!!on;
  document.body.classList.toggle('movie-mode',moviePlaying);
  const mb=$('#movie-btn');
  if(mb){
    mb.classList.toggle('playing',moviePlaying);
    mb.setAttribute('aria-pressed',moviePlaying?'true':'false');
    mb.querySelector('span').textContent=moviePlaying?'❚❚ FILM · PLAYING':'▶ ANIME FILM';
  }
}
let sakugaTimer=null,impactCutTimer=null;
function triggerSakuga(cyan=false){
  const el=$('#sakuga-flash');if(!el)return;
  el.classList.toggle('cyan',!!cyan);
  el.classList.remove('on');void el.offsetWidth;
  el.classList.add('on');
  clearTimeout(sakugaTimer);
  sakugaTimer=setTimeout(()=>el.classList.remove('on'),140);
}
function triggerImpactCut(){
  const el=$('#impact-cut-fx');if(!el)return;
  el.classList.remove('on');void el.offsetWidth;
  el.classList.add('on');
  clearTimeout(impactCutTimer);
  impactCutTimer=setTimeout(()=>el.classList.remove('on'),85);
}
function dismissWelcome(){
  const w=$('#welcome-gate');
  if(w&&!w.classList.contains('gone')){
    if(document.activeElement&&w.contains(document.activeElement))try{document.activeElement.blur()}catch{}
    w.classList.add('gone');w.setAttribute('aria-hidden','true');
  }
}
function dismissGates(){
  dismissWelcome();
  const s=$('#sound-gate');
  if(s&&!s.classList.contains('gone')){
    if(document.activeElement&&s.contains(document.activeElement))try{document.activeElement.blur()}catch{}
    s.classList.add('gone');s.setAttribute('aria-hidden','true');
  }
}
$('#welcome-enter').onclick=()=>{
  dismissWelcome();
  setTimeout(()=>$('#gate-yes')?.focus(),120);
};
const wRes=$('#welcome-resume');
if(wRes)wRes.onclick=e=>{
  e.preventDefault();
  Sound.enable(false);Sound.setVoice(false);
  dismissGates();
  const col=$('#collection');
  if(col)window.scrollTo({top:col.getBoundingClientRect().top+window.scrollY,behavior:'instant'});
};
$('#gate-yes').onclick=()=>{
  Sound.enable(true);Sound.setVoice(true);
  Sound.chime(220,1.6,.1);
  dismissGates();
  Sound.forceCue('prologue');
};
$('#gate-movie').onclick=()=>{
  Sound.enable(true);Sound.setVoice(true);
  Sound.chime(220,1.8,.12);
  dismissGates();
  Sound.forceCue('prologue');
  setMovieMode(true);
};
$('#gate-no').onclick=()=>{Sound.enable(false);Sound.setVoice(false);dismissGates()};
if(window.__NEXUS_GATE_CHOICE==='yes')$('#gate-yes').click();
else if(window.__NEXUS_GATE_CHOICE==='movie')$('#gate-movie').click();
else if(window.__NEXUS_GATE_CHOICE==='no')$('#gate-no').click();
else if(window.__NEXUS_GATE_CHOICE==='resume'&&wRes)wRes.click();
window.__NEXUS_READY=true;
$('#eq-btn').onclick=()=>Sound.toggle();
$('#voice-btn').onclick=()=>Sound.toggleVoice();
$('#movie-btn').onclick=()=>{
  if(!moviePlaying){
    if(!Sound.isVoice()){Sound.enable(true);Sound.setVoice(true)}
    setMovieMode(true);
  }else{
    setMovieMode(false);
  }
};

/* ==================== CANVAS SETUP & HELPERS ==================== */
const heroCv=$('#hero-cv'),mistCv=$('#mist-cv'),walkActorCv=$('#parth-walk-cv');
const raysCv=$('#impact-rays'),monoFxCv=$('#mono-fx-cv'),portalFxCv=$('#portal-fx-cv');
const reachCv=$('#reach-cv'),stepCv=$('#step-cv'),curtainCv=$('#curtain-cv');
const ladderLegCv=$('#ladder-leg-cv'),templeLegCv=$('#temple-leg-cv');
const hallCv=$('#hall-cv'),sancActorsCv=$('#sanc-actors-cv'),pourCv=$('#pour-cv');
const vortexCv=$('#vortex-cv'),vortexActorCv=$('#vortex-actor-cv'),shatterCv=$('#shatter-cv'),shatterFallCv=$('#shatter-fall-cv'),colFxCv=$('#col-fx-cv');

function fitCanvas(cv,uhd=false){
  const cw=cv.clientWidth,ch=cv.clientHeight;
  const r=(cw>0&&ch>0)?null:cv.getBoundingClientRect();
  const w=Math.max(10,Math.round(cw>0?cw:r.width)),h=Math.max(10,Math.round(ch>0?ch:r.height));
  const d=uhd
    ? Math.min(5.334,Math.max(devicePixelRatio||1,Math.min(5.334,7680/Math.max(w,1))))
    : Math.min(Math.max(devicePixelRatio||1,1.8),3.0);
  const bw=Math.round(w*d),bh=Math.round(h*d);
  if(cv.width!==bw||cv.height!==bh){cv.width=bw;cv.height=bh}
  const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  return{w,h,c};
}

/* Reusable offscreen canvas for articulated walk & cached Gojo Awakened sprite */
const tmpCv=document.createElement('canvas'),tmpCtx=tmpCv.getContext('2d');
const legFlipCv=document.createElement('canvas'),legFlipCtx=legFlipCv.getContext('2d');
let legFlipReady=false;
function ensureLegFlip(){
  if(legFlipReady)return true;
  const im=IMG.p_walk1;
  if(!im||!im.complete||!im.naturalWidth)return false;
  legFlipCv.width=im.naturalWidth;legFlipCv.height=im.naturalHeight;
  legFlipCtx.clearRect(0,0,legFlipCv.width,legFlipCv.height);
  legFlipCtx.save();
  legFlipCtx.translate(legFlipCv.width,0);legFlipCtx.scale(-1,1);
  legFlipCtx.drawImage(im,0,0);
  legFlipCtx.restore();
  legFlipReady=true;
  return true;
}

const HD_CACHE={},GOJO_CACHE={};
function defringeAndSharpen(cx,w,h,inkStrength=0){
  try{
    const id=cx.getImageData(0,0,w,h),d=id.data;
    const copy=new Uint8ClampedArray(d);
    const stride=w*4;
    for(let y=1;y<h-1;y++){
      for(let x=1;x<w-1;x++){
        const idx=(y*w+x)*4,a=copy[idx+3];
        if(a===0)continue;
        if(a<18){d[idx+3]=0;continue}
        /* Crisp micro-unsharp contrast preserving 3D PBR shading & translucent silk ribbons */
        if(a<245)continue;
        const cR=copy[idx],cG=copy[idx+1],cB=copy[idx+2];
        let minL=999,maxL=0,sumR=0,sumG=0,sumB=0;
        const nIdx=[idx-stride,idx+stride,idx-4,idx+4,idx-stride-4,idx-stride+4,idx+stride-4,idx+stride+4];
        for(let k=0;k<8;k++){
          const ni=nIdx[k],nr=copy[ni],ng=copy[ni+1],nb=copy[ni+2];
          sumR+=nr;sumG+=ng;sumB+=nb;
          const nl=nr*0.299+ng*0.587+nb*0.114;
          if(nl<minL)minL=nl;
          if(nl>maxL)maxL=nl;
        }
        const contrast=maxL-minL;
        if(contrast<12)continue;
        const avgR=sumR*0.125,avgG=sumG*0.125,avgB=sumB*0.125;
        const sharp=0.45;
        d[idx]=clamp(Math.round(cR+(cR-avgR)*sharp),0,255);
        d[idx+1]=clamp(Math.round(cG+(cG-avgG)*sharp),0,255);
        d[idx+2]=clamp(Math.round(cB+(cB-avgB)*sharp),0,255);
      }
    }
    cx.putImageData(id,0,0);
  }catch{}
}
function getHDAnimeSprite(key){
  if(HD_CACHE[key])return HD_CACHE[key];
  const im=IMG[key];
  if(!im||!im.complete||!im.naturalWidth)return null;
  const nw=im.naturalWidth,nh=im.naturalHeight;
  const isSanctuaryHero=/^(p_idle|p_entity|p_recoil|p_speak|p_listen|g_front|g_listen|g_profile|g_bestow)$/.test(key);
  const maxDim=typeof window!=='undefined'&&window.innerWidth<760?1150:(isSanctuaryHero?1600:1400);
  const mul=Math.min(isSanctuaryHero?2.0:1.7,maxDim/Math.max(nw,nh,1));
  const w=Math.round(nw*Math.max(1,mul)),h=Math.round(nh*Math.max(1,mul));
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const cx=cv.getContext('2d',{willReadFrequently:true});
  cx.imageSmoothingEnabled=true;cx.imageSmoothingQuality='high';
  cx.drawImage(im,0,0,w,h);
  defringeAndSharpen(cx,w,h,0);
  HD_CACHE[key]=cv;
  return cv;
}
let PAPER_GRAIN_TILE=null;
function getPaperGrainTile(){
  if(PAPER_GRAIN_TILE)return PAPER_GRAIN_TILE;
  const t=document.createElement('canvas');t.width=96;t.height=96;
  const c=t.getContext('2d');
  c.fillStyle='rgba(255,252,244,0.03)';c.fillRect(0,0,96,96);
  for(let y=0;y<96;y+=2){
    c.fillStyle=y%4===0?'rgba(255,250,240,0.22)':'rgba(24,20,18,0.16)';
    c.fillRect(0,y,96,1);
  }
  for(let i=0;i<360;i++){
    const x=((i*53)%96),y=((i*79)%96);
    c.fillStyle=i%2?'rgba(255,250,238,0.34)':'rgba(32,26,22,0.28)';
    c.fillRect(x,y,1+(i%2),1);
  }
  PAPER_GRAIN_TILE=t;
  return t;
}
function quantizePaperSurface(cx,w,h,opts={}){
  const step=opts.step||22,blend=opts.blend??0.44,grain=opts.grain??7;
  try{
    const id=cx.getImageData(0,0,w,h),d=id.data;
    const copy=new Uint8ClampedArray(d),stride=w*4;
    for(let y=1;y<h-1;y++){
      const rowOff=y*stride;
      for(let x=1;x<w-1;x++){
        const idx=rowOff+x*4,a=copy[idx+3];
        if(a<20)continue;
        let r=copy[idx],g=copy[idx+1],b=copy[idx+2];
        /* Step tonal bands into matte cardstock layers while preserving crisp anime detail */
        const qr=Math.round(r/step)*step,qg=Math.round(g/step)*step,qb=Math.round(b/step)*step;
        r=lerp(r,qr,blend);g=lerp(g,qg,blend);b=lerp(b,qb,blend);
        /* Kirigami internal layer crease highlight/shadow between contrasting paper planes */
        const lum=r*0.299+g*0.587+b*0.114;
        const nTop=(idx-stride-4);
        if(copy[nTop+3]>160){
          const nLum=copy[nTop]*0.299+copy[nTop+1]*0.587+copy[nTop+2]*0.114;
          const diff=lum-nLum;
          if(diff>36){r+=11;g+=10;b+=7}
          else if(diff<-36){r-=12;g-=12;b-=10}
        }
        /* Cotton rag fiber modulation + matte white paper floor/ceiling */
        const hsh=(((x*19+y*37)^((x*7)*(y*11)))&15)-7.5;
        const gr=(hsh/7.5)*grain;
        d[idx]=clamp(Math.round(r*0.97+5+gr),12,248);
        d[idx+1]=clamp(Math.round(g*0.96+4+gr),11,244);
        d[idx+2]=clamp(Math.round(b*0.93+3+gr*0.85),15,236);
      }
    }
    cx.putImageData(id,0,0);
  }catch{}
}
function makeTintSilhouette(src,w,h,fillStyle){
  const t=document.createElement('canvas');t.width=w;t.height=h;
  const cx=t.getContext('2d');
  cx.drawImage(src,0,0,w,h);
  cx.globalCompositeOperation='source-in';
  cx.fillStyle=fillStyle;
  cx.fillRect(0,0,w,h);
  return t;
}
function stampRing(cx,img,ox,oy,rad,steps=12){
  for(let i=0;i<steps;i++){
    const a=(i/steps)*Math.PI*2;
    cx.drawImage(img,ox+Math.cos(a)*rad,oy+Math.sin(a)*rad);
  }
}
function makePaperCutSprite(src,opts={}){
  if(!src)return null;
  const sw=src.width||src.naturalWidth,sh=src.height||src.naturalHeight;
  if(!sw||!sh)return null;
  /* Volumetric 3D CGI Character Polish: ZERO flat white sticker borders, full PBR shading + soft ambient depth separation */
  const pad=opts.pad??Math.max(10,Math.round(Math.max(sw,sh)*0.018));
  const shOff=opts.shadow??Math.max(5,Math.round(pad*0.38));
  const out=document.createElement('canvas');out.width=sw+pad*2;out.height=sh+pad*2;
  const oc=out.getContext('2d');
  oc.imageSmoothingEnabled=true;oc.imageSmoothingQuality='high';
  const shadSil=makeTintSilhouette(src,sw,sh,'rgba(6,6,12,0.34)');
  const rimSil=makeTintSilhouette(src,sw,sh,opts.rimColor||'rgba(218,232,255,0.22)');

  /* 1. Soft volumetric depth drop shadow & directional studio rim highlight */
  oc.save();
  try{oc.filter='blur('+Math.max(4,Math.round(shOff*0.65))+'px)'}catch{}
  oc.drawImage(shadSil,pad+shOff*0.8,pad+shOff*0.95);
  oc.restore();

  oc.save();
  try{oc.filter='blur('+Math.max(1.5,Math.round(shOff*0.24))+'px)'}catch{}
  oc.drawImage(rimSil,pad-Math.max(1,shOff*0.18),pad-Math.max(1,shOff*0.18));
  oc.restore();

  /* 2. Full smooth 3D CGI character render */
  oc.drawImage(src,pad,pad);
  out._pad=pad;out._origW=sw;out._origH=sh;
  return out;
}
function drawPaperSprite(c,spr,dx,dy,dw,dh){
  if(!spr)return;
  if(spr._pad&&spr._origW&&spr._origH){
    const sx=dw/spr._origW,sy=dh/spr._origH;
    c.drawImage(spr,dx-spr._pad*sx,dy-spr._pad*sy,dw+2*spr._pad*sx,dh+2*spr._pad*sy);
  }else{
    c.drawImage(spr,dx,dy,dw,dh);
  }
}
const PAPER_CACHE={},PAPER_ENTITY_CACHE={},WALK_PAPER_FRAMES=[],STAGE_PAPER_URL={};
const STRIDE_FRAMES=100,WALK_KEY_COUNT=25;
if(typeof window!=='undefined')window.__STRIDE_FRAMES=STRIDE_FRAMES;
function getPaperCutSprite(key,entityMode=false){
  const cache=entityMode?PAPER_ENTITY_CACHE:PAPER_CACHE;
  if(cache[key])return cache[key];
  const base=entityMode?getEntityParthSprite(key):getHDAnimeSprite(key);
  if(!base)return null;
  const sw=base.width||base.naturalWidth,sh=base.height||base.naturalHeight;
  const pad=Math.max(12,Math.round(Math.max(sw,sh)*0.022));
  const res=makePaperCutSprite(base,{pad,rim:Math.max(5,Math.round(pad*0.52))});
  if(res)cache[key]=res;
  return res;
}
function getWalkPaperFrame(f){
  const idx100=((Math.floor(f)%STRIDE_FRAMES)+STRIDE_FRAMES)%STRIDE_FRAMES;
  const qIdx=Math.round((idx100/STRIDE_FRAMES)*WALK_KEY_COUNT)%WALK_KEY_COUNT;
  if(WALK_PAPER_FRAMES[qIdx])return WALK_PAPER_FRAMES[qIdx];
  const raw=getWalkFrame((qIdx/WALK_KEY_COUNT)*STRIDE_FRAMES);
  if(!raw)return null;
  const sw=raw.width,sh=raw.height;
  const pad=Math.max(12,Math.round(Math.max(sw,sh)*0.022));
  const res=makePaperCutSprite(raw,{pad,rim:Math.max(5,Math.round(pad*0.52))});
  if(res)WALK_PAPER_FRAMES[qIdx]=res;
  return res;
}
/* Continuous 100-Frame Sub-Pixel Paper-Cutout Gait Synthesizer (silky crossfade across 100 stride phases without memory bloat) */
function drawSmoothWalkFrame(c,walkFloat100,dx,dy,dw,dh,alpha=1,cropLegs=false){
  const norm=((walkFloat100%STRIDE_FRAMES)+STRIDE_FRAMES)%STRIDE_FRAMES;
  const stepPerKey=STRIDE_FRAMES/WALK_KEY_COUNT;
  const kPos=norm/stepPerKey;
  const k0=Math.floor(kPos)%WALK_KEY_COUNT;
  const fA=getWalkPaperFrame((k0/WALK_KEY_COUNT)*STRIDE_FRAMES)||getPaperCutSprite('p_walk1');
  if(!fA)return;
  c.save();c.globalAlpha=alpha;
  if(cropLegs){
    const pad=fA._pad||0;
    const sw=fA._origW||(fA.width-pad*2)||fA.naturalWidth;
    const sh=fA._origH||(fA.height-pad*2)||fA.naturalHeight;
    if(sw&&sh){
      const sx=pad+sw*0.14,sW=sw*0.72,sy=pad+sh*0.56,sH=Math.min(sh*0.43+pad,fA.height-sy);
      c.drawImage(fA,sx,sy,sW,sH,dx,dy,dw,dh);
    }
  }else{
    const sw=fA._origW||fA.width||fA.naturalWidth,sh=fA._origH||fA.height||fA.naturalHeight;
    const fdw=(sw&&sh)?(sw*(dh/sh)):dw;
    drawPaperSprite(c,fA,dx+(dw-fdw)*0.5,dy,fdw,dh);
  }
  c.restore();
}
function makePaperBackdropUrl(srcImg,opts={}){
  if(!srcImg)return '';
  const nw=srcImg.naturalWidth||srcImg.width,nh=srcImg.naturalHeight||srcImg.height;
  if(!nw||!nh)return '';
  const maxD=typeof window!=='undefined'&&window.innerWidth<760?1400:2400;
  const scale=Math.min(1,maxD/Math.max(nw,nh));
  const w=Math.round(nw*scale),h=Math.round(nh*scale);
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const cx=cv.getContext('2d',{willReadFrequently:true});
  cx.imageSmoothingEnabled=true;cx.imageSmoothingQuality='high';
  cx.drawImage(srcImg,0,0,w,h);
  try{return cv.toDataURL('image/webp',0.93)}catch{return ''}
}
const ENTITY_CACHE={},REF_PORTRAITS={},HD_FACE_URL={},WALK_FRAMES=[];
function getEntityParthSprite(key){
  if(ENTITY_CACHE[key])return ENTITY_CACHE[key];
  /* Native 3D CGI Obsidian Sovereign Trench Coat Parth (true sculpted cloth & icy sapphire eyes) */
  if(IMG.p_entity&&IMG.p_entity.complete&&IMG.p_entity.naturalWidth){
    const ent=getHDAnimeSprite('p_entity')||IMG.p_entity;
    ENTITY_CACHE[key]=ent;
    return ent;
  }
  const src=getHDAnimeSprite(key)||IMG[key];
  if(!src)return null;
  ENTITY_CACHE[key]=src;
  return src;
}
function getGojoSprite(key){return getEntityParthSprite(key)}

function extractSheetPortrait(key,entityStyle){
  const im=IMG[key];
  if(!im||!im.complete||!im.naturalWidth)return null;
  const sw=im.naturalWidth,sh=im.naturalHeight;
  const rxFrac=key==='ref_g'?0.654:0.548;
  const rx0=Math.round(sw*rxFrac),ry0=Math.round(sh*0.03),rw=Math.max(20,sw-rx0-Math.round(sw*0.015)),rh=Math.round(sh*0.92);
  const outW=rw*3,outH=rh*3;
  const cv=document.createElement('canvas');cv.width=outW;cv.height=outH;
  const cx=cv.getContext('2d',{willReadFrequently:true});
  cx.imageSmoothingEnabled=true;cx.imageSmoothingQuality='high';
  cx.drawImage(im,rx0,ry0,rw,rh,0,0,outW,outH);
  try{
    const id=cx.getImageData(0,0,outW,outH),d=id.data;
    const n=outW*outH,vis=new Uint8Array(n),q=new Int32Array(n);
    let qs=0,qe=0;
    const isWhite=p=>d[p*4]>236&&d[p*4+1]>236&&d[p*4+2]>236;
    const push=(x,y)=>{if(x<0||y<0||x>=outW||y>=outH)return;const p=y*outW+x;if(!vis[p]&&isWhite(p)){vis[p]=1;q[qe++]=p}};
    for(let x=0;x<outW;x++){push(x,0);push(x,outH-1)}
    for(let y=0;y<outH;y++){push(0,y);push(outW-1,y)}
    while(qs<qe){
      const p=q[qs++],x=p%outW,y=(p-x)/outW;
      push(x-1,y);push(x+1,y);push(x,y-1);push(x,y+1);
    }
    for(let i=0;i<n;i++){
      if(vis[i])d[i*4+3]=0;
      else if(entityStyle){
        const k=i*4,r=d[k],g=d[k+1],b=d[k+2],lum=r*0.299+g*0.587+b*0.114;
        const sat=Math.max(r,g,b)-Math.min(r,g,b);
        const y=Math.floor(i/outW),x=i%outW;
        const isSkin=(r-b>18&&r>g+2&&r>98);
        if(isSkin){
          d[k]=clamp(Math.round(((r/255-0.5)*1.12+0.5)*255+4),0,255);
          d[k+1]=clamp(Math.round(((g/255-0.5)*1.10+0.5)*255+2),0,255);
          d[k+2]=clamp(Math.round(((b/255-0.5)*1.08+0.5)*255+2),0,255);
        }else if(y>outH*0.26&&y<outH*0.44&&Math.abs(x-outW*0.5)<outW*0.24&&lum>48&&lum<215&&sat>8){
          const ir=clamp(Math.round(lum*0.65+84),105,218);
          d[k]=Math.round(ir*0.86);d[k+1]=Math.round(ir*0.94);d[k+2]=Math.min(242,Math.round(ir*1.08));
        }else if(y>outH*0.60){
          const cLum=clamp(lum/210,0,1);
          d[k]=Math.round(lerp(9,28,cLum));d[k+1]=Math.round(lerp(10,31,cLum));d[k+2]=Math.round(lerp(14,40,cLum));
        }
      }
    }
    cx.putImageData(id,0,0);
    defringeAndSharpen(cx,outW,outH,0.34);
  }catch{}
  if(entityStyle){
    cx.strokeStyle='rgba(206,214,228,0.65)';cx.lineWidth=2.4;
    cx.beginPath();cx.moveTo(outW*0.28,outH*0.68);cx.lineTo(outW*0.48,outH*0.96);cx.stroke();
    cx.beginPath();cx.moveTo(outW*0.72,outH*0.68);cx.lineTo(outW*0.52,outH*0.96);cx.stroke();
  }
  const pad=Math.max(12,Math.round(outW*0.04));
  const paperStand=makePaperCutSprite(cv,{pad,rim:Math.max(7,Math.round(outW*0.020)),shadow:Math.max(8,Math.round(outW*0.026))});
  const fin=document.createElement('canvas');fin.width=outW;fin.height=outH;
  const fc=fin.getContext('2d');
  /* Layered crimson/obsidian kirigami card mat with angled paper fold shadow */
  const bg=fc.createLinearGradient(0,0,0,outH);
  bg.addColorStop(0,'#1D1B22');bg.addColorStop(1,'#0D0C10');
  fc.fillStyle=bg;fc.fillRect(0,0,outW,outH);
  fc.save();
  fc.fillStyle=key==='ref_g'?'rgba(150,25,29,0.44)':'rgba(40,42,54,0.46)';
  fc.beginPath();fc.moveTo(0,outH*0.56);fc.lineTo(outW,outH*0.38);fc.lineTo(outW,outH);fc.lineTo(0,outH);fc.closePath();fc.fill();
  fc.strokeStyle='rgba(245,240,228,0.16)';fc.lineWidth=1.5;
  fc.beginPath();fc.moveTo(0,outH*0.56);fc.lineTo(outW,outH*0.38);fc.stroke();
  fc.globalAlpha=0.06;
  const gPat=fc.createPattern(getPaperGrainTile(),'repeat');
  if(gPat){fc.fillStyle=gPat;fc.fillRect(0,0,outW,outH)}
  fc.restore();
  if(paperStand){
    fc.drawImage(paperStand,-pad*0.55,-pad*0.25,outW+pad*1.1,outH+pad*1.1);
  }else{
    fc.drawImage(cv,0,0);
  }
  return fin.toDataURL('image/webp',0.95);
}
function getPaperCutUrl(key,entityMode=false){
  const sp=getPaperCutSprite(key,entityMode);
  if(!sp)return '';
  try{return sp.toDataURL('image/webp',0.93)}catch{return ''}
}
let staticPaperDone=false;
function hydrateDomPaperCutouts(){
  if(staticPaperDone)return;
  if(!IMG.p_idle||!IMG.p_idle.complete||!IMG.p_idle.naturalWidth)return;
  staticPaperDone=true;
  const cp=$('#contact-parth');
  if(cp){const u=getPaperCutUrl('p_idle',false);if(u)cp.src=u}
  [
    ['pe_relieved','#img-mist-phone'],['pe_shocked','#img-mist-shock'],
    ['pey_shock','#img-impact-eyes'],['p_mem','#img-last-mem'],
    ['hd_eye_parth','#img-eye-parth'],['hd_eye_god','#img-eye-god'],
    ['hd_eye_god','#img-dual-god'],['hd_eye_parth','#img-dual-parth'],
    ['hd_reach','#reach-hd-img'],['celestial','#shatter-cel-bg']
  ].forEach(([k,sel])=>{
    if(!STAGE_PAPER_URL[k]&&IMG[k]&&IMG[k].complete&&IMG[k].naturalWidth){
      STAGE_PAPER_URL[k]=makePaperBackdropUrl(IMG[k]);
    }
    if(STAGE_PAPER_URL[k]){const el=$(sel);if(el)el.src=STAGE_PAPER_URL[k]}
  });
}
function initRefPortraits(){
  if(!REF_PORTRAITS.parth&&IM.pe_profile){
    REF_PORTRAITS.parth=IM.pe_profile;
    REF_PORTRAITS.parth_entity=IM.p_entity_portrait||IM.pe_determined||IM.pe_profile;
    const f1=$('#img-mist-face1'),fp=$('#folio-parth'),sh=$('#img-shatter-inset');
    if(f1)f1.src=REF_PORTRAITS.parth;
    if(fp)fp.src=IM.pe_confident||REF_PORTRAITS.parth;
    if(sh)sh.src=REF_PORTRAITS.parth_entity;
  }
  if(!REF_PORTRAITS.god&&IM.ge_serene){
    REF_PORTRAITS.god=IM.ge_serene;
  }
}
function getFaceCloseUrl(faceKey,isEntityVerdict=false){
  initRefPortraits();
  if(isEntityVerdict&&REF_PORTRAITS.parth_entity)return REF_PORTRAITS.parth_entity;
  return IM[faceKey]||REF_PORTRAITS.parth||'';
}
if(typeof requestIdleCallback==='function')requestIdleCallback(hydrateDomPaperCutouts,{timeout:1400});
else setTimeout(hydrateDomPaperCutouts,500);

function getWalkFrame(f){
  const idx100=((Math.floor(f)%STRIDE_FRAMES)+STRIDE_FRAMES)%STRIDE_FRAMES;
  const qIdx=Math.round((idx100/STRIDE_FRAMES)*WALK_KEY_COUNT)%WALK_KEY_COUNT;
  if(WALK_FRAMES[qIdx])return WALK_FRAMES[qIdx];
  const w1=getHDAnimeSprite('p_walk1')||IMG.p_walk1;
  const w2=getHDAnimeSprite('p_walk2')||w1;
  const w3=getHDAnimeSprite('p_walk3')||w1;
  if(!w1||!w2||!w3)return null;
  const sw=Math.max(w1.width||w1.naturalWidth,w2.width||w2.naturalWidth,w3.width||w3.naturalWidth);
  const sh=w1.height||w1.naturalHeight;
  if(!sw||!sh)return null;
  /* Crisp 100%-opaque 3D CGI key poses [w2 -> w1 -> w3 -> w1] with continuous vertical stride arc & lean (ZERO double-leg ghosting!) */
  const phi=qIdx/WALK_KEY_COUNT,p4=phi*4;
  const seq=[w2,w1,w3,w1];
  const A=seq[Math.floor(p4)%4];
  const aW=A.width||A.naturalWidth;
  const comY=-Math.abs(Math.sin(phi*Math.PI*2))*5.2;
  const lean=Math.sin(phi*Math.PI*2)*0.013;
  const cv=document.createElement('canvas');cv.width=sw;cv.height=sh;
  const cx=cv.getContext('2d');
  cx.imageSmoothingEnabled=true;cx.imageSmoothingQuality='high';
  cx.save();
  cx.translate(sw*0.5,sh*0.5+comY);
  cx.rotate(lean);
  cx.drawImage(A,-aW*0.5,-sh*0.5);
  cx.restore();
  WALK_FRAMES[qIdx]=cv;
  return cv;
}

/* HTML-Preserving Scroll-Written Typewriter Engine (.cap-box starts empty and writes on scroll) */
const CAP_REGISTRY=new Map();
function parseHtmlTokens(html){
  const host=document.createElement('div');
  host.innerHTML=html.trim();
  const toks=[];
  const walk=(node,cls)=>{
    if(node.nodeType===3){
      const txt=node.nodeValue.replace(/s+/g,' ');
      if(txt)toks.push({txt,cls});
    }else if(node.nodeType===1){
      const nextCls=node.className||cls;
      for(let i=0;i<node.childNodes.length;i++)walk(node.childNodes[i],nextCls);
    }
  };
  walk(host,'');
  let total=0;toks.forEach(t=>{total+=t.txt.length});
  return{toks,total};
}
function initTypewriters(){
  document.querySelectorAll('.cap-box').forEach(el=>{
    if(CAP_REGISTRY.has(el))return;
    const parsed=parseHtmlTokens(el.innerHTML);
    CAP_REGISTRY.set(el,parsed);
    el.innerHTML='';
    el.dataset.typeN='0';
  });
}
function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function paintTypedTokens(el,rec,frac){
  if(!el||!rec)return;
  const f=clamp(frac,0,1);
  const n=Math.round(f*rec.total);
  if(el.dataset.typeN===String(n))return;
  el.dataset.typeN=String(n);
  if(n<=0){el.innerHTML='';return}
  let left=n,out='';
  for(let i=0;i<rec.toks.length&&left>0;i++){
    const tk=rec.toks[i],take=tk.txt.slice(0,left);
    left-=take.length;
    out+=tk.cls?('<span class="'+tk.cls+'">'+escHtml(take)+'</span>'):escHtml(take);
  }
  if(n<rec.total)out+='<span class="type-cur"></span>';
  el.innerHTML=out;
}
function setTypedRaw(el,rawHtml,frac){
  if(!el)return;
  let rec=CAP_REGISTRY.get(el);
  if(!rec||rec.src!==rawHtml){
    rec=parseHtmlTokens(rawHtml);rec.src=rawHtml;
    CAP_REGISTRY.set(el,rec);el.dataset.typeN='';
  }
  paintTypedTokens(el,rec,frac);
}
function setTypedProgress(el,frac){
  if(el)paintTypedTokens(el,CAP_REGISTRY.get(el),frac);
}

/* Convert Monolith & Step-Threshold red circles into LUMINOUS SILVERY-LIQUID WHITE ("as u are meeting the god") */
function bindSilverPortal(imgKey,selectors){
  const im=IMG[imgKey];
  if(!im)return;
  const run=()=>{
    try{
      const w=im.naturalWidth,h=im.naturalHeight;
      if(!w||!h)return;
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;
      const cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(im,0,0);
      const id=cx.getImageData(0,0,w,h),d=id.data;
      for(let i=0;i<d.length;i+=4){
        const r=d[i],g=d[i+1],b=d[i+2];
        const redDom=r-Math.max(g,b);
        if(redDom>10&&r>42){
          const k=clamp(redDom/85,0,1);
          const lum=clamp(r/255,0.42,1);
          const sr=Math.round(lerp(r,Math.round(234*lum+26),k));
          const sg=Math.round(lerp(g,Math.round(240*lum+20),k));
          const sb=Math.round(lerp(b,Math.round(252*lum+8),k));
          d[i]=clamp(sr,0,255);d[i+1]=clamp(sg,0,255);d[i+2]=clamp(sb,0,255);
        }
      }
      cx.putImageData(id,0,0);
      quantizePaperSurface(cx,w,h,{step:24,blend:0.38,grain:7});
      const pat=cx.createPattern(getPaperGrainTile(),'repeat');
      if(pat){cx.save();cx.globalAlpha=0.065;cx.fillStyle=pat;cx.fillRect(0,0,w,h);cx.restore()}
      const url=cv.toDataURL('image/webp',0.90);
      selectors.forEach(s=>{const el=$(s);if(el)el.src=url});
    }catch{}
  };
  if(im.complete&&im.naturalWidth)run();
  else im.addEventListener('load',run,{once:true});
}
bindSilverPortal('hd_monolith',['#img-mono-hd','#portal-hd-img']);
bindSilverPortal('hd_step',['#step-hd-img']);

/* ==================== STAGE 1: HERO & RISING CLOUD WALL ==================== */
let ptr3dTx=0,ptr3dTy=0,ptr3dX=0,ptr3dY=0;
addEventListener('pointermove',e=>{
  const iw=Math.max(1,window.innerWidth),ih=Math.max(1,window.innerHeight);
  ptr3dTx=clamp((e.clientX/iw-0.5)*2,-1,1);
  ptr3dTy=clamp((e.clientY/ih-0.5)*2,-1,1);
},{passive:true});

function drawHero(t,pHero){
  const{w,h,c}=fitCanvas(heroCv);
  c.fillStyle='#000000';c.fillRect(0,0,w,h);
  /* 3D Perspective Deep-Space Floor Grid & Orbiting Wireframe Octahedron Shards */
  const vpX=w*0.5+ptr3dX*w*0.06,vpY=h*(0.48-pHero*0.18)+ptr3dY*h*0.04;
  c.save();
  c.strokeStyle='rgba(255,255,255,0.065)';c.lineWidth=1;
  for(let i=-10;i<=10;i++){
    c.beginPath();c.moveTo(vpX+i*18,vpY);c.lineTo(vpX+i*190,h*1.08);c.stroke();
  }
  const gShift=(pHero*320+t*22)%68;
  for(let r=1;r<8;r++){
    const yy=vpY+Math.pow((r+gShift/68)/8,1.7)*(h*1.08-vpY);
    if(yy<h){c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy);c.stroke()}
  }
  for(let k=0;k<8;k++){
    const ang=t*(0.24+(k%3)*0.08)+k*0.85+pHero*2.1;
    const rad=Math.min(w,h)*(0.24+(k%4)*0.08);
    const ox=vpX+Math.cos(ang)*rad*1.35,oy=vpY+Math.sin(ang)*rad*0.42-pHero*85;
    const zScale=0.72+0.36*Math.sin(ang);
    const s=18*zScale;
    c.save();c.translate(ox,oy);c.scale(Math.cos(t*0.8+k),zScale);c.rotate(t*0.6+k);
    c.strokeStyle='rgba(245,241,230,'+(0.16*zScale).toFixed(2)+')';c.lineWidth=1.1;
    c.beginPath();c.moveTo(0,-s);c.lineTo(s*0.85,0);c.lineTo(0,s);c.lineTo(-s*0.85,0);c.closePath();c.stroke();
    c.restore();
  }
  c.restore();

  const baseRise=0.07+smoothstep(0.06,0.94,pHero)*1.04;
  const topY=h*(1-baseRise);
  for(let m=0;m<28;m++){
    const z=0.5+((m*37)%100)/100;
    const mx=(w*((m*41+13)%94)/100)+ptr3dX*36*z;
    const my=h*((m*23+7)%62)/100+ptr3dY*24*z;
    const al=(0.14+0.28*Math.max(0,Math.sin(t*1.8+m)))*z;
    c.fillStyle='rgba(255,255,255,'+al.toFixed(2)+')';
    c.beginPath();c.arc(mx,my,(1.0+(m%3)*0.6)*z,0,Math.PI*2);c.fill();
  }
  const decks=[
    {dy:-44,fill:'#C8C3B8',stroke:'#161418',phase:0.75,shad:'rgba(0,0,0,0.48)',amp:12,bump:38,par:0.18},
    {dy:-28,fill:'#DAD6CC',stroke:'#161418',phase:0.95,shad:'rgba(0,0,0,0.45)',amp:14,bump:44,par:0.34},
    {dy:-12,fill:'#EAE6DC',stroke:'#161418',phase:1.35,shad:'rgba(0,0,0,0.36)',amp:16,bump:50,par:0.54},
    {dy:0,fill:'#F5F1E6',stroke:'#141414',phase:1.7,shad:'rgba(0,0,0,0.32)',amp:18,bump:56,par:0.82}
  ];
  const segs=16;
  decks.forEach((dk,li)=>{
    c.save();
    c.shadowColor=dk.shad;c.shadowBlur=18;c.shadowOffsetY=-6;
    c.fillStyle=dk.fill;c.strokeStyle=dk.stroke;c.lineWidth=2;
    const xOff=ptr3dX*38*dk.par,yOff=ptr3dY*18*dk.par;
    const xStart=-60+xOff,step=(w+120)/segs;
    const y0=topY+dk.dy+yOff+Math.sin(t*(1.05-li*0.1))*dk.amp;
    c.beginPath();c.moveTo(xStart,h+60);c.lineTo(xStart,y0);
    for(let i=0;i<segs;i++){
      const x1=xStart+i*step,x2=x1+step;
      const midX=(x1+x2)*0.5;
      const puff=Math.sin((i+1)*dk.phase+t*(1.05-li*0.1))*dk.amp+Math.cos(i*2.1-t*.8+li)*10;
      const dome=(dk.bump+((i*17+li*11)%28)+Math.sin(t*1.2+i+li)*8)*1.35;
      c.quadraticCurveTo(midX,topY+dk.dy+yOff+puff-dome,x2,topY+dk.dy+yOff+puff);
    }
    c.lineTo(w+60,h+60);c.closePath();c.fill();
    c.shadowColor='transparent';c.stroke();
    c.restore();
  });
  c.save();
  c.shadowColor='rgba(14,12,16,0.34)';c.shadowBlur=10;c.shadowOffsetX=4;c.shadowOffsetY=5;
  c.fillStyle='#F5F1E6';c.strokeStyle='#141414';c.lineWidth=2;
  for(let k=0;k<6;k++){
    const px=w*(0.16+k*0.135)+Math.sin(t*.7+k)*14+ptr3dX*26;
    const py=topY-42-(k%3)*26+Math.cos(t*.9+k)*8+ptr3dY*14;
    const pr=14+(k%3)*9;
    c.beginPath();c.arc(px,py,pr,0,Math.PI*2);c.fill();c.stroke();
  }
  c.restore();

  const heroCvEl=$('#hero-cv');
  const hRx=(pHero*5.5-ptr3dY*3.2).toFixed(2),hRy=(ptr3dX*4.2+Math.sin(t*0.55)*1.4).toFixed(2);
  if(heroCvEl)heroCvEl.style.transform=`perspective(1100px) scale(${(1.04+pHero*0.08).toFixed(3)}) rotateX(${hRx}deg) rotateY(${hRy}deg)`;
  const lock=$('#hero-lockup');
  const fade=1-smoothstep(0.32,0.74,pHero);
  lock.style.opacity=fade.toFixed(3);
  lock.style.transform=`perspective(950px) translate3d(${(ptr3dX*16).toFixed(1)}px,${(-pHero*64+ptr3dY*12).toFixed(1)}px,${(pHero*70).toFixed(1)}px) scale(${(1+pHero*0.14).toFixed(3)}) rotateX(${(pHero*11-ptr3dY*5.5).toFixed(2)}deg) rotateY(${(ptr3dX*6.5+Math.sin(t*0.7)*1.8).toFixed(2)}deg)`;
}

/* ==================== ACT I: MUMBAI 6:42 PM — DUSK SKYLINE, SMOOTH WALK & HEADLIGHTS ==================== */
let lastWalkStepPhase=0;
function drawMistBg(t,pMist){
  const{w,h,c}=fitCanvas(mistCv);
  const dusk=smoothstep(0.28,0.88,pMist);
  const bgG=c.createLinearGradient(0,0,0,h*0.6);
  bgG.addColorStop(0,'#F2F1EC');
  bgG.addColorStop(1,dusk>0.4?'#E8E2D9':'#F2F1EC');
  c.fillStyle=bgG;c.fillRect(0,0,w,h);

  const hor=h*0.48+ptr3dY*h*0.025;
  const vpX=w*0.5+(Math.sin(pMist*Math.PI*3)*0.12+ptr3dX*0.14)*w;
  /* Three-Plane 3D Extruded Perspective Skyline & Elevated Metro Viaduct */
  const pan=pMist*280;
  c.save();
  /* Far parallax towers */
  c.fillStyle='rgba(205,200,190,0.68)';
  for(let f=-2;f<14;f++){
    const fx=((f*138-(pan*0.20)%138)+w+260)%(w+260)-130;
    const fh=65+((f*53)%135),topY=hor-fh-18,cw=100;
    const sideW=clamp((vpX-(fx+cw*0.5))*0.065,-24,24);
    c.fillStyle='rgba(196,191,181,0.70)';c.fillRect(fx,topY,cw,fh+18);
    c.fillStyle='rgba(168,163,154,0.62)';
    c.beginPath();
    if(sideW>0){c.moveTo(fx+cw,topY);c.lineTo(fx+cw+sideW,topY+sideW*0.35);c.lineTo(fx+cw+sideW,hor);c.lineTo(fx+cw,hor);}
    else{c.moveTo(fx,topY);c.lineTo(fx+sideW,topY-sideW*0.35);c.lineTo(fx+sideW,hor);c.lineTo(fx,hor);}
    c.closePath();c.fill();
  }
  c.shadowColor='rgba(18,16,20,0.24)';c.shadowBlur=12;c.shadowOffsetX=4;c.shadowOffsetY=4;
  c.strokeStyle='#1E1D22';c.lineWidth=1.4;
  for(let i=-2;i<16;i++){
    const bx=((i*116-(pan*0.46)%116)+w+232)%(w+232)-116;
    const bh=52+((i*37)%118),cw=78,topY=hor-bh;
    const sideW=clamp((vpX-(bx+cw*0.5))*0.10,-28,28);
    /* Extruded 3D Perspective Side Wall */
    c.shadowColor='transparent';
    c.fillStyle='#B9B4A8';
    c.beginPath();
    if(sideW>=0){
      c.moveTo(bx+cw,topY);c.lineTo(bx+cw+sideW,topY+Math.abs(sideW)*0.32);
      c.lineTo(bx+cw+sideW,hor);c.lineTo(bx+cw,hor);
    }else{
      c.moveTo(bx,topY);c.lineTo(bx+sideW,topY+Math.abs(sideW)*0.32);
      c.lineTo(bx+sideW,hor);c.lineTo(bx,hor);
    }
    c.closePath();c.fill();c.stroke();
    /* Front Facade + Roof Bevel */
    c.shadowColor='rgba(18,16,20,0.22)';
    c.fillStyle='#DDD9CF';c.fillRect(bx,topY,cw,bh);c.strokeRect(bx,topY,cw,bh);
    c.fillStyle='#F5F1E6';c.fillRect(bx,topY,cw,4);
  }
  /* Elevated 3D viaduct & Mumbai Metro train */
  c.fillStyle='#C7C2B6';c.fillRect(0,hor-28,w,7);
  c.fillStyle='#A6A195';c.fillRect(0,hor-21,w,3);
  const trainX=((w+260)-((pMist*920+t*42)%(w+520)));
  c.fillStyle='#353742';c.strokeStyle='#F5F1E6';c.lineWidth=1.6;
  c.fillRect(trainX,hor-40,180,12);c.strokeRect(trainX,hor-40,180,12);
  c.fillStyle='rgba(255,244,210,0.82)';
  for(let m=0;m<8;m++)c.fillRect(trainX+10+m*21,hor-37,13,5);
  c.fillStyle='#ABA69B';
  for(let p=-1;p<10;p++){
    const px=((p*180-(pan*0.7)%180)+w+180)%(w+180)-90;
    c.fillRect(px,hor-18,10,18);
  }
  c.restore();
  /* Drifting Mumbai Dusk Ash & Warm Amber Light Motes */
  for(let e=0;e<22;e++){
    const mx=(w*((e*47)%96)/100)+Math.sin(t*1.2+e)*16-pan*0.32;
    const my=hor*0.92-((t*(18+(e%4)*7)+e*39)%(hor*0.85));
    c.fillStyle=e%3===0?'rgba(214,68,48,0.28)':'rgba(255,248,232,0.52)';
    c.beginPath();c.arc(((mx%w)+w)%w,my,1.2+(e%3)*0.6,0,Math.PI*2);c.fill();
  }

  /* Horizon & Perspective Mumbai Street Grid */
  c.strokeStyle='#141414';c.lineWidth=1.5;
  c.beginPath();c.moveTo(0,hor);c.lineTo(w,hor);c.stroke();

  c.strokeStyle='rgba(20,20,20,0.26)';c.lineWidth=1;
  for(let i=-12;i<=12;i++){
    c.beginPath();c.moveTo(w/2+i*24,hor);c.lineTo(w/2+i*155,h);c.stroke();
  }
  const shift=(pMist*620)%74;
  for(let r=1;r<11;r++){
    const yy=hor+Math.pow(r/10,1.75)*(h-hor)+shift*(r/10);
    if(yy<h){c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy);c.stroke()}
  }
  /* Crosswalk dashes scrolling smoothly */
  c.fillStyle='rgba(255,255,255,0.65)';c.strokeStyle='rgba(20,20,20,0.22)';
  for(let k=-2;k<7;k++){
    const cx=w*0.18+k*110-((pMist*320)%110);
    c.fillRect(cx,h*0.81,58,12);c.strokeRect(cx,h*0.81,58,12);
  }

  /* Solo Leveling Volumetric Mumbai Sunset Shafts + Dynamic Speed Streaks */
  c.save();
  for(let r=0;r<4;r++){
    const rx=w*(0.15+r*0.24)+Math.sin(t*0.6+r)*22-pan*0.18;
    const rg=c.createLinearGradient(rx,0,rx+w*0.12,h*0.7);
    rg.addColorStop(0,'rgba(255,244,218,0.22)');
    rg.addColorStop(1,'rgba(255,244,218,0)');
    c.fillStyle=rg;
    c.beginPath();c.moveTo(rx,0);c.lineTo(rx+w*0.07,0);c.lineTo(rx+w*0.22,h*0.72);c.lineTo(rx+w*0.10,h*0.72);c.closePath();c.fill();
  }
  c.strokeStyle='rgba(20,20,20,0.16)';c.lineWidth=1.4;
  const streakCount=pMist>0.65?16:9;
  for(let i=0;i<streakCount;i++){
    const sx=((t*(220+i*14)+i*170)%(w+280))-140,sy=h*(0.18+(i%6)*0.11);
    c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+110,sy-5);c.stroke();
  }
  c.restore();

  /* IDEA 1 — THE PAPER FIREWALL BREACH: 3D Origami City Unzip & Crimson Cipher Rift (0.64..1.0) */
  if(pMist>0.64){
    const hp=smoothstep(0.64,0.98,pMist);
    const rx=w*0.64,ry=hor*0.72;
    const breachR=Math.min(w,h)*(0.08+Math.pow(hp,1.15)*0.48);

    c.save();
    /* Crimson Rift Glow Behind Unfolding Skyline */
    const riftG=c.createRadialGradient(rx,ry,6,rx,ry,breachR*1.45);
    riftG.addColorStop(0,'rgba(255,255,255,'+(0.90*hp).toFixed(2)+')');
    riftG.addColorStop(0.28,'rgba(229,57,53,'+(0.68*hp).toFixed(2)+')');
    riftG.addColorStop(0.66,'rgba(120,16,20,'+(0.38*hp).toFixed(2)+')');
    riftG.addColorStop(1,'rgba(120,16,20,0)');
    c.fillStyle=riftG;c.fillRect(0,0,w,h);

    /* Counter-Rotating 3D Cryptographic Hexagonal Firewall Seals */
    c.save();
    c.translate(rx,ry);
    c.scale(1,0.78+hp*0.18);
    for(let ring=0;ring<3;ring++){
      c.save();
      c.rotate(t*(ring%2?-0.85:0.70)*(1+hp*0.8)+hp*1.4);
      const rad=breachR*(0.42+ring*0.26);
      c.strokeStyle=ring===1?'rgba(255,248,240,'+(0.52*hp).toFixed(2)+')':'rgba(201,37,33,'+(0.68*hp).toFixed(2)+')';
      c.lineWidth=1.8-ring*0.3;
      c.setLineDash(ring===2?[10,8]:[]);
      c.beginPath();
      for(let s=0;s<=6;s++){
        const a=(s/6)*Math.PI*2;
        const px=Math.cos(a)*rad,py=Math.sin(a)*rad;
        if(s===0)c.moveTo(px,py);else c.lineTo(px,py);
      }
      c.stroke();c.restore();
    }
    c.restore();

    /* Horizontal Crimson Laser Breach Scanlines */
    for(let sl=0;sl<14;sl++){
      const sy=(hor*0.18+(sl/14)*h*0.72+Math.sin(t*12+sl)*4*hp);
      const swLen=w*(0.18+((sl*37)%55)/100)*hp;
      const sx=(sl%2===0)?w-swLen:(w*0.22);
      c.fillStyle=sl%3===0?'rgba(43,182,216,'+(0.28*hp).toFixed(2)+')':'rgba(201,37,33,'+(0.34*hp).toFixed(2)+')';
      c.fillRect(sx,sy,swLen,1.5+(sl%3));
    }

    /* Peeling 3D Cardstock Paper Ribbons Lifting Off the City Horizon */
    c.shadowColor='rgba(12,6,8,0.45)';c.shadowBlur=10;c.shadowOffsetX=4;c.shadowOffsetY=5;
    for(let p=0;p<24;p++){
      const px=w*(0.06+((p*43)%88)/100)+Math.sin(t*2.4+p)*22*hp;
      const py=hor+40-(Math.pow(hp,1.1)*(hor+120)*((p%5)*0.14+0.55))-((t*90+p*28)%80)*hp;
      const pw=14+(p%4)*8,ph=22+(p%3)*12;
      c.save();c.translate(px,py);
      c.rotate(hp*(p%2?1.8:-1.6)+t*(1.4+(p%3)*0.4));
      c.scale(1,Math.cos(t*2.5+p+hp*2));
      c.fillStyle=p%4===0?'#C92521':p%2===0?'#F5F1E6':'#1B1C22';
      c.strokeStyle='#141414';c.lineWidth=1.2;
      c.fillRect(-pw/2,-ph/2,pw,ph);c.strokeRect(-pw/2,-ph/2,pw,ph);
      c.restore();
    }
    c.restore();
  }
}

function drawParthWalkActor(t,pMist,cam){
  const{w,h,c}=fitCanvas(walkActorCv,true);
  c.clearRect(0,0,w,h);
  initRefPortraits();
  const w1=getHDAnimeSprite('p_walk1')||IMG.p_walk1;
  if(!w1)return;

  const isPhone=pMist>=0.34&&pMist<=0.64;
  const isRecoil=pMist>0.82;
  const phoneBlend=isPhone?smoothstep(0.32,0.39,pMist)*(1-smoothstep(0.59,0.66,pMist)):0;
  const recoilBlend=isRecoil?smoothstep(0.82,0.90,pMist):0;
  const walkAmt=1-Math.max(phoneBlend,recoilBlend);

  /* Scroll-locked 100-Frame Sub-Pixel Layered 3D Paper-Cutout Gait Cycle */
  const walkFloat=pMist*2.5*STRIDE_FRAMES;
  const walkBase=getWalkPaperFrame(walkFloat)||getPaperCutSprite('p_walk1')||w1;
  const phoneIm=phoneBlend>0.02?(getPaperCutSprite('p_phone')||IMG.p_phone):null;
  const recoilIm=recoilBlend>0.02?(getPaperCutSprite('p_recoil')||IMG.p_recoil):null;
  const phi=((walkFloat/STRIDE_FRAMES)%1+1)%1;

  if(walkAmt>0.6&&pMist>0.03&&pMist<0.95){
    const stepIdx=Math.floor(pMist*12);
    if(stepIdx!==lastWalkStepPhase){lastWalkStepPhase=stepIdx;Sound.step()}
  }

  const sw=w1.width||w1.naturalWidth,sh=w1.height||w1.naturalHeight;
  if(!sw||!sh)return;
  const targetH=Math.min(h*0.72,560);
  const scale=targetH/sh;
  const drawW=sw*scale,drawH=sh*scale;
  const baseX=w*(0.46+pMist*0.04);
  const baseY=h*0.90;

  /* Apply 3D camera matrix (dolly + roll + yaw shear) inside 4K canvas BEFORE sampling 8K Paper-Cutout sprites */
  c.save();
  if(cam){
    c.translate(w*0.5+w*(cam.tx/100),h*0.52+h*(cam.ty/100));
    const yawComp=Math.cos((cam.ry||0)*Math.PI/180);
    const pitchComp=1-Math.abs(cam.rx||0)*0.008;
    c.scale(cam.s*yawComp,cam.s*pitchComp);
    c.rotate((cam.r||0)*Math.PI/180);
    c.translate(-w*0.5,-h*0.52);
  }

  const bob=-Math.abs(Math.sin(phi*Math.PI*2))*6.2*walkAmt;
  const gshR=drawW*(0.40-bob*0.002);
  c.save();c.translate(baseX,baseY-3);c.scale(1,0.16);
  const gsh=c.createRadialGradient(0,0,2,0,0,gshR);
  gsh.addColorStop(0,'rgba(14,14,18,0.34)');
  gsh.addColorStop(0.6,'rgba(14,14,18,0.14)');
  gsh.addColorStop(1,'rgba(14,14,18,0)');
  c.fillStyle=gsh;c.beginPath();c.arc(0,0,gshR,0,Math.PI*2);c.fill();
  c.restore();

  const lean=(walkAmt*0.020*Math.cos(phi*Math.PI*2))-(recoilBlend*0.045);
  c.translate(baseX,baseY+bob);
  c.rotate(lean);

  if(phoneBlend>0.12){
    for(let rg=0;rg<2;rg++){
      const pr=((t*0.9+rg*0.5)%1);
      c.save();
      c.strokeStyle='rgba(201,37,33,'+((1-pr)*0.48*phoneBlend).toFixed(2)+')';
      c.lineWidth=1.8;
      c.beginPath();c.arc(drawW*0.06,-drawH*0.56,14+pr*52,0,Math.PI*2);c.stroke();
      c.restore();
    }
  }

  if(walkAmt>0.02&&walkBase){
    drawSmoothWalkFrame(c,walkFloat,-drawW/2,-drawH,drawW,drawH,walkAmt,false);
  }
  if(phoneBlend>0.02&&phoneIm){
    const phW=phoneIm._origW||phoneIm.width||sw,phH=phoneIm._origH||phoneIm.height||sh;
    const psc=targetH/phH,pdw=phW*psc,pdh=targetH;
    c.save();c.globalAlpha=phoneBlend;
    drawPaperSprite(c,phoneIm,-pdw/2,-pdh,pdw,pdh);
    c.restore();
  }
  if(recoilBlend>0.02&&recoilIm){
    const rcW=recoilIm._origW||recoilIm.width||sw,rcH=recoilIm._origH||recoilIm.height||sh;
    const rsc=targetH/rcH,rdw=rcW*rsc,rdh=targetH;
    c.save();c.globalAlpha=recoilBlend;
    drawPaperSprite(c,recoilIm,-rdw/2,-rdh,rdw,rdh);
    c.restore();
  }
  c.restore();
}

/* ==================== ACT II: ANIMATED IMPACT SPEEDLINES, HEADLIGHT FLARES & GLASS SHARDS ==================== */
function drawImpactRays(t,pImp){
  const{w,h,c}=fitCanvas(raysCv);
  c.clearRect(0,0,w,h);
  const cx=w/2,cy=h/2;
  const maxD=Math.max(w,h);
  const rotDrift=Math.sin(t*3.6)*0.025;
  /* Live Pulsing 100-Ray Radial Manga Action Speedlines */
  for(let i=0;i<100;i++){
    const a=(i/100)*Math.PI*2+rotDrift*(i%2?1:-1);
    const pulse=((t*2.8+i*0.37)%1);
    const innerR=125+pulse*62-pImp*38;
    const isCrimson=pImp>0.44&&i%6===0;
    c.strokeStyle=isCrimson?'rgba(216,38,34,'+(0.22+pImp*0.44).toFixed(2)+')':'rgba(20,20,22,'+(0.14+pImp*0.36).toFixed(2)+')';
    c.lineWidth=i%5===0?2.2:i%2===0?1.1:.6;
    c.beginPath();c.moveTo(cx+Math.cos(a)*innerR,cy+Math.sin(a)*(innerR*1.12));
    c.lineTo(cx+Math.cos(a)*maxD,cy+Math.sin(a)*maxD);c.stroke();
  }
  if(pImp>0.48){
    const waveP=smoothstep(0.48,0.88,pImp);
    c.save();
    c.strokeStyle='rgba(201,37,33,'+((1-waveP)*0.55).toFixed(2)+')';
    c.lineWidth=2.5+(1-waveP)*4;
    c.beginPath();c.arc(cx,cy,Math.min(w,h)*(0.12+waveP*0.58),0,Math.PI*2);c.stroke();
    c.restore();
  }
  /* Twin Crimson & Silver Breach Scan Flares + Horizontal Firewall Arcs Behind Parth */
  if(pImp>0.16){
    const hl=smoothstep(0.16,0.62,pImp);
    const flicker=0.92+Math.sin(t*42)*0.08;
    const sep=lerp(w*0.32,w*0.20,hl);
    [cx-sep,cx+sep].forEach((lx,idx)=>{
      const ly=cy+Math.sin(t*38+idx*1.5)*2.8*hl;
      const rad=maxD*0.26*hl*flicker;
      const g=c.createRadialGradient(lx,ly,2,lx,ly,rad);
      g.addColorStop(0,'rgba(255,255,255,'+(0.96*hl).toFixed(2)+')');
      g.addColorStop(0.28,idx%2===0?'rgba(229,57,53,'+(0.62*hl).toFixed(2)+')':'rgba(175,235,255,'+(0.58*hl).toFixed(2)+')');
      g.addColorStop(1,'rgba(229,57,53,0)');
      c.fillStyle=g;c.beginPath();c.arc(lx,ly,rad,0,Math.PI*2);c.fill();
      c.strokeStyle='rgba(255,255,255,'+(0.62*hl).toFixed(2)+')';
      c.lineWidth=2.4*hl;c.beginPath();c.moveTo(lx-rad*1.4,ly);c.lineTo(lx+rad*1.4,ly);c.stroke();
    });
    c.save();c.translate(cx,cy);c.rotate(t*0.7+pImp*2.2);
    c.strokeStyle='rgba(201,37,33,'+(0.42*hl).toFixed(2)+')';c.lineWidth=1.8;c.setLineDash([12,10]);
    c.beginPath();c.arc(0,0,Math.min(w,h)*(0.24+hl*0.22),0,Math.PI*2);c.stroke();
    /* Multi-Axis 3D Gimbal Cipher Ellipses */
    for(let g=0;g<2;g++){
      c.save();c.rotate((g?-0.52:0.48)+t*(g?-0.8:0.9));
      c.scale(1,0.34+0.28*Math.sin(t*1.6+g));
      c.setLineDash([]);c.strokeStyle=g?'rgba(20,20,24,'+(0.28*hl).toFixed(2)+')':'rgba(229,57,53,'+(0.48*hl).toFixed(2)+')';
      c.beginPath();c.arc(0,0,Math.min(w,h)*(0.32+g*0.08),0,Math.PI*2);c.stroke();
      c.restore();
    }
    c.restore();
  }
  /* Flying Shattered Paper-Cut Glass Shards on Collision */
  if(pImp>0.34){
    const sh=smoothstep(0.34,0.86,pImp);
    for(let s=0;s<28;s++){
      const ang=(s/28)*Math.PI*2+0.3;
      const dist=88+sh*(maxD*0.50)+((t*150+s*29)%(maxD*0.24));
      const sx=cx+Math.cos(ang)*dist,sy=cy+Math.sin(ang)*(dist*0.78);
      const sz=8+(s%4)*5;
      c.save();c.translate(sx,sy);c.rotate(ang+t*(2.8+(s%3)));
      c.fillStyle=s%3===0?'rgba(229,57,53,0.72)':'rgba(255,255,255,0.88)';
      c.strokeStyle='#141414';c.lineWidth=1.1;
      c.beginPath();c.moveTo(-sz,0);c.lineTo(sz*0.4,-sz*0.65);c.lineTo(sz*0.8,sz*0.5);c.closePath();
      c.fill();c.stroke();c.restore();
    }
  }
}

/* ==================== ACT III: SILVERY LIQUID WHITE MONOLITH CIRCLE & LEG FOCUS ==================== */
let lastLadderStepIdx=-1,lastTempleStepIdx=-1;
function drawPortalParticles(cv,t,intensity=1,portalCenter=null){
  const{w,h,c}=fitCanvas(cv);
  c.clearRect(0,0,w,h);
  /* Smooth Luminous Silvery Liquid White Portal Glow + Rotating Paper-Cut Halo Rings */
  if(portalCenter){
    const cx=w*portalCenter.x,cy=h*portalCenter.y,rad=Math.min(w,h)*portalCenter.r;
    const pulse=1+Math.sin(t*3.2)*0.06;
    const g=c.createRadialGradient(cx,cy,rad*0.04,cx,cy,rad*1.58*pulse);
    g.addColorStop(0,`rgba(255,255,255,${Math.min(0.96,0.84*intensity).toFixed(2)})`);
    g.addColorStop(0.38,`rgba(232,240,252,${(0.58*intensity).toFixed(2)})`);
    g.addColorStop(0.72,`rgba(205,222,245,${(0.26*intensity).toFixed(2)})`);
    g.addColorStop(1,'rgba(220,235,255,0)');
    c.fillStyle=g;c.beginPath();c.arc(cx,cy,rad*1.58*pulse,0,Math.PI*2);c.fill();
    c.save();c.translate(cx,cy);c.rotate(t*0.45);
    c.strokeStyle=`rgba(255,255,255,${(0.36*intensity).toFixed(2)})`;c.lineWidth=1.4;
    c.setLineDash([8,12]);c.beginPath();c.arc(0,0,rad*1.12*pulse,0,Math.PI*2);c.stroke();
    /* True 3D Intersecting Orbital Gyro Rings Around Silvery Gate */
    for(let gr=0;gr<2;gr++){
      c.save();
      c.rotate(t*(gr?-0.68:0.55)+(gr?0.85:-0.75));
      c.scale(1,0.34+0.26*Math.cos(t*1.3+gr*1.4));
      c.setLineDash([]);c.lineWidth=1.5;
      c.strokeStyle=gr?`rgba(255,255,255,${(0.42*intensity).toFixed(2)})`:`rgba(180,224,255,${(0.45*intensity).toFixed(2)})`;
      c.beginPath();c.arc(0,0,rad*(1.05+gr*0.24),0,Math.PI*2);c.stroke();
      c.restore();
    }
    c.rotate(-t*0.9);c.setLineDash([3,9]);
    c.strokeStyle=`rgba(218,232,250,${(0.28*intensity).toFixed(2)})`;
    c.beginPath();c.arc(0,0,rad*0.86,0,Math.PI*2);c.stroke();
    c.restore();
  }
  for(let i=0;i<56;i++){
    const spd=22+(i%6)*12;
    const x=((i*97+t*spd*0.6)%w);
    const y=h-((i*53+t*spd)%h);
    const r=1.2+(i%3)*0.95;
    c.fillStyle=i%3===0?`rgba(255,255,255,${(0.72*intensity).toFixed(2)})`:`rgba(216,229,248,${(0.76*intensity).toFixed(2)})`;
    c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
  }
}

/* Scroll-Driven 100-Frame Continuous Biomechanical Legs & Sneakers Close-Up */
function drawLadderLegFocus(cv,t,prog,crimsonFloor=false){
  if(!cv)return;
  const{w,h,c}=fitCanvas(cv,true);
  const w1=getHDAnimeSprite('p_walk1')||IMG.p_walk1;
  if(!w1)return;

  const scale=Math.min(w/320,h/170);
  const stepFloat=prog*2.2*STRIDE_FRAMES;
  const phi=((stepFloat/STRIDE_FRAMES)%1+1)%1;
  const walkBase=getWalkPaperFrame(stepFloat)||getWalkFrame(stepFloat)||w1;
  const shiftCycle=(phi*2)%1;

  /* 1. Textured Perspective Stone Steps (SS7) or Crimson Temple Tiles (SS3) */
  c.fillStyle=crimsonFloor?'#8E171B':'#ECEAE2';
  c.fillRect(0,0,w,h);
  c.save();
  if(crimsonFloor){
    const grad=c.createLinearGradient(0,0,0,h);
    grad.addColorStop(0,'#5C0C0F');grad.addColorStop(1,'#9E1B20');
    c.fillStyle=grad;c.fillRect(0,0,w,h);
    c.strokeStyle='#0E0E10';c.lineWidth=1.2;
    const horY=h*0.26;
    for(let i=-5;i<=6;i++){
      c.beginPath();c.moveTo(w*0.5+i*24,horY);c.lineTo(w*0.5+i*64,h);c.stroke();
    }
    for(let r=0;r<7;r++){
      const yy=horY+((r+shiftCycle)/6)*(h-horY);
      c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy);c.stroke();
    }
    c.strokeStyle='rgba(12,12,14,0.42)';c.lineWidth=1;
    for(let k=0;k<22;k++){
      const hx=((k*43+shiftCycle*60)%w),hy=h*0.38+((k*29)%54)/100*h;
      c.beginPath();c.moveTo(hx,hy);c.lineTo(hx+24,hy+3);c.stroke();
    }
  }else{
    const skyG=c.createLinearGradient(0,0,0,h*0.34);
    skyG.addColorStop(0,'#FFFFFF');skyG.addColorStop(1,'#EAE8E0');
    c.fillStyle=skyG;c.fillRect(0,0,w,h*0.34);
    const steps=6;
    for(let s=0;s<steps;s++){
      const frac=clamp((s+shiftCycle)/steps,0,1.08);
      const yTop=h*0.18+Math.pow(frac,1.18)*h*0.84;
      const yBot=yTop+18*scale*(0.7+frac*0.55);
      const halfW=lerp(w*0.26,w*0.64,frac);
      const lx=w*0.5-halfW,rx=w*0.5+halfW;
      c.fillStyle='#F7F6F1';c.strokeStyle='#141414';c.lineWidth=1.3;
      c.beginPath();
      c.moveTo(lx+10,yTop-8*scale);c.lineTo(rx-10,yTop-8*scale);
      c.lineTo(rx,yTop);c.lineTo(lx,yTop);c.closePath();
      c.fill();c.stroke();
      c.fillStyle='#DDD9CE';
      c.fillRect(lx,yTop,halfW*2,yBot-yTop);c.strokeRect(lx,yTop,halfW*2,yBot-yTop);
      c.strokeStyle='rgba(20,20,24,0.34)';c.lineWidth=0.9;
      for(let hLine=lx+12;hLine<rx-6;hLine+=18){
        c.beginPath();c.moveTo(hLine,yTop+2);c.lineTo(hLine+((hLine*7)%5)-2,yBot-2);c.stroke();
      }
    }
  }
  c.restore();

  /* 2. Composite Solid Crisp Paper-Cut Frame From 100-Frame Crossfaded Gait Cycle (lower thigh to sole) */
  const pad=walkBase._pad||0;
  const sw=walkBase._origW||(walkBase.width-pad*2)||walkBase.naturalWidth;
  const sh=walkBase._origH||(walkBase.height-pad*2)||walkBase.naturalHeight;
  if(sw&&sh){
    const sW=sw*0.72,sH=Math.min(sh*0.43+pad,walkBase.height-(pad+sh*0.56));
    const drawH=h*0.98,drawW=drawH*(sW/sH);
    const dx=w*0.5-drawW*0.5;
    const dy=h*0.02-Math.abs(Math.sin(phi*Math.PI*2))*5.0;

    c.fillStyle='rgba(12,12,16,0.36)';
    c.beginPath();c.ellipse(w*0.5,h*0.92,drawW*0.36,7*scale,0,0,Math.PI*2);c.fill();
    drawSmoothWalkFrame(c,stepFloat,dx,dy,drawW,drawH,1,true);
  }
}

/* ==================== ACT IV: INTERACTIVE HOLD & SINGULARITY PORTAL SUCTION ==================== */
let reachProgress=0,reachHolding=false,reachDone=false,reachUserHold=false;
function drawReach(t){
  const{w,h,c}=fitCanvas(reachCv,true);
  c.clearRect(0,0,w,h);
  const cx=w*0.24,cy=h*0.50;
  const pull=clamp(reachProgress,0,1);
  const voidR=Math.min(w,h)*(0.24+pull*0.28);

  /* Glossy Obsidian-Crimson Singularity Core + Swirl Pulling Toward Center */
  const rim=c.createRadialGradient(cx,cy,voidR*0.18,cx,cy,voidR*1.45);
  rim.addColorStop(0,'rgba(8,2,3,'+(0.95).toFixed(2)+')');
  rim.addColorStop(0.42,'rgba(42,4,8,'+(0.88).toFixed(2)+')');
  rim.addColorStop(0.68,'rgba(220,226,238,'+(0.42+pull*0.38).toFixed(2)+')');
  rim.addColorStop(0.84,'rgba(150,25,29,'+(0.28+pull*0.25).toFixed(2)+')');
  rim.addColorStop(1,'rgba(150,25,29,0)');
  c.fillStyle=rim;
  c.beginPath();c.arc(cx,cy,voidR*1.45,0,Math.PI*2);c.fill();

  /* Silvery Liquid Mercury Inward Vacuum Streams + 3D Orbiting Singularity Torus Rings */
  c.save();
  for(let tr=0;tr<3;tr++){
    c.save();c.translate(cx,cy);
    c.rotate(t*(tr%2?-0.52:0.65)+tr*1.05+pull*1.8);
    c.scale(1,0.32+0.25*Math.sin(t*1.4+tr));
    c.strokeStyle=tr===0?'rgba(255,255,255,'+(0.45+pull*0.38).toFixed(2)+')':'rgba(205,222,248,'+(0.32+pull*0.32).toFixed(2)+')';
    c.lineWidth=1.4+pull*1.2;
    c.beginPath();c.arc(0,0,voidR*(0.82+tr*0.24),0,Math.PI*2);c.stroke();
    c.restore();
  }
  const count=24;
  for(let i=0;i<count;i++){
    const a=(i/count)*Math.PI*2-t*(1.4+pull*4.2);
    const rOut=voidR*(1.35+((i*17)%10)*0.08);
    const rIn=voidR*(0.24+((i%3)*0.06));
    const midA=a+0.75+pull*1.15;
    c.strokeStyle=i%2===0?'rgba(255,255,255,'+(0.46+pull*0.42).toFixed(2)+')':'rgba(210,218,232,'+(0.32+pull*0.35).toFixed(2)+')';
    c.lineWidth=1.4+(i%3)*0.8+pull*1.2;
    c.beginPath();
    c.moveTo(cx+Math.cos(a)*rOut,cy+Math.sin(a)*rOut);
    c.quadraticCurveTo(cx+Math.cos(midA)*rOut*0.58,cy+Math.sin(midA)*rOut*0.58,cx+Math.cos(midA+0.55)*rIn,cy+Math.sin(midA+0.55)*rIn);
    c.stroke();
  }
  c.restore();

  if(pull>0.72){
    const flash=smoothstep(0.72,1.0,pull);
    const fg=c.createRadialGradient(cx,cy,4,cx,cy,Math.hypot(w,h)*flash);
    fg.addColorStop(0,'rgba(255,255,255,'+(0.95*flash).toFixed(2)+')');
    fg.addColorStop(0.45,'rgba(255,244,244,'+(0.52*flash).toFixed(2)+')');
    fg.addColorStop(1,'rgba(150,25,29,0)');
    c.fillStyle=fg;c.fillRect(0,0,w,h);
  }
}

/* ==================== ACT V: STEP INSIDE & 100-STRIP VERTICAL INK CURTAIN ==================== */
function drawStepOverlay(t){
  const{w,h,c}=fitCanvas(stepCv);
  c.clearRect(0,0,w,h);
  const cx=w*0.5,cy=h*0.42,rad=Math.min(w,h)*0.44;
  const g=c.createRadialGradient(cx,cy,rad*0.1,cx,cy,rad*1.15);
  g.addColorStop(0,'rgba(255,255,255,0.42)');
  g.addColorStop(0.55,'rgba(224,236,252,0.18)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle=g;c.fillRect(0,0,w,h);
  for(let i=0;i<42;i++){
    const x=w*(0.14+((i*37)%72)/100)+Math.sin(t*1.1+i)*8,y=h-((t*(36+(i%4)*10)+i*42)%h);
    c.fillStyle=i%2?'rgba(255,255,255,0.72)':'rgba(214,228,250,0.68)';
    c.beginPath();c.arc(x,y,1.3+(i%2)*0.9,0,Math.PI*2);c.fill();
  }
}

let curtainBoomed=false;
function drawCurtain(t,pCur){
  const{w,h,c}=fitCanvas(curtainCv);
  /* Match reference video 00:43-00:45: deep crimson hall emerging out of obsidian ink darkness */
  const bgG=c.createLinearGradient(0,0,0,h);
  bgG.addColorStop(0,'#0D0D0F');
  bgG.addColorStop(0.28,'#480A0C');
  bgG.addColorStop(0.75,'#96191D');
  bgG.addColorStop(1,'#6B1013');
  c.fillStyle=bgG;c.fillRect(0,0,w,h);

  const pillars=[0.05,0.16,0.28,0.72,0.84,0.95];
  const camYawC=ptr3dX*22;
  pillars.forEach((px,idx)=>{
    const pw=w*(idx===0||idx===5?.082:idx===1||idx===4?.062:.044);
    const depth=(idx===0||idx===5)?1.6:(idx===1||idx===4)?1.05:0.55;
    const x=w*px-pw/2+(px-0.5)*pCur*44+Math.sin(t*1.1+idx)*2.2-camYawC*depth;
    const sideW=clamp((0.5-px)*46-camYawC*0.35,-24,24);
    c.save();
    c.fillStyle='#240608';
    c.fillRect(sideW>0?x+pw:x+sideW,0,Math.abs(sideW),h);
    c.shadowColor='rgba(6,2,4,0.52)';c.shadowBlur=16;c.shadowOffsetX=idx<3?7:-7;c.shadowOffsetY=4;
    const g=c.createLinearGradient(x,0,x+pw,0);
    g.addColorStop(0,'#1B0708');g.addColorStop(.45,'#82181C');g.addColorStop(.8,'#4A0C0E');g.addColorStop(1,'#120506');
    c.fillStyle=g;c.fillRect(x,0,pw,h);
    c.shadowColor='transparent';
    c.strokeStyle='#0B0B0D';c.lineWidth=1.4;c.strokeRect(x,0,pw,h);
    for(let k=1;k<6;k++){c.beginPath();c.moveTo(x+k*(pw/6),0);c.lineTo(x+k*(pw/6),h);c.stroke()}
    c.restore();
  });
  for(let e=0;e<36;e++){
    const ex=(w*(0.06+((e*43)%88)/100))+Math.sin(t*1.6+e)*16;
    const ey=h-((t*(30+(e%4)*10)+e*48)%h);
    c.fillStyle='rgba(255,235,230,0.46)';
    c.beginPath();c.arc(ex,ey,1.1+(e%3)*0.75,0,Math.PI*2);c.fill();
  }

  /* 100-Strip Etched Ink & Cardstock Curtain peeling with 3D Y-axis Twist & Drop Shadows */
  if(pCur<0.78){
    const bars=100,bw=w/bars;
    const sweepIn=smoothstep(0.01,0.34,pCur);
    const sweepOut=smoothstep(0.30,0.78,pCur);
    c.save();
    c.shadowColor='rgba(0,0,0,0.48)';c.shadowBlur=8;c.shadowOffsetX=5;c.shadowOffsetY=3;
    for(let i=0;i<bars;i++){
      const stagger=((i*31)%17)*0.016+Math.sin(i*0.18)*0.024;
      const top=clamp((sweepOut*1.40-stagger)*h,0,h);
      const bot=clamp((sweepIn*1.40-stagger)*h,0,h);
      if(bot>top){
        const twist=0.35+0.65*Math.abs(Math.cos(pCur*5.2+i*0.14));
        const cxStrip=i*bw+bw*0.5;
        const wStrip=bw*0.78*twist;
        c.fillStyle=i%3===0?'#F5F1E6':'#141317';
        c.fillRect(cxStrip-wStrip*0.5,top,wStrip,bot-top);
      }
    }
    c.restore();
  }
  const showEye=pCur>0.55&&pCur<0.97;
  $('#eye-strip').classList.toggle('on',showEye);
  $('#cap-curtain').classList.toggle('on',showEye);
  const showLegs=pCur>0.44&&pCur<0.96;
  const tLeg=$('#temple-leg-inset');
  if(tLeg)tLeg.classList.toggle('on',showLegs);
  if(showLegs){
    drawLadderLegFocus(templeLegCv,tTime,pCur,true);
    const tStep=Math.floor(pCur*14);
    if(tStep!==lastTempleStepIdx){lastTempleStepIdx=tStep;Sound.step()}
  }
  if(showEye){
    const eyeZoom=(1.04+(pCur-0.55)*0.42).toFixed(3);
    const eyeRot=((pCur-0.75)*2.4).toFixed(2);
    const eyeTilt=((pCur-0.75)*-4.0).toFixed(2);
    $('#eye-strip').style.transform=`perspective(800px) translateX(-50%) translateY(0) scale(${eyeZoom}) rotate(${eyeRot}deg) rotateX(${eyeTilt}deg)`;
  }else{
    $('#eye-strip').style.transform='translateX(-50%) translateY(16px)';
  }
  const godEyeOp=smoothstep(0.72,0.82,pCur);
  if(godEyeOp>0.55&&!curtainBoomed){curtainBoomed=true;Sound.boom(56,.26)}
  if(pCur<0.45)curtainBoomed=false;
  $('#img-eye-god').style.opacity=godEyeOp.toFixed(2);
  const curTxt=godEyeOp>0.5
    ? 'THE KERNEL WARDEN LOOKS DOWN FROM THE THRONE: <span class="red">"INTRUDER—PROVE YOUR SYSTEM BELONGS HERE."</span>'
    : '"WHERE AM I…? THAT WASN\x27T A NETWORK DROP." <span class="red">CRIMSON PILLARS SURROUND THE KERNEL</span>.';
  setTypedRaw($('#cap-curtain'),curTxt,showEye?smoothstep(0.55,0.88,pCur):0);
}

/* ==================== ACT VI: CRIMSON SANCTUARY · 3D MULTI-ANGLE FILM RIG & RIBBONS ==================== */
const SANCTUARY_BEATS=[
  {
    id:'confrontation',turn1:'g',
    cam:{s:1.06,tx:0,ty:0,r:0,rx:1.2,ry:0,vpX:0.50,hor:0.75,shake:0},
    godPose:'g_front',parthPose:'p_recoil',
    godFace:'ge_serene',parthFace:'pe_shocked',
    speaker:'THE DIVINE',showFace:'ge_serene',
    cap1:'"WELCOME TO THE KERNEL SANCTUARY, <span class="red">PARTH VIJAY GIDDE</span>. PROVE YOUR SYSTEM COMPILES."',
    cap2:'"IF THIS ENGINE AUDITS <span class="red">REAL CODE</span>—OPEN MY LOGS AND RUN EVERY CHECK!"',
    jpLines:[
      {who:'g',spk:'THE DIVINE',jp:'中核聖域へようこそ、パルト・ヴィジャイ・ギッデ。お前の創った技術が本物か、ここで検証する。'},
      {who:'p',spk:'PARTH',jp:'コードの真価を測る監査エンジンだというなら、俺の全ログを今すぐ走らせるがいい！'}
    ],
    wind:1.05,dossierSide:'right',dossier:null
  },
  {
    id:'who',turn1:'p',
    cam:{s:1.58,tx:16,ty:15,r:-1.8,rx:4.5,ry:-6.2,vpX:0.74,hor:0.86,shake:.35},
    godPose:'g_listen',parthPose:'p_speak',
    godFace:'ge_eval',parthFace:'pe_confident',
    speaker:'PARTH',showFace:'pe_confident',
    cap1:'"WHO STANDS BEHIND THE TERMINAL IN <span class="red">NAVI MUMBAI</span>? TRACE CONFIRMED."',
    cap2:'"<span class="red">B.E. CYBERSECURITY &amp; IOT</span> AT MUMBAI UNIVERSITY. CO-FOUNDED <span class="red">DEVHARBOUR</span>."',
    jpLines:[
      {who:'p',spk:'PARTH',jp:'ムンバイ大学でサイバーセキュリティとIoTを専攻し、デヴハーバーを共同設立したパルトだ。'},
      {who:'g',spk:'THE DIVINE',jp:'ナビムンバイの端末の向こうに立つ、覚悟ある創作者か。続けろ。'}
    ],
    wind:1.25,dossierSide:'right',
    dossier:{
      kicker:'SYSTEM // CHAPTER 01 · IDENTITY',
      title:'Identity & Foundation',
      verdict:'"A builder who studies how systems break."',
      rows:[
        ['Base','Navi Mumbai, Maharashtra · Mumbai University (2025–2029)'],
        ['Venture','Co-Founder, DevHarbour — 4,000+ developers'],
        ['Degree','B.E. Cybersecurity (IoT incl. Blockchain Technology)'],
        ['SSC','SSC Foundation, 2023'],
        ['Focus','Cybersecurity, AI & GenAI, Web Systems']
      ]
    }
  },
  {
    id:'built',turn1:'g',
    cam:{s:1.54,tx:-13,ty:8,r:1.7,rx:-3.2,ry:6.8,vpX:0.22,hor:0.72,shake:.45},
    godPose:'g_listen',parthPose:'p_speak',
    godFace:'ge_eval',parthFace:'pe_relieved',
    speaker:'THE DIVINE',showFace:'ge_eval',
    cap1:'"TALK IS CHEAP. MOUNT THE <span class="red">DEPLOYED SYSTEMS</span>—NOT SLIDE DECKS."',
    cap2:'"FIVE SHIPPED BUILDS: <span class="red">GARAA</span> WON NATIONAL 1ST RUNNER-UP, <span class="red">ZYR</span>, LASER &amp; IOT SENSORS!"',
    jpLines:[
      {who:'g',spk:'THE DIVINE',jp:'言葉は不要だ。机上の空論ではなく、実際に稼働するシステムを見せてみろ。'},
      {who:'p',spk:'PARTH',jp:'五つの実戦プロダクトがある。全国準優勝のガラー、ジール、そしてレーザー測距とIoT気象監視システムだ！'}
    ],
    wind:1.35,dossierSide:'left',
    dossier:{
      kicker:'SYSTEM // CHAPTER 02 · ARTIFACTS',
      title:'Five Verified Case Files',
      verdict:'"Proof over poetry."',
      builds:true
    }
  },
  {
    id:'defended',turn1:'p',
    cam:{s:1.74,tx:19,ty:17,r:2.1,rx:5.2,ry:-7.5,vpX:0.78,hor:0.88,shake:.55},
    godPose:'g_front',parthPose:'p_idle',
    godFace:'ge_serene',parthFace:'pe_determined',
    speaker:'PARTH',showFace:'pe_determined',
    cap1:'"YOU <span class="cyan">HARDEN WHAT SYSTEMS DEPEND ON</span>. LOGS VERIFIED."',
    cap2:'"<span class="red">TRIPPLE ONE SOLUTIONS</span>—THREAT RESEARCH, NETWORK MONITORING &amp; <span class="red">NPTEL ELITE 75%</span>."',
    jpLines:[
      {who:'p',spk:'PARTH',jp:'トリプルワン・ソリューションズで脅威分析とネットワーク監視を担い、NPTELエリート七十五％も修めた。'},
      {who:'g',spk:'THE DIVINE',jp:'他者が頼る基盤を最前線で守り抜く防御者か。悪くない。'}
    ],
    wind:1.5,dossierSide:'right',
    dossier:{
      kicker:'SYSTEM // CHAPTER 03 · DEFENDER',
      title:'The Defender Record',
      verdict:'"You guard what others depend on."',
      rows:[
        ['Intern','Tripple One Solutions — Threat research & network monitoring'],
        ['NPTEL','Cyber Security and Privacy — Elite, 75%'],
        ['Check','Ethical Hacking Assessment — VaultofCodes'],
        ['Sim','Mastercard Cybersecurity Simulation — Forage'],
        ['OS','Unix / Linux Fundamentals — Infosys Springboard']
      ]
    }
  },
  {
    id:'led',turn1:'p',
    cam:{s:1.52,tx:-12,ty:9,r:-1.6,rx:-2.8,ry:5.6,vpX:0.26,hor:0.74,shake:.5},
    godPose:'g_profile',parthPose:'p_listen',
    godFace:'ge_approve',parthFace:'pe_confident',
    speaker:'THE DIVINE',showFace:'ge_approve',
    cap1:'"A BUILDER WHO <span class="red">SCALES AN ENTIRE ECOSYSTEM</span>. RARE SIGNATURE."',
    cap2:'"<span class="red">DEVHARBOUR</span> REACHED <span class="red">4,000+ BUILDERS</span>—PLUS IIT BOMBAY TECHFEST RANK 88!"',
    jpLines:[
      {who:'p',spk:'PARTH',jp:'デヴハーバーを四千人以上の開発者が集う場へと導き、IITボンベイのテックフェストでも実績を残した！'},
      {who:'g',spk:'THE DIVINE',jp:'一人の技術者にとどまらず、コミュニティごと動かす指導力か。稀有な才能だな。'}
    ],
    wind:1.85,dossierSide:'left',
    dossier:{
      kicker:'SYSTEM // CHAPTER 04 · COMMAND',
      title:'The Creator & Leader',
      verdict:'"A leader who ships."',
      rows:[
        ['DevHarbour','Co-Founder (Oct 2025) — 4,000+ builders'],
        ['Hackathon','Baloon National 2026 — 1st Runner-up'],
        ['Techfest','IIT Bombay Ambassador — Rank 88'],
        ['Goibibo','Campus Marketing Intern, Aug–Sept 2026']
      ]
    }
  },
  {
    id:'know',turn1:'p',
    cam:{s:1.50,tx:12,ty:12,r:1.0,rx:3.5,ry:-4.5,vpX:0.50,hor:0.78,shake:.95},
    godPose:'g_front',parthPose:'p_listen',
    godFace:'ge_eval',parthFace:'pe_curious',
    speaker:'DUAL',dualEyes:true,
    cap1:'"<span class="red">CHECKSUM MATCH. ZERO HYPE</span>. THE NUMBERS HOLD."',
    cap2:'"FROM <span class="red">LINUX &amp; PYTHON SECURITY</span> TO <span class="red">REACT &amp; GENAI</span>—EARNED IN PRODUCTION."',
    jpLines:[
      {who:'p',spk:'PARTH',jp:'リナックスやパイソンの防御技術からリアクト、生成AIまで、すべて実戦で鍛え上げてきた。'},
      {who:'g',spk:'THE DIVINE',jp:'誇張のない、検証された数字だ。その実力を認めよう。'}
    ],
    wind:1.6,dossierSide:'right',
    dossier:{
      kicker:'SYSTEM // CHAPTER 05 · ARSENAL',
      title:'Skill Constellation',
      verdict:'"Honest numbers. I approve."',
      rows:[
        ['Defense','Network security · Linux · Ethical hacking'],
        ['Build','Python · React / Vite · Arduino & IoT'],
        ['AI/CV','Generative AI · OCR · Face Detection'],
        ['Lead','Product strategy · Community · Events'],
        ['Certs','Microsoft GenAI · Python AI']
      ]
    }
  },
  {
    id:'unbuilt',turn1:'p',
    cam:{s:1.66,tx:-15,ty:9,r:1.9,rx:-4.2,ry:7.2,vpX:0.18,hor:0.84,shake:.5},
    godPose:'g_front',parthPose:'p_listen',
    godFace:'ge_approve',parthFace:'pe_curious',
    speaker:'THE DIVINE',showFace:'ge_approve',
    cap1:'"AND THE MODULES STILL MARKED <span class="red">ACTIVE R&amp;D</span>? UNFINISHED MEANS ALIVE."',
    cap2:'"NEVER HALTING—<span class="red">ANTI-SPOOFING AI, LOG PLAYBOOKS &amp; NEXT-GEN SYSTEMS</span>."',
    jpLines:[
      {who:'p',spk:'PARTH',jp:'未完の設計図こそが前進の証だ。なりすまし防止AIやセキュリティ自動化を今も創り続けている。'},
      {who:'g',spk:'THE DIVINE',jp:'未完であるということは、すなわち挑戦が生きているということだな。'}
    ],
    wind:1.75,dossierSide:'left',
    dossier:{
      kicker:'SYSTEM // CHAPTER 06 · ACTIVE QUEUE',
      title:'The Unfinished Archive',
      verdict:'"Unfinished is simply alive."',
      rows:[
        ['Active','Security automation & log playbooks'],
        ['R&D','Anti-spoofing & verification (Garaa)'],
        ['Growth','DevHarbour hackathon ecosystem tooling'],
        ['Concept','Generative-AI creative web systems']
      ]
    }
  },
  {
    id:'verdict',turn1:'g',
    cam:{s:1.44,tx:-7,ty:5,r:-1.2,rx:3.8,ry:-5.0,vpX:0.34,hor:0.68,shake:1.15},
    godPose:'g_bestow',parthPose:'p_idle',
    godFace:'ge_cmd',parthFace:'pe_relieved',
    speaker:'THE DIVINE',showFace:'ge_cmd',
    cap1:'"CHECKSUM CLEAN. ALL CLAIMS COMPILED—<span class="red">ROOT OVERRIDE GRANTED</span>."',
    cap2:'"CLEARANCE <span class="cyan">LOCKED</span>. RETURNING TO NAVI MUMBAI—AT FULL BANDWIDTH!"',
    jpLines:[
      {who:'g',spk:'THE DIVINE',jp:'チェック完了。全項目が仕様通りに稼働している——ルート権限を解放する！'},
      {who:'pw',spk:'PARTH · AWAKENED',jp:'検証完了。システム解放——ナビムンバイの夜明けへ、フル稼働で戻る！'}
    ],
    wind:2.5,dossierSide:'right',dossier:null
  }
];

let activeSancBuild=0,sancDossierOpen=false;
const SANCTUARY_BUILDS=[
  ['Garaa','Identity verification','OCR, QR, face detection & quality verdict.','Team Garaa — 1st Runner-up, Baloon National 2026.','React · Tesseract · jsQR · face-api','https://gaara-1.github.io/ZyID/','OPEN LIVE PROTOTYPE ↗'],
  ['DevHarbour','Builder ecosystem','Community platform & hackathons serving 4,000+ developers.','Co-Founder since Oct 2025.','Product · Strategy · Community','https://devharbour.in','VISIT DEVHARBOUR.IN ↗'],
  ['Zyr Studio','AI resume builder','Live resume layout paired with AI refinement.','Designed & engineered UI workflow.','React · Vite · AI'],
  ['Laser Ranging','Security perimeter','Optical distance thresholding for security alerts.','Built ranging & trigger loop.','Optical · Security'],
  ['IoT Weather','Arduino monitor','Real-time temperature & humidity readout.','Sensor wiring & firmware.','Arduino · IoT']
];

function renderSanctuaryDossier(beat){
  const card=$('#sanc-dossier-card'),hud=$('#sanc-hud');
  if(!beat.dossier){
    card.classList.add('hidden');
    card.classList.remove('expanded');
    if(hud)hud.classList.remove('has-dossier','dossier-left','dossier-expanded');
    return;
  }
  const isLeft=beat.dossierSide==='left';
  card.classList.remove('hidden');
  card.classList.toggle('left-mode',isLeft);
  card.classList.toggle('expanded',sancDossierOpen);
  if(hud){hud.classList.add('has-dossier');hud.classList.toggle('dossier-left',isLeft);hud.classList.toggle('dossier-expanded',sancDossierOpen)}
  const togLabel=sancDossierOpen?'[ COLLAPSE - ]':'[ + EXPAND RECORD ]';
  if(beat.dossier.builds){
    const b=SANCTUARY_BUILDS[activeSancBuild]||SANCTUARY_BUILDS[0];
    card.innerHTML=
      '<div class="sd-sys-head"><div class="sd-kicker">'+beat.dossier.kicker+'</div><button type="button" class="sd-toggle-btn" id="sd-exp-btn">'+togLabel+'</button></div>'+
      '<div class="sd-title">'+beat.dossier.title+'</div>'+
      '<div class="sd-verdict">'+beat.dossier.verdict+'</div>'+
      '<div class="sd-build-pills">'+SANCTUARY_BUILDS.map((it,idx)=>'<button type="button" class="sd-build-pill'+(idx===activeSancBuild?' on':'')+'" data-sbuild="'+idx+'">'+it[0]+'</button>').join('')+'</div>'+
      '<div class="sd-rows">'+
        '<div class="sd-row"><b>Project</b><span><strong>'+b[0]+'</strong> — '+b[1]+'</span></div>'+
        '<div class="sd-row"><b>Stack</b><span>'+b[4]+'</span></div>'+
        '<div class="sd-row sd-row-extra"><b>What</b><span>'+b[2]+'</span></div>'+
        '<div class="sd-row sd-row-extra"><b>Role</b><span>'+b[3]+'</span></div>'+
        (b[5]?'<div class="sd-row"><b>Link</b><span><a href="'+b[5]+'" target="_blank" rel="noopener">'+b[6]+'</a></span></div>':'')+
      '</div>';
    card.querySelectorAll('[data-sbuild]').forEach(btn=>btn.onclick=()=>{activeSancBuild=+btn.dataset.sbuild;renderSanctuaryDossier(beat)});
  }else{
    card.innerHTML=
      '<div class="sd-sys-head"><div class="sd-kicker">'+beat.dossier.kicker+'</div><button type="button" class="sd-toggle-btn" id="sd-exp-btn">'+togLabel+'</button></div>'+
      '<div class="sd-title">'+beat.dossier.title+'</div>'+
      '<div class="sd-verdict">'+beat.dossier.verdict+'</div>'+
      '<div class="sd-rows">'+beat.dossier.rows.map((r,idx)=>'<div class="sd-row'+(idx>=2?' sd-row-extra':'')+'"><b>'+r[0]+'</b><span>'+r[1]+'</span></div>').join('')+'</div>';
  }
  const eb=$('#sd-exp-btn');
  if(eb)eb.onclick=()=>{sancDossierOpen=!sancDossierOpen;renderSanctuaryDossier(beat)};
}

let lastBeatIdx=-1,sancShake=0,verdictZoomBoomed=false;
let camCur={s:1.06,tx:0,ty:0,r:0,rx:1.2,ry:0,vpX:0.5,hor:0.75};
function drawHallBg(t,wind,pSanc=0,vpX=0.5,horRatio=0.75,verdictTr=0){
  const{w,h,c}=fitCanvas(hallCv);
  c.fillStyle='#96191D';c.fillRect(0,0,w,h);
  const hor=h*clamp(horRatio,0.44,0.92);
  const vp=w*clamp(vpX,0.12,0.88);
  const panShift=(vpX-0.5)*w;

  /* 3D Perspective Floor Projection converging directly to camera Vanishing Point (vp, hor) */
  c.fillStyle='#750F12';c.fillRect(0,hor,w,h-hor);
  c.strokeStyle='#141414';c.lineWidth=1.4;
  c.beginPath();c.moveTo(0,hor);c.lineTo(w,hor);c.stroke();
  for(let i=-14;i<=14;i++){
    const topX=vp+i*24;
    const botX=vp+(i*190)+(vpX-0.5)*-240;
    c.beginPath();c.moveTo(topX,hor);c.lineTo(botX,h);c.stroke();
  }
  const floorSpan=Math.max(40,h-hor);
  const floorShift=(pSanc*380)%(floorSpan/5);
  for(let r=0;r<6;r++){
    const frac=(r/5+(floorShift/floorSpan))%1;
    const y=hor+Math.pow(frac,1.45)*floorSpan;
    c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();
  }

  /* Multi-Plane 3D Extruded Cathedral Pillars with Dynamic Vanishing-Point Side Faces */
  const stoneCourseShift=(pSanc*240)%68;
  [[0.04,0.095,1.85],[0.16,0.068,1.15],[0.30,0.045,0.55],[0.70,0.045,0.55],[0.84,0.068,1.15],[0.96,0.095,1.85]].forEach(([px,pw,depth])=>{
    const cw=w*pw,cx=w*px-cw/2-panShift*depth*0.65;
    if(cx+cw<-40||cx>w+40)return;
    const sideW=clamp((vp-(cx+cw*0.5))*0.075*depth,-cw*0.58,cw*0.58);
    c.save();
    c.fillStyle='#2B0507';c.strokeStyle='#141414';c.lineWidth=1.2;
    c.beginPath();
    if(sideW>=0){
      c.moveTo(cx+cw,0);c.lineTo(cx+cw+sideW,12*depth);c.lineTo(cx+cw+sideW,hor-6*depth);c.lineTo(cx+cw,hor);
    }else{
      c.moveTo(cx,0);c.lineTo(cx+sideW,12*depth);c.lineTo(cx+sideW,hor-6*depth);c.lineTo(cx,hor);
    }
    c.closePath();c.fill();c.stroke();
    c.shadowColor='rgba(10,2,4,0.52)';c.shadowBlur=18;c.shadowOffsetX=px<0.5?8:-8;c.shadowOffsetY=4;
    const g=c.createLinearGradient(cx,0,cx+cw,0);
    g.addColorStop(0,'#3D0A0C');g.addColorStop(.42,'#B82529');g.addColorStop(.75,'#641013');g.addColorStop(1,'#240607');
    c.fillStyle=g;c.fillRect(cx,0,cw,hor);
    c.shadowColor='transparent';
    c.strokeStyle='#141414';c.lineWidth=1.5;c.strokeRect(cx,0,cw,hor);
    c.strokeStyle='rgba(245,240,228,0.22)';c.lineWidth=1;
    c.beginPath();c.moveTo(cx+2,0);c.lineTo(cx+2,hor);c.stroke();
    c.strokeStyle='#141414';c.lineWidth=1.2;
    for(let k=1;k<5;k++){c.beginPath();c.moveTo(cx+k*(cw/5),0);c.lineTo(cx+k*(cw/5),hor);c.stroke()}
    c.strokeStyle='rgba(20,10,12,0.28)';c.lineWidth=1;
    for(let sy=stoneCourseShift*depth*0.45;sy<hor;sy+=68){
      const yy=sy%hor;c.beginPath();c.moveTo(cx,yy);c.lineTo(cx+cw,yy);c.stroke();
    }
    c.restore();
  });
  c.save();c.globalAlpha=0.045;
  const hPat=c.createPattern(getPaperGrainTile(),'repeat');
  if(hPat){c.fillStyle=hPat;c.fillRect(0,0,w,h)}
  c.restore();

  if(verdictTr<0.95){
    const sanctuaryDim=1-verdictTr;
    c.save();c.globalAlpha=sanctuaryDim;
    /* Gently swaying crimson silk cathedral banners */
    [0.23,0.77].forEach((bxR,bi)=>{
      const bx=w*bxR-panShift*(bi?0.45:0.45);
      const sway=Math.sin(t*1.9*wind+bi*1.7)*(8+wind*5);
      c.fillStyle='rgba(128,16,20,0.68)';c.strokeStyle='#141414';c.lineWidth=1.4;
      c.beginPath();
      c.moveTo(bx-14,0);c.lineTo(bx+14,0);
      c.quadraticCurveTo(bx+16+sway*0.6,hor*0.42,bx+10+sway,hor*0.74);
      c.lineTo(bx+sway,hor*0.80);
      c.lineTo(bx-10+sway,hor*0.74);
      c.quadraticCurveTo(bx-16+sway*0.6,hor*0.42,bx-14,0);
      c.closePath();c.fill();c.stroke();
    });
    const gx=w*0.58-panShift*0.24,gy=h*clamp(horRatio*0.40,0.20,0.42);
    c.save();c.translate(gx,gy);
    /* Multi-Axis 3D Tilted Gimbal Magic Sanctuary Astrolabe */
    for(let gRing=0;gRing<3;gRing++){
      c.save();
      c.rotate(t*(gRing%2?-0.34:0.28)*wind+pSanc*(gRing%2?-2.8:3.4)+(gRing*0.52));
      c.scale(1,gRing===1?1:(0.42+0.26*Math.sin(t*0.75*wind+gRing)));
      c.strokeStyle=gRing===1?'rgba(235,230,248,0.68)':'rgba(255,248,240,0.48)';
      c.lineWidth=gRing===1?2.1:1.4;
      c.setLineDash(gRing===0?[6,8]:gRing===2?[2,9]:[]);
      c.beginPath();c.arc(0,0,Math.min(w,h)*(0.185+gRing*0.055),0,Math.PI*2);c.stroke();
      c.restore();
    }
    c.restore();
    for(let i=0;i<36;i++){
      const ex=(w*(0.05+((i*41)%90)/100))+Math.sin(t*2.1+i)*18*wind-panShift*0.35;
      const ey=h-((t*(42+(i%5)*14)*wind+i*46+pSanc*420)%h);
      c.fillStyle='rgba(255,246,238,0.58)';
      c.beginPath();c.arc(ex,ey,1.2+(i%2)*0.8,0,Math.PI*2);c.fill();
    }
    /* Floating 3D Kirigami Blueprint Cards Orbiting Sanctuary Core */
    for(let sc=0;sc<4;sc++){
      const ang=pSanc*6.5+t*0.24+(sc*Math.PI*0.5);
      const sx=gx+Math.cos(ang)*(w*0.25)-panShift*0.42;
      const sy=gy+Math.sin(ang)*(h*0.14);
      const depth=0.65+0.35*Math.sin(ang);
      c.save();c.translate(sx,sy);
      c.scale(depth*Math.cos(t*0.4+sc),depth);
      c.fillStyle='rgba(245,241,230,0.16)';c.strokeStyle='rgba(255,248,240,0.42)';c.lineWidth=1.2;
      c.fillRect(-36,-24,72,48);c.strokeRect(-36,-24,72,48);
      c.fillStyle='rgba(43,182,216,0.55)';c.fillRect(-26,-14,24,4);
      c.fillStyle='rgba(255,248,240,0.45)';c.fillRect(-26,-4,48,2);c.fillRect(-26,4,38,2);
      c.restore();
    }
    c.restore();
  }

  /* Awakening Plain #000000 Pitch-Black Void backdrop (razor-crisp overhead white light is drawn directly in 4K #sanc-actors-cv!) */
  if(verdictTr>0.01){
    c.fillStyle='rgba(0,0,0,'+clamp(verdictTr*1.08,0,1).toFixed(3)+')';
    c.fillRect(0,0,w,h);
  }
}

function drawSanctuaryActors(t,beat,shift=0,scrollBoost=0,vpX=0.5,horRatio=0.75,subBeat=0,cam=null,verdictTr=0){
  const{w,h,c}=fitCanvas(sancActorsCv,true);
  c.clearRect(0,0,w,h);
  initRefPortraits();
  const gIm=getPaperCutSprite(beat.godPose||'g_front',false)||getHDAnimeSprite(beat.godPose||'g_front')||IMG[beat.godPose]||IMG.g_front;
  const pRaw=IMG[beat.parthPose||'p_listen']||IMG.p_listen;
  const pIm=getPaperCutSprite(beat.parthPose||'p_listen',false)||getHDAnimeSprite(beat.parthPose||'p_listen')||pRaw;

  const orbitOff=(vpX-0.5)*w*0.18;
  const floorY=h*clamp(horRatio,0.54,0.92);
  const isVerdict=beat.id==='verdict';

  /* Apply 3D Camera Matrix (dolly + roll + yaw foreshortening) in Native 4K Canvas Coordinates */
  c.save();
  if(cam){
    c.translate(w*0.5+w*(cam.tx/100),h*0.5+h*(cam.ty/100));
    const yawComp=Math.cos((cam.ry||0)*Math.PI/180);
    const pitchComp=1-Math.abs(cam.rx||0)*0.008;
    c.scale(cam.s*yawComp,cam.s*pitchComp);
    c.rotate((cam.r||0)*Math.PI/180);
    c.translate(-w*0.5,-h*0.5);
  }

  /* Soft Feathered Heavenly White Awakening Light Veil behind Entity Parth on #000000 Void */
  if(isVerdict&&verdictTr>0.01){
    const beamAmt=smoothstep(0.05,0.30,verdictTr);
    if(beamAmt>0.01){
      const bx=w*0.37-orbitOff*1.05;
      const cy=h*0.46;
      const beamFloor=Math.min(h*0.93,floorY+h*0.16);
      c.save();
      const auraR=Math.min(w,h)*0.44*beamAmt;
      const aura=c.createRadialGradient(bx,cy,10,bx,cy,auraR);
      aura.addColorStop(0,'rgba(255,255,255,'+(0.52*beamAmt).toFixed(2)+')');
      aura.addColorStop(0.32,'rgba(236,242,250,'+(0.28*beamAmt).toFixed(2)+')');
      aura.addColorStop(0.68,'rgba(215,222,235,'+(0.09*beamAmt).toFixed(2)+')');
      aura.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=aura;
      c.beginPath();c.arc(bx,cy,auraR,0,Math.PI*2);c.fill();

      const colW=w*0.18;
      const hg=c.createLinearGradient(bx-colW,0,bx+colW,0);
      hg.addColorStop(0,'rgba(255,255,255,0)');
      hg.addColorStop(0.5,'rgba(255,255,255,'+(0.42*beamAmt).toFixed(2)+')');
      hg.addColorStop(1,'rgba(255,255,255,0)');
      c.fillStyle=hg;
      c.fillRect(bx-colW,0,colW*2,beamFloor);

      if(subBeat>0.26){
        c.save();
        c.fillStyle='rgba(255,255,255,'+(0.11*beamAmt).toFixed(2)+')';
        c.font='700 '+Math.round(h*0.095)+'px var(--jp)';
        c.textAlign='center';
        c.fillText('覚',bx-w*0.11,cy-h*0.08);
        c.fillText('醒',bx-w*0.11,cy+h*0.04);
        c.restore();
      }
      c.restore();
    }
  }

  /* 1. Draw The Divine (8K Layered 3D Paper-Cutout Sovereign) */
  const gw=gIm&&(gIm._origW||gIm.width||gIm.naturalWidth),gh=gIm&&(gIm._origH||gIm.height||gIm.naturalHeight);
  const godAlpha=isVerdict?1-smoothstep(0.06,0.28,subBeat):1;
  if(gw&&gh&&godAlpha>0.01){
    const targetH=Math.min(h*0.65,550);
    const scale=targetH/gh;
    const dw=gw*scale,dh=gh*scale;
    const baseGx=shift>=0?lerp(w*0.62,w*0.46,shift):lerp(w*0.62,w*0.68,-shift);
    const gx=baseGx-orbitOff*0.55;
    const gy=Math.min(h*0.78,floorY-h*0.02)+(isVerdict?0:Math.sin(t*2.2)*4.5);
    c.save();
    c.globalAlpha=godAlpha;
    drawPaperSprite(c,gIm,gx-dw/2,gy-dh,dw,dh);
    c.restore();
  }

  /* 2. Draw Parth (8K Layered 3D Paper-Cutout + Verdict Sovereign Entity Coat) */
  const pw=pIm&&(pIm._origW||pIm.width||pIm.naturalWidth),ph=pIm&&(pIm._origH||pIm.height||pIm.naturalHeight);
  if(pw&&ph){
    const entIm=isVerdict?(getPaperCutSprite(beat.parthPose||'p_idle',true)||getEntityParthSprite(beat.parthPose||'p_idle')||pIm):pIm;
    const targetH=Math.min(h*0.58,495);
    const scale=targetH/ph;
    const dw=pw*scale,dh=ph*scale;
    const basePx=shift>=0?lerp(w*0.37,w*0.29,shift):lerp(w*0.37,w*0.51,-shift);
    const px=basePx-orbitOff*1.05;
    const py=Math.min(h*0.93,floorY+h*0.16);

    const sRad=dw*0.36;
    c.save();c.translate(px,py-4);c.scale(1,0.18);
    const sGr=c.createRadialGradient(0,0,2,0,0,sRad);
    sGr.addColorStop(0,isVerdict?'rgba(255,255,255,0.22)':'rgba(15,6,6,0.52)');
    sGr.addColorStop(0.6,isVerdict?'rgba(255,255,255,0.08)':'rgba(15,6,6,0.18)');
    sGr.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=sGr;c.beginPath();c.arc(0,0,sRad,0,Math.PI*2);c.fill();
    c.restore();

    const breath=1+Math.sin(t*2.4)*0.008;
    const sway=Math.sin(t*1.7)*1.8;
    c.save();
    c.translate(px-dw/2+sway,py-dh*breath);
    c.scale(1,breath);
    if(isVerdict){
      const morph=smoothstep(0.08,0.34,subBeat);
      const padP=pIm._pad||0,origWP=pIm._origW||pw,origHP=pIm._origH||ph;
      const sxP=dw/origWP,syP=dh/origHP;
      const dTopY=-padP*syP,dTotH=dh+2*padP*syP;
      const cutSrcY=Math.round(padP+origHP*morph);
      const cutDstY=dh*morph;
      const ePad=entIm._pad||0,eOW=entIm._origW||pw,eOH=entIm._origH||ph;
      const eSc=targetH/eOH,edw=eOW*eSc,edxOff=(dw-edw)*0.5;
      const cutEntY=Math.round(ePad+eOH*morph);
      if(morph<0.995){
        c.drawImage(pIm,0,cutSrcY,pIm.width||origWP,(pIm.height||origHP)-cutSrcY,-padP*sxP,cutDstY,dw+2*padP*sxP,(dTopY+dTotH)-cutDstY);
      }
      if(morph>0.005){
        c.drawImage(entIm,0,0,entIm.width||eOW,cutEntY,edxOff-ePad*(edw/eOW),-ePad*eSc,edw+2*ePad*(edw/eOW),cutDstY+ePad*eSc);
      }
      if(morph>0.02&&morph<0.98){
        c.fillStyle='#FFFFFF';
        c.fillRect(dw*0.04,cutDstY-1.5,dw*0.92,3);
      }
    }else{
      drawPaperSprite(c,pIm,0,0,dw,dh);
    }
    c.restore();
  }
  c.restore();
}

/* ==================== POUR, VORTEX & SHATTER CANVASES ==================== */
/* ==================== POUR (PLAIN LIQUID MERCURY RED THEME), VORTEX AWAKENING & SHATTER ==================== */
let pourProgress=0,pourHolding=false,pourDone=false,pourUserHold=false;
function drawPour(t,pPour=0.5){
  const{w,h,c}=fitCanvas(pourCv,true);
  /* Clean Plain Deep Crimson Studio Void + Mirror Floor Horizon */
  const bg=c.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,'#8E1519');
  bg.addColorStop(0.68,'#6A0E11');
  bg.addColorStop(1,'#3E0608');
  c.fillStyle=bg;c.fillRect(0,0,w,h);

  const horY=h*0.74,cx=w*0.56,inf=clamp(pourProgress,0,1);
  c.fillStyle='#5A0B0E';c.fillRect(0,horY,w,h-horY);
  c.strokeStyle='#141414';c.lineWidth=1.6;
  c.beginPath();c.moveTo(0,horY);c.lineTo(w,horY);c.stroke();

  /* Liquid Mercury Chrome Ripples Spreading Across Crimson Floor Horizon */
  for(let r=0;r<10;r++){
    const u=((r/10)+(t*0.24+inf*0.55)%1)%1;
    const rx=w*(0.05+u*(0.26+inf*0.18));
    const ry=rx*0.16;
    c.strokeStyle='rgba(242,245,250,'+((1-u)*(0.38+inf*0.48)).toFixed(2)+')';
    c.lineWidth=1.3+(1-u)*1.4;
    c.beginPath();c.ellipse(cx,horY+2,rx,ry,0,0,Math.PI*2);c.stroke();
  }

  /* Glossy Liquid Mercury Pool & Center Hovering Chrome-Crimson Core */
  const poolG=c.createRadialGradient(cx,horY+2,4,cx,horY+2,w*(0.14+inf*0.10));
  poolG.addColorStop(0,'rgba(255,255,255,'+(0.88+inf*0.12).toFixed(2)+')');
  poolG.addColorStop(0.45,'rgba(205,212,224,'+(0.62+inf*0.25).toFixed(2)+')');
  poolG.addColorStop(0.85,'rgba(120,24,28,0.22)');
  poolG.addColorStop(1,'rgba(90,11,14,0)');
  c.fillStyle=poolG;
  c.beginPath();c.ellipse(cx,horY+2,w*(0.14+inf*0.10),26+inf*14,0,0,Math.PI*2);c.fill();

  /* Three Z-Sorted 3D Orbiting Essence Spheres Revolving Behind & In Front of Mercury Stream */
  const orbColors=['#2BB6D8','#4BC988','#E4B648'];
  const orbs=orbColors.map((col,i)=>{
    const ang=pPour*3.2+t*(0.65+inf*1.3)+(i*Math.PI*2/3);
    const orbitR=(108-inf*62);
    const z=Math.sin(ang);
    return{col,ang,z,ox:cx+Math.cos(ang)*orbitR*1.42,oy:h*0.46+z*orbitR*0.36,rad:Math.max(8,(18-inf*5)*(0.80+z*0.26))};
  });
  const drawOrb=o=>{
    c.save();
    c.globalAlpha=o.z<0?0.78:1;
    c.shadowColor='rgba(12,4,6,0.52)';c.shadowBlur=12;c.shadowOffsetX=4;c.shadowOffsetY=5;
    const og=c.createRadialGradient(o.ox-o.rad*0.32,o.oy-o.rad*0.32,2,o.ox,o.oy,o.rad*1.1);
    og.addColorStop(0,'#FFFFFF');og.addColorStop(0.45,o.col);og.addColorStop(1,'#14151A');
    c.fillStyle=og;c.beginPath();c.arc(o.ox,o.oy,o.rad,0,Math.PI*2);c.fill();
    c.shadowColor='transparent';
    c.strokeStyle='rgba(255,250,242,0.72)';c.lineWidth=1.4;c.stroke();
    c.restore();
  };
  orbs.filter(o=>o.z<0).forEach(drawOrb);

  /* Cascading Metallic Liquid Mercury Stream (chrome gradient with dark ink rim) */
  const streamW=(12+Math.sin(t*3)*2.5+inf*22);
  const stTop=0,stBot=horY+2;
  const mercG=c.createLinearGradient(cx-streamW,0,cx+streamW,0);
  mercG.addColorStop(0,'#1A1B20');
  mercG.addColorStop(0.25,'#CBD2DF');
  mercG.addColorStop(0.52,'#FFFFFF');
  mercG.addColorStop(0.78,'#9EA6B6');
  mercG.addColorStop(1,'#14151A');
  c.fillStyle=mercG;
  c.beginPath();
  c.moveTo(cx-streamW*1.35,stTop);
  c.bezierCurveTo(cx-streamW*0.65,stBot*0.4,cx-streamW*0.52,stBot*0.75,cx-streamW*0.85,stBot);
  c.lineTo(cx+streamW*0.85,stBot);
  c.bezierCurveTo(cx+streamW*0.52,stBot*0.75,cx+streamW*0.65,stBot*0.4,cx+streamW*1.35,stTop);
  c.closePath();c.fill();
  orbs.filter(o=>o.z>=0).forEach(drawOrb);
}

let vortexProgress=0,vortexHolding=false,vortexDone=false,vortexUserHold=false;
function drawVortex(t,pVor=0.5){
  const{w,h,c}=fitCanvas(vortexCv);
  c.fillStyle='#000000';c.fillRect(0,0,w,h);
  const pull=smoothstep(0.05,0.92,pVor);
  const lift=clamp(Math.max(pull*0.68,vortexProgress),0,1);
  const cx=w/2+ptr3dX*w*0.03,cy=h*(0.52-lift*0.04)+ptr3dY*h*0.02;

  /* Smooth Feathered Heavenly White Awakening Aura + True 3D Ascending Helix Rings */
  const auraR=Math.min(w,h)*(0.42+lift*0.26);
  const aura=c.createRadialGradient(cx,cy,8,cx,cy,auraR);
  aura.addColorStop(0,'rgba(255,255,255,'+(0.62+lift*0.36).toFixed(2)+')');
  aura.addColorStop(0.26,'rgba(235,242,252,'+(0.34+lift*0.34).toFixed(2)+')');
  aura.addColorStop(0.62,'rgba(200,210,226,'+(0.10+lift*0.18).toFixed(2)+')');
  aura.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=aura;
  c.beginPath();c.arc(cx,cy,auraR,0,Math.PI*2);c.fill();

  const colW=w*(0.16+lift*0.09);
  const colG=c.createLinearGradient(cx-colW,0,cx+colW,0);
  colG.addColorStop(0,'rgba(255,255,255,0)');
  colG.addColorStop(0.5,'rgba(255,255,255,'+(0.30+lift*0.42).toFixed(2)+')');
  colG.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle=colG;
  c.fillRect(cx-colW,0,colW*2,h*0.94);

  /* 3D Ascending Perspective Halo Rings */
  c.save();
  for(let hr=0;hr<4;hr++){
    const phase=((hr/4)+(t*(0.22+lift*0.35)))%1;
    const ryPos=h*(0.88-phase*0.76);
    const rr=Math.min(w,h)*(0.18+Math.sin(phase*Math.PI)*0.16);
    c.save();c.translate(cx,ryPos);c.scale(1,0.22+0.08*Math.cos(phase*Math.PI));
    c.strokeStyle='rgba(255,255,255,'+(Math.sin(phase*Math.PI)*(0.28+lift*0.36)).toFixed(2)+')';
    c.lineWidth=1.6;c.beginPath();c.arc(0,0,rr,0,Math.PI*2);c.stroke();
    c.restore();
  }
  c.restore();

  c.save();
  c.fillStyle='rgba(255,255,255,'+(0.09+lift*0.08).toFixed(2)+')';
  c.font='700 '+Math.round(h*0.12)+'px var(--jp)';
  c.textAlign='center';
  c.fillText('覚',cx-w*0.15,cy-h*0.09);
  c.fillText('醒',cx-w*0.15,cy+h*0.05);
  c.restore();
  for(let i=0;i<48;i++){
    const px=cx+((i*59)%320)-160+Math.sin(t*0.95+i)*15;
    const py=h-((t*(22+(i%4)*8+lift*38)+i*38)%h);
    c.fillStyle='rgba(255,255,255,'+(0.26+lift*0.58).toFixed(2)+')';
    c.beginPath();c.arc(px,py,1.0+(i%2)*0.9,0,Math.PI*2);c.fill();
  }

  /* Awakened 8K Paper-Cutout Sovereign Entity Parth rising in light */
  const{w:aw,h:ah,c:ac}=fitCanvas(vortexActorCv,true);
  ac.clearRect(0,0,aw,ah);
  const srcV=getPaperCutSprite('p_idle',true)||getEntityParthSprite('p_idle')||IMG.p_idle;
  const ow=srcV&&(srcV._origW||srcV.width||srcV.naturalWidth),oh=srcV&&(srcV._origH||srcV.height||srcV.naturalHeight);
  const cw=srcV&&(srcV.width||ow),ch=srcV&&(srcV.height||oh),vPad=srcV&&(srcV._pad||0);
  if(ow&&oh){
    const targetH=Math.min(ah*0.64,520)*(0.95+pull*0.08+vortexProgress*0.14);
    const sc=targetH/oh,dw=ow*sc,dh=targetH,dPadX=vPad*(dw/ow),dPadY=vPad*sc;
    const fy=ah*(0.54-lift*0.06);
    ac.save();
    ac.translate(aw/2-dw/2,fy-dh/2);
    const hemY=Math.round(vPad+oh*0.44);
    ac.drawImage(srcV,0,0,cw,hemY,-dPadX,-dPadY,dw+2*dPadX,hemY*sc);
    for(let y=hemY;y<ch;y+=4){
      const bh=Math.min(4,ch-y);
      const frac=(y-hemY)/Math.max(1,ch-hemY);
      const wx=Math.sin(pVor*6-frac*4+t*1.1)*frac*(1.8+vortexProgress*3.6);
      ac.drawImage(srcV,0,y,cw,bh,wx-dPadX,-dPadY+y*sc,dw+2*dPadX,bh*sc+1.0);
    }
    ac.restore();
  }
}

const SHARDS=[...Array(64)].map((_,i)=>({
  x:0.10+((i*37)%80)/100,y0:((i*19)%62)/100,w:10+((i*11)%24),h:12+((i*13)%26),
  vx:((i%2?-1:1)*(0.06+((i*7)%14)/100)),vy:0.24+((i*5)%22)/100,rot:(i%7)*.5
}));
function drawShatter(t,pSh){
  const crack=smoothstep(0.08,0.88,pSh);
  const celOp=smoothstep(0.24,0.84,pSh);
  $('#shatter-cel-bg').style.opacity=celOp.toFixed(2);
  const celRotX=((0.5-pSh)*7.5).toFixed(2);
  const celRotY=((pSh-0.5)*5.5).toFixed(2);
  const celRotZ=((pSh-0.5)*1.8).toFixed(2);
  $('#shatter-cel-bg').style.transform=`perspective(950px) translate3d(0,${((0.5-pSh)*3.4).toFixed(2)}%,0) scale(${(1.20-celOp*0.08+Math.sin(t*1.4)*0.014).toFixed(3)}) rotateX(${celRotX}deg) rotateY(${celRotY}deg) rotate(${celRotZ}deg)`;
  $('#shatter-inset').style.transform=`perspective(750px) translateY(${((0.55-pSh)*38+Math.sin(t*2.1)*4).toFixed(1)}px) rotateY(${((0.5-pSh)*8).toFixed(2)}deg) rotate(${((pSh-0.5)*-2.8).toFixed(2)}deg)`;
  $('#cap-shatter').style.transform=`perspective(750px) translateX(-50%) translateY(${((pSh-0.5)*28).toFixed(1)}px) rotateX(${((0.5-pSh)*4).toFixed(2)}deg)`;

  const{w,h,c}=fitCanvas(shatterCv);
  c.clearRect(0,0,w,h);
  /* Crimson firewall splitting in 3D perspective to unveil Navi Mumbai Dawn */
  c.fillStyle=`rgba(150,25,29,${(1-celOp*0.88).toFixed(2)})`;c.fillRect(0,0,w,h);
  if(crack>0.06){
    const sunG=c.createRadialGradient(w*0.5,h*0.42,8,w*0.5,h*0.42,Math.max(w,h)*0.58*crack);
    sunG.addColorStop(0,'rgba(255,252,240,'+(0.75*crack).toFixed(2)+')');
    sunG.addColorStop(0.42,'rgba(255,220,170,'+(0.32*crack*(1-celOp*0.5)).toFixed(2)+')');
    sunG.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=sunG;c.fillRect(0,0,w,h);
  }

  [w*0.36,w*0.64].forEach((cx,ci)=>{
    const cw=Math.min(118,w*0.11);
    const drawHalf=(topHalf)=>{
      c.save();
      c.shadowColor='rgba(10,4,6,0.45)';c.shadowBlur=14;c.shadowOffsetX=5;c.shadowOffsetY=7;
      c.translate(cx+(ci?1:-1)*(topHalf?crack*34:crack*10),h*0.5+(topHalf?-crack*40:crack*22));
      c.rotate((ci?1:-1)*crack*(topHalf?0.16:0.08));
      c.fillStyle='#F5F1E6';c.strokeStyle='#141414';c.lineWidth=2.2;
      c.beginPath();
      if(topHalf){
        c.moveTo(-cw/2,-h*0.6);c.lineTo(cw/2,-h*0.6);c.lineTo(cw/2,-16);
        c.lineTo(cw*.16,18);c.lineTo(-cw*.18,-8);c.lineTo(-cw/2,16);c.closePath();
      }else{
        c.moveTo(-cw/2,28);c.lineTo(-cw*.18,4);c.lineTo(cw*.16,30);c.lineTo(cw/2,-4);
        c.lineTo(cw/2,h*0.6);c.lineTo(-cw/2,h*0.6);c.closePath();
      }
      c.fill();c.shadowColor='transparent';c.stroke();
      c.save();c.clip();
      for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(k*(cw/6),-h*0.6);c.lineTo(k*(cw/6),h*0.6);c.stroke()}
      c.restore();c.restore();
    };
    drawHalf(true);drawHalf(false);
  });

  c.save();c.shadowColor='rgba(10,4,6,0.42)';c.shadowBlur=8;c.shadowOffsetX=4;c.shadowOffsetY=5;
  SHARDS.forEach((s,idx)=>{
    const x=(s.x+s.vx*crack+Math.sin(t*1.5+idx)*0.014)*w;
    const y=((s.y0+s.vy*crack+t*0.035)%1.08)*h;
    c.save();c.translate(x,y);c.rotate(s.rot+crack*2.8+t*(0.5+(idx%3)*0.25));
    c.scale(Math.cos(t*1.8+idx*0.9),Math.cos(t*1.3+idx*0.6));
    c.fillStyle=idx%4===0?'#DCE8F8':'#F4F0E5';c.strokeStyle='#141414';c.lineWidth=1.8;
    c.fillRect(-s.w/2,-s.h/2,s.w,s.h);c.strokeRect(-s.w/2,-s.h/2,s.w,s.h);
    c.restore();
  });
  c.restore();

  const{w:fw,h:fh,c:fc}=fitCanvas(shatterFallCv);
  fc.fillStyle='#96191D';fc.fillRect(0,0,fw,fh);
  fc.save();fc.shadowColor='rgba(10,4,6,0.44)';fc.shadowBlur=8;fc.shadowOffsetX=4;fc.shadowOffsetY=5;
  SHARDS.slice(0,28).forEach((s,i)=>{
    const x=fw*((0.1+i*0.048)%0.9)+Math.sin(t*1.8+i)*8,y=fh*((0.15+s.vy*0.8+crack*0.45+t*0.05)%0.95);
    fc.save();fc.translate(x,y);fc.rotate(s.rot+crack*3+t*0.9);
    fc.scale(Math.cos(t*2.1+i),0.85+0.15*Math.sin(t+i));
    fc.fillStyle='#F4F0E5';fc.strokeStyle='#141414';fc.lineWidth=1.8;
    fc.fillRect(-s.w/2,-s.h/2,s.w,s.h);fc.strokeRect(-s.w/2,-s.h/2,s.w,s.h);
    fc.restore();
  });
  fc.restore();
}

function drawCollectionFx(t){
  if(!colFxCv)return;
  const{w,h,c}=fitCanvas(colFxCv);
  c.clearRect(0,0,w,h);
  /* Subtle Manhwa Architectural Grid & Drifting Geometric Motes Behind Archive */
  c.strokeStyle='rgba(20,20,24,0.065)';c.lineWidth=1;
  const off=(t*18)%64;
  for(let x=-64;x<w+64;x+=64){c.beginPath();c.moveTo(x+off,0);c.lineTo(x+off,h);c.stroke()}
  for(let y=-64;y<h+64;y+=64){c.beginPath();c.moveTo(0,y+off);c.lineTo(w,y+off);c.stroke()}
  /* Rotating Manhwa Sovereign Crest Astrolabe Watermark */
  const cx=w*0.84,cy=h*0.42,rad=Math.min(w,h)*0.24;
  c.save();c.translate(cx,cy);c.rotate(t*0.14);
  c.strokeStyle='rgba(201,37,33,0.14)';c.lineWidth=1.5;
  c.setLineDash([7,9]);c.beginPath();c.arc(0,0,rad,0,Math.PI*2);c.stroke();
  c.setLineDash([]);c.strokeStyle='rgba(20,20,24,0.10)';
  c.beginPath();c.arc(0,0,rad*0.72,0,Math.PI*2);c.stroke();
  for(let k=0;k<4;k++){
    const a=k*Math.PI*0.5;
    c.beginPath();c.moveTo(Math.cos(a)*rad*0.55,Math.sin(a)*rad*0.55);c.lineTo(Math.cos(a)*rad*1.08,Math.sin(a)*rad*1.08);c.stroke();
  }
  c.restore();
  /* Rising Crimson & Ink Tech Sparks */
  for(let i=0;i<24;i++){
    const sx=w*((0.05+((i*37)%90)/100))+Math.sin(t*0.9+i)*18;
    const sy=h-((t*(24+(i%5)*7)+i*48)%h);
    c.fillStyle=i%3===0?'rgba(201,37,33,0.44)':'rgba(20,20,24,0.28)';
    c.beginPath();c.arc(sx,sy,1.8+(i%3)*0.7,0,Math.PI*2);c.fill();
  }
}

/* ==================== INTERACTIVE HOLD ORBS ==================== */
function bindHold(btnId,ringId,onProg,moveMode=false){
  const btn=$(btnId),ring=$(ringId);
  let active=false,startX=0;
  function down(e){
    active=true;startX=e.clientX||(e.touches&&e.touches[0].clientX)||0;
    if(btn.setPointerCapture&&e.pointerId!==undefined)try{btn.setPointerCapture(e.pointerId)}catch{}
  }
  function move(e){
    if(!active||!moveMode)return;
    const x=e.clientX||(e.touches&&e.touches[0].clientX)||startX;
    const span=Math.max(54,Math.min(130,window.innerWidth*0.24));
    onProg(clamp((startX-x)/span,0,1),ring);
  }
  function up(){active=false}
  btn.addEventListener('pointerdown',down);
  addEventListener('pointermove',move);
  addEventListener('pointerup',up);
  addEventListener('pointercancel',up);
  return()=>active;
}
const isHoldMove=bindHold('#hold-move-btn','#ring-move',(v)=>{reachUserHold=true;reachProgress=Math.max(reachProgress,v)},true);
const isHoldPour=bindHold('#hold-pour-btn','#ring-pour',()=>{pourUserHold=true});
const isHoldVortex=bindHold('#hold-vortex-btn','#ring-vortex',()=>{vortexUserHold=true});

$('#hold-move-btn').addEventListener('pointerdown',()=>{reachUserHold=true});
$('#hold-pour-btn').addEventListener('pointerdown',()=>{pourUserHold=true});
$('#hold-vortex-btn').addEventListener('pointerdown',()=>{vortexUserHold=true});
$('#hold-move-btn').addEventListener('click',()=>{reachUserHold=true;if(reachProgress<0.25)reachDone=true});
$('#hold-pour-btn').addEventListener('click',()=>{pourUserHold=true;if(pourProgress<0.25)pourDone=true});
$('#hold-vortex-btn').addEventListener('click',()=>{vortexUserHold=true;if(vortexProgress<0.25)vortexDone=true});

/* ==================== BUTTER-SMOOTH INERTIAL SCROLL ENGINE ==================== */
let scrollSmoothY=window.scrollY||0,scrollTargetY=window.scrollY||0,smoothWheelOn=false,prevAppliedY=window.scrollY||0;
function maxScrollY(){return Math.max(0,document.documentElement.scrollHeight-innerHeight)}
function smoothScrollTo(y){
  scrollSmoothY=window.scrollY;prevAppliedY=scrollSmoothY;
  scrollTargetY=clamp(y,0,maxScrollY());
  smoothWheelOn=true;
}
function findScrollableAncestor(el){
  let cur=el;
  while(cur&&cur!==document.body&&cur!==document.documentElement){
    if(cur.scrollHeight>cur.clientHeight+2){
      const ov=getComputedStyle(cur).overflowY;
      if(ov==='auto'||ov==='scroll')return cur;
    }
    cur=cur.parentElement;
  }
  return null;
}
addEventListener('wheel',e=>{
  if(e.ctrlKey||e.metaKey||$('#dossier-modal').classList.contains('on'))return;
  Sound.resumeCtx();
  if(moviePlaying)setMovieMode(false);
  const sc=findScrollableAncestor(e.target);
  const dy=e.deltaMode===1?e.deltaY*32:e.deltaMode===2?e.deltaY*innerHeight*0.85:e.deltaY;
  if(sc){
    const atTop=sc.scrollTop<=0&&dy<0,atBot=sc.scrollTop+sc.clientHeight>=sc.scrollHeight-1&&dy>0;
    if(!atTop&&!atBot)return;
  }
  e.preventDefault();
  if(!smoothWheelOn){scrollSmoothY=window.scrollY;scrollTargetY=window.scrollY;prevAppliedY=scrollSmoothY}
  scrollTargetY=clamp(scrollTargetY+dy*1.05,0,maxScrollY());
  smoothWheelOn=true;
},{passive:false});
addEventListener('touchstart',()=>{smoothWheelOn=false;if(moviePlaying)setMovieMode(false)},{passive:true});
addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key)){smoothWheelOn=false;if(moviePlaying)setMovieMode(false)}
});

/* Smooth Anchor Jumps */
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const id=a.getAttribute('href');
  if(!id||id.length<2)return;
  const target=$(id);
  if(target){e.preventDefault();smoothScrollTo(target.getBoundingClientRect().top+window.scrollY)}
}));

/* Scroll Reveal Observer for Collection & Cards */
const revealEls=[...$$('.medallion,.shelf-stage,.fact-card,.taste-card,.taste-bounds,.retail-item,.arc-item,.c-row,#ev-dossier,#skill-svg,#skill-info,.portrait-plate')];
revealEls.forEach(el=>el.classList.add('reveal-item'));
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(ents=>{
    ents.forEach(en=>{if(en.isIntersecting){en.target.classList.add('vis');io.unobserve(en.target)}});
  },{threshold:0.04,rootMargin:'120px 0px 80px 0px'});
  revealEls.forEach(el=>io.observe(el));
}else{
  revealEls.forEach(el=>el.classList.add('vis'));
}

/* Click any Story Caption Box to hear Japanese Character Voice Line */
const CAP_CUE_MAP={
  '#cap-mist-1':'mist1','#cap-mist-2':'mist2','#cap-mist-3':'mist3',
  '#cap-imp-1':'impact','#cap-imp-2':'impact2','#cap-void-orb':'void_orb',
  '#cap-mono-1':'monolith','#cap-port-1':'portal','#cap-port-2':'portal2',
  '#cap-reach':'reach','#cap-step':'step','#cap-pour':'pour',
  '#cap-vortex':'vortex','#cap-shatter':'shatter'
};
Object.keys(CAP_CUE_MAP).forEach(sel=>{
  const el=$(sel);
  if(el)el.onclick=()=>Sound.forceCue(CAP_CUE_MAP[sel]);
});
if($('#cap-curtain'))$('#cap-curtain').onclick=()=>Sound.forceCue(pCurS>0.77?'curtain_god':'curtain');
$('#sanc-cap-1').onclick=()=>{
  const b=SANCTUARY_BEATS[clamp(lastBeatIdx,0,SANCTUARY_BEATS.length-1)];
  const gLine=(b.jpLines||[]).filter(l=>l.who==='g');
  Sound.forceCue('cap1_'+b.id,gLine.length?gLine:b.jpLines);
};
$('#sanc-cap-2').onclick=()=>{
  const b=SANCTUARY_BEATS[clamp(lastBeatIdx,0,SANCTUARY_BEATS.length-1)];
  const pLine=(b.jpLines||[]).filter(l=>l.who==='p'||l.who==='pw');
  Sound.forceCue('cap2_'+b.id,pLine.length?pLine:b.jpLines);
};

/* ==================== MASTER SCROLL & CINEMATIC CAMERA LOOP ==================== */
let lastTs=0,tTime=0,lastTheme='',lastScrollY=window.scrollY||0,scrollVelS=0,sancShift=0,didInitDraw=false,impactCutDone=false;
let pHeroS=0,pMistS=0,pImpS=0,pMonoS=0,pPortS=0,pReachS=0,pStepS=0,pCurS=0,pSancS=0,pMedS=0,pPourS=0,pVorS=0,pShatterS=0;
function isNearView(el,pad=280){
  if(!el)return false;
  const r=el.getBoundingClientRect();
  return r.bottom>=-pad&&r.top<=innerHeight+pad;
}
function secProgress(el){
  const r=el.getBoundingClientRect();
  const total=Math.max(1,r.height-innerHeight);
  return clamp(-r.top/total,0,1);
}
function viewProgress(el){
  const r=el.getBoundingClientRect();
  return clamp((innerHeight-r.top)/(innerHeight+r.height),0,1);
}

function tick(ts){
  const dt=Math.min(.05,(ts-lastTs)/1e3||.016);lastTs=ts;tTime+=dt;

  /* Auto-Play 4K Anime Film Director Mode ("as videoo") */
  if(moviePlaying){
    const colTop=($('#collection')?.getBoundingClientRect().top||9999)+window.scrollY;
    if(window.scrollY>=colTop-40){
      setMovieMode(false);
    }else{
      let mvSpeed=230;
      if(isNearView($('#scene-sanctuary-story'),-60))mvSpeed=155;
      else if(isNearView($('#scene-mist'),-40))mvSpeed=205;
      else if(isNearView($('#scene-curtain'),0))mvSpeed=190;
      else if(isNearView($('#scene-reach'),-80)){mvSpeed=135;if(reachProgress<0.15&&viewProgress($('#scene-reach'))>0.42)reachDone=true}
      else if(isNearView($('#scene-pour'),-80)){mvSpeed=135;if(pourProgress<0.15&&viewProgress($('#scene-pour'))>0.42)pourDone=true}
      else if(isNearView($('#scene-vortex'),-80)){mvSpeed=135;if(vortexProgress<0.15&&viewProgress($('#scene-vortex'))>0.42)vortexDone=true}
      const nextY=clamp(window.scrollY+mvSpeed*dt,0,maxScrollY());
      window.scrollTo({top:nextY,behavior:'instant'});
      smoothWheelOn=false;
    }
  }

  /* Apply Inertial Wheel Scroll Smoothly Before Measuring Section Bounds */
  if(smoothWheelOn){
    if(Math.abs(window.scrollY-prevAppliedY)>20){
      smoothWheelOn=false;
    }else{
      const wDamp=1-Math.exp(-12.5*dt);
      scrollSmoothY+=(scrollTargetY-scrollSmoothY)*wDamp;
      if(Math.abs(scrollTargetY-scrollSmoothY)<0.25){scrollSmoothY=scrollTargetY;smoothWheelOn=false}
      window.scrollTo({top:scrollSmoothY,behavior:'instant'});
      prevAppliedY=window.scrollY;
    }
  }

  const curY=window.scrollY||0;
  const scrollJump=Math.abs(curY-lastScrollY)>650;
  const instVel=Math.abs(curY-lastScrollY)/Math.max(0.008,dt)/1400;
  lastScrollY=curY;
  scrollVelS+=(instVel-scrollVelS)*(1-Math.exp(-8.5*dt));

  const damp=1-Math.exp(-11.5*dt);
  const gDamp=1-Math.exp(-7.5*dt);
  ptr3dX+=(ptr3dTx-ptr3dX)*gDamp;
  ptr3dY+=(ptr3dTy-ptr3dY)*gDamp;
  const gYaw=ptr3dX*4.8+Math.sin(tTime*0.62)*1.6;
  const gPitch=-ptr3dY*4.0+Math.cos(tTime*0.54)*1.2;
  const firstRun=!didInitDraw;
  const snapRun=firstRun||scrollJump;

  const pHeroT=secProgress($('#hero'));
  const pMistT=secProgress($('#scene-mist'));
  const pImpT=viewProgress($('#scene-impact'));
  const pMonoT=viewProgress($('.mono-wide'));
  const pPortT=viewProgress($('.portal-panel-wrap'));
  const pReachT=viewProgress($('#scene-reach'));
  const pStepT=viewProgress($('#scene-step'));
  const pCurT=secProgress($('#scene-curtain'));
  const pSancT=secProgress($('#scene-sanctuary-story'));
  const pMedT=viewProgress($('#scene-medallions'));
  const pPourT=viewProgress($('#scene-pour'));
  const pVorT=viewProgress($('#scene-vortex'));
  const pShatterT=viewProgress($('#scene-shatter'));

  if(snapRun){
    pHeroS=pHeroT;pMistS=pMistT;pImpS=pImpT;pMonoS=pMonoT;pPortS=pPortT;
    pReachS=pReachT;pStepS=pStepT;pCurS=pCurT;pSancS=pSancT;
    pMedS=pMedT;pPourS=pPourT;pVorS=pVorT;pShatterS=pShatterT;
  }else{
    pHeroS+=(pHeroT-pHeroS)*damp;
    pMistS+=(pMistT-pMistS)*damp;
    pImpS+=(pImpT-pImpS)*damp;
    pMonoS+=(pMonoT-pMonoS)*damp;
    pPortS+=(pPortT-pPortS)*damp;
    pReachS+=(pReachT-pReachS)*damp;
    pStepS+=(pStepT-pStepS)*damp;
    pCurS+=(pCurT-pCurS)*damp;
    pSancS+=(pSancT-pSancS)*damp;
    pMedS+=(pMedT-pMedS)*damp;
    pPourS+=(pPourT-pPourS)*damp;
    pVorS+=(pVorT-pVorS)*damp;
    pShatterS+=(pShatterT-pShatterS)*damp;
  }

  /* Continuous Anime OST Environment & Wind Bed Modulation */
  if(!scrollJump&&didInitDraw){
    if(isNearView($('#scene-vortex'),0))Sound.updateEnv(320+pVorS*780,0.08+vortexProgress*0.16,420+vortexProgress*450);
    else if(isNearView($('#scene-pour'),0))Sound.mercuryFlow(Math.max(pourProgress,pPourS*0.4));
    else if(isNearView($('#scene-reach'),0))Sound.portalSuck(reachProgress);
    else if(isNearView($('#scene-sanctuary-story'),0))Sound.updateEnv(520,0.08,360);
    else if(isNearView($('#scene-monolith'),0))Sound.updateEnv(380,0.12,520);
    else if(isNearView($('#scene-mist'),0))Sound.updateEnv(340,0.09,320);
    else Sound.updateEnv(300,0.04,280);
  }

  /* 1. Hero Cloud Dissolve */
  if(firstRun||isNearView($('#hero'))){
    drawHero(tTime,pHeroS);
    if(!firstRun&&pHeroT>0.12&&pHeroT<0.68&&isNearView($('#hero'),0))Sound.cue('prologue');
  }

  /* 2. Act I: Mumbai Walk 3D Multi-Axis Camera & Paper Firewall Breach */
  if(isNearView($('#scene-mist'))){
    drawMistBg(tTime,pMistS);
    let mScale=1.04,mTx=0,mTy=0,mRot=0,mRx=0,mRy=0;
    if(pMistS<0.15){
      const u=smoothstep(0,0.15,pMistS);
      mScale=lerp(1.04,1.12,u);mTx=lerp(0,-1.8,u);mTy=lerp(0,1.4,u);mRot=lerp(0,-0.6,u);mRx=lerp(2.2,4.0,u);mRy=lerp(-4.5,-1.5,u);
    }else if(pMistS<0.30){
      const u=smoothstep(0.15,0.30,pMistS);
      mScale=lerp(1.12,1.20,u);mTx=lerp(-1.8,-4.2,u);mTy=lerp(1.4,2.8,u);mRot=lerp(-0.6,1.2,u);mRx=lerp(4.0,1.5,u);mRy=lerp(-1.5,5.5,u);
    }else if(pMistS<0.45){
      const u=smoothstep(0.30,0.45,pMistS);
      mScale=lerp(1.20,1.34,u);mTx=lerp(-4.2,-6.0,u);mTy=lerp(2.8,4.4,u);mRot=lerp(1.2,2.0,u);mRx=lerp(1.5,-3.2,u);mRy=lerp(5.5,-6.2,u);
    }else if(pMistS<0.60){
      const u=smoothstep(0.45,0.60,pMistS);
      mScale=lerp(1.34,1.18,u);mTx=lerp(-6.0,-1.8,u);mTy=lerp(4.4,1.4,u);mRot=lerp(2.0,-2.1,u);mRx=lerp(-3.2,3.6,u);mRy=lerp(-6.2,4.0,u);
    }else if(pMistS<0.80){
      const u=smoothstep(0.60,0.80,pMistS);
      mScale=lerp(1.18,1.38,u);mTx=lerp(-1.8,3.6,u);mTy=lerp(1.4,5.4,u);mRot=lerp(-2.1,1.8,u);mRx=lerp(3.6,-4.5,u);mRy=lerp(4.0,-7.5,u);
    }else{
      const u=smoothstep(0.80,1.0,pMistS);
      mScale=lerp(1.38,1.54,u);mTx=lerp(3.6,2.8,u);mTy=lerp(5.4,7.4,u);mRot=lerp(1.8,-2.4,u);mRx=lerp(-4.5,5.2,u);mRy=lerp(-7.5,6.8,u);
    }
    if(pMistS>0.64)Sound.truckApproach(clamp((pMistS-0.64)/0.36,0,1));
    if(pMistS>0.72)Sound.tireScreech();
    if(pMistS>0.78)Sound.truckHorn();
    if(pMistS<0.25)Sound.resetCues();
    const has3dNow=!!(window.Nexus3D&&window.Nexus3D.ok);
    if(!has3dNow){
      const camMist={tx:mTx+ptr3dX*1.8,ty:mTy+ptr3dY*1.2,s:mScale,r:mRot,rx:mRx+gPitch*0.6,ry:mRy+gYaw*0.75};
      $('#mist-cam').style.transform='perspective(1050px) translate3d('+camMist.tx.toFixed(2)+'%,'+camMist.ty.toFixed(2)+'%,0) scale('+mScale.toFixed(3)+') rotateX('+camMist.rx.toFixed(2)+'deg) rotateY('+camMist.ry.toFixed(2)+'deg) rotate('+mRot.toFixed(2)+'deg)';
      drawParthWalkActor(tTime,pMistS,camMist);
    }
    const hint=$('.scroll-step-hint');
    if(hint){hint.style.opacity=pMistS>0.025?'0':'1';hint.style.visibility=pMistS>0.03?'hidden':'visible'}

    const showM1=pMistS<0.36,showM2=pMistS>=0.32&&pMistS<0.68,showM3=pMistS>=0.64;
    $('#cap-mist-1').style.opacity=showM1?1:0;
    $('#cap-mist-1').style.transform='perspective(800px) translate3d(0,'+(showM1?0:16)+'px,24px) rotateX('+(gPitch*0.55).toFixed(2)+'deg) rotateY('+(gYaw*0.65).toFixed(2)+'deg)';
    setTypedProgress($('#cap-mist-1'),showM1?smoothstep(0.01,0.22,pMistS):0);
    $('#inset-face-1').style.opacity=showM1?1:0;
    $('#inset-face-1').style.transform='perspective(800px) translate3d(0,'+((0.18-pMistS)*45).toFixed(1)+'px,32px) rotateX('+(gPitch*0.75).toFixed(2)+'deg) rotateY('+(-4+gYaw*0.85).toFixed(2)+'deg)';

    $('#cap-mist-2').style.opacity=showM2?1:0;
    $('#cap-mist-2').style.transform='perspective(800px) translate3d(0,'+(showM2?0:16)+'px,24px) rotateX('+(gPitch*0.55).toFixed(2)+'deg) rotateY('+(gYaw*0.65).toFixed(2)+'deg)';
    setTypedProgress($('#cap-mist-2'),showM2?smoothstep(0.32,0.54,pMistS):0);
    $('#inset-phone-joy').style.opacity=showM2?1:0;
    $('#inset-phone-joy').style.transform='perspective(800px) translate3d(0,'+((pMistS-0.48)*55).toFixed(1)+'px,32px) rotateX('+(gPitch*0.75).toFixed(2)+'deg) rotateY('+(4+gYaw*0.85).toFixed(2)+'deg)';

    $('#cap-mist-3').style.opacity=showM3?1:0;
    $('#cap-mist-3').style.transform='perspective(800px) translate3d(0,'+(showM3?0:16)+'px,24px) rotateX('+(gPitch*0.55).toFixed(2)+'deg) rotateY('+(gYaw*0.65).toFixed(2)+'deg)';
    setTypedProgress($('#cap-mist-3'),showM3?smoothstep(0.64,0.88,pMistS):0);
    $('#inset-face-shock').style.opacity=showM3?1:0;
    $('#inset-face-shock').style.transform='perspective(800px) translate3d(0,'+((0.82-pMistS)*38).toFixed(1)+'px,34px) rotateX('+(gPitch*0.75).toFixed(2)+'deg) rotateY('+(-4+gYaw*0.85).toFixed(2)+'deg)';
    $('#img-mist-shock').src=getFaceCloseUrl(pMistS>0.83?'pe_shocked':'pe_confused');
    $('#mist-shock-tag').textContent=pMistS>0.83?'BREACH!':'WAIT…';

    if(!firstRun&&pMistT>0.03&&pMistT<0.98){
      if(pMistT<0.33)Sound.cue('mist1');
      else if(pMistT<0.66)Sound.cue('mist2');
      else Sound.cue('mist3');
    }
  }

  /* 3. Act II: 3D Bullet-Time Orbit, Breach Shock & Gyroscope Snapshot */
  if(isNearView($('#scene-impact'))){
    drawImpactRays(tTime,pImpS);
    const impZoom=1.02+smoothstep(0.18,0.72,pImpS)*0.50;
    const hitVib=(pImpS>0.44&&pImpS<0.76)?Math.sin(tTime*62)*3.5*(1-Math.abs(pImpS-0.60)*4):0;
    $('#img-impact-portrait').style.transform='scale('+impZoom.toFixed(3)+') rotate('+((pImpS-0.5)*-2.4).toFixed(2)+'deg)';
    $('#img-impact-portrait').src=getFaceCloseUrl(pImpS>0.46?'pe_shocked':pImpS>0.34?'pe_determined':'pe_profile');
    $('#impact-rays').style.transform='perspective(1050px) rotateX('+(gPitch*0.65).toFixed(2)+'deg) rotateY('+(gYaw*0.65).toFixed(2)+'deg) scale(1.03)';
    $('#portrait-panel').style.transform='perspective(950px) translate3d('+hitVib.toFixed(1)+'px,0,28px) scale('+(0.98+smoothstep(0.1,0.75,pImpS)*0.09).toFixed(3)+') rotateY('+((pImpS-0.45)*-14.5+gYaw*0.85).toFixed(2)+'deg) rotateX('+((0.5-pImpS)*8.5+gPitch*0.85).toFixed(2)+'deg) rotate('+((pImpS-0.45)*2.6).toFixed(2)+'deg)';
    $('#impact-eye-cut').style.opacity=pImpS>0.36&&pImpS<0.85?1:0;
    $('#impact-eye-cut').style.transform='perspective(750px) translate3d(0,'+((0.5-pImpS)*32).toFixed(1)+'px,34px) rotateY('+((0.5-pImpS)*10+gYaw*0.75).toFixed(2)+'deg) rotateX('+(gPitch*0.7).toFixed(2)+'deg) scale('+(1+smoothstep(0.36,0.75,pImpS)*0.14).toFixed(3)+')';
    $('#cap-imp-1').style.transform='perspective(750px) translate3d(0,'+((0.5-pImpS)*36).toFixed(1)+'px,20px) rotateY('+((pImpS-0.5)*-7.5+gYaw*0.55).toFixed(2)+'deg) rotateX('+(gPitch*0.5).toFixed(2)+'deg)';
    $('#cap-imp-2').style.transform='perspective(750px) translate3d(0,'+((pImpS-0.5)*36).toFixed(1)+'px,20px) rotateY('+((pImpS-0.5)*7.5+gYaw*0.55).toFixed(2)+'deg) rotateX('+(gPitch*0.5).toFixed(2)+'deg)';
    const orb=$('.void-orb-svg'),pol=$('.mem-polaroid'),orbP=viewProgress($('.void-orb-stage'));
    setTypedProgress($('#cap-imp-1'),smoothstep(0.08,0.42,pImpS));
    setTypedProgress($('#cap-imp-2'),smoothstep(0.45,0.78,pImpS));
    setTypedProgress($('#cap-void-orb'),smoothstep(0.08,0.62,orbP));
    $('#portrait-headlight').style.opacity=pImpS>0.42?smoothstep(0.42,0.64,pImpS).toFixed(2):'0';
    $('#portrait-flash').style.opacity=pImpS>0.64?smoothstep(0.64,0.82,pImpS).toFixed(2):'0';
    if(orb)orb.style.transform='perspective(800px) rotateX('+((0.5-orbP)*24+gPitch*1.1).toFixed(1)+'deg) rotateY('+((orbP-0.5)*42+gYaw*1.2).toFixed(1)+'deg) rotate('+(orbP*48-20+Math.sin(tTime*1.4)*8).toFixed(1)+'deg) scale('+(0.92+orbP*0.14).toFixed(3)+')';
    if(pol)pol.style.transform='perspective(800px) translate3d(0,'+((0.68-orbP)*36+Math.sin(tTime*2.1)*4).toFixed(1)+'px,24px) rotateX('+((orbP-0.5)*14+gPitch*0.9).toFixed(2)+'deg) rotateY('+((0.5-orbP)*16+gYaw*0.95).toFixed(2)+'deg) rotate('+(-5.5+orbP*5.5).toFixed(2)+'deg)';
    if(pImpS>0.12&&pImpS<0.46)Sound.tireScreech();
    if(pImpS>0.56&&pImpS<0.86){Sound.impactHit();if(!impactCutDone){impactCutDone=true;triggerImpactCut();}}
    else if(pImpS<0.12){impactCutDone=false;Sound.resetCues();}
    if(didInitDraw&&pImpT>0.18&&pImpT<0.88&&isNearView($('#scene-impact'),-40)){
      const orbP=viewProgress($('.void-orb-stage'));
      if(orbP>0.32&&orbP<0.78)Sound.cue('void_orb');
      else Sound.cue(pImpT<0.55?'impact':'impact2');
    }
  }

  /* 4. Act III: 3D Sweeping Monolith Staircase + Silvery Port + Walking Legs Focus */
  if(isNearView($('.mono-wide'))){
    const legFocus=smoothstep(0.22,0.56,pMonoS)*(1-smoothstep(0.68,0.92,pMonoS));
    const monoScale=(1.08+legFocus*0.36+smoothstep(0.68,1.0,pMonoS)*0.22).toFixed(3);
    const monoTx=lerp(0,-3.5,legFocus)+lerp(0,4.0,smoothstep(0.68,1.0,pMonoS));
    const monoTy=lerp(2,-9.5,legFocus)+lerp(0,5.5,smoothstep(0.68,1.0,pMonoS));
    const monoRot=((pMonoS-0.5)*2.4).toFixed(2);
    const monoRx=((0.5-pMonoS)*6.5).toFixed(2);
    const monoRy=((pMonoS-0.5)*-9.0).toFixed(2);
    const monoFrame=$('.mono-wide'),lInset=$('#ladder-leg-inset');
    if(monoFrame)monoFrame.style.transform='perspective(1100px) rotateX('+(gPitch*0.42).toFixed(2)+'deg) rotateY('+(gYaw*0.45).toFixed(2)+'deg)';
    $('#img-mono-hd').style.transform='perspective(950px) translate3d('+monoTx.toFixed(2)+'%,'+monoTy.toFixed(2)+'%,0) scale('+monoScale+') rotateX('+(+monoRx+gPitch*0.6).toFixed(2)+'deg) rotateY('+(+monoRy+gYaw*0.6).toFixed(2)+'deg) rotate('+monoRot+'deg)';
    $('#cap-mono-1').style.transform='perspective(750px) translate3d(0,'+((0.5-pMonoS)*20).toFixed(1)+'px,24px) rotateY('+((pMonoS-0.5)*5+gYaw*0.65).toFixed(2)+'deg) rotateX('+(gPitch*0.55).toFixed(2)+'deg)';
    setTypedProgress($('#cap-mono-1'),smoothstep(0.06,0.56,pMonoS));
    drawPortalParticles(monoFxCv,tTime,0.85+pMonoS*0.65,{x:0.71+monoTx*0.008,y:0.54+monoTy*0.008,r:0.15});
    const showLadderLegs=pMonoS>0.08&&pMonoS<0.96;
    if(lInset){
      lInset.classList.toggle('on',showLadderLegs);
      if(showLadderLegs)lInset.style.transform='perspective(800px) translate3d(0,0,28px) rotateX('+(gPitch*0.7).toFixed(2)+'deg) rotateY('+(-3+gYaw*0.8).toFixed(2)+'deg)';
    }
    if(showLadderLegs){
      drawLadderLegFocus(ladderLegCv,tTime,pMonoS,false);
      const lStep=Math.floor(pMonoS*14);
      if(lStep!==lastLadderStepIdx){lastLadderStepIdx=lStep;Sound.step(true)}
    }
    if(!firstRun&&pMonoT>0.16&&pMonoT<0.84&&isNearView($('.mono-wide'),-30)){
      Sound.cue(pMonoT<0.46?'monolith':'mono_legs');
    }
  }
  if(isNearView($('.portal-panel-wrap'))){
    const portScale=(1.48+pPortS*0.44).toFixed(3);
    const portRotX=((0.5-pPortS)*9.5+gPitch*0.6).toFixed(2);
    const portRotY=((pPortS-0.5)*11.0+gYaw*0.7).toFixed(2);
    const portRotZ=((pPortS-0.5)*3.4).toFixed(2);
    const portTy=((0.5-pPortS)*4.2).toFixed(2);
    const pFrame=$('.portal-frame');
    if(pFrame)pFrame.style.transform='perspective(1100px) rotateX('+(gPitch*0.42).toFixed(2)+'deg) rotateY('+(gYaw*0.45).toFixed(2)+'deg)';
    $('#portal-hd-img').style.transform='perspective(850px) translate3d(0,'+portTy+'%,0) scale('+portScale+') rotateX('+portRotX+'deg) rotateY('+portRotY+'deg) rotate('+portRotZ+'deg)';
    $('#cap-port-1').style.transform='perspective(750px) translate3d(0,'+((0.5-pPortS)*34).toFixed(1)+'px,22px) rotateY('+((0.5-pPortS)*6+gYaw*0.6).toFixed(2)+'deg) rotateX('+(gPitch*0.5).toFixed(2)+'deg)';
    $('#cap-port-2').style.transform='perspective(750px) translate3d(0,'+((pPortS-0.5)*30).toFixed(1)+'px,22px) rotateY('+((pPortS-0.5)*6+gYaw*0.6).toFixed(2)+'deg) rotateX('+(gPitch*0.5).toFixed(2)+'deg)';
    setTypedProgress($('#cap-port-1'),smoothstep(0.06,0.44,pPortS));
    setTypedProgress($('#cap-port-2'),smoothstep(0.36,0.78,pPortS));
    drawPortalParticles(portalFxCv,tTime,0.9+pPortS*0.95,{x:0.50,y:0.48,r:0.28});
    if(!firstRun&&pPortT>0.18&&pPortT<0.84&&isNearView($('.portal-panel-wrap'),-30)){
      Sound.cue(pPortT<0.52?'portal':'portal2');
    }
  }

  /* 5. Act IV: Hold & Singularity Breach Suction -> Auto-Advance to Next Slide */
  if(isNearView($('#scene-reach'))){
    if((isHoldMove()||reachDone)&&reachProgress<1){
      reachProgress=clamp(reachProgress+dt*1.25,0,1);
      Sound.portalSuck(reachProgress);
    if(reachProgress>=1){
      $('#hold-move-btn').classList.add('done');$('#lbl-move').innerHTML='ENTERED<br>✓';
      triggerImpactCut();
      Sound.chime(392,1.6,.1);Sound.boom(58,.28);Sound.whoosh();
        if(Sound.isVoice())Sound.forceCue('reach');
        reachDone=false;
        if(reachUserHold){
          reachUserHold=false;
          setTimeout(()=>{
            const next=$('#scene-step');
            if(next&&!moviePlaying)smoothScrollTo(next.getBoundingClientRect().top+window.scrollY);
          },260);
        }
      }
    }
    if(didInitDraw&&pReachT>0.28&&pReachT<0.78&&isNearView($('#scene-reach'),-40)&&!isHoldMove())Sound.cue('reach');
    $('#ring-move').style.strokeDashoffset=(345*(1-reachProgress)).toFixed(1);
    const suck=smoothstep(0.02,1.0,reachProgress);
    const reachScale=(1.08+pReachS*0.14+suck*0.20-(Math.pow(suck,2.1)*0.82)).toFixed(3);
    const reachTx=(-suck*32).toFixed(2);
    const reachRot=(-Math.pow(suck,1.6)*16).toFixed(2);
    const reachRx=((0.5-pReachS)*7.5-suck*10+gPitch*0.6).toFixed(2);
    const reachRy=((0.5-pReachS)*11.5+suck*12+gYaw*0.7).toFixed(2);
    $('#reach-hd-img').style.transform='perspective(850px) translate3d('+reachTx+'%,0,0) scale('+reachScale+') rotateX('+reachRx+'deg) rotateY('+reachRy+'deg) rotate('+reachRot+'deg)';
    $('#reach-hd-img').style.opacity=(1-smoothstep(0.76,0.98,suck)).toFixed(2);
    $('#reach-cv').style.transform='perspective(950px) rotateX('+(gPitch*0.55).toFixed(2)+'deg) rotateY('+(gYaw*0.55).toFixed(2)+'deg) scale('+(1.02+suck*0.06).toFixed(3)+')';
    $('#cap-reach').style.transform='perspective(750px) translate3d(0,'+((pReachS-0.5)*28).toFixed(1)+'px,24px) rotateY('+((pReachS-0.5)*6+gYaw*0.65).toFixed(2)+'deg) rotateX('+(gPitch*0.55).toFixed(2)+'deg)';
    setTypedProgress($('#cap-reach'),smoothstep(0.08,0.56,pReachS));
    drawReach(tTime);
    const moveBtn=$('#hold-move-btn'),handDot=$('#hand-dot'),handLine=$('#hand-line');
    if(moveBtn&&handDot&&handLine){
      moveBtn.style.marginLeft=((-suck*155).toFixed(1))+'px';
      const rScene=$('#scene-reach').getBoundingClientRect();
      const rDot=handDot.getBoundingClientRect(),rOrb=moveBtn.getBoundingClientRect();
      const x1=rDot.left+rDot.width/2-rScene.left,y1=rDot.top+rDot.height/2-rScene.top;
      const x2=rOrb.left+rOrb.width/2-rScene.left,y2=rOrb.top+rOrb.height/2-rScene.top;
      const dist=Math.hypot(x2-x1,y2-y1),ang=Math.atan2(y2-y1,x2-x1);
      handLine.style.left=x1.toFixed(1)+'px';handLine.style.top=y1.toFixed(1)+'px';
      handLine.style.width=Math.max(0,dist).toFixed(1)+'px';
      handLine.style.transform='rotate('+ang.toFixed(4)+'rad)';
    }
  }

  /* 6. Act V: Step Inside & 100-Strip 3D Firewall Curtain */
  if(isNearView($('#scene-step'))){
    const stepScale=(1.12+pStepS*0.30).toFixed(3);
    const stepRot=((pStepS-0.5)*4.8).toFixed(2);
    const stepTilt=((0.5-pStepS)*7.5+gPitch*0.6).toFixed(2);
    const stepYaw=((pStepS-0.5)*9.0+gYaw*0.7).toFixed(2);
    const stepTy=((0.5-pStepS)*4.2).toFixed(2);
    const sf=$('.step-frame');
    if(sf)sf.style.transform='perspective(1100px) rotateX('+(gPitch*0.42).toFixed(2)+'deg) rotateY('+(gYaw*0.45).toFixed(2)+'deg)';
    $('#step-hd-img').style.transform='perspective(820px) translate3d(0,'+stepTy+'%,0) scale('+stepScale+') rotateX('+stepTilt+'deg) rotateY('+stepYaw+'deg) rotate('+stepRot+'deg)';
    $('#cap-step').style.transform='perspective(750px) translateX(-50%) translate3d(0,'+((0.5-pStepS)*24).toFixed(1)+'px,24px) rotateX('+((0.5-pStepS)*5+gPitch*0.55).toFixed(2)+'deg) rotateY('+(gYaw*0.55).toFixed(2)+'deg)';
    setTypedProgress($('#cap-step'),smoothstep(0.10,0.62,pStepS));
    drawStepOverlay(tTime);
    if(!firstRun&&pStepT>0.30&&pStepT<0.74&&isNearView($('#scene-step'),-40))Sound.cue('step');
  }
  if(isNearView($('#scene-curtain'))){
    drawCurtain(tTime,pCurS);
    const curZoom=(1.12+smoothstep(0.08,0.94,pCurS)*0.24).toFixed(3);
    const curRot=((pCurS-0.45)*-3.8).toFixed(2);
    const curTilt=((pCurS-0.45)*6.8+gPitch*0.55).toFixed(2);
    const curPan=((0.5-pCurS)*8.5+gYaw*0.65).toFixed(2);
    const curTy=((pCurS-0.45)*-20).toFixed(1);
    $('#curtain-cv').style.transform='perspective(920px) translate3d(0,'+curTy+'px,0) scale('+curZoom+') rotateX('+curTilt+'deg) rotateY('+curPan+'deg) rotate('+curRot+'deg)';
    const tl=$('#temple-leg-inset'),cc=$('#cap-curtain');
    if(tl&&tl.classList.contains('on'))tl.style.transform='perspective(800px) translate3d(0,0,28px) rotateX('+(gPitch*0.65).toFixed(2)+'deg) rotateY('+(gYaw*0.75).toFixed(2)+'deg)';
    if(cc&&cc.classList.contains('on'))cc.style.transform='perspective(800px) translateX(-50%) translate3d(0,0,24px) rotateX('+(gPitch*0.55).toFixed(2)+'deg) rotateY('+(gYaw*0.6).toFixed(2)+'deg)';
    if(!firstRun&&pCurT>0.52&&pCurT<0.97){
      if(pCurT<=0.70)Sound.cue('curtain');else Sound.cue('curtain_god');
    }
  }

  /* 7. Act VI: Crimson Sanctuary 3D Multi-Angle Camera + Plain Void Entity Transformation */
  const bIdx=clamp(Math.floor(pSancS*SANCTUARY_BEATS.length),0,SANCTUARY_BEATS.length-1);
  const beat=SANCTUARY_BEATS[bIdx];
  if(isNearView($('#scene-sanctuary-story'))){
    const sancDamp=1-Math.exp(-12*dt);
    const targetShift=!beat.dossier?0:(beat.dossierSide==='left'?-1:1);
    sancShift+=((targetShift-sancShift)*sancDamp);

    const beatFloat=pSancS*SANCTUARY_BEATS.length;
    const subBeat=clamp(beatFloat-Math.floor(beatFloat),0,1);
    const nextBeat=SANCTUARY_BEATS[Math.min(bIdx+1,SANCTUARY_BEATS.length-1)];
    const easeBeat=smoothstep(0.42,1.0,subBeat);

    let aimCam={s:beat.cam.s,tx:beat.cam.tx,ty:beat.cam.ty,r:beat.cam.r,rx:beat.cam.rx||0,ry:beat.cam.ry||0,vpX:beat.cam.vpX,hor:beat.cam.hor};
    if(beat.id==='verdict'){
      const vZoom=smoothstep(0.32,0.68,subBeat);
      aimCam.s=lerp(1.44,1.94,vZoom);
      aimCam.tx=lerp(-7,24,vZoom);
      aimCam.ty=lerp(5,12,vZoom);
      aimCam.r=lerp(-1.2,0.9,vZoom);
      aimCam.rx=lerp(3.8,-2.8,vZoom);
      aimCam.ry=lerp(-5.0,4.5,vZoom);
      aimCam.vpX=lerp(0.34,0.66,vZoom);
      aimCam.hor=lerp(0.68,0.84,vZoom);
      if(subBeat>0.42&&!verdictZoomBoomed){
        verdictZoomBoomed=true;sancShake=0;
        triggerSakuga(true);triggerImpactCut();
        Sound.boom(48,.38);Sound.whoosh();
      }
      if(subBeat<0.25)verdictZoomBoomed=false;
    }else if(bIdx<SANCTUARY_BEATS.length-1){
      aimCam.s=lerp(beat.cam.s,nextBeat.cam.s,easeBeat);
      aimCam.tx=lerp(beat.cam.tx,nextBeat.cam.tx,easeBeat);
      aimCam.ty=lerp(beat.cam.ty,nextBeat.cam.ty,easeBeat);
      aimCam.r=lerp(beat.cam.r,nextBeat.cam.r,easeBeat);
      aimCam.rx=lerp(beat.cam.rx||0,nextBeat.cam.rx||0,easeBeat);
      aimCam.ry=lerp(beat.cam.ry||0,nextBeat.cam.ry||0,easeBeat);
      aimCam.vpX=lerp(beat.cam.vpX,nextBeat.cam.vpX,easeBeat);
      aimCam.hor=lerp(beat.cam.hor,nextBeat.cam.hor,easeBeat);
    }
    const hoverDriftX=Math.sin(pSancS*Math.PI*14)*0.6;
    const hoverDriftY=Math.sin(subBeat*Math.PI)*0.9;

    camCur.s=snapRun?aimCam.s:camCur.s+(aimCam.s-camCur.s)*sancDamp;
    camCur.tx=snapRun?(aimCam.tx+hoverDriftX):camCur.tx+((aimCam.tx+hoverDriftX)-camCur.tx)*sancDamp;
    camCur.ty=snapRun?(aimCam.ty+hoverDriftY):camCur.ty+((aimCam.ty+hoverDriftY)-camCur.ty)*sancDamp;
    camCur.r=snapRun?aimCam.r:camCur.r+(aimCam.r-camCur.r)*sancDamp;
    camCur.rx=snapRun?aimCam.rx:camCur.rx+(aimCam.rx-camCur.rx)*sancDamp;
    camCur.ry=snapRun?aimCam.ry:camCur.ry+(aimCam.ry-camCur.ry)*sancDamp;
    camCur.vpX=snapRun?aimCam.vpX:camCur.vpX+(aimCam.vpX-camCur.vpX)*sancDamp;
    camCur.hor=snapRun?aimCam.hor:camCur.hor+(aimCam.hor-camCur.hor)*sancDamp;
    if(snapRun)sancShift=targetShift;

    sancShake*=Math.exp(-12*dt);
    if(!(window.Nexus3D&&window.Nexus3D.ok)){
      const cRx=(camCur.rx+gPitch*0.55).toFixed(2),cRy=(camCur.ry+gYaw*0.65).toFixed(2);
      $('#sanc-cam').style.transform='perspective(1050px) translate3d('+camCur.tx.toFixed(2)+'%,'+camCur.ty.toFixed(2)+'%,0) scale('+camCur.s.toFixed(3)+') rotateX('+cRx+'deg) rotateY('+cRy+'deg) rotate('+camCur.r.toFixed(2)+'deg)';
      if($('#sanc-speaker-inset'))$('#sanc-speaker-inset').style.transform='perspective(750px) translate3d(0,0,28px) rotateY('+(-camCur.ry*0.42+gYaw*0.65).toFixed(2)+'deg) rotateX('+(camCur.rx*0.35+gPitch*0.6).toFixed(2)+'deg)';
      if($('#sanc-dossier-card')&&!$('#sanc-dossier-card').classList.contains('hidden'))$('#sanc-dossier-card').style.transform='perspective(850px) translate3d(0,0,22px) rotateY('+(camCur.ry*0.36+gYaw*0.45).toFixed(2)+'deg) rotateX('+(camCur.rx*0.24+gPitch*0.4).toFixed(2)+'deg)';
    }else{
      if($('#sanc-speaker-inset'))$('#sanc-speaker-inset').style.transform='none';
      if($('#sanc-dossier-card'))$('#sanc-dossier-card').style.transform='none';
    }
    $('#img-sanc-speaker').style.transform='scale('+(1.02+subBeat*0.08).toFixed(3)+')';

    /* Sequential Manhwa One-Speaker-At-A-Time Flow (NEVER stack two dialogue walls at once!) */
    const splitPt=beat.id==='verdict'?0.24:0.48;
    const firstWho=beat.turn1||'g';
    const activeTurn=(subBeat<splitPt)?firstWho:(firstWho==='g'?'p':'g');
    const c1=$('#sanc-cap-1'),c2=$('#sanc-cap-2'),spInset=$('#sanc-speaker-inset');
    const showGod=(activeTurn==='g');
    const showParth=(activeTurn==='p');
    const godFrac=showGod?(beat.id==='verdict'?smoothstep(0.00,0.14,subBeat):smoothstep(firstWho==='g'?0.00:0.48,firstWho==='g'?0.16:0.64,subBeat)):0;
    const parthFrac=showParth?(beat.id==='verdict'?smoothstep(0.24,0.34,subBeat):smoothstep(firstWho==='p'?0.00:0.48,firstWho==='p'?0.16:0.64,subBeat)):0;

    setTypedRaw(c1,beat.cap1,showGod?godFrac:0);
    setTypedRaw(c2,beat.cap2,showParth?parthFrac:0);
    c1.style.opacity=showGod?'1':'0';
    c1.style.transform='perspective(800px) translate3d(0,'+(showGod?'0px':'-10px')+',24px) rotateX('+(gPitch*0.45).toFixed(2)+'deg) rotateY('+(gYaw*0.55).toFixed(2)+'deg)';
    c1.style.pointerEvents=showGod?'auto':'none';
    c2.style.opacity=showParth?'1':'0';
    c2.style.transform='perspective(800px) translate3d(0,'+(showParth?'0px':'10px')+',24px) rotateX('+(gPitch*0.45).toFixed(2)+'deg) rotateY('+(gYaw*0.55).toFixed(2)+'deg)';
    c2.style.pointerEvents=showParth?'auto':'none';

    const hidePortrait=(beat.dualEyes||(beat.id==='verdict'&&subBeat>0.26));
    spInset.style.opacity=hidePortrait?'0':'1';
    if(!hidePortrait){
      const faceKey=activeTurn==='g'?(beat.godFace||beat.showFace):(beat.parthFace||beat.showFace);
      const wantSrc=getFaceCloseUrl(faceKey,false);
      if(wantSrc&&$('#img-sanc-speaker').src!==wantSrc)$('#img-sanc-speaker').src=wantSrc;
      const wantTag=activeTurn==='g'?'THE DIVINE':'PARTH';
      if($('#sanc-speaker-tag').textContent!==wantTag)$('#sanc-speaker-tag').textContent=wantTag;
    }

    const verdictTr=beat.id==='verdict'?smoothstep(0.04,0.32,subBeat):0;
    $('#sanc-sticky').style.background=verdictTr>0.3?'#000000':'';
    $('#hall-cv').style.filter=verdictTr>0.5?'none':'blur(0.9px) saturate(1.08)';
    drawHallBg(tTime,beat.wind,pSancS,camCur.vpX+ptr3dX*0.035,camCur.hor+ptr3dY*0.025,verdictTr);
    drawSanctuaryActors(tTime,beat,sancShift,scrollVelS,camCur.vpX+ptr3dX*0.045,camCur.hor+ptr3dY*0.025,subBeat,{...camCur,rx:camCur.rx+gPitch*0.55,ry:camCur.ry+gYaw*0.65},verdictTr);

    /* Turn-Locked Sanctuary Voice Cue: God & Parth Speak Immediately When Their Bubble Appears! */
    if(!firstRun&&pSancT>0.004&&pSancT<0.996&&isNearView($('#scene-sanctuary-story'),-20)){
      const turnKey='beat_'+beat.id+'_'+activeTurn;
      const turnLines=(beat.jpLines||[]).filter(l=>(l.who==='pw'?'p':l.who)===activeTurn);
      Sound.cue(turnKey,turnLines.length?turnLines:beat.jpLines,true);
    }
  }

  if(bIdx!==lastBeatIdx){
    lastBeatIdx=bIdx;
    $('#sanc-dual-eyes').classList.toggle('on',!!beat.dualEyes);
    renderSanctuaryDossier(beat);
    $$('.rail-pip').forEach(p=>p.classList.toggle('on',+p.dataset.beat===bIdx));
    if(!firstRun&&pSancT>0.01&&pSancT<0.99){
      Sound.chime(360+bIdx*42,1.1,.06);
      Sound.whoosh();
      if((beat.cam.shake||0)>0.72){Sound.boom(52,.28);triggerSakuga(false)}
    }
  }

  /* 8. Medallions, Liquid Mercury Pour, Dark Awakening & Shatter Continuous 3D Choreography */
  if(isNearView($('#scene-medallions'))){
    $$('#scene-medallions .medallion').forEach((m,idx)=>{
      const dy=((0.5-pMedS)*(22+idx*12)).toFixed(1);
      const ry=((pMedS-0.5)*(14-idx*6)+gYaw*1.15).toFixed(2);
      const rx=((0.5-pMedS)*10+gPitch*1.05).toFixed(2);
      const sc=(0.95+smoothstep(0.08,0.60,pMedS)*0.08).toFixed(3);
      m.style.transform='perspective(750px) translate3d(0,'+dy+'px,24px) rotateX('+rx+'deg) rotateY('+ry+'deg) scale('+sc+')';
    });
    const shelf=$('.shelf-stage');
    if(shelf)shelf.style.transform='perspective(950px) translateY('+((0.5-pMedS)*26).toFixed(1)+'px) rotateX('+((0.5-pMedS)*8+gPitch*0.65).toFixed(2)+'deg) rotateY('+(gYaw*0.65).toFixed(2)+'deg)';
    if(didInitDraw&&pMedT>0.32&&pMedT<0.75&&isNearView($('#scene-medallions'),-40))Sound.cue('medallions');
  }

  if(isNearView($('#scene-pour'))){
    if((isHoldPour()||pourDone)&&pourProgress<1){
      pourProgress=clamp(pourProgress+dt*1.25,0,1);
      Sound.mercuryFlow(pourProgress);
      if(pourProgress>=1){
        $('#hold-pour-btn').classList.add('done');$('#lbl-pour').innerHTML='INFUSED<br>✓';
        Sound.chime(659.25,1.8,.1);Sound.boom(64,.22);
        if(Sound.isVoice())Sound.forceCue('pour');
        pourDone=false;
        if(pourUserHold){
          pourUserHold=false;
          setTimeout(()=>{
            const next=$('#scene-vortex');
            if(next&&!moviePlaying)smoothScrollTo(next.getBoundingClientRect().top+window.scrollY);
          },280);
        }
      }
    }
    const pRx=((0.5-pPourS)*8.5+gPitch*0.7).toFixed(2),pRy=((pPourS-0.5)*9.5+gYaw*0.8).toFixed(2);
    $('#ring-pour').style.strokeDashoffset=(345*(1-pourProgress)).toFixed(1);
    $('#pour-cv').style.transform='perspective(980px) scale('+(1.04+pourProgress*0.08).toFixed(3)+') rotateX('+pRx+'deg) rotateY('+pRy+'deg)';
    $('#cap-pour').style.transform='perspective(800px) translate3d(0,'+((pPourS-0.5)*26).toFixed(1)+'px,26px) rotateX('+(gPitch*0.6).toFixed(2)+'deg) rotateY('+(gYaw*0.65).toFixed(2)+'deg)';
    setTypedProgress($('#cap-pour'),smoothstep(0.08,0.58,pPourS));
    drawPour(tTime,pPourS);
    if(didInitDraw&&pPourT>0.32&&pPourT<0.74&&isNearView($('#scene-pour'),-40))Sound.cue('pour');
  }

  if(isNearView($('#scene-vortex'))){
    if((isHoldVortex()||vortexDone)&&vortexProgress<1){
      vortexProgress=clamp(vortexProgress+dt*1.25,0,1);
      Sound.swell(vortexProgress);
      if(vortexProgress>=1){
        $('#hold-vortex-btn').classList.add('done');$('#lbl-vortex').innerHTML='AWAKENED<br>✦';
        Sound.chime(784,2,.12);Sound.boom(50,.34);
        if(Sound.isVoice())Sound.forceCue('vortex');
        vortexDone=false;
        if(vortexUserHold){
          vortexUserHold=false;
          setTimeout(()=>{
            const next=$('#scene-shatter');
            if(next&&!moviePlaying)smoothScrollTo(next.getBoundingClientRect().top+window.scrollY);
          },320);
        }
      }
    }
    const vLift=Math.max(pVorS,vortexProgress);
    const vRx=((0.5-vLift)*7.5+gPitch*0.7).toFixed(2),vRy=((vLift-0.5)*9.0+gYaw*0.8).toFixed(2);
    $('#ring-vortex').style.strokeDashoffset=(345*(1-vortexProgress)).toFixed(1);
    $('#vortex-cv').style.transform='perspective(1050px) scale('+(1.04+vLift*0.10).toFixed(3)+') rotateX('+vRx+'deg) rotateY('+vRy+'deg)';
    $('#vortex-actor-cv').style.transform='perspective(1050px) scale('+(1.02+vLift*0.12).toFixed(3)+') rotateX('+((0.5-vLift)*5+gPitch*0.55).toFixed(2)+'deg) rotateY('+(gYaw*0.75).toFixed(2)+'deg)';
    $('#cap-vortex').style.transform='perspective(800px) translate3d(0,'+((0.5-pVorS)*32).toFixed(1)+'px,26px) rotateX('+(gPitch*0.6).toFixed(2)+'deg) rotateY('+(gYaw*0.65).toFixed(2)+'deg)';
    setTypedProgress($('#cap-vortex'),smoothstep(0.08,0.56,pVorS));
    drawVortex(tTime,pVorS);
    if(didInitDraw&&pVorT>0.32&&pVorT<0.74&&isNearView($('#scene-vortex'),-40))Sound.cue('vortex');
  }

  if(isNearView($('#scene-shatter'))){
    drawShatter(tTime,pShatterS);
    const shPan=$('.shatter-panel'),shBot=$('.shatter-bottom-panel');
    if(shPan)shPan.style.transform='perspective(1100px) rotateX('+(gPitch*0.42).toFixed(2)+'deg) rotateY('+(gYaw*0.45).toFixed(2)+'deg)';
    if(shBot)shBot.style.transform='perspective(1100px) rotateX('+(gPitch*0.35).toFixed(2)+'deg) rotateY('+(gYaw*0.38).toFixed(2)+'deg)';
    $('#shatter-cv').style.transform='perspective(980px) rotateX('+(gPitch*0.55).toFixed(2)+'deg) rotateY('+(gYaw*0.55).toFixed(2)+'deg)';
    setTypedProgress($('#cap-shatter'),smoothstep(0.10,0.58,pShatterS));
    if(!firstRun&&pShatterT>0.36&&pShatterT<0.68&&isNearView($('#scene-shatter'),-40)){
      if(Sound._shatDone!==true){Sound._shatDone=true;Sound.shatterFx()}
      Sound.cue('shatter');
    }else if(pShatterT<0.2){Sound._shatDone=false}
  }

  /* Collection Live Backdrop FX, Full 3D Parallax & Scroll Reveal */
  if(isNearView($('#collection'))){
    drawCollectionFx(tTime);
    const pAbout=viewProgress($('#sec-about'));
    const pp=$('.portrait-plate');
    if(pp)pp.style.transform='perspective(850px) translateY('+((0.5-pAbout)*28).toFixed(1)+'px) rotateX('+(gPitch*0.65).toFixed(2)+'deg) rotateY('+(gYaw*0.75).toFixed(2)+'deg)';
    const pTaste=viewProgress($('#sec-taste'));
    const tb=$('.taste-bounds');
    if(tb)tb.style.transform='perspective(950px) rotateX('+((0.5-pTaste)*4.2+gPitch*0.45).toFixed(2)+'deg) rotateY('+(gYaw*0.42).toFixed(2)+'deg) translateY('+((0.5-pTaste)*16).toFixed(1)+'px)';
    const evD=$('.ev-dossier');
    if(evD)evD.style.transform='perspective(950px) rotateX('+(gPitch*0.35).toFixed(2)+'deg) rotateY('+(gYaw*0.38).toFixed(2)+'deg)';
    const cp=$('#contact-parth');
    if(cp)cp.style.transform='perspective(850px) rotateX('+(gPitch*0.6).toFixed(2)+'deg) rotateY('+(gYaw*0.7).toFixed(2)+'deg)';
    revealEls.forEach(el=>{
      if(!el.classList.contains('vis')){
        const r=el.getBoundingClientRect();
        if(r.top<=innerHeight+90)el.classList.add('vis');
      }
    });
  }
  didInitDraw=true;

  /* 9. Top Header & Equalizer Dynamic Contrast (checked strictly so curtain never bleeds into Sanctuary Beat 0!) */
  const themeAtY=y=>{
    const hit=id=>{const r=$(id).getBoundingClientRect();return y>r.top&&y<r.bottom};
    if(hit('#scene-reach')||hit('#scene-sanctuary-story')||hit('#scene-pour'))return 'red';
    if(hit('#scene-curtain'))return 'curtain';
    if((hit('#hero')&&pHeroS<0.58)||hit('#scene-medallions')||hit('#scene-vortex'))return 'dark';
    return 'light';
  };
  const bTheme=themeAtY(34),eTheme=themeAtY(innerHeight-34);
  if(bTheme!==lastTheme){
    lastTheme=bTheme;
    $('#brand-mark').className=bTheme==='dark'?'on-dark':bTheme==='red'?'on-red':bTheme==='curtain'?'on-curtain':'';
  }
  const eqLive=$('#eq-btn').classList.contains('live')?'live ':'';
  $('#eq-btn').className=eqLive+(eTheme==='curtain'?'on-curtain':'');
  const colRect=$('#collection').getBoundingClientRect();
  const inCol=colRect.top<220;
  $('#nav-exp').classList.toggle('active',!inCol);
  $('#nav-col').classList.toggle('active',inCol);
  if(!firstRun&&inCol)Sound.cue('collection');

  if(didInitDraw&&(!REF_PORTRAITS.parth||!REF_PORTRAITS.god))initRefPortraits();
  requestAnimationFrame(tick);
}
initTypewriters();
requestAnimationFrame(tick);

/* ==================== SANCTUARY RAIL JUMP, MEDALLION JUMP & VOICE ==================== */
function jumpToSanctuaryBeat(idx){
  const sec=$('#scene-sanctuary-story');
  const top=sec.offsetTop+Math.max(0,(sec.offsetHeight-innerHeight)*((idx+0.35)/SANCTUARY_BEATS.length));
  smoothScrollTo(top);
}
$$('.rail-pip').forEach(p=>p.onclick=()=>jumpToSanctuaryBeat(+p.dataset.beat));
$$('[data-jump-beat]').forEach(m=>m.onclick=()=>jumpToSanctuaryBeat(+m.dataset.jumpBeat));

$('#sanc-voice-pill').onclick=()=>Sound.toggleVoice();

/* ==================== DOSSIER / CHAPTER JUMP MODAL ==================== */
const openDossier=()=>$('#dossier-modal').classList.add('on');
const closeDossier=()=>$('#dossier-modal').classList.remove('on');
$('#nav-dos').onclick=openDossier;
$('#open-sheets-btn').onclick=openDossier;
$('#close-dossier').onclick=closeDossier;
$('#dossier-modal').onclick=e=>{if(e.target===$('#dossier-modal'))closeDossier()};
addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#dossier-modal').classList.contains('on'))closeDossier()});
$$('[data-jump]').forEach(b=>b.onclick=()=>{
  const target=$(b.dataset.jump);
  closeDossier();
  if(target)smoothScrollTo(target.getBoundingClientRect().top+window.scrollY);
});

/* ==================== THE COLLECTION: CASE FILES & SKILL CONSTELLATION ==================== */
const EVIDENCE=[{"id":"garaa","num":"CASE 01","title":"Garaa","sub":"Identity & document verification","dims":["defender","thinker","engineer","creator"],"problem":"Manual KYC and identity checks break down when documents suffer blur, glare, tampered text, or mismatched faces.","idea":"Unify OCR extraction, QR decoding, face detection, and image-quality verification into a single deterministic verdict.","role":"Built and shipped with Team Garaa — 1st Runner-up at Baloon National Hackathon 2026.","impl":"Browser-native verification pipeline combining OCR, QR parsing, face landmark checks, and document quality scoring.","tags":["React","Tesseract.js","jsQR","face-api.js"],"link":"https://gaara-1.github.io/ZyID/","linkTxt":"OPEN LIVE PROTOTYPE ↗"},{"id":"devharbour","num":"CASE 02","title":"DevHarbour","sub":"Developer learning & building platform","dims":["creator","engineer"],"problem":"Student developers often lack structured builder ecosystems that bridge early learning into shipped hackathon projects.","idea":"Build a community platform where learners build real projects, grow technical skills, and ship through hackathons.","role":"Co-Founder since October 2025 — product development, platform strategy, community growth, and hackathon organization.","impl":"End-to-end platform strategy and community programming serving 4,000+ users.","tags":["Product","Strategy","Community","4,000+ Users"],"link":"https://devharbour.in","linkTxt":"VISIT DEVHARBOUR.IN ↗"},{"id":"zyr","num":"CASE 03","title":"Zyr Resume Studio","sub":"AI-assisted resume builder","dims":["thinker","engineer","creator"],"problem":"Resumes often suffer from clunky formatting workflows and inconsistent bullet refinement.","idea":"Pair instant live layout formatting with AI-assisted content refinement in a fast studio UI.","role":"Designed and engineered the studio interface and interactive generation workflow.","impl":"Fast frontend workspace combining live preview formatting with guided AI editing.","tags":["React","Vite","AI assistance"]},{"id":"laser","num":"CASE 04","title":"Laser Distance System","sub":"Optical ranging for security","dims":["defender","engineer"],"problem":"Perimeter security prototypes require low-latency distance thresholding without bulky sensor arrays.","idea":"Use optical laser ranging to measure live target distance and trigger security alerts.","role":"Built the measurement workflow and explored practical security monitoring triggers.","impl":"Optical distance calculation loop coupled with threshold trigger verification.","tags":["Laser ranging","Hardware sensing","Security"]},{"id":"weather","num":"CASE 05","title":"IoT Weather Detection","sub":"Arduino environmental monitor","dims":["engineer"],"problem":"Localized environmental monitoring needs low-cost telemetry directly from physical sensor modules.","idea":"Acquire real-time ambient temperature and humidity readings on an Arduino microcontroller.","role":"Built hardware connections and live monitoring firmware.","impl":"Arduino sensor wiring and real-time telemetry readout code.","tags":["Arduino","Temp/humidity sensors","IoT"]}];

let activeProj='garaa',activeLens='all';
function drawEvidence(){
  const tabs=$('#ev-tabs'),dos=$('#ev-dossier');
  const btns=[...tabs.querySelectorAll('[data-ev]')];
  btns.forEach((b,ti)=>{
    const pid=b.dataset.ev,p=EVIDENCE.find(x=>x.id===pid);if(!p)return;
    const m=activeLens==='all'||p.dims.includes(activeLens),a=pid===activeProj;
    b.classList.toggle('active',a);
    b.classList.toggle('muted',!m);
    b.setAttribute('aria-selected',a?'true':'false');
    b.setAttribute('tabindex',a?'0':'-1');
    const lbl=b.querySelector('.f-lbl');
    if(lbl)lbl.style.color=a?'#FF8A80':'';
  });
  dos.querySelectorAll('.ev-panel').forEach(p=>{
    const a=p.id==='ev-panel-'+activeProj;
    p.hidden=!a;
  });
  const idx=Math.max(0,EVIDENCE.findIndex(x=>x.id===activeProj));
  $('#prod-counter').textContent='0'+(idx+1)+' / 0'+EVIDENCE.length;
}
(()=>{
  const btns=[...$('#ev-tabs').querySelectorAll('[data-ev]')];
  btns.forEach((b,ti)=>{
    b.onclick=()=>{activeProj=b.dataset.ev;drawEvidence()};
    b.onkeydown=e=>{
      if(!['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'].includes(e.key))return;
      e.preventDefault();
      const nextIdx=e.key==='Home'?0:e.key==='End'?EVIDENCE.length-1:(ti+(e.key==='ArrowDown'||e.key==='ArrowRight'?1:-1)+EVIDENCE.length)%EVIDENCE.length;
      activeProj=EVIDENCE[nextIdx].id;drawEvidence();$('#ev-tab-'+activeProj)?.focus();
    };
  });
})();
$('#prod-prev').onclick=()=>{const i=EVIDENCE.findIndex(x=>x.id===activeProj);activeProj=EVIDENCE[(i-1+EVIDENCE.length)%EVIDENCE.length].id;drawEvidence()};
$('#prod-next').onclick=()=>{const i=EVIDENCE.findIndex(x=>x.id===activeProj);activeProj=EVIDENCE[(i+1)%EVIDENCE.length].id;drawEvidence()};
$$('[data-lens]').forEach(b=>b.onclick=()=>{
  activeLens=b.dataset.lens;
  $$('[data-lens]').forEach(x=>x.classList.toggle('on',x.dataset.lens===activeLens));
  $$('.retail-item[data-dims]').forEach(el=>el.classList.toggle('muted',activeLens!=='all'&&!(el.dataset.dims||'').split(',').includes(activeLens)));
  drawEvidence();
});
drawEvidence();

const SCATS=[{"id":"cyber","label":"CYBERSECURITY","x":175,"y":122},{"id":"prog","label":"PROGRAMMING","x":490,"y":122},{"id":"ai","label":"AI & GENAI","x":340,"y":205},{"id":"prod","label":"PRODUCT DEV","x":185,"y":284},{"id":"lead","label":"LEADERSHIP","x":495,"y":284}];
const SNODES=[{"id":"netsec","cat":"cyber","label":"Network Security","x":95,"y":58,"desc":"Network security monitoring, threat research, and incident response planning.","applied":["Tripple One Solutions Internship (Sept–Nov 2026)","NPTEL Cyber Security and Privacy (Elite, 75%)","Mastercard Cybersecurity Job Simulation (Forage)"]},{"id":"linux","cat":"cyber","label":"Linux & Ethical Hacking","x":95,"y":192,"desc":"Unix/Linux OS fundamentals and security assessments.","applied":["Infosys Springboard Unix / Linux OS Fundamentals","VaultofCodes Ethical Hacking & Cybersecurity Assessment"]},{"id":"python","cat":"prog","label":"Python Security","x":585,"y":58,"desc":"Applied Python for security analysis and AI workflows.","applied":["Tripple One Solutions Python security analysis","House of Edtech 30 Days of Python Using AI"]},{"id":"react","cat":"prog","label":"React / Vite / Web","x":585,"y":192,"desc":"Frontend engineering for verification flows and developer ecosystems.","applied":["Garaa identity prototype (React)","Zyr Resume Studio (React + Vite)","DevHarbour platform engineering"]},{"id":"arduino","cat":"prog","label":"Arduino & IoT","x":340,"y":52,"desc":"Embedded sensor acquisition and optical ranging.","applied":["IoT Weather Detection System (Arduino)","Laser Distance Measurement System"]},{"id":"genai","cat":"ai","label":"Generative AI & OCR","x":340,"y":314,"desc":"OCR extraction, QR decoding, face detection, and Generative AI.","applied":["Garaa (Tesseract.js, jsQR, face-api.js)","Zyr Resume Studio","Microsoft & LinkedIn Generative AI Essentials"]},{"id":"proddev","cat":"prod","label":"Product Strategy","x":105,"y":340,"desc":"Product development and competitive hackathon execution.","applied":["Co-Founder, DevHarbour (4,000+ users)","1st Runner-up, Baloon National Hackathon 2026"]},{"id":"community","cat":"lead","label":"Community & Events","x":575,"y":340,"desc":"Community growth, hackathons, and campus leadership.","applied":["DevHarbour hackathon organization","Techfest IIT Bombay College Ambassador (Rank 88)","Goibibo Campus Marketing Intern"]}];
let curSkill='netsec';
function drawSkills(){
  const svg=$('#skill-svg'),cats=$('#skill-cats'),info=$('#skill-info');
  const s=SNODES.find(x=>x.id===curSkill)||SNODES[0];
  const edges=[...SNODES.map(k=>{const cat=SCATS.find(z=>z.id===k.cat);return{a:k.id,b:cat.id,x1:k.x,y1:k.y,x2:cat.x,y2:cat.y}}),{a:'netsec',b:'python',x1:95,y1:58,x2:585,y2:58},{a:'genai',b:'react',x1:340,y1:314,x2:585,y2:192},{a:'proddev',b:'community',x1:105,y1:340,x2:575,y2:340}];
  const orbitRing=`<g style="transform-origin:340px 190px;animation:orbSpin 42s linear infinite"><circle cx="340" cy="190" r="142" fill="none" stroke="rgba(255,255,255,0.09)" stroke-dasharray="6 10" stroke-width="1.2" /><circle cx="340" cy="190" r="218" fill="none" stroke="rgba(229,57,53,0.16)" stroke-dasharray="3 14" stroke-width="1.2" /></g>`;
  svg.innerHTML=orbitRing+edges.map(e=>{const hi=e.a===s.id||e.b===s.id||e.b===s.cat;return `<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" stroke="${hi?'#E53935':'rgba(255,255,255,0.20)'}" stroke-width="${hi?2.4:1}" stroke-dasharray="${hi?'0':'4 4'}" />`;
  }).join('')+
    SCATS.map(cat=>{const hi=cat.id===s.cat;return `<g data-sc="${cat.id}" style="cursor:pointer"><rect x="${cat.x-50}" y="${cat.y-17}" width="100" height="34" fill="${hi?'#FFFFFF':'#252528'}" stroke="${hi?'#E53935':'rgba(255,255,255,0.45)'}" stroke-width="1.5" /><text x="${cat.x}" y="${cat.y+3.5}" text-anchor="middle" fill="${hi?'#141414':'#F2F1EC'}" font-size="8.5" font-weight="700" font-family="JetBrains Mono,monospace">${cat.label}</text></g>`;
  }).join('')+
    SNODES.map(k=>{const hi=k.id===s.id;const pulse=hi?`<circle cx="${k.x}" cy="${k.y}" r="16" fill="none" stroke="#FF5252" stroke-width="1.8" style="animation:nodePulse 2s ease-in-out infinite" />`:'';return `<g data-sn="${k.id}" style="cursor:pointer">${pulse}<circle cx="${k.x}" cy="${k.y}" r="${hi?10.5:7.5}" fill="${hi?'#E53935':'#1B1B1B'}" stroke="#FFFFFF" stroke-width="1.8" /><text x="${k.x}" y="${k.y-15}" text-anchor="middle" fill="${hi?'#FFFFFF':'#C8C6BE'}" font-size="10.5" font-weight="${hi?700:500}" font-family="Inter,sans-serif">${k.label}</text></g>`;
  }).join('');
  cats.querySelectorAll('[data-scp]').forEach(b=>b.classList.toggle('on',b.dataset.scp===s.cat));
  info.querySelectorAll('.skill-panel').forEach(p=>{p.hidden=p.dataset.skillPanel!==s.id});
  svg.querySelectorAll('[data-sn]').forEach(n=>n.onclick=()=>{curSkill=n.dataset.sn;drawSkills()});
  svg.querySelectorAll('[data-sc]').forEach(n=>n.onclick=()=>{const f=SNODES.find(x=>x.cat===n.dataset.sc);if(f){curSkill=f.id;drawSkills()}});
}
$('#skill-cats').querySelectorAll('[data-scp]').forEach(b=>b.onclick=()=>{const f=SNODES.find(x=>x.cat===b.dataset.scp);if(f){curSkill=f.id;drawSkills()}});
drawSkills();
['#print-resume-btn','#print-resume-btn-2'].forEach(sel=>{const b=$(sel);if(b)b.onclick=()=>window.print()});

$('#copy-mail').onclick=function(){
  const b=this,done=()=>{b.textContent='COPIED ✓';setTimeout(()=>b.textContent='COPY',1800)};
  if(navigator.clipboard)navigator.clipboard.writeText('parthvgidde@gmail.com').then(done).catch(done);else done();
};
$('#draft-mail-form').onsubmit=e=>{
  e.preventDefault();
  location.href='mailto:parthvgidde@gmail.com?subject='+encodeURIComponent($('#mail-subj').value||'Hello Parth')+'&body='+encodeURIComponent($('#mail-body').value||'Hi Parth,\n\n');
};
$('#replay-btn').onclick=()=>{
  reachProgress=0;reachDone=false;reachUserHold=false;$('#hold-move-btn').classList.remove('done');$('#lbl-move').innerHTML='HOLD &amp;<br>ENTER';
  $('#reach-hd-img').style.opacity='1';
  pourProgress=0;pourDone=false;pourUserHold=false;$('#hold-pour-btn').classList.remove('done');$('#lbl-pour').innerHTML='HOLD &amp;<br>POUR';
  vortexProgress=0;vortexDone=false;vortexUserHold=false;$('#hold-vortex-btn').classList.remove('done');$('#lbl-vortex').innerHTML='HOLD';
  Sound.resetCues();
  smoothScrollTo(0);
};
