(()=>{ "use strict";
const $=id=>document.getElementById(id);
const MAX_BYTES=25*1024*1024;
const IMAGE_TYPES={jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",bmp:"image/bmp",tif:"image/tiff",tiff:"image/tiff",gif:"image/gif"};
const MATRIX={
  pdf:[{id:"pdf-docx",label:"DOCX",note:"Text-first reconstruction; layout may change."},{id:"pdf-txt",label:"TXT",note:"Extracts selectable PDF text."},{id:"pdf-jpg",label:"JPG",note:"Renders selected PDF pages as images."},{id:"pdf-png",label:"PNG",note:"Renders selected PDF pages as images."}],
  image:[{id:"image-jpg",label:"JPG",note:"JPEG output uses a white background for transparency."},{id:"image-png",label:"PNG",note:"Lossless raster output."},{id:"image-webp",label:"WEBP",note:"Browser-encoded WebP output."},{id:"image-pdf",label:"PDF",note:"One image per PDF page; order is preserved."}],
  txt:[{id:"txt-docx",label:"DOCX",note:"Creates a clean, editable Word document."},{id:"txt-pdf",label:"PDF",note:"Creates a simple text PDF."}],
  docx:[{id:"docx-txt",label:"TXT",note:"Extracts document text without formatting."},{id:"docx-html",label:"HTML",note:"Converts document structure to HTML."}],
  csv:[{id:"csv-xlsx",label:"XLSX",note:"Creates a single-sheet Excel workbook."}],
  xlsx:[{id:"xlsx-csv",label:"CSV",note:"Export one selected workbook sheet."}]
};
const $fileInput=$("fileInput"),$dropzone=$("dropzone"),$fileList=$("fileList"),$fileEmpty=$("fileEmpty"),$target=$("targetFormat"),$options=$("converterOptions"),$convert=$("convertButton"),$reset=$("resetConverter"),$status=$("converterStatus"),$result=$("converterResult"),$resultName=$("resultName"),$resultMeta=$("resultMeta"),$download=$("downloadResult"),$support=$("supportNote"),$progress=$("progressBar"),$progressLabel=$("progressLabel");
if(!$fileInput||!$dropzone||!$target)return;
let files=[],resultBlob=null,resultName="",sourceKind="",workbook=null;
const lib={};
const LIBS={
  pdfjs:["https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",()=>window.pdfjsLib],
  docx:["https://cdn.jsdelivr.net/npm/docx@9.7.1/build/index.js",()=>window.docx],
  jspdf:["https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js",()=>window.jspdf&&window.jspdf.jsPDF],
  xlsx:["https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",()=>window.XLSX],
  mammoth:["https://cdn.jsdelivr.net/npm/mammoth@1.12.2/mammoth.browser.min.js",()=>window.mammoth],
  zip:["https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js",()=>window.JSZip]
};
const setStatus=(message,error=false)=>{$status.textContent=message;$status.classList.toggle("error",error);};
const setProgress=(value,label)=>{$progress.style.width=Math.max(0,Math.min(100,value))+"%";$progressLabel.textContent=label||Math.round(value)+"%";};
const bytes=n=>{if(!n)return"0 B";const u=["B","KB","MB","GB"],i0=0;let i=i0,v=n;while(v>=1024&&i<u.length-1){v/=1024;i++;}return v.toFixed(i?1:0)+" "+u[i];};
const ext=name=>(name.split(".").pop()||"").toLowerCase();
const kind=file=>{const e=ext(file.name),m=(file.type||"").toLowerCase();if(e==="pdf"||m==="application/pdf")return"pdf";if(e==="txt"||m==="text/plain")return"txt";if(e==="csv"||m==="text/csv")return"csv";if(e==="docx"||m.indexOf("wordprocessingml.document")>=0)return"docx";if(e==="xlsx"||e==="xls"||m.indexOf("spreadsheetml")>=0||m==="application/vnd.ms-excel")return"xlsx";if(IMAGE_TYPES[e]||m.indexOf("image/")===0)return"image";return"unknown";};
const safeBase=name=>(name.replace(/\.[^.]+$/,"").trim().replace(/[^a-z0-9._-]+/gi,"-").replace(/^-+|-+$/g,"")||"converted-file");
const extForTarget=id=>({"pdf-docx":"docx","pdf-txt":"txt","pdf-jpg":"jpg","pdf-png":"png","image-jpg":"jpg","image-png":"png","image-webp":"webp","image-pdf":"pdf","txt-docx":"docx","txt-pdf":"pdf","docx-txt":"txt","docx-html":"html","csv-xlsx":"xlsx","xlsx-csv":"csv"}[id]);
const setBusy=busy=>{$convert.disabled=busy||!files.length;$reset.disabled=busy;$fileInput.disabled=busy;$target.disabled=busy||!sourceKind;};
function renderFiles(){
  $fileList.replaceChildren();
  files.forEach((file,i)=>{
    const row=document.createElement("div");row.className="converter-file";
    const icon=document.createElement("span");icon.className="converter-file-icon";icon.textContent=kind(file).toUpperCase();
    const info=document.createElement("div");info.className="converter-file-info";
    const name=document.createElement("strong");name.textContent=file.name;
    const meta=document.createElement("span");meta.textContent=bytes(file.size)+(file.type?" · "+file.type:"");
    info.append(name,meta);
    const actions=document.createElement("div");actions.className="converter-file-actions";
    if(kind(file)==="image"&&sourceKind==="image"){
      const up=document.createElement("button");up.className="small-button";up.type="button";up.textContent="↑";up.title="Move up";up.disabled=i===0;
      up.onclick=()=>{[files[i-1],files[i]]=[files[i],files[i-1]];renderFiles();};
      const down=document.createElement("button");down.className="small-button";down.type="button";down.textContent="↓";down.title="Move down";down.disabled=i===files.length-1;
      down.onclick=()=>{[files[i+1],files[i]]=[files[i],files[i+1]];renderFiles();};actions.append(up,down);
    }
    const remove=document.createElement("button");remove.className="small-button";remove.type="button";remove.textContent="Remove";remove.onclick=()=>{files.splice(i,1);refresh();};actions.append(remove);
    row.append(icon,info,actions);$fileList.appendChild(row);
  });
  $fileList.hidden=!files.length;$fileEmpty.hidden=!!files.length;
}
async function loadScript(name){
  if(lib[name])return lib[name];
  const cfg=LIBS[name];if(!cfg)throw Error("Unknown conversion engine.");
  lib[name]=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-converter-lib="'+name+'"]');
    if(existing){existing.addEventListener("load",()=>resolve(cfg[1]()));existing.addEventListener("error",()=>reject(Error("Conversion engine failed to load.")));return;}
    const s=document.createElement("script");s.src=cfg[0];s.async=true;s.dataset.converterLib=name;
    s.onload=()=>{try{const value=cfg[1]();if(!value)throw Error("Conversion engine is unavailable.");resolve(value);}catch(e){reject(e);}};
    s.onerror=()=>reject(Error("Could not load the conversion engine. Check your connection and try again."));
    document.head.appendChild(s);
  });
  return lib[name];
}
function parsePages(value,total){
  if(!value||!value.trim())return Array.from({length:total},(_,i)=>i+1);
  const set=new Set();
  for(const part of value.split(",")){
    const p=part.trim();
    if(/^\d+$/.test(p)){const n=Number(p);if(n<1||n>total)throw Error("Page number "+n+" is outside the PDF.");set.add(n);continue;}
    const m=p.match(/^(\d+)\s*-\s*(\d+)$/);if(!m)throw Error("Use page numbers like 1,3 or ranges like 2-5.");
    const a=Number(m[1]),b=Number(m[2]);if(a<1||b>total||a>b)throw Error("Invalid PDF page range.");
    for(let n=a;n<=b;n++)set.add(n);
  }
  return [...set].sort((a,b)=>a-b);
}
function addTextPages(pdf,text){
  const lines=text.replace(/\r/g,"").split("\n"),margin=18,line=6;let y=22;
  for(const raw of lines){const chunks=pdf.splitTextToSize(raw||" ",180);for(const chunk of chunks){if(y>280){pdf.addPage();y=22;}pdf.text(chunk,margin,y);y+=line;}}
}
async function pdfDocument(file){
  const pdfjs=await loadScript("pdfjs");pdfjs.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  return pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
}
async function extractPdf(file,pages,onProgress){
  const pdf=await pdfDocument(file),parts=[];
  for(let i=0;i<pages.length;i++){
    const page=await pdf.getPage(pages[i]),content=await page.getTextContent();let lines=[],lastY=null;
    for(const item of content.items){
      const y=item.transform&&item.transform[5];
      if(lastY!==null&&Math.abs(y-lastY)>2)lines.push("\n");else if(lines.length)lines.push(" ");
      lines.push(item.str);lastY=y;
    }
    parts.push("Page "+pages[i]+"\n"+lines.join(""));
    if(onProgress)onProgress(15+70*((i+1)/pages.length));
  }
  return {pdf,pages,text:parts.join("\n\n")};
}
async function imageBlob(file,target,quality){
  const img=new Image(),url=URL.createObjectURL(file);
  try{
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error("The browser could not decode this image."));img.src=url;});
    const canvas=document.createElement("canvas");canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext("2d");
    if(!ctx)throw Error("Canvas encoding is unavailable in this browser.");
    if(target==="image/jpeg"){ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);}
    ctx.drawImage(img,0,0);
    return await new Promise(resolve=>canvas.toBlob(resolve,target,target==="image/png"?undefined:quality));
  }finally{URL.revokeObjectURL(url);}
}
async function imageToPdf(inputFiles){
  const JsPDF=await loadScript("jspdf");let pdf;
  for(let i=0;i<inputFiles.length;i++){
    const file=inputFiles[i],url=URL.createObjectURL(file),img=new Image();
    try{
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error("The browser could not decode "+file.name+"."));img.src=url;});
      const w=210,h=297,scale=Math.min(w/img.naturalWidth,h/img.naturalHeight),iw=img.naturalWidth*scale,ih=img.naturalHeight*scale;
      if(!pdf)pdf=new JsPDF({unit:"mm",format:"a4"});else pdf.addPage();
      pdf.addImage(img,"JPEG",(w-iw)/2,(h-ih)/2,iw,ih,undefined,"FAST");
    }finally{URL.revokeObjectURL(url);}
  }
  return pdf.output("blob");
}
async function pdfToImages(file,target,pages,onProgress){
  const pdf=await pdfDocument(file),zip=pages.length>1?await loadScript("zip"):null,filesOut=[];
  for(let i=0;i<pages.length;i++){
    const page=await pdf.getPage(pages[i]),viewport=page.getViewport({scale:1.55}),canvas=document.createElement("canvas");canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas rendering is unavailable in this browser.");
    await page.render({canvasContext:ctx,viewport}).promise;
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,target==="png"?"image/png":"image/jpeg",target==="png"?undefined:.92));if(!blob)throw Error("Image encoding failed.");
    filesOut.push({name:"page-"+String(pages[i]).padStart(3,"0")+"."+target,blob});if(onProgress)onProgress(15+80*((i+1)/pages.length));
  }
  if(filesOut.length===1)return{name:filesOut[0].name,blob:filesOut[0].blob};
  const archive=new zip();filesOut.forEach(x=>archive.file(x.name,x.blob));
  return{name:"converted-pages.zip",blob:await archive.generateAsync({type:"blob",compression:"DEFLATE"})};
}
async function pdfToDocx(file,pages,onProgress){
  const data=await extractPdf(file,pages,onProgress),d=await loadScript("docx"),paragraphs=[];
  data.text.split(/\n\n+/).forEach(block=>{
    const lines=block.split("\n"),isPage=/^Page \d+$/.test(lines[0]||"");
    if(isPage)paragraphs.push(new d.Paragraph({text:lines[0],heading:d.HeadingLevel.HEADING_2}));
    const body=lines.slice(isPage?1:0).join(" ").trim();if(body)paragraphs.push(new d.Paragraph({text:body}));
  });
  if(!paragraphs.length)throw Error("No selectable text was found. This PDF may be scanned; this browser build does not claim OCR reconstruction.");
  const doc=new d.Document({sections:[{children:paragraphs}]});return await d.Packer.toBlob(doc);
}
async function textToDocx(text){
  const d=await loadScript("docx"),blocks=text.replace(/\r/g,"").split(/\n\n+/).map(x=>x.trim()).filter(Boolean),children=blocks.map(x=>new d.Paragraph({text:x}));
  const doc=new d.Document({sections:[{children:children.length?children:[new d.Paragraph({text:""})]}]});return await d.Packer.toBlob(doc);
}
async function textToPdf(text){const JsPDF=await loadScript("jspdf"),pdf=new JsPDF({unit:"mm",format:"a4"});addTextPages(pdf,text);return pdf.output("blob");}
async function docxTo(type,file){
  const mammoth=await loadScript("mammoth"),buffer=await file.arrayBuffer();
  if(type==="txt"){const r=await mammoth.extractRawText({arrayBuffer:buffer});return{blob:new Blob([r.value],{type:"text/plain;charset=utf-8"}),warnings:r.messages};}
  const r=await mammoth.convertToHtml({arrayBuffer:buffer}),html="<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Converted document</title></head><body>"+r.value+"</body></html>";
  return{blob:new Blob([html],{type:"text/html;charset=utf-8"}),warnings:r.messages};
}
async function csvToXlsx(file){
  const XLSX=await loadScript("xlsx"),text=await file.text(),wb=XLSX.utils.book_new(),rows=text.split(/\r?\n/).filter(Boolean).map(line=>{
    const out=[];let cell="",quoted=false;
    for(let i=0;i<line.length;i++){const c=line[i];if(c==="\""&&line[i+1]==="\""){cell+="\"";i++;}else if(c==="\"")quoted=!quoted;else if(c===","&&!quoted){out.push(cell);cell="";}else cell+=c;}out.push(cell);return out;
  });
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),"Sheet1");
  return new Blob([XLSX.write(wb,{bookType:"xlsx",type:"array"})],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}
