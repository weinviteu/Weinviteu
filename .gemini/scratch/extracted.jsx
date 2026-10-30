
<div className="ctrl"><button id="replay" type="button">Replay</button><button id="lang" type="button">हिंदी</button><button id="snd" type="button" ariaPressed="true">Sound on</button></div>

<section id="s1" className="scene" role="button" tabIndex="0" ariaLabel="Wedding invitation. Unlock the doors with the golden key">
  <div className="tilt" id="tilt1">
    <div className="world" id="w1">
      <div className="bgblur" style={{"backgroundImage":"url(/invitation-assets/asset_0.jpg)"}}></div>
      <div className="stage" id="st1" style={{"width":"735px","height":"983px"}}>
        <div className="interior">
          <div className="ibg" id="ibg" style={{"backgroundImage":"url(/invitation-assets/asset_1.jpg)"}}></div>
          <div className="iimg" id="iimg"><img dataCopy="#p2base" alt="" /><img dataCopy="#p2over" alt="" /></div>
          <div className="light" id="ilight"></div>
        </div>
        <div className="doors3d">
          <div className="leaf L" id="leafL"><img src="/invitation-assets/asset_2.webp" alt="" /><div className="shade"></div><div className="spill"></div><div className="sheen"></div><div className="edge"></div></div>
          <div className="leaf R" id="leafR"><img src="/invitation-assets/asset_3.webp" alt="" /><div className="shade"></div><div className="spill"></div><div className="sheen"></div><div className="edge"></div></div>
        </div>
        <img className="frame" src="/invitation-assets/asset_4.webp" alt="A carved golden door set in a turquoise tiled arch, framed by bougainvillea" />
        <svg className="lockplate" id="plate" viewBox="0 0 53 100" ariaHidden="true"><defs><linearGradient id="gP" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6e2a4"/><stop offset=".45" stopColor="#c49a4c"/><stop offset=".7" stopColor="#8e6526"/><stop offset="1" stopColor="#e7c77e"/></linearGradient></defs>
          <path d="M26.5 1 C33 10 50 14 50 30 L50 70 C50 86 33 90 26.5 99 C20 90 3 86 3 70 L3 30 C3 14 20 10 26.5 1 Z" fill="url(#gP)" stroke="#7a5420" strokeWidth="1.2"/>
          <path d="M26.5 8 C31 15 44 18 44 31 L44 69 C44 82 31 85 26.5 92 C22 85 9 82 9 69 L9 31 C9 18 22 15 26.5 8 Z" fill="none" stroke="#fff0c2" strokeWidth=".8" opacity=".7"/>
          <circle cx="26.5" cy="42" r="6.2" fill="#1d0f05"/><path d="M23 44 L21.5 60 L31.5 60 L30 44 Z" fill="#1d0f05"/>
          <circle cx="26.5" cy="20" r="2" fill="#fff0c2" opacity=".8"/><circle cx="26.5" cy="80" r="2" fill="#fff0c2" opacity=".8"/></svg>
        <div className="seam" id="seam"></div>
        <div className="rays" id="rays"></div>
      </div>
    </div>
  </div>
  <div className="vignette"></div>
  <div className="scrim"></div>
  <canvas className="fx" id="fx1"></canvas>
  <div className="welcome" id="welcome">
    <div className="om">॥ श्री गणेशाय नमः ॥</div>
    <div className="wt">Wedding Invitation</div>
    <svg className="ws2" viewBox="0 0 120 12" ariaHidden="true"><path d="M2 6 H48 M72 6 H118" stroke="#f3d58c" strokeWidth="1"/><path d="M60 1 L65 6 L60 11 L55 6 Z" fill="#f3d58c"/></svg>
    <div className="ws">A warm welcome awaits you inside</div>
  </div>
  <div id="key" role="button" tabIndex="0" ariaLabel="Golden key. Drag it to the lock, or press Enter to unlock the doors">
    <div className="halo"></div>
    <div className="kin"><svg viewBox="0 0 60 176" ariaHidden="true"><defs>
      <linearGradient id="gK" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8a6124"/><stop offset=".35" stopColor="#f7e3a6"/><stop offset=".55" stopColor="#d4a955"/><stop offset="1" stopColor="#7d5620"/></linearGradient>
      <radialGradient id="gKb" cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#fff2c8"/><stop offset=".5" stopColor="#d2a650"/><stop offset="1" stopColor="#7b531c"/></radialGradient></defs>
      <path d="M27 0 h6 v40 h-6z M33 6 h9 v6 h-9z M33 16 h6 v5 h-6z M33 26 h10 v7 h-10z" fill="url(#gK)"/>
      <rect x="26" y="38" width="8" height="78" rx="2" fill="url(#gK)"/>
      <rect x="22" y="44" width="16" height="5" rx="2" fill="url(#gK)"/><rect x="21" y="106" width="18" height="6" rx="2.5" fill="url(#gK)"/><rect x="23" y="100" width="14" height="4" rx="2" fill="url(#gK)"/>
      <path d="M30 112 C44 112 54 122 54 136 C54 150 44 160 30 160 C16 160 6 150 6 136 C6 122 16 112 30 112 Z" fill="url(#gKb)" stroke="#6e4a17" strokeWidth="1"/>
      <path d="M30 120 C34 128 40 130 46 136 C40 142 34 144 30 152 C26 144 20 142 14 136 C20 130 26 128 30 120 Z" fill="#3a2008" opacity=".85"/>
      <circle cx="30" cy="136" r="4.2" fill="#c2273f" stroke="#f6dc98" strokeWidth="1.2"/>
      <path d="M30 160 v4" stroke="#b08238" strokeWidth="2"/><path d="M26 164 h8 l1 4 h-10z" fill="#d4a955"/>
      <g stroke="#b3162f" strokeWidth="1.4" strokeLinecap="round"><path d="M27 168 l-2 8"/><path d="M29 168 l-.6 8.5"/><path d="M31 168 l.6 8.5"/><path d="M33 168 l2 8"/></g></svg></div>
  </div>
  <div className="hint"><span id="hintTxt">Drag the golden key to the lock</span></div>
