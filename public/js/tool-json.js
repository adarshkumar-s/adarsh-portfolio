(() => {
  "use strict";
  const input = document.getElementById("jsonInput");
  const output = document.getElementById("jsonOutput");
  const status = document.getElementById("jsonStatus");
  const inputMeta = document.getElementById("jsonInputMeta");
  const outputMeta = document.getElementById("jsonOutputMeta");
  if (!input || !output) return;
  const stats = value => `${value.length.toLocaleString()} chars · ${value ? value.split("\n").length.toLocaleString() : 0} lines`;
  const updateMeta = () => { inputMeta.textContent = stats(input.value); outputMeta.textContent = stats(output.textContent); };
  const setStatus = (message, error = false) => { status.textContent = message; status.classList.toggle("error", error); };
  const parse = () => {
    if (!input.value.trim()) throw new Error("Paste JSON into the input first.");
    try { return JSON.parse(input.value); } catch (error) {
      const match = /position (\d+)/i.exec(error.message);
      const position = match ? Number(match[1]) : null;
      throw new Error(position === null ? error.message : `${error.message} · near character ${position.toLocaleString()}`);
    }
  };
  const render = (value, compact) => { output.textContent = JSON.stringify(value, null, compact ? 0 : 2); updateMeta(); };
  document.getElementById("formatJson").addEventListener("click", () => { try { render(parse(), false); setStatus("Valid JSON · formatted"); } catch (e) { output.textContent = ""; updateMeta(); setStatus(e.message, true); } });
  document.getElementById("validateJson").addEventListener("click", () => { try { const value = parse(); setStatus(`Valid JSON · ${Array.isArray(value) ? "array" : typeof value}`); } catch (e) { setStatus(e.message, true); } });
  document.getElementById("minifyJson").addEventListener("click", () => { try { render(parse(), true); setStatus("Valid JSON · minified"); } catch (e) { output.textContent = ""; updateMeta(); setStatus(e.message, true); } });
  document.getElementById("clearJson").addEventListener("click", () => { input.value = ""; output.textContent = ""; updateMeta(); setStatus("Cleared. Paste JSON to begin."); input.focus(); });
  document.getElementById("copyJson").addEventListener("click", async event => { const value = output.textContent; if (!value) return setStatus("Nothing to copy yet.", true); try { await navigator.clipboard.writeText(value); event.currentTarget.textContent = "Copied"; setStatus("Output copied to clipboard."); setTimeout(() => { event.currentTarget.textContent = "Copy output"; }, 1000); } catch { setStatus("Clipboard access was unavailable. Select the output and copy it manually.", true); } });
  input.addEventListener("input", updateMeta);
  input.addEventListener("keydown", event => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); document.getElementById("formatJson").click(); } });
  updateMeta();
})();
