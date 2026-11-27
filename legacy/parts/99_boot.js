// ===================== BOOT =====================
window.claude?.hot?.snapshot?.(()=>({PROG}));
$('top').innerHTML=`<button class="rst" data-reset aria-label="Reiniciar todo" title="Reiniciar todo">${ic('repeat',14,'currentColor',2)}<span>Reiniciar</span></button>`;
// the 3D city starts first and then calls this
window.__legacyBoot=()=>{fit();titleScreen();requestAnimationFrame(loop);setInterval(()=>{if(G&&SCREEN==="game")deliverMail()},1500)};
window.__legacyTut=()=>{if(G&&(G.tut||G.mini)&&$('coach').classList.contains('on'))tut()};
window.__legacyState=()=>G?{s:G.s,ep:G.ep,screen:SCREEN,view:VIEW}:{s:null,ep:null,screen:SCREEN,view:VIEW};
}

