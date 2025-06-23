// i found this code on google
// i saw a tiktok about 3d backgrounds and wanted to try it out
// so i just searched for ones that i thought looked cool
let vantaEffect;
function initVanta() {
  if (vantaEffect) vantaEffect.destroy();
  vantaEffect = VANTA.HALO({
    el: ".vanta-bg",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.0,
    minWidth: 200.0,
    scale: 1.0,
    scaleMobile: 1.0
  });
}
window.addEventListener("DOMContentLoaded", initVanta);
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(initVanta, 200);
});
