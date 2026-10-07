/**
 * SimpleApps Suite - Conversor PDF / Doc / Docx / ODT a Markdown
 * app.js - Controlador de Interfaz, Eventos, Modos y Renderizado
 */

document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const dom = {
        // Pestañas de entrada
        tabFileBtn: document.getElementById('tabFileBtn'),
        tabPasteBtn: document.getElementById('tabPasteBtn'),
        tabFileContent: document.getElementById('tabFileContent'),
        tabPasteContent: document.getElementById('tabPasteContent'),

        // Modo Archivo
        dropzone: document.getElementById('dropzone'),
        fileInput: document.getElementById('fileInput'),
        btnSelectFile: document.getElementById('btnSelectFile'),
        fileInfoCard: document.getElementById('fileInfoCard'),
        fileInfoName: document.getElementById('fileInfoName'),
        fileInfoSize: document.getElementById('fileInfoSize'),
        fileInfoType: document.getElementById('fileInfoType'),
        btnRemoveFile: document.getElementById('btnRemoveFile'),
        btnConvertFile: document.getElementById('btnConvertFile'),

        // Modo Pegado
        pasteTextarea: document.getElementById('pasteTextarea'),
        btnConvertPaste: document.getElementById('btnConvertPaste'),
        btnClearPaste: document.getElementById('btnClearPaste'),
        btnLoadSample: document.getElementById('btnLoadSample'),
        btnPasteClipboard: document.getElementById('btnPasteClipboard'),
        pasteFormatBadge: document.getElementById('pasteFormatBadge'),

        // Opciones de Configuración
        optBulletMarker: document.getElementById('optBulletMarker'),
        optHeadingStyle: document.getElementById('optHeadingStyle'),
        optCleanBreaks: document.getElementById('optCleanBreaks'),
        optPageBreaks: document.getElementById('optPageBreaks'),

        // Panel de Resultados
        resultsSection: document.getElementById('resultsSection'),
        emptyStateCard: document.getElementById('emptyStateCard'),
        markdownEditor: document.getElementById('markdownEditor'),
        renderedPreview: document.getElementById('renderedPreview'),
        lineNumbers: document.getElementById('lineNumbers'),

        // Vistas
        viewSplitBtn: document.getElementById('viewSplitBtn'),
        viewRawBtn: document.getElementById('viewRawBtn'),
        viewPreviewBtn: document.getElementById('viewPreviewBtn'),
        viewerContainer: document.getElementById('viewerContainer'),

        // Métricas
        statWords: document.getElementById('statWords'),
        statChars: document.getElementById('statChars'),
        statLines: document.getElementById('statLines'),
        statHeadings: document.getElementById('statHeadings'),
        statTables: document.getElementById('statTables'),

        // Acciones del Resultado
        btnCopyMd: document.getElementById('btnCopyMd'),
        btnDownloadMd: document.getElementById('btnDownloadMd'),
        btnCopyHtml: document.getElementById('btnCopyHtml'),
        btnClearAll: document.getElementById('btnClearAll'),

        // Estado y Alertas
        statusBanner: document.getElementById('statusBanner'),
        toastContainer: document.getElementById('toastContainer')
    };

    // Estado interno
    const state = {
        selectedFile: null,
        currentMarkdown: '',
        activeView: 'split', // 'split', 'raw', 'preview'
        activeInputTab: 'file', // 'file', 'paste'
        pastedHtmlBuffer: null, // almacena HTML enriquecido capturado en el evento paste
        currentDocTitle: 'documento'
    };

    // Configuración inicial de Marked.js para la vista previa
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            gfm: true,
            breaks: true,
            headerIds: true,
            mangle: false
        });
    }

    /* =========================================================================
       1. MANEJO DE PESTAÑAS (Subir Archivo vs Pegar Contenido)
       ========================================================================= */
    function switchInputTab(tab) {
        state.activeInputTab = tab;
        if (tab === 'file') {
            dom.tabFileBtn.classList.add('active');
            dom.tabPasteBtn.classList.remove('active');
            dom.tabFileContent.style.display = 'block';
            dom.tabPasteContent.style.display = 'none';
        } else {
            dom.tabPasteBtn.classList.add('active');
            dom.tabFileBtn.classList.remove('active');
            dom.tabFileContent.style.display = 'none';
            dom.tabPasteContent.style.display = 'block';
            dom.pasteTextarea.focus();
        }
    }

    dom.tabFileBtn.addEventListener('click', () => switchInputTab('file'));
    dom.tabPasteBtn.addEventListener('click', () => switchInputTab('paste'));

    /* =========================================================================
       2. MANEJO DE ARCHIVOS Y DRAG & DROP
       ========================================================================= */
    dom.btnSelectFile.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.fileInput.click();
    });

    dom.dropzone.addEventListener('click', () => {
        dom.fileInput.click();
    });

    dom.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.dropzone.classList.add('drag-over');
    });

    dom.dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dom.dropzone.classList.remove('drag-over');
    });

    dom.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    dom.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    dom.btnRemoveFile.addEventListener('click', (e) => {
        e.stopPropagation();
        resetFileSelection();
    });

    function handleFileSelection(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        const validExtensions = ['pdf', 'docx', 'doc', 'odt', 'xlsx', 'xls', 'ods', 'csv', 'tsv', 'txt', 'rtf', 'html', 'htm', 'md'];

        if (!validExtensions.includes(ext)) {
            showToast(`Formato no admitido (.${ext}). Por favor adjunta PDF, DOCX, DOC, ODT, XLSX, XLS, ODS, HTML o TXT.`, 'error');
            return;
        }

        state.selectedFile = file;
        state.currentDocTitle = file.name.replace(/\.[^/.]+$/, "");

        dom.fileInfoName.textContent = file.name;
        dom.fileInfoSize.textContent = formatFileSize(file.size);
        dom.fileInfoType.textContent = ext.toUpperCase();

        dom.dropzone.style.display = 'none';
        dom.fileInfoCard.style.display = 'flex';
        dom.btnConvertFile.disabled = false;

        showToast(`Archivo "${file.name}" cargado. Haz clic en "Convertir a Markdown".`, 'info');
    }

    function resetFileSelection() {
        state.selectedFile = null;
        dom.fileInput.value = '';
        dom.fileInfoCard.style.display = 'none';
        dom.dropzone.style.display = 'flex';
        dom.btnConvertFile.disabled = true;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /* =========================================================================
       3. PROCESAMIENTO DE CONVERSIÓN DE ARCHIVOS
       ========================================================================= */
    dom.btnConvertFile.addEventListener('click', async () => {
        if (!state.selectedFile) return;

        setLoadingState(true, `Procesando ${state.selectedFile.name}...`);

        try {
            const options = getConversionOptions();
            const result = await window.docToMarkdownConverter.convertFile(state.selectedFile, options);

            displayMarkdownResult(result.markdown, `${state.selectedFile.name}`);
            showToast(`¡Conversión exitosa de ${state.selectedFile.name}!`, 'success');
        } catch (error) {
            console.error("Error en la conversión:", error);
            showToast(`Error al procesar archivo: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    });

    /* =========================================================================
       4. MANEJO DE ÁREA DE PEGADO Y PORTAPAPELES ENRIQUECIDO
       ========================================================================= */
    // Captura del evento paste para interceptar HTML de Word, Docs y Web si existe
    dom.pasteTextarea.addEventListener('paste', (e) => {
        const clipboard = e.clipboardData;
        const html = clipboard.getData('text/html');

        if (html && html.trim().length > 0) {
            state.pastedHtmlBuffer = html;
            dom.pasteFormatBadge.textContent = "Formato Enriquecido detectado (Word / Web)";
            dom.pasteFormatBadge.className = "format-badge rich";
        } else {
            state.pastedHtmlBuffer = null;
            dom.pasteFormatBadge.textContent = "Texto Plano";
            dom.pasteFormatBadge.className = "format-badge plain";
        }
    });

    dom.pasteTextarea.addEventListener('input', () => {
        if (!dom.pasteTextarea.value.trim()) {
            state.pastedHtmlBuffer = null;
            dom.pasteFormatBadge.textContent = "Sin contenido";
            dom.pasteFormatBadge.className = "format-badge";
        }
    });

    // Botón para pegar directamente con la API Clipboard
    if (dom.btnPasteClipboard) {
        dom.btnPasteClipboard.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                dom.pasteTextarea.value = text;
                dom.pasteTextarea.focus();
                showToast("Texto pegado desde el portapapeles.", "info");
            } catch (err) {
                dom.pasteTextarea.focus();
                showToast("Presiona Ctrl + V dentro del cuadro de texto para pegar.", "info");
            }
        });
    }

    // Botón para limpiar área de pegado
    dom.btnClearPaste.addEventListener('click', () => {
        dom.pasteTextarea.value = '';
        state.pastedHtmlBuffer = null;
        dom.pasteFormatBadge.textContent = "Sin contenido";
        dom.pasteFormatBadge.className = "format-badge";
        dom.pasteTextarea.focus();
    });

    // Botón para cargar documento de ejemplo
    dom.btnLoadSample.addEventListener('click', () => {
        const sampleHtml = `
<h1>Informe Trimestral de Operaciones</h1>
<p>Este es un <strong>documento de ejemplo</strong> con formato enriquecido para probar la conversión inmediata a <em>Markdown</em>.</p>

<h2>Objetivos Principales</h2>
<ul>
    <li>Migración a arquitectura <strong>100% cliente</strong> y local.</li>
    <li>Optimización de tiempos de respuesta a <code>0 ms</code> de latencia.</li>
    <li>Soporte universal para documentos <strong>PDF, DOCX, DOC y ODT</strong>.</li>
</ul>

<h2>Tabla Comparativa de Rendimiento</h2>
<table>
    <thead>
        <tr>
            <th>Módulo</th>
            <th>Tiempo (Local)</th>
            <th>Tasa Éxito</th>
            <th>Privacidad</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Doc to Markdown</td>
            <td>12 ms</td>
            <td>100%</td>
            <td>Totalmente Offline</td>
        </tr>
        <tr>
            <td>Diff Viewer</td>
            <td>5 ms</td>
            <td>100%</td>
            <td>En memoria</td>
        </tr>
        <tr>
            <td>Linux Perms</td>
            <td>1 ms</td>
            <td>100%</td>
            <td>Reactivo</td>
        </tr>
    </tbody>
</table>

<blockquote>
    "La privacidad no es una opción, es la base de las utilidades locales modernas."
</blockquote>
<p>Para más información, consulta el repositorio oficial en GitHub.</p>
        `.trim();

        state.pastedHtmlBuffer = sampleHtml;
        dom.pasteTextarea.value = sampleHtml;
        dom.pasteFormatBadge.textContent = "Documento de Ejemplo (HTML enriquecido con tablas)";
        dom.pasteFormatBadge.className = "format-badge rich";
        showToast("Ejemplo cargado. Ahora haz clic en 'Convertir Contenido a Markdown'.", "info");
    });

    // Conversión del texto pegado
    dom.btnConvertPaste.addEventListener('click', () => {
        const textVal = dom.pasteTextarea.value.trim();
        if (!textVal) {
            showToast("Por favor pega o escribe algún contenido antes de convertir.", "error");
            dom.pasteTextarea.focus();
            return;
        }

        setLoadingState(true, "Convirtiendo contenido a Markdown...");

        try {
            const options = getConversionOptions();
            let markdown = '';

            // Si hay HTML enriquecido capturado o el texto parece contener etiquetas HTML
            if (state.pastedHtmlBuffer || /<[a-z][\s\S]*>/i.test(textVal)) {
                const sourceHtml = state.pastedHtmlBuffer || textVal;
                markdown = window.docToMarkdownConverter.convertHtmlToMarkdown(sourceHtml, options);
            } else {
                // Es texto plano estructurado
                markdown = window.docToMarkdownConverter.cleanMarkdownText(textVal, options);
            }

            state.currentDocTitle = 'documento-pegado';
            displayMarkdownResult(markdown, 'Contenido Pegado');
            showToast("¡Texto convertido a Markdown exitosamente!", "success");
        } catch (error) {
            console.error("Error al convertir texto:", error);
            showToast(`Error: ${error.message}`, "error");
        } finally {
            setLoadingState(false);
        }
    });

    /* =========================================================================
       5. OPCIONES DE CONVERSIÓN
       ========================================================================= */
    function getConversionOptions() {
        return {
            bulletMarker: dom.optBulletMarker ? dom.optBulletMarker.value : '-',
            headingStyle: dom.optHeadingStyle ? dom.optHeadingStyle.value : 'atx',
            cleanMultipleBreaks: dom.optCleanBreaks ? dom.optCleanBreaks.checked : true,
            includePageBreaks: dom.optPageBreaks ? dom.optPageBreaks.checked : true
        };
    }

    // Re-aplicar opciones al vuelo si ya hay un documento procesado
    [dom.optBulletMarker, dom.optHeadingStyle, dom.optCleanBreaks, dom.optPageBreaks].forEach(ctrl => {
        if (ctrl) {
            ctrl.addEventListener('change', () => {
                if (state.currentMarkdown) {
                    showToast("Opciones actualizadas para la próxima conversión.", "info");
                }
            });
        }
    });

    /* =========================================================================
       6. RENDERIZADO Y VISUALIZACIÓN DE RESULTADOS
       ========================================================================= */
    function displayMarkdownResult(markdown, sourceName) {
        state.currentMarkdown = markdown;

        dom.markdownEditor.value = markdown;
        updateLineNumbers();
        updateRenderedPreview(markdown);
        updateStatistics(markdown);

        dom.emptyStateCard.style.display = 'none';
        dom.resultsSection.style.display = 'block';

        // Scroll suave hacia los resultados
        dom.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Actualización de Vista Previa Renderizada con Marked.js
    function updateRenderedPreview(markdown) {
        if (typeof marked !== 'undefined') {
            try {
                dom.renderedPreview.innerHTML = marked.parse(markdown || '');
            } catch (e) {
                dom.renderedPreview.innerHTML = `<pre>${escapeHtml(markdown)}</pre>`;
            }
        } else {
            dom.renderedPreview.innerHTML = `<pre>${escapeHtml(markdown)}</pre>`;
        }
    }

    // Numeración de líneas sincronizada con el editor
    function updateLineNumbers() {
        const lines = (dom.markdownEditor.value || '').split('\n').length;
        let lineNums = '';
        for (let i = 1; i <= lines; i++) {
            lineNums += `${i}\n`;
        }
        dom.lineNumbers.textContent = lineNums;
    }

    // Escuchar ediciones directas en el editor de Markdown en tiempo real
    dom.markdownEditor.addEventListener('input', () => {
        const updatedMd = dom.markdownEditor.value;
        state.currentMarkdown = updatedMd;
        updateLineNumbers();
        updateRenderedPreview(updatedMd);
        updateStatistics(updatedMd);
    });

    // Sincronizar scroll entre numeración de líneas y textarea
    dom.markdownEditor.addEventListener('scroll', () => {
        dom.lineNumbers.scrollTop = dom.markdownEditor.scrollTop;
    });

    /* =========================================================================
       7. SELECTOR DE VISTAS (Dividida / Solo Código / Solo Preview)
       ========================================================================= */
    function switchResultView(mode) {
        state.activeView = mode;
        dom.viewSplitBtn.classList.remove('active');
        dom.viewRawBtn.classList.remove('active');
        dom.viewPreviewBtn.classList.remove('active');
        dom.viewerContainer.className = 'viewer-container';

        if (mode === 'split') {
            dom.viewSplitBtn.classList.add('active');
            dom.viewerContainer.classList.add('mode-split');
        } else if (mode === 'raw') {
            dom.viewRawBtn.classList.add('active');
            dom.viewerContainer.classList.add('mode-raw');
        } else if (mode === 'preview') {
            dom.viewPreviewBtn.classList.add('active');
            dom.viewerContainer.classList.add('mode-preview');
        }
    }

    dom.viewSplitBtn.addEventListener('click', () => switchResultView('split'));
    dom.viewRawBtn.addEventListener('click', () => switchResultView('raw'));
    dom.viewPreviewBtn.addEventListener('click', () => switchResultView('preview'));

    /* =========================================================================
       8. CÁLCULO DE MÉTRICAS Y ESTADÍSTICAS
       ========================================================================= */
    function updateStatistics(markdown) {
        const stats = window.docToMarkdownConverter.analyzeMarkdown(markdown);
        dom.statWords.textContent = stats.words.toLocaleString();
        dom.statChars.textContent = stats.chars.toLocaleString();
        dom.statLines.textContent = stats.lines.toLocaleString();
        dom.statHeadings.textContent = stats.headings.toLocaleString();
        dom.statTables.textContent = stats.tables.toLocaleString();
    }

    /* =========================================================================
       9. ACCIONES: COPIAR Y DESCARGAR RESULTADOS
       ========================================================================= */
    // Copiar Markdown al portapapeles
    dom.btnCopyMd.addEventListener('click', async () => {
        if (!state.currentMarkdown) return;
        try {
            await navigator.clipboard.writeText(state.currentMarkdown);
            showCopyFeedback(dom.btnCopyMd, "¡Markdown Copiado!");
            showToast("Código Markdown copiado al portapapeles.", "success");
        } catch (err) {
            dom.markdownEditor.select();
            document.execCommand('copy');
            showCopyFeedback(dom.btnCopyMd, "¡Markdown Copiado!");
            showToast("Código Markdown copiado.", "success");
        }
    });

    // Descargar archivo .md
    dom.btnDownloadMd.addEventListener('click', () => {
        if (!state.currentMarkdown) return;

        const filename = `${sanitizeFilename(state.currentDocTitle || 'documento')}.md`;
        const blob = new Blob([state.currentMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(`Archivo "${filename}" descargado con éxito.`, "success");
    });

    // Copiar HTML renderizado
    if (dom.btnCopyHtml) {
        dom.btnCopyHtml.addEventListener('click', async () => {
            const htmlContent = dom.renderedPreview.innerHTML;
            if (!htmlContent) return;
            try {
                await navigator.clipboard.writeText(htmlContent);
                showToast("HTML renderizado copiado al portapapeles.", "info");
            } catch (err) {
                showToast("No se pudo copiar el HTML.", "error");
            }
        });
    }

    // Limpiar todo y volver al estado inicial
    dom.btnClearAll.addEventListener('click', () => {
        state.currentMarkdown = '';
        dom.markdownEditor.value = '';
        dom.renderedPreview.innerHTML = '';
        updateStatistics('');
        dom.resultsSection.style.display = 'none';
        dom.emptyStateCard.style.display = 'block';
        resetFileSelection();
        dom.pasteTextarea.value = '';
        state.pastedHtmlBuffer = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast("Espacio de trabajo reiniciado.", "info");
    });

    /* =========================================================================
       10. UTILIDADES Y FEEDBACK
       ========================================================================= */
    function showCopyFeedback(button, text) {
        const originalHTML = button.innerHTML;
        button.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span>${text}</span>
        `;
        button.style.borderColor = "var(--accent-emerald)";
        button.style.color = "#34D399";

        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.borderColor = "";
            button.style.color = "";
        }, 2200);
    }

    function setLoadingState(isLoading, message = 'Procesando...') {
        if (isLoading) {
            dom.statusBanner.style.display = 'flex';
            dom.statusBanner.querySelector('.status-text').textContent = message;
        } else {
            dom.statusBanner.style.display = 'none';
        }
    }

    function showToast(message, type = 'info') {
        if (!dom.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const iconSvg = type === 'success' 
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
            : type === 'error'
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
            : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

        toast.innerHTML = `${iconSvg}<span>${message}</span>`;
        dom.toastContainer.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('visible'));

        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3600);
    }

    function sanitizeFilename(name) {
        return name.replace(/[^a-z0-9_\-\u00C0-\u017F]/gi, '_').toLowerCase();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =========================================================================
    // MODAL DE AYUDA Y GUÍA DE USO
    // =========================================================================
    const helpModal = document.getElementById('helpModal');
    const btnOpenHelpModal = document.getElementById('btnOpenHelpModal');
    const btnOpenHelpHero = document.getElementById('btnOpenHelpHero');
    const btnCloseHelpModal = document.getElementById('btnCloseHelpModal');
    const btnDismissHelp = document.getElementById('btnDismissHelp');
    const helpTabBtns = document.querySelectorAll('#helpModal .help-tab-btn');
    const helpTabContents = document.querySelectorAll('#helpModal .help-tab-content');

    function openHelpModal(targetTabId = 'tabHelpOverview') {
        if (!helpModal) return;
        switchHelpTab(targetTabId);
        helpModal.classList.add('active', 'open');
        document.body.style.overflow = 'hidden';
    }

    function closeHelpModal() {
        if (!helpModal) return;
        helpModal.classList.remove('active', 'open');
        document.body.style.overflow = '';
    }

    function switchHelpTab(tabKey) {
        const candidate = tabKey || 'tabHelpOverview';
        let found = false;
        helpTabContents.forEach(c => {
            if (c.id === candidate) found = true;
        });
        const activeTab = found ? candidate : 'tabHelpOverview';

        helpTabBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.tab === activeTab);
        });
        helpTabContents.forEach(c => {
            c.style.display = c.id === activeTab ? 'block' : 'none';
        });
    }

    if (btnOpenHelpModal) btnOpenHelpModal.addEventListener('click', () => openHelpModal('tabHelpOverview'));
    if (btnOpenHelpHero) btnOpenHelpHero.addEventListener('click', () => openHelpModal('tabHelpOverview'));
    if (btnCloseHelpModal) btnCloseHelpModal.addEventListener('click', closeHelpModal);
    if (btnDismissHelp) btnDismissHelp.addEventListener('click', closeHelpModal);
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) closeHelpModal();
        });
    }

    helpTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchHelpTab(btn.dataset.tab);
        });
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeHelpModal();
        }
    });

    // Inicializar vista por defecto
    switchResultView('split');
});
