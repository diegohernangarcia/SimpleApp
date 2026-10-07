/**
 * SimpleApps Suite - Conversor PDF / Doc / Docx / ODT a Markdown
 * converter.js - Motor de Extracción y Conversión Multi-Formato 100% Local
 */

class DocToMarkdownConverter {
    constructor() {
        this.initTurndown();
    }

    /**
     * Inicializa y configura el motor Turndown con reglas GFM (GitHub Flavored Markdown)
     */
    initTurndown() {
        if (typeof TurndownService === 'undefined') {
            console.warn("TurndownService no encontrado en el ámbito global. Se usará fallback.");
            this.turndown = null;
            return;
        }

        this.turndown = new TurndownService({
            headingStyle: 'atx', // # H1, ## H2
            hr: '---',
            bulletListMarker: '-',
            codeBlockStyle: 'fenced',
            fence: '```',
            emDelimiter: '*',
            strongDelimiter: '**',
            linkStyle: 'inlined'
        });

        // Regla para soporte de Tablas GFM (| Col1 | Col2 |)
        this.turndown.addRule('tableCell', {
            filter: ['th', 'td'],
            replacement: (content, node) => {
                const text = content.replace(/\r?\n|\r/g, ' ').trim();
                return ' ' + text + ' |';
            }
        });

        this.turndown.addRule('tableRow', {
            filter: 'tr',
            replacement: (content, node) => {
                const parent = node.parentNode;
                const isHead = parent && parent.nodeName === 'THEAD';
                const isFirstRow = !node.previousElementSibling;
                const cells = Array.from(node.querySelectorAll('th, td'));
                
                let row = '|' + content + '\n';
                
                // Si es encabezado o la primera fila de la tabla sin thead, generar separador | --- | --- |
                if (isHead || (isFirstRow && !parent.querySelector('thead'))) {
                    const separator = '|' + cells.map(() => ' --- |').join('') + '\n';
                    row += separator;
                }
                return row;
            }
        });

        this.turndown.addRule('table', {
            filter: 'table',
            replacement: (content) => {
                return '\n\n' + content.trim() + '\n\n';
            }
        });

        // Regla para elementos tachados (strikethrough <del>, <s>, <strike>)
        this.turndown.addRule('strikethrough', {
            filter: ['del', 's', 'strike'],
            replacement: (content) => {
                return '~~' + content + '~~';
            }
        });

        // Regla para bloques de código con lenguaje
        this.turndown.addRule('highlightedCode', {
            filter: (node) => {
                return node.nodeName === 'PRE' && node.querySelector('code');
            },
            replacement: (content, node) => {
                const codeNode = node.querySelector('code');
                const langMatch = (codeNode.className || '').match(/language-(\w+)/);
                const lang = langMatch ? langMatch[1] : '';
                const codeText = codeNode.textContent.replace(/\n$/, '');
                return '\n\n```' + lang + '\n' + codeText + '\n```\n\n';
            }
        });

        // Ignorar scripts y estilos
        this.turndown.remove(['script', 'style', 'noscript']);
    }

    /**
     * Aplica opciones del usuario al conversor Turndown
     */
    applyOptions(options = {}) {
        if (!this.turndown) return;
        if (options.bulletMarker) this.turndown.options.bulletListMarker = options.bulletMarker;
        if (options.headingStyle) this.turndown.options.headingStyle = options.headingStyle;
    }

    /**
     * Punto de entrada principal para convertir archivos según su extensión
     * @param {File} file Objeto File seleccionado
     * @param {Object} options Opciones de configuración
     * @returns {Promise<{markdown: string, meta: Object}>}
     */
    async convertFile(file, options = {}) {
        const ext = file.name.split('.').pop().toLowerCase();
        const arrayBuffer = await file.arrayBuffer();

        this.applyOptions(options);

        switch (ext) {
            case 'docx':
                return await this.convertDocx(arrayBuffer, options);
            case 'odt':
                return await this.convertOdt(arrayBuffer, options);
            case 'pdf':
                return await this.convertPdf(arrayBuffer, options);
            case 'doc':
                return await this.convertDoc(arrayBuffer, file.name, options);
            case 'xlsx':
            case 'xls':
            case 'ods':
            case 'csv':
            case 'tsv':
                return await this.convertSpreadsheet(arrayBuffer, file.name, ext, options);
            case 'html':
            case 'htm': {
                const text = new TextDecoder('utf-8').decode(arrayBuffer);
                return {
                    markdown: this.convertHtmlToMarkdown(text, options),
                    meta: { type: 'HTML', pages: 1 }
                };
            }
            case 'txt':
            case 'md': {
                const text = new TextDecoder('utf-8').decode(arrayBuffer);
                return {
                    markdown: this.cleanMarkdownText(text, options),
                    meta: { type: 'Texto Plano / MD', pages: 1 }
                };
            }
            default:
                throw new Error(`Extensión no soportada: .${ext}. Formatos permitidos: PDF, DOCX, DOC, ODT, XLSX, XLS, ODS, HTML, TXT.`);
        }
    }