</section>

<section id="s2" className="scene" ariaLive="polite">
  <div className="world" id="w2">
    <div className="bgblur" style={{"backgroundImage":"url(/invitation-assets/asset_5.jpg)"}}></div>
    <div className="stage" id="st2" style={{"width":"736px","height":"1003px"}}>
      <img id="p2base" src="/invitation-assets/asset_6.webp" alt="A watercolour palace courtyard with peacocks beneath a scalloped arch" style={{"left":"0","top":"0","width":"736px","height":"1003px"}} />
      <div id="glows"></div>
      <div id="lans"></div>
      <div className="gateglow" id="gateglow"></div>
      <img id="p2over" src="/invitation-assets/asset_7.webp" alt="" style={{"left":"0","top":"0","width":"736px"}} />
      <div className="names" id="names" ariaLabel="">
        <div className="ln sm" id="l1"></div>
        <div className="nm" id="bride"></div>
        <div className="amp ln" id="amp">&amp;</div>
        <div className="nm" id="groom"></div>
        <svg id="orn" viewBox="0 0 140 16" ariaHidden="true"><path d="M2 8 H56 M84 8 H138" stroke="#8f6120" strokeWidth="1"/><path d="M70 2 L76 8 L70 14 L64 8 Z M58 8 a3 3 0 1 0 0.01 0 M82 8 a3 3 0 1 0 0.01 0" fill="none" stroke="#8f6120" strokeWidth="1"/></svg>
        <div className="ln sm" id="l2"></div>
        <div className="ln dt" id="dt"></div>
      </div>
    </div>
  </div>
  <canvas className="fx" id="fx2"></canvas>
</section>

