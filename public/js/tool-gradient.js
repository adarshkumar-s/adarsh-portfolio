(() => {
  "use strict";
  const preview = document.getElementById("gradientPreview");
  const a = document.getElementById("colorA");
  const b = document.getElementById("colorB");
  const type = document.getElementById("gradientType");
  const angle = document.getElementById("angle");
  const angleValue = document.getElementById("angleValue");
  const angleControl = document.getElementById("angleControl");
  const output = document.getElementById("cssOutput");
  const status = document.getElementById("gradientStatus");
  if (!preview) return;
  const setStatus = message => { status.textContent = message; status.classList.remove("error"); };
  const update = () => {
    const css = type.value === "linear" ? `linear-gradient(${angle.value}deg, ${a.value}, ${b.value})` : `radial-gradient(circle, ${a.value}, ${b.value})`;
    preview.style.background = css;
    output.textContent = `background: ${css};`;
    angleControl.hidden = type.value !== "linear";
    angleValue.textContent = `${angle.value}°`;
  };
  [a,b,type,angle].forEach(control => control.addEventListener("input", update));
  [a,b,type,angle].forEach(control => control.addEventListener("change", update));
  document.getElementById("copyCss").addEventListener("click", async event => { try { await navigator.clipboard.writeText(output.textContent); event.currentTarget.textContent = "Copied"; setStatus("CSS copied to clipboard."); setTimeout(() => event.currentTarget.textContent = "Copy CSS", 1000); } catch { setStatus("Clipboard access was unavailable. Select the CSS and copy it manually."); } });
  document.getElementById("randomGradient").addEventListener("click", () => { const hex = () => `#${Math.floor(Math.random()*0xffffff).toString(16).padStart(6,"0")}`; a.value = hex(); b.value = hex(); angle.value = String(Math.floor(Math.random()*361)); type.value = Math.random() > .5 ? "linear" : "radial"; update(); setStatus("New gradient generated."); });
  document.getElementById("resetGradient").addEventListener("click", () => { a.value="#a78bfa"; b.value="#68e8d0"; type.value="linear"; angle.value="135"; update(); setStatus("Gradient reset."); });
  update();
})();