    /**
     * Convierte archivos DOCX utilizando Mammoth.js
     */
    async convertDocx(arrayBuffer, options = {}) {
        if (typeof mammoth === 'undefined') {
            throw new Error("La librería Mammoth.js no está disponible para procesar DOCX.");
        }

        const mammothOptions = {
            styleMap: [
                "p[style-name='Heading 1'] => h1:fresh",
                "p[style-name='Heading 2'] => h2:fresh",
                "p[style-name='Heading 3'] => h3:fresh",
                "p[style-name='Heading 4'] => h4:fresh",
                "p[style-name='Title'] => h1:fresh",
                "p[style-name='Subtitle'] => h3:fresh",
                "p[style-name='Quote'] => blockquote:fresh",
                "r[style-name='Code'] => code"
            ]
        };

        const result = await mammoth.convertToHtml({ arrayBuffer }, mammothOptions);
        const html = result.value;
        const markdown = this.convertHtmlToMarkdown(html, options);

        return {
            markdown: markdown,
            meta: {
                type: 'Microsoft Word (DOCX)',
                warnings: result.messages || []
            }
        };
    }

    /**
     * Convierte archivos ODT (OpenDocument Text) extrayendo y parseando content.xml con JSZip
     */
    async convertOdt(arrayBuffer, options = {}) {
        if (typeof JSZip === 'undefined') {
            throw new Error("La librería JSZip no está disponible para procesar ODT.");
        }

        const zip = await JSZip.loadAsync(arrayBuffer);
        const contentFile = zip.file("content.xml");
        if (!contentFile) {
            throw new Error("El archivo ODT no contiene un 'content.xml' válido.");
        }

        const xmlString = await contentFile.async("text");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        // Convertir la estructura XML de ODT a HTML semántico
        const html = this.parseOdtXmlToHtml(xmlDoc);
        const markdown = this.convertHtmlToMarkdown(html, options);

        return {
            markdown: markdown,
            meta: {
                type: 'OpenDocument Text (ODT)'
            }
        };
    }

    /**
     * Convierte planillas de cálculo (XLSX, XLS, ODS, CSV) a tablas GFM en Markdown
     * @param {ArrayBuffer} arrayBuffer Contenido binario del archivo
     * @param {string} fileName Nombre original del archivo
     * @param {string} ext Extensión del archivo
     * @param {Object} options Opciones de formato
     * @returns {Promise<{markdown: string, meta: Object}>}
     */
    async convertSpreadsheet(arrayBuffer, fileName, ext, options = {}) {
        if (typeof XLSX === 'undefined') {
            throw new Error("La librería SheetJS (XLSX) no está cargada para procesar planillas.");
        }

        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error("El libro de cálculo no contiene hojas válidas.");
        }

        const markdownSections = [];
        const baseName = fileName.replace(/\.[^/.]+$/, "");
        markdownSections.push(`# ${baseName}\n`);

        const isMultiSheet = workbook.SheetNames.length > 1;
        let totalRowsCount = 0;

        workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) return;

            // Extraer datos como matriz 2D
            const rawRows = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',
                raw: false,
                blankrows: false
            });

            if (isMultiSheet) {
                markdownSections.push(`## 📊 Hoja: ${sheetName}\n`);
            }

            if (!rawRows || rawRows.length === 0) {
                markdownSections.push(`*Esta hoja no contiene datos.*\n`);
                return;
            }

            // Encontrar el número máximo de columnas informadas
            let maxCols = 0;
            rawRows.forEach(row => {
                if (Array.isArray(row)) {
                    let lastFilled = -1;
                    for (let c = row.length - 1; c >= 0; c--) {
                        if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '') {
                            lastFilled = c;
                            break;
                        }
                    }
                    if (lastFilled + 1 > maxCols) {
                        maxCols = lastFilled + 1;
                    }
                }
            });

            if (maxCols === 0) {
                markdownSections.push(`*Esta hoja no contiene datos.*\n`);
                return;
            }

            // Función de sanitización de celda para GFM
            const sanitizeCell = (val) => {
                if (val === undefined || val === null) return '';
                const str = String(val).trim();
                return str
                    .replace(/\|/g, '\\|')
                    .replace(/\r?\n|\r/g, '<br>');
            };

            // Fila 0: Encabezados
            const headerRow = rawRows[0] || [];
            const headers = [];
            for (let c = 0; c < maxCols; c++) {
                const hVal = sanitizeCell(headerRow[c]);
                headers.push(hVal || `Columna ${c + 1}`);
            }

            let tableMd = '| ' + headers.join(' | ') + ' |\n';
            tableMd += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

            // Filas de datos (a partir de la fila 1)
            let sheetDataRows = 0;
            for (let r = 1; r < rawRows.length; r++) {
                const row = rawRows[r] || [];
                const isBlank = row.every(c => c === undefined || c === null || String(c).trim() === '');
                if (isBlank) continue;

                const cells = [];
                for (let c = 0; c < maxCols; c++) {
                    cells.push(sanitizeCell(row[c]));
                }
                tableMd += '| ' + cells.join(' | ') + ' |\n';
                sheetDataRows++;
            }

            totalRowsCount += (sheetDataRows + 1);
            markdownSections.push(tableMd.trim() + '\n');
        });

        const fullMarkdown = markdownSections.join('\n');

        return {
            markdown: this.cleanMarkdownText(fullMarkdown, options),
            meta: {
                type: `Planilla de Cálculo (${ext.toUpperCase()})`,
                sheets: workbook.SheetNames.length,
                totalRows: totalRowsCount
            }
        };
    }

    /**
     * Parser XML nativo para content.xml de OpenDocument ODT
     */
    parseOdtXmlToHtml(xmlDoc) {
        let html = '';
        const body = xmlDoc.getElementsByTagName('office:text')[0] || xmlDoc.getElementsByTagName('office:body')[0];
        if (!body) return '<p>Documento ODT vacío.</p>';

        const walkNode = (node) => {
            const name = node.nodeName;

            // Encabezados <text:h>
            if (name === 'text:h') {
                const level = node.getAttribute('text:outline-level') || '1';
                const tag = `h${Math.min(Math.max(parseInt(level, 10), 1), 6)}`;
                return `<${tag}>${this.extractNodeTextWithFormatting(node)}</${tag}>`;
            }

            // Párrafos <text:p>
            if (name === 'text:p') {
                const text = this.extractNodeTextWithFormatting(node);
                if (!text.trim()) return '';
                return `<p>${text}</p>`;
            }

            // Listas <text:list>
            if (name === 'text:list') {
                let listHtml = '<ul>';
                const items = node.getElementsByTagName('text:list-item');
                for (let i = 0; i < items.length; i++) {
                    listHtml += `<li>${this.extractNodeTextWithFormatting(items[i])}</li>`;
                }
                listHtml += '</ul>';
                return listHtml;
            }

            // Tablas <table:table>
            if (name === 'table:table') {
                let tableHtml = '<table>';
                const rows = node.getElementsByTagName('table:table-row');
                for (let r = 0; r < rows.length; r++) {
                    const row = rows[r];
                    const isFirst = (r === 0);
                    const tag = isFirst ? 'th' : 'td';
                    tableHtml += '<tr>';
                    const cells = row.getElementsByTagName('table:table-cell');
                    for (let c = 0; c < cells.length; c++) {
                        tableHtml += `<${tag}>${this.extractNodeTextWithFormatting(cells[c])}</${tag}>`;
                    }
                    tableHtml += '</tr>';
                }
                tableHtml += '</table>';
                return tableHtml;
            }

            // Recorrer hijos si no es un elemento hoja manejado
            let inner = '';
            for (let child of node.childNodes) {
                if (child.nodeType === 1) { // Element
                    inner += walkNode(child);
                }
            }
            return inner;
        };

        for (let child of body.childNodes) {
            if (child.nodeType === 1) {
                html += walkNode(child);
            }
        }

        return html || '<p>Sin contenido reconocible en ODT.</p>';
    }

    /**
     * Extrae texto con formato básico (enlaces, negrita, cursiva) de nodos ODT
     */
    extractNodeTextWithFormatting(node) {
        let result = '';
        for (let child of node.childNodes) {
            if (child.nodeType === 3) { // Text node
                result += child.nodeValue;
            } else if (child.nodeType === 1) {
                const name = child.nodeName;
                if (name === 'text:s') {
                    const count = parseInt(child.getAttribute('text:c') || '1', 10);
                    result += ' '.repeat(count);
                } else if (name === 'text:tab') {
                    result += '\t';
                } else if (name === 'text:line-break') {
                    result += '<br>';
                } else if (name === 'text:a') {
                    const href = child.getAttribute('xlink:href') || '#';
                    result += `<a href="${href}">${this.extractNodeTextWithFormatting(child)}</a>`;
                } else {
                    result += this.extractNodeTextWithFormatting(child);
                }
            }
        }
        return result;
    }

    /**
     * Convierte archivos PDF extrayendo texto y estructurando encabezados y párrafos mediante PDF.js
     */
    async convertPdf(arrayBuffer, options = {}) {
        if (typeof pdfjsLib === 'undefined') {
            throw new Error("La librería PDF.js no está disponible para procesar PDF.");
        }

        // Configurar worker de PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';

        const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            useSystemFonts: true
        });

        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        const pagesMarkdown = [];

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageMd = this.parsePdfTextContent(textContent, options);
            
            if (pageMd.trim()) {
                if (options.includePageBreaks && totalPages > 1) {
                    pagesMarkdown.push(`<!-- Página ${pageNum} -->\n\n${pageMd}`);
                } else {
                    pagesMarkdown.push(pageMd);
                }
            }
        }

        const fullMarkdown = pagesMarkdown.join('\n\n---\n\n');

        return {
            markdown: this.cleanMarkdownText(fullMarkdown, options),
            meta: {
                type: 'Documento PDF',
                pages: totalPages
            }
        };
    }

    /**
     * Reconstruye líneas, encabezados y párrafos de una página PDF analizando coordenadas y tamaños de fuente
     */
    parsePdfTextContent(textContent, options = {}) {
        const items = textContent.items;
        if (!items || items.length === 0) return '';

        // Filtrar espacios vacíos y calcular estadísticas de tamaños de fuentes
        const fontSizes = [];
        const validItems = [];

        for (const item of items) {
            if (!item.str || !item.str.trim()) continue;
            // La escala de fuente suele encontrarse en transform[0] o transform[3]
            const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12;
            item.fontSize = Math.round(fontSize * 10) / 10;
            item.x = Math.round(item.transform[4]);
            item.y = Math.round(item.transform[5]);
            fontSizes.push(item.fontSize);
            validItems.push(item);
        }

        if (validItems.length === 0) return '';

        // Calcular tamaño de fuente promedio o moda (cuerpo de texto habitual)
        fontSizes.sort((a, b) => a - b);
        const medianFontSize = fontSizes[Math.floor(fontSizes.length / 2)] || 12;

        // Agrupar elementos por línea (misma coordenada Y aproximada, margen +-4px)
        validItems.sort((a, b) => {
            if (Math.abs(b.y - a.y) > 4) return b.y - a.y; // Orden descendente en Y (arriba hacia abajo)
            return a.x - b.x; // Orden ascendente en X (izquierda a derecha)
        });

        const lines = [];
        let currentLine = [];
        let lastY = null;

        for (const item of validItems) {
            if (lastY === null || Math.abs(item.y - lastY) <= 4) {
                currentLine.push(item);
            } else {
                lines.push(currentLine);
                currentLine = [item];
            }
            lastY = item.y;
        }
        if (currentLine.length > 0) lines.push(currentLine);

        // Convertir líneas a bloques Markdown
        const blocks = [];
        let currentParagraph = [];

        for (const line of lines) {
            const lineText = line.map(i => i.str).join(' ').trim();
            if (!lineText) continue;

            const avgSize = line.reduce((acc, i) => acc + i.fontSize, 0) / line.length;

            // Detectar si es un encabezado por tamaño de fuente relativo
            const isHeading1 = avgSize >= medianFontSize * 1.55;
            const isHeading2 = avgSize >= medianFontSize * 1.25 && !isHeading1;

            // Detectar viñetas de lista
            const isBullet = /^[\u2022\u25E6\u2023\u2219\*\-\+]\s+/.test(lineText);
            const isNumbered = /^\d+[\.\)]\s+/.test(lineText);

            if (isHeading1) {
                if (currentParagraph.length) {
                    blocks.push(currentParagraph.join(' '));
                    currentParagraph = [];
                }
                blocks.push(`# ${lineText.replace(/^#+\s*/, '')}`);
            } else if (isHeading2) {
                if (currentParagraph.length) {
                    blocks.push(currentParagraph.join(' '));
                    currentParagraph = [];
                }
                blocks.push(`## ${lineText.replace(/^#+\s*/, '')}`);
            } else if (isBullet || isNumbered) {
                if (currentParagraph.length) {
                    blocks.push(currentParagraph.join(' '));
                    currentParagraph = [];
                }
                const formattedBullet = lineText.replace(/^[\u2022\u25E6\u2023\u2219]\s*/, '- ');
                blocks.push(formattedBullet);
            } else {
                // Acumular líneas en párrafo si terminan de manera continua
                currentParagraph.push(lineText);
            }
        }

        if (currentParagraph.length) {
            blocks.push(currentParagraph.join(' '));
        }

        return blocks.join('\n\n');
    }

    /**
     * Convierte archivos DOC tradicionales (Word 97-2003 / RTF / HTML-DOC)
     */
    async convertDoc(arrayBuffer, filename = 'documento.doc', options = {}) {
        const bytes = new Uint8Array(arrayBuffer.slice(0, 1024));
        const header = Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');

        // Caso 1: Archivo RTF disfrazado de .doc (comienza con "{\rtf")
        const textSample = new TextDecoder('latin1').decode(bytes);
        if (textSample.startsWith('{\\rtf')) {
            const fullRtf = new TextDecoder('latin1').decode(arrayBuffer);
            const text = this.parseRtfToText(fullRtf);
            return {
                markdown: this.cleanMarkdownText(text, options),
                meta: { type: 'Microsoft Word (RTF en DOC)' }
            };
        }

        // Caso 2: Documento HTML generado con extensión .doc (muy común en exportaciones web)
        if (textSample.toLowerCase().includes('<html') || textSample.toLowerCase().includes('xmlns:w="urn:schemas-microsoft-com:office:word"')) {
            const fullHtml = new TextDecoder('utf-8').decode(arrayBuffer);
            return {
                markdown: this.convertHtmlToMarkdown(fullHtml, options),
                meta: { type: 'Microsoft Word (HTML / WebDoc)' }
            };
        }

        // Caso 3: Archivo binario compuesto CFBF tradicional (0xd0, 0xcf, 0x11, 0xe0...)
        // Extracción de flujo de texto legible preservando saltos de línea y párrafos
        const extractedText = this.extractTextFromBinaryDoc(arrayBuffer);
        if (extractedText.trim().length > 30) {
            return {
                markdown: this.cleanMarkdownText(extractedText, options),
                meta: { 
                    type: 'Microsoft Word 97-2003 (Binario CFBF)',
                    note: 'Texto extraído de forma estructurada. Para formatos avanzados (tablas complejas), se sugiere guardar como .docx.'
                }
            };
        }

        throw new Error("No fue posible extraer texto del formato binario .doc. Se recomienda convertirlo a .docx o copiar y pegar su contenido en la pestaña de texto.");
    }

    /**
     * Parser para archivos RTF
     */
    parseRtfToText(rtf) {
        return rtf
            .replace(/\\par[d]?/g, '\n\n')
            .replace(/\\tab/g, '\t')
            .replace(/\\b\s+(.*?)\\b0/g, '**$1**')
            .replace(/\\i\s+(.*?)\\i0/g, '*$1*')
            .replace(/\{\*?\\[^{}]+;\}|[{}]|\\\w+/g, '')
            .replace(/\r?\n\s*\r?\n/g, '\n\n')
            .trim();
    }

    /**
     * Extractor de cadenas de texto UTF-16LE / ASCII de archivos binarios Word .doc (CFBF)
     */
    extractTextFromBinaryDoc(arrayBuffer) {
        const u16 = new Uint16Array(arrayBuffer);
        let extracted = '';
        let consecutivePrintable = 0;
        let buffer = '';

        for (let i = 0; i < u16.length; i++) {
            const code = u16[i];
            // Caracteres imprimibles habituales y saltos de línea
            if (code === 10 || code === 13 || (code >= 32 && code <= 126) || (code >= 160 && code <= 65533)) {
                buffer += String.fromCharCode(code);
                consecutivePrintable++;
            } else {
                if (consecutivePrintable >= 4) {
                    extracted += buffer;
                }
                buffer = '';
                consecutivePrintable = 0;
            }
        }
        if (consecutivePrintable >= 4) extracted += buffer;

        // Limpiar fragmentos de metadatos internos de Word
        return extracted
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
            .replace(/\r\n|\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    /**
     * Convierte código HTML o contenido copiado del portapapeles a Markdown
     */
    convertHtmlToMarkdown(htmlString, options = {}) {
        if (!htmlString || !htmlString.trim()) return '';

        this.applyOptions(options);

        // Pre-limpieza de HTML
        let cleanHtml = htmlString
            // Eliminar comentarios condicionales de Word (<!--[if ...]>...<![endif]-->)
            .replace(/<!--[\s\S]*?-->/g, '')
            // Limpiar clases específicas de Office MsoNormal
            .replace(/class="?Mso[a-zA-Z0-9_]*"?/gi, '')
            // Normalizar saltos de línea dentro de etiquetas
            .trim();

        if (this.turndown) {
            try {
                const md = this.turndown.turndown(cleanHtml);
                return this.cleanMarkdownText(md, options);
            } catch (err) {
                console.error("Error en Turndown:", err);
            }
        }

        // Fallback básico si Turndown falla
        return this.fallbackHtmlToMarkdown(cleanHtml);
    }

    /**
     * Fallback liviano para convertir HTML a Markdown sin dependencias
     */
    fallbackHtmlToMarkdown(html) {
        const div = document.createElement('div');
        div.innerHTML = html;

        let md = '';
        const traverse = (node) => {
            if (node.nodeType === 3) {
                md += node.nodeValue;
                return;
            }
            const tag = node.nodeName.toLowerCase();
            switch (tag) {
                case 'h1': md += `\n\n# ${node.textContent.trim()}\n\n`; break;
                case 'h2': md += `\n\n## ${node.textContent.trim()}\n\n`; break;
                case 'h3': md += `\n\n### ${node.textContent.trim()}\n\n`; break;
                case 'h4': md += `\n\n#### ${node.textContent.trim()}\n\n`; break;
                case 'p': md += `\n\n${node.textContent.trim()}\n\n`; break;
                case 'strong': case 'b': md += `**${node.textContent}**`; break;
                case 'em': case 'i': md += `*${node.textContent}*`; break;
                case 'code': md += `\`${node.textContent}\``; break;
                case 'pre': md += `\n\n\`\`\`\n${node.textContent.trim()}\n\`\`\`\n\n`; break;
                case 'li': md += `- ${node.textContent.trim()}\n`; break;
                case 'hr': md += `\n\n---\n\n`; break;
                default:
                    for (let child of node.childNodes) traverse(child);
            }
        };
        traverse(div);
        return this.cleanMarkdownText(md);
    }

    /**
     * Limpia y normaliza texto Markdown según preferencias
     */
    cleanMarkdownText(md, options = {}) {
        let result = md
            .replace(/\r\n/g, '\n')
            .replace(/\t/g, '    ');

        if (options.cleanMultipleBreaks !== false) {
            result = result.replace(/\n{3,}/g, '\n\n');
        }

        if (options.trimTrailingSpaces !== false) {
            result = result.split('\n').map(l => l.trimEnd()).join('\n');
        }

        return result.trim();
    }

    /**
     * Genera métricas y estadísticas detalladas del texto Markdown generado
     */
    analyzeMarkdown(markdown) {
        if (!markdown || !markdown.trim()) {
            return {
                words: 0,
                chars: 0,
                lines: 0,
                headings: 0,
                tables: 0,
                links: 0
            };
        }

        const trimmed = markdown.trim();
        const words = (trimmed.match(/\b[\w\u00C0-\u017F]+\b/g) || []).length;
        const chars = markdown.length;
        const lines = markdown.split('\n').length;
        const headings = (markdown.match(/^#{1,6}\s+/gm) || []).length;
        const tables = (markdown.match(/\|[\s-:]+\|/g) || []).length;
        const links = (markdown.match(/\[.*?\]\(.*?\)/g) || []).length;

        return {
            words,
            chars,
            lines,
            headings,
            tables,
            links
        };
    }
}

// Instancia global y soporte modular
if (typeof window !== 'undefined') {
    window.docToMarkdownConverter = new DocToMarkdownConverter();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocToMarkdownConverter;
    module.exports.DocToMarkdownConverter = DocToMarkdownConverter;
}