async function loadWorkbook(file){const XLSX=await loadScript("xlsx");workbook=XLSX.read(await file.arrayBuffer(),{type:"array"});return workbook;}
async function xlsxToCsv(file,sheet){
  const XLSX=await loadScript("xlsx"),wb=workbook||await loadWorkbook(file),name=sheet||wb.SheetNames[0],ws=wb.Sheets[name];if(!ws)throw Error("That workbook sheet could not be read.");
  return new Blob([XLSX.utils.sheet_to_csv(ws)],{type:"text/csv;charset=utf-8"});
}
function renderOptions(){
  $options.replaceChildren();const id=$target.value;
  if(/^pdf-(jpg|png)$/.test(id)){
    $options.innerHTML="<div class=\"converter-option\"><label for=\"pageRange\">Pages</label><input id=\"pageRange\" type=\"text\" inputmode=\"text\" placeholder=\"All pages · e.g. 1-3,5\"><small>Multiple rendered pages are downloaded as a ZIP.</small></div>";
  }else if(id==="pdf-docx"){
    $options.innerHTML="<label class=\"converter-check\"><input type=\"checkbox\" checked disabled><span>Basic text and page order are preserved; complex layout, tables and scanned-page reconstruction may change.</span></label>";
  }else if(/^image-/.test(id)){
    $options.innerHTML="<div class=\"converter-option-grid\"><div class=\"converter-option\"><label for=\"imageQuality\">Quality</label><input id=\"imageQuality\" type=\"range\" min=\"50\" max=\"100\" value=\"90\"><output id=\"imageQualityValue\">90%</output></div><div class=\"converter-option\"><label for=\"jpegBackground\">JPEG background</label><select id=\"jpegBackground\"><option value=\"white\">White</option><option value=\"black\">Black</option></select></div></div>";
    $("imageQuality").oninput=()=>$("imageQualityValue").value=$("imageQuality").value+"%";
  }else if(id==="xlsx-csv"){
    $options.innerHTML="<div class=\"converter-option\"><label for=\"sheetSelect\">Workbook sheet</label><select id=\"sheetSelect\"></select><small>Choose one sheet. Sheets are never silently merged.</small></div>";populateSheets();
  }else{$options.innerHTML="<p class=\"converter-note\">No extra options needed for this conversion.</p>";}
}
async function populateSheets(){
  if(sourceKind!=="xlsx"||!files[0])return;
  try{const wb=await loadWorkbook(files[0]),select=$("sheetSelect");select.replaceChildren(...wb.SheetNames.map(name=>{const o=document.createElement("option");o.value=name;o.textContent=name;return o;}));}
  catch(e){setStatus("The workbook could not be read yet. "+e.message,true);}
}
function refresh(){
  workbook=null;sourceKind=files[0]?kind(files[0]):"";
  if(files.some(f=>f.size>MAX_BYTES)){setStatus("A file is larger than the 25 MB limit.",true);files=[];sourceKind="";}
  $target.replaceChildren();(MATRIX[sourceKind]||[]).forEach((item,i)=>{const o=document.createElement("option");o.value=item.id;o.textContent=item.label;if(i===0)o.selected=true;$target.appendChild(o);});
  $target.disabled=!sourceKind;renderFiles();renderOptions();$convert.disabled=!files.length||!$target.value;
  $support.textContent=sourceKind?((MATRIX[sourceKind]||[]).length+" verified browser conversions available for this file type."):"PDF, images, TXT, DOCX, CSV and XLSX are accepted. Maximum 25 MB per file.";
  $result.hidden=true;resultBlob=null;resultName="";setProgress(0,"Ready");
  if(files.length)setStatus(files.length+" file"+(files.length===1?"":"s")+" ready.");else setStatus("Drop files here or choose files to begin.");
}
function acceptSelected(list){
  const selected=[...list];if(!selected.length)return;const firstKind=kind(selected[0]);
  if(firstKind==="unknown"||!MATRIX[firstKind])return setStatus("That file type is not supported.",true);
  if(firstKind!=="image"&&selected.length>1)return setStatus("This conversion uses one source file at a time.",true);
  if(selected.some(f=>f.size>MAX_BYTES))return setStatus("A file is larger than the 25 MB limit.",true);
  files=selected;refresh();
}
async function run(){
  if(!files.length||!$target.value)return;setBusy(true);$result.hidden=true;resultBlob=null;setProgress(4,"Preparing");
  try{
    const id=$target.value,base=safeBase(files[0].name),targetExt=extForTarget(id);let output;
    if(id==="pdf-txt"){
      const pdf=await pdfDocument(files[0]),pages=parsePages("",pdf.numPages),data=await extractPdf(files[0],pages,setProgress);
      if(!data.text.replace(/Page \d+\s*/g,"").trim())setStatus("No selectable text was found. This PDF appears to be scanned; TXT conversion cannot reconstruct it without OCR.",true);
      output={name:base+".txt",blob:new Blob([data.text],{type:"text/plain;charset=utf-8"})};
    }else if(id==="pdf-docx"){
      const pdf=await pdfDocument(files[0]);output={name:base+".docx",blob:await pdfToDocx(files[0],parsePages("",pdf.numPages),setProgress)};
    }else if(/^pdf-(jpg|png)$/.test(id)){
      const pdf=await pdfDocument(files[0]),pages=parsePages($("pageRange")?.value||"",pdf.numPages);output=await pdfToImages(files[0],id.slice(4),pages,setProgress);
      output.name=base+"-pages."+(pages.length>1?"zip":id.slice(4));
    }else if(id==="image-pdf"){
      if(files.some(f=>kind(f)!=="image"))throw Error("Only image files can be combined into a PDF.");
      output={name:base+"-images.pdf",blob:await imageToPdf(files)};
    }else if(/^image-(jpg|png|webp)$/.test(id)){
      const targetMime={"image-jpg":"image/jpeg","image-png":"image/png","image-webp":"image/webp"}[id],q=Number($("imageQuality")?.value||90)/100,blob=await imageBlob(files[0],targetMime,q);
      if(!blob)throw Error("This browser could not encode the requested image format.");
      if(files[0].type==="image/gif")setStatus("Done. Animated GIFs are converted as their first decoded frame; animation is not preserved.");
      output={name:base+"."+targetExt,blob};
    }else if(id==="txt-docx"){output={name:base+".docx",blob:await textToDocx(await files[0].text())};
    }else if(id==="txt-pdf"){output={name:base+".pdf",blob:await textToPdf(await files[0].text())};
    }else if(id==="docx-txt"||id==="docx-html"){
      const r=await docxTo(id==="docx-txt"?"txt":"html",files[0]);output={name:base+"."+targetExt,blob:r.blob,warnings:r.warnings};
    }else if(id==="csv-xlsx"){output={name:base+".xlsx",blob:await csvToXlsx(files[0])};
    }else if(id==="xlsx-csv"){output={name:base+".csv",blob:await xlsxToCsv(files[0],$("sheetSelect")?.value)};
    }else throw Error("This conversion is not available.");
    if(!output||!(output.blob instanceof Blob)||output.blob.size<1)throw Error("The conversion did not produce a valid output file.");
    resultBlob=output.blob;resultName=output.name;setProgress(100,"Complete");$resultName.textContent=resultName;$resultMeta.textContent=bytes(resultBlob.size)+" · "+(resultBlob.type||"download");$result.hidden=false;$download.disabled=false;
    if(output.warnings?.length)setStatus("Converted with "+output.warnings.length+" document warning"+(output.warnings.length===1?"":"s")+". Review the result before sharing.");else if($status.classList.contains("error")){}else setStatus("Conversion complete. Your output was created in this browser.");
    $result.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"nearest"});
  }catch(error){console.error(error);setProgress(0,"Ready");setStatus(error&&error.message?error.message:"Conversion failed. Try a smaller or different file.",true);}
  finally{setBusy(false);}
}
$target.addEventListener("change",renderOptions);
$fileInput.addEventListener("change",()=>acceptSelected($fileInput.files));
["dragenter","dragover"].forEach(type=>$dropzone.addEventListener(type,e=>{e.preventDefault();$dropzone.classList.add("is-dragging");}));
["dragleave","drop"].forEach(type=>$dropzone.addEventListener(type,e=>{e.preventDefault();$dropzone.classList.remove("is-dragging");}));
$dropzone.addEventListener("drop",e=>acceptSelected(e.dataTransfer.files));
$convert.addEventListener("click",run);
$reset.addEventListener("click",()=>{files=[];$fileInput.value="";workbook=null;refresh();});
$download.addEventListener("click",()=>{if(!resultBlob)return;const url=URL.createObjectURL(resultBlob),a=document.createElement("a");a.href=url;a.download=resultName;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);});
renderFiles();refresh();
})();