<section id="s3" className="scene" ariaLive="polite">
  <div className="fr" id="frA"><div className="world"><div className="bgblur"></div><div className="stage"><img className="bgi" alt="" /><div className="glw"></div></div></div>
  <div className="ui3"></div>
  <div className="t3">
    <div className="pg" id="pg3">
      <div className="cframe" id="cframe" role="button" tabIndex="-1" ariaLabel="Couple portrait">
        <div className="ph"><div className="rv"><div className="empty" id="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M3 8h3l2-3h8l2 3h3v11H3z"/><circle cx="12" cy="13" r="4"/></svg>Your couple portrait goes here<br /><span style={{"fontSize":"17px"}}>tap to preview one</span></div><img id="cimg" alt="" hidden /><div className="gleam"></div></div></div>
        <svg className="bd" viewBox="0 0 310 440"><defs><linearGradient id="gGold3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e9cf8a"/><stop offset=".5" stopColor="#b08238"/><stop offset="1" stopColor="#f1dc9c"/></linearGradient></defs>
          <path d="M10,430 L10,138 C10,68 108,54 155,10 C202,54 300,68 300,138 L300,430 Z" stroke="url(#gGold3)" strokeWidth="4"/>
          <path d="M2,438 L2,136 C2,62 104,46 155,0 C206,46 308,62 308,136 L308,438 Z" stroke="url(#gGold3)" strokeWidth="1.3"/></svg>
      </div>
      <div className="cnames">
        <div><div className="n fade soft" style={{"--d":"1.4s"}} id="c3b"></div><div className="of fade soft" style={{"--d":"2s"}} id="c3bo"></div><div className="fa fade soft" style={{"--d":"2.2s"}} id="c3bf"></div></div>
        <div className="amp fade soft" style={{"--d":"1.7s"}}>&amp;</div>
        <div><div className="n fade soft" style={{"--d":"1.9s"}} id="c3g"></div><div className="of fade soft" style={{"--d":"2.4s"}} id="c3go"></div><div className="fa fade soft" style={{"--d":"2.6s"}} id="c3gf"></div></div>
      </div>
      <div className="cvenue">
        <svg className="fade" style={{"--d":"2.8s"}} viewBox="0 0 150 14" ariaHidden="true"><path d="M2 7 H60 M90 7 H148" stroke="#b08238"/><path d="M75 1 L81 7 L75 13 L69 7 Z" fill="none" stroke="#b08238"/></svg>
        <div className="vl fade soft" style={{"--d":"3s"}} dataEn="request the pleasure of your company at" dataHi="आपकी गरिमामयी उपस्थिति के आकांक्षी">request the pleasure of your company at</div>
        <div className="vn fade soft" style={{"--d":"3.2s"}} id="vName"></div>
        <div className="va fade soft" style={{"--d":"3.4s"}} id="vAddr"></div>
      </div>
      <input type="file" id="pick" accept="image/*" hidden />
    </div>
    <div className="pg" id="pg4">
      <div className="sd">
        <div className="t fade soft" style={{"--d":".2s"}} dataEn="Save the Date" dataHi="शुभ तिथि">Save the Date</div>
        <div className="day fade soft" style={{"--d":".6s"}} id="sdDay"></div>
        <div className="date fade soft" style={{"--d":".8s"}} id="sdDate"></div>
        <svg className="fade" style={{"--d":"1s"}} viewBox="0 0 180 16" ariaHidden="true"><path d="M2 8 H72 M108 8 H178" stroke="#b08238"/><path d="M90 2 L96 8 L90 14 L84 8 Z" fill="none" stroke="#b08238"/></svg>
        <div className="time fade soft" style={{"--d":"1.2s"}} id="sdTime"></div>
      </div>
      <div className="cd" id="cd"></div>
      <div className="cdl fade soft" style={{"--d":"2s"}} id="cdl" dataEn="until the pheras begin" dataHi="फेरों में शेष समय">until the pheras begin</div>
      <div className="mapb fade" style={{"--d":"2.3s"}}><a id="maplink" target="_blank" rel="noopener" dataEn="Open in Maps" dataHi="नक्शे में देखें">Open in Maps</a></div>
    </div>
  </div>
  </div>
  <div className="fr" id="frB"><div className="world"><div className="bgblur"></div><div className="stage"><img className="bgi" alt="" /><div className="glw"></div></div></div>
  <div className="ui3"></div><div className="t3"></div></div>
  <canvas className="fx" id="fx3"></canvas>
</section>
<div className="cue" id="cue" role="button" tabIndex="0" ariaLabel="Continue"><span>Scroll</span><i></i></div>
<nav className="dots" id="dots" ariaLabel="Sections"></nav>
<div className="flash" id="flash"></div>


