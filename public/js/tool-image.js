(() => {
  "use strict";
  const input = document.getElementById("imageInput");
  const dropzone = document.getElementById("dropzone");
  const quality = document.getElementById("quality");
  const format = document.getElementById("outputFormat");
  const dimension = document.getElementById("maxDimension");
  const optimize = document.getElementById("optimize");
  const download = document.getElementById("download");
  const reset = document.getElementById("resetImage");
  const status = document.getElementById("imageStatus");
  const originalPreview = document.getElementById("originalPreview");
  const optimizedPreview = document.getElementById("optimizedPreview");
  if (!input || !dropzone) return;
  const MAX_BYTES = 12 * 1024 * 1024;
  let file = null, originalUrl = "", optimizedUrl = "", optimizedBlob = null, image = null;
  const formatName = type => type === "image/webp" ? "WebP" : type === "image/png" ? "PNG" : "JPEG";
  const size = bytes => { if (!bytes) return "—"; const units = ["B","KB","MB"]; let n = bytes, i = 0; while (n >= 1024 && i < 2) { n /= 1024; i++; } return `${n.toFixed(i ? 1 : 0)} ${units[i]}`; };
  const setStatus = (message, error = false) => { status.textContent = message; status.classList.toggle("error", error); };
  const clearUrl = url => { if (url) URL.revokeObjectURL(url); };
  const resetPreview = () => { clearUrl(originalUrl); clearUrl(optimizedUrl); originalUrl = optimizedUrl = ""; optimizedBlob = null; image = null; originalPreview.hidden = true; optimizedPreview.hidden = true; ["originalSize","originalDimensions","originalType","optimizedSize","reduction","optimizedType"].forEach(id => { document.getElementById(id).textContent = "—"; }); optimize.disabled = true; download.disabled = true; };
  const loadFile = selected => {
    resetPreview();
    if (!selected) return;
    if (!selected.type.startsWith("image/")) return setStatus("That file is not a supported image.", true);
    if (!/image\/(jpeg|png|webp|gif)/.test(selected.type)) return setStatus("Use JPEG, PNG, WebP or GIF.", true);
    if (selected.size > MAX_BYTES) return setStatus("That image is larger than the 12 MB limit.", true);
    file = selected;
    originalUrl = URL.createObjectURL(file);
    originalPreview.src = originalUrl; originalPreview.hidden = false;
    originalPreview.onload = () => {
      image = originalPreview;
      document.getElementById("originalSize").textContent = size(file.size);
      document.getElementById("originalDimensions").textContent = `${image.naturalWidth} × ${image.naturalHeight}`;
      document.getElementById("originalType").textContent = formatName(file.type);
      optimize.disabled = false;
      setStatus("Image ready. Adjust settings, then optimize.");
    };
    originalPreview.onerror = () => setStatus("The browser could not decode that image.", true);
  };
  const run = () => {
    if (!image || !file) return;
    optimize.disabled = true; download.disabled = true; setStatus("Optimizing locally…");
    requestAnimationFrame(() => {
      const max = Number(dimension.value);
      const scale = max && Math.max(image.naturalWidth, image.naturalHeight) > max ? max / Math.max(image.naturalWidth, image.naturalHeight) : 1;
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return setStatus("Canvas encoding is unavailable in this browser.", true);
      if (format.value === "image/jpeg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height); }
      ctx.drawImage(image, 0, 0, width, height);
      canvas.toBlob(blob => {
        optimize.disabled = false;
        if (!blob) return setStatus(`${formatName(format.value)} encoding is unavailable in this browser.`, true);
        optimizedBlob = blob; clearUrl(optimizedUrl); optimizedUrl = URL.createObjectURL(blob);
        optimizedPreview.src = optimizedUrl; optimizedPreview.hidden = false;
        document.getElementById("optimizedSize").textContent = size(blob.size);
        const change = ((1 - blob.size / file.size) * 100);
        document.getElementById("reduction").textContent = `${change >= 0 ? "−" : "+"}${Math.abs(change).toFixed(1)}%`;
        document.getElementById("optimizedType").textContent = formatName(blob.type || format.value);
        download.disabled = false;
        setStatus(`Done · ${width} × ${height} · ${formatName(blob.type || format.value)}`);
      }, format.value, Number(quality.value) / 100);
    });
  };
  quality.addEventListener("input", () => { document.getElementById("qualityValue").textContent = `${quality.value}%`; });
  input.addEventListener("change", () => loadFile(input.files[0]));
  ["dragenter","dragover"].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.add("is-dragging"); }));
  ["dragleave","drop"].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.remove("is-dragging"); }));
  dropzone.addEventListener("drop", event => loadFile(event.dataTransfer.files[0]));
  optimize.addEventListener("click", run);
  download.addEventListener("click", () => { if (!optimizedBlob) return; const a = document.createElement("a"); a.href = optimizedUrl; a.download = `${file.name.replace(/\.[^.]+$/, "")}-optimized.${formatName(optimizedBlob.type || format.value).toLowerCase()}`; a.click(); });
  reset.addEventListener("click", () => { file = null; input.value = ""; resetPreview(); setStatus("Choose an image to begin."); });
  window.addEventListener("beforeunload", () => { clearUrl(originalUrl); clearUrl(optimizedUrl); });
})();
