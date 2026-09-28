// --- IMPORTACIÓN DE ALUMNOS DESDE PDF (ORLA DE SÉNECA) ---
//
// El PDF de Séneca ("DetCuaAluFot") es una cuadrícula de 4 columnas: cada celda tiene
// la foto del alumno y debajo el texto "Apellidos, Nombre". Algunos alumnos no tienen foto.
// Estrategia:
//   1. Se leen los textos de la página y se unen los fragmentos de una misma línea.
//   2. Se recorre la lista de operaciones de dibujo para saber dónde se pinta cada imagen.
//   3. Cada nombre se empareja con la imagen que está justo encima de él.
//   4. La foto se recorta de la página renderizada en un canvas y se reduce a miniatura.

const PDFJS_VERSION = '3.11.174';
const PDFJS_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/`;
const PDF_RENDER_SCALE = 2.5;     // resolución del renderizado para recortar las fotos
const PHOTO_MAX_SIZE = 240;       // tamaño máximo (px) de las miniaturas guardadas

let pdfJsPromise = null;

function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfJsPromise) return pdfJsPromise;
    pdfJsPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = PDFJS_BASE + 'pdf.min.js';
        script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + 'pdf.worker.min.js';
            resolve(window.pdfjsLib);
        };
        script.onerror = () => { pdfJsPromise = null; reject(new Error('No se pudo cargar el lector de PDF. Comprueba la conexión a internet.')); };
        document.head.appendChild(script);
    });
    return pdfJsPromise;
}

async function extractStudentsFromPdf(file, onProgress) {
    const pdfjs = await loadPdfJs();
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data }).promise;
    const result = { course: '', unit: '', students: [] };

    try {
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            if (onProgress) onProgress(pageNum, pdf.numPages);
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
            const [textContent, opList] = await Promise.all([page.getTextContent(), page.getOperatorList()]);

            const lines = mergeTextLines(textContent.items, viewport, pdfjs);
            if (!result.unit) result.unit = findHeaderValue(lines, /^Unidad\s*:/i);
            if (!result.course) result.course = findHeaderValue(lines, /^Curso\s*:/i);

            const names = lines.filter(l => isStudentNameLine(l.text))
                .sort((a, b) => (a.y - b.y) || (a.x - b.x));
            if (!names.length) { page.cleanup(); continue; }

            const images = collectImageBoxes(opList, viewport, pdfjs);
            const photoByName = pairNamesWithPhotos(names, images);
            const canvas = photoByName.size ? await renderPage(page, viewport) : null;

            names.forEach((line, index) => {
                const commaAt = line.text.indexOf(',');
                const imageIndex = photoByName.get(index);
                result.students.push({
                    lastName: line.text.slice(0, commaAt).trim(),
                    firstName: line.text.slice(commaAt + 1).trim(),
                    photo: (canvas && imageIndex !== undefined) ? cropToDataUrl(canvas, images[imageIndex]) : null
                });
            });

            if (canvas) { canvas.width = 0; canvas.height = 0; }
            page.cleanup();
        }
    } finally {
        pdf.destroy();
    }
    return result;
}

// Une fragmentos de texto contiguos de la misma línea (coordenadas del canvas, y hacia abajo)
function mergeTextLines(items, viewport, pdfjs) {
    const fragments = [];
    for (const item of items) {
        if (!item.str || !item.str.trim()) continue;
        const t = pdfjs.Util.transform(viewport.transform, item.transform);
        const size = Math.hypot(t[2], t[3]);
        if (!size || Math.abs(t[1]) > size * 0.05 || Math.abs(t[2]) > size * 0.05) continue; // texto girado (márgenes)
        fragments.push({ str: item.str, x: t[4], y: t[5], w: item.width * viewport.scale, size });
    }
    fragments.sort((a, b) => a.x - b.x);

    const lines = [];
    for (const f of fragments) {
        const line = lines.find(l => Math.abs(l.y - f.y) < l.size * 0.35 &&
                                     f.x - l.right < l.size * 0.8 &&
                                     f.x - l.right > -l.size * 0.5);
        if (line) {
            const gap = f.x - line.right;
            line.text += (gap > line.size * 0.15 ? ' ' : '') + f.str;
            line.right = Math.max(line.right, f.x + f.w);
        } else {
            lines.push({ text: f.str, x: f.x, y: f.y, right: f.x + f.w, size: f.size });
        }
    }
    lines.forEach(l => { l.text = l.text.replace(/\s+/g, ' ').trim(); });
    return lines;
}

function findHeaderValue(lines, regex) {
    const line = lines.find(l => regex.test(l.text));
    return line ? line.text.replace(regex, '').trim() : '';
}

function isStudentNameLine(text) {
    return /^[^,:\d/]{2,},\s*[^,:\d/]{1,}$/.test(text);
}

// Recorre las operaciones de dibujo siguiendo la matriz de transformación para
// obtener el rectángulo (en coordenadas del canvas) de cada imagen pintada.
function collectImageBoxes(opList, viewport, pdfjs) {
    const OPS = pdfjs.OPS;
    const imageOps = new Set([OPS.paintImageXObject, OPS.paintInlineImageXObject,
                              OPS.paintImageMaskXObject, OPS.paintJpegXObject].filter(v => v !== undefined));
    const boxes = [];
    const stack = [];
    let ctm = [1, 0, 0, 1, 0, 0];

    for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i];
        if (fn === OPS.save) {
            stack.push(ctm);
        } else if (fn === OPS.restore) {
            ctm = stack.pop() || ctm;
        } else if (fn === OPS.transform) {
            ctm = pdfjs.Util.transform(ctm, args);
        } else if (fn === OPS.paintFormXObjectBegin) {
            stack.push(ctm);
            if (args && Array.isArray(args[0]) && args[0].length === 6) ctm = pdfjs.Util.transform(ctm, args[0]);
        } else if (fn === OPS.paintFormXObjectEnd) {
            ctm = stack.pop() || ctm;
        } else if (imageOps.has(fn)) {
            const m = pdfjs.Util.transform(viewport.transform, ctm);
            const corners = [[0, 0], [1, 0], [0, 1], [1, 1]].map(p => pdfjs.Util.applyTransform(p, m));
            const xs = corners.map(p => p[0]);
            const ys = corners.map(p => p[1]);
            const box = { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
            const minSide = 15 * viewport.scale;
            if (box.right - box.left >= minSide && box.bottom - box.top >= minSide) boxes.push(box);
        }
    }
    return boxes;
}

// Empareja cada nombre con la imagen situada justo encima (misma columna).
// Devuelve Map<índiceNombre, índiceImagen>.
function pairNamesWithPhotos(names, images) {
    const candidates = [];
    names.forEach((name, ni) => {
        const nameCenter = (name.x + name.right) / 2;
        const nameTop = name.y - name.size;
        images.forEach((img, ii) => {
            const gap = nameTop - img.bottom;                     // > 0 si la imagen está encima
            if (gap < -name.size * 1.5 || gap > name.size * 8) return;
            const imgWidth = img.right - img.left;
            const dx = Math.abs((img.left + img.right) / 2 - nameCenter);
            if (dx > Math.max(imgWidth, name.size * 8)) return;
            candidates.push({ ni, ii, cost: Math.abs(gap) + dx * 0.5 });
        });
    });
    candidates.sort((a, b) => a.cost - b.cost);

    const pairs = new Map();
    const usedImages = new Set();
    for (const c of candidates) {
        if (pairs.has(c.ni) || usedImages.has(c.ii)) continue;
        pairs.set(c.ni, c.ii);
        usedImages.add(c.ii);
    }
    return pairs;
}

async function renderPage(page, viewport) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
}

function cropToDataUrl(source, box) {
    const left = Math.max(0, Math.floor(box.left));
    const top = Math.max(0, Math.floor(box.top));
    const width = Math.min(source.width, Math.ceil(box.right)) - left;
    const height = Math.min(source.height, Math.ceil(box.bottom)) - top;
    if (width < 4 || height < 4) return null;
    return drawScaled(source, left, top, width, height);
}

function drawScaled(source, sx, sy, sw, sh, maxSize = PHOTO_MAX_SIZE) {
    const scale = Math.min(1, maxSize / Math.max(sw, sh));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sw * scale));
    canvas.height = Math.max(1, Math.round(sh * scale));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
}

// Convierte una imagen elegida por el docente en una miniatura (para cambiar/añadir fotos a mano)
function fileToThumbnail(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            try { resolve(drawScaled(img, 0, 0, img.naturalWidth, img.naturalHeight)); }
            catch (e) { reject(e); }
            finally { URL.revokeObjectURL(url); }
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')); };
        img.src = url;
    });
}
