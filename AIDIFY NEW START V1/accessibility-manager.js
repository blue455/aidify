(function(global){
  'use strict';

  var LS = {
    fontSize: 'fontSize',
    highContrast: 'highContrast',
    darkMode: 'darkMode',
    dyslexiaFont: 'dyslexiaFont',
    linkHighlight: 'linkHighlight',
    largeCursors: 'largeCursors',
    reduceMotion: 'reduceMotion',
    gridColumns: 'gridColumns',
    ttsScope: 'ttsScope',
    ttsAutoRead: 'ttsAutoRead'
  };

  function read(key, def){ try{ var v = localStorage.getItem(key); return v===null? def : v; }catch(e){ return def; } }
  function readBool(key){ return read(key,'false') === 'true'; }
  function write(key, val){ try{ localStorage.setItem(key, val); }catch(e){} }

  function mapFont(size){
    switch(size){
      case 'sm': return '14px';
      case 'base': return '16px';
      case 'lg': return '18px';
      case 'xl': return '20px';
      default: return /^[0-9.]+px$/.test(size||'') ? size : '16px';
    }
  }

  function applyAccessibility(){
    try{
      var root = document.documentElement; var body = document.body || root;
      // Font size
      var fsz = read(LS.fontSize, 'base');
      root.style.fontSize = mapFont(fsz);

      // Class toggles
      toggleClass(body, 'high-contrast', readBool(LS.highContrast));
      toggleClass(body, 'dark-mode', readBool(LS.darkMode));
      toggleClass(body, 'dyslexia-mode', readBool(LS.dyslexiaFont));
      toggleClass(body, 'link-highlight', readBool(LS.linkHighlight));
      toggleClass(body, 'large-cursors', readBool(LS.largeCursors));
      toggleClass(body, 'reduce-motion', readBool(LS.reduceMotion));

      // Grid columns variable (used by some product/home grids)
      var cols = read(LS.gridColumns, 'auto');
      if (cols && cols !== 'auto'){
        root.style.setProperty('--grid-columns', cols);
        // Also set a generic CSS var that custom scripts may use
        root.style.setProperty('--grid-template-columns', 'repeat(' + cols + ', minmax(var(--card-min,220px), 1fr))');
      }

      // Auto-read on load (only if explicitly enabled and speechSynthesis exists)
      var auto = readBool(LS.ttsAutoRead);
      if (auto && 'speechSynthesis' in window){
        setTimeout(function(){ ttsSpeakFromScope(); }, 300);
      }
    }catch(e){ /* no-op */ }
  }

  function toggleClass(el, cls, on){ if(!el) return; if(on) el.classList.add(cls); else el.classList.remove(cls); }

  // TTS helpers reused across pages
  function getTTSTextByScope(scope){
    try{
      if(scope==='selection'){
        var sel = window.getSelection().toString();
        return sel && sel.trim().length ? sel.trim() : '';
      }
      if(scope==='page'){
        return document.body ? document.body.innerText : '';
      }
      var container = document.querySelector('main') || document.body; return container ? container.innerText : '';
    }catch(e){ return ''; }
  }
  function ttsSpeakFromScope(){
    if (!('speechSynthesis' in window)) return;
    var synth = window.speechSynthesis;
    var scope = read(LS.ttsScope, 'main');
    var text = getTTSTextByScope(scope);
    if (!text || !text.trim()) return;
    try{ synth.cancel(); var u = new SpeechSynthesisUtterance(text); synth.speak(u); }catch(e){}
  }
  function ttsPauseResume(){ var s = window.speechSynthesis; if(!s) return; if(s.paused) s.resume(); else if(s.speaking) s.pause(); }
  function ttsStop(){ var s = window.speechSynthesis; if(!s) return; s.cancel(); }

  function updateSetting(key, value){
    switch(key){
      case 'fontSize': write(LS.fontSize, value); break;
      case 'highContrast': write(LS.highContrast, String(!!value)); break;
      case 'darkMode': write(LS.darkMode, String(!!value)); break;
      case 'dyslexiaFont': write(LS.dyslexiaFont, String(!!value)); break;
      case 'linkHighlight': write(LS.linkHighlight, String(!!value)); break;
      case 'largeCursors': write(LS.largeCursors, String(!!value)); break;
      case 'reduceMotion': write(LS.reduceMotion, String(!!value)); break;
      case 'gridColumns': write(LS.gridColumns, value); break;
      case 'ttsScope': write(LS.ttsScope, value); break;
      case 'ttsAutoRead': write(LS.ttsAutoRead, String(!!value)); break;
      default: return;
    }
    applyAccessibility();
  }

  function getSettings(){
    return {
      fontSize: read(LS.fontSize, 'base'),
      highContrast: readBool(LS.highContrast),
      darkMode: readBool(LS.darkMode),
      dyslexiaFont: readBool(LS.dyslexiaFont),
      linkHighlight: readBool(LS.linkHighlight),
      largeCursors: readBool(LS.largeCursors),
      reduceMotion: readBool(LS.reduceMotion),
      gridColumns: read(LS.gridColumns, 'auto'),
      ttsScope: read(LS.ttsScope, 'main'),
      ttsAutoRead: readBool(LS.ttsAutoRead)
    };
  }

  function injectFooterStyles(){
    try{
      if (document.getElementById('aidify-footer-readable')) return;
      var s = document.createElement('style');
      s.id = 'aidify-footer-readable';
      s.textContent = [
        '.site-footer{background:var(--surface);color:var(--text);font-size:15px;line-height:1.6}',
        '.site-footer a{color:var(--text);text-decoration:none}',
        '.site-footer a:hover{ text-decoration: underline }',
        '.site-footer h4{margin:0;color:var(--text);font-size:16px}',
        '.site-footer .muted{color:var(--muted)}',
        '.site-footer [aria-disabled="true"]{opacity:.6;pointer-events:none}',
        '.site-footer .footer-inner,.site-footer .bottom-row{max-width:1180px;margin:0 auto}'
      ].join('\n');
      document.head.appendChild(s);
    }catch(e){}
  }

  // Public API
  global.AIDIFY_ACCESSIBILITY = {
    applyAccessibility: applyAccessibility,
    updateSetting: updateSetting,
    getSettings: getSettings,
    tts: {
      speak: ttsSpeakFromScope,
      pauseResume: ttsPauseResume,
      stop: ttsStop
    }
  };

  // Auto-apply on load
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ injectFooterStyles(); applyAccessibility(); });
  } else {
    injectFooterStyles();
    applyAccessibility();
  }

})(window);
