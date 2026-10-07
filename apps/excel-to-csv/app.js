/**
 * SimpleApps Suite - De Excel a CSV
 * app.js - Controlador de Interfaz de Usuario y Flujo de Exportación Multi-Hoja
 */

(function () {
    'use strict';

    // Estado principal de la aplicación
    const state = {
        workbooks: [], // Lista de libros cargados con sus hojas
        currentPreviewSheet: null // Hoja actualmente desplegada en el modal
    };

    // Referencias al DOM
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const btnSelectFiles = document.getElementById('btnSelectFiles');
    const btnLoadSamples = document.getElementById('btnLoadSamples');
    const workbooksSection = document.getElementById('workbooksSection');
    const workbooksListContainer = document.getElementById('workbooksListContainer');
    const totalSheetsBadge = document.getElementById('totalSheetsBadge');
    const btnAddMoreFiles = document.getElementById('btnAddMoreFiles');
    const btnClearAll = document.getElementById('btnClearAll');
    
    // Controles globales de exportación
    const globalExportBar = document.getElementById('globalExportBar');
    const globalSelectedStats = document.getElementById('globalSelectedStats');
    const btnDownloadAllZip = document.getElementById('btnDownloadAllZip');
    const btnDownloadAllIndividual = document.getElementById('btnDownloadAllIndividual');

    // Opciones de configuración
    const optDelimiter = document.getElementById('optDelimiter');
    const optEncoding = document.getElementById('optEncoding');
    const optQuotes = document.getElementById('optQuotes');
    const optTrim = document.getElementById('optTrim');
    const optSkipEmpty = document.getElementById('optSkipEmpty');

    // Modal de vista previa
    const previewModal = document.getElementById('previewModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalSheetTitle = document.getElementById('modalSheetTitle');
    const modalTableStats = document.getElementById('modalTableStats');
    const modalTableHead = document.getElementById('modalTableHead');
    const modalTableBody = document.getElementById('modalTableBody');
    const btnModalDownloadCsv = document.getElementById('btnModalDownloadCsv');

    const toastContainer = document.getElementById('toastContainer');

    /**
     * Inicialización de eventos
     */
    function init() {
        setupDropzoneEvents();
        setupOptionsEvents();
        setupModalEvents();
        setupGlobalActions();
        setupHelpModalEvents();
    }

    /**
     * Configuración del Drag & Drop y selector de archivos
     */
    function setupDropzoneEvents() {
        btnSelectFiles.addEventListener('click', () => fileInput.click());
        btnAddMoreFiles.addEventListener('click', () => fileInput.click());
        btnLoadSamples.addEventListener('click', handleLoadSampleWorkbook);

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleIncomingFiles(Array.from(e.target.files));
                fileInput.value = ''; // Reset
            }
        });

        // Eventos Drag and Drop
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('drag-active');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('drag-active');
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length > 0) {
                handleIncomingFiles(Array.from(dt.files));
            }
        });

        btnClearAll.addEventListener('click', () => {
            if (state.workbooks.length === 0) return;
            if (confirm('¿Deseas quitar todos los libros y hojas cargadas?')) {
                state.workbooks = [];
                renderWorkbooksList();
                showToast('Se limpiaron todos los archivos.', 'info');
            }
        });
    }

    /**
     * Maneja la subida de uno o varios archivos Excel
     */
    async function handleIncomingFiles(fileList) {
        const validExtensions = ['.xlsx', '.xls', '.xlsm', '.ods', '.xlsb'];
        const excelFiles = fileList.filter(file => {
            const lower = file.name.toLowerCase();
            return validExtensions.some(ext => lower.endsWith(ext));
        });

        if (excelFiles.length === 0) {
            showToast('Por favor, selecciona archivos Excel válidos (.xlsx, .xls, .xlsm, .ods).', 'error');
            return;
        }

        let addedWorkbooks = 0;
        let totalSheetsFound = 0;

        for (const file of excelFiles) {
            try {
                const parsed = await window.excelToCsvConverter.parseWorkbook(file);
                if (parsed.sheets.length === 0) {
                    showToast(`El archivo "${file.name}" no contiene hojas con datos.`, 'warning');
                    continue;
                }

                state.workbooks.push(parsed);
                addedWorkbooks++;
                totalSheetsFound += parsed.sheets.length;
            } catch (err) {
                console.error(err);
                showToast(`Error al procesar ${file.name}: ${err.message}`, 'error');
            }
        }

        if (addedWorkbooks > 0) {
            renderWorkbooksList();
            showToast(`Se cargaron ${addedWorkbooks} libro(s) con un total de ${totalSheetsFound} hoja(s).`, 'success');
        }
    }

    /**
     * Carga un libro Excel de demostración en memoria con 3 hojas distintas
     */
    async function handleLoadSampleWorkbook() {
        try {
            const sampleFile = window.excelToCsvConverter.createSampleWorkbook();
            const parsed = await window.excelToCsvConverter.parseWorkbook(sampleFile);
            state.workbooks.push(parsed);
            renderWorkbooksList();
            showToast('¡Libro de ejemplo cargado con éxito! Contiene 3 hojas listas para exportar.', 'success');
        } catch (err) {
            console.error(err);
            showToast('No se pudo generar el libro de ejemplo: ' + err.message, 'error');
        }
    }

    /**
     * Obtiene las opciones actuales de conversión configuradas por el usuario
     */
    function getExportOptions() {
        return {
            delimiter: optDelimiter.value,
            encoding: optEncoding.value,
            quotePolicy: optQuotes.value,
            trimWhitespace: optTrim.checked,
            skipEmptyRows: optSkipEmpty.checked
        };
    }

    /**
     * Re-renderiza la lista de libros y sus hojas
     */
    function renderWorkbooksList() {
        if (state.workbooks.length === 0) {
            workbooksSection.style.display = 'none';
            globalExportBar.style.display = 'none';
            return;
        }

        workbooksSection.style.display = 'block';
        workbooksListContainer.innerHTML = '';

        let totalSheets = 0;
        let totalSelectedSheets = 0;

        state.workbooks.forEach((wb, wbIndex) => {
            totalSheets += wb.sheets.length;
            const wbCard = document.createElement('div');
            wbCard.className = 'workbook-card';

            const formattedSize = window.excelToCsvConverter.formatFileSize(wb.fileSize);
            const selectedInWb = wb.sheets.filter(s => s.selected).length;
            totalSelectedSheets += selectedInWb;

            wbCard.innerHTML = `
                <div class="workbook-header">
                    <div class="workbook-info">
                        <div class="workbook-icon-box">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="8" y1="13" x2="16" y2="13"/>
                                <line x1="8" y1="17" x2="16" y2="17"/>
                            </svg>
                        </div>
                        <div>
                            <div class="workbook-name">${escapeHtml(wb.fileName)}</div>
                            <div class="workbook-meta">${formattedSize} • ${wb.sheets.length} hoja(s)</div>
                        </div>
                    </div>
                    <div class="workbook-actions">
                        <button type="button" class="btn-action-icon" data-action="toggle-select-all" data-wb="${wbIndex}">
                            <span>${selectedInWb === wb.sheets.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}</span>
                        </button>
                        <button type="button" class="btn-action-icon btn-action-download" data-action="zip-wb" data-wb="${wbIndex}" title="Descargar las hojas de este libro en un archivo ZIP">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            <span>Descargar ZIP del Libro</span>
                        </button>
                        <button type="button" class="btn-action-icon" data-action="remove-wb" data-wb="${wbIndex}" title="Quitar este libro" style="color: #EF4444;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>

                <div class="sheets-table-wrap">
                    <table class="sheets-table">
                        <thead>
                            <tr>
                                <th class="sheet-check-cell">Exportar</th>
                                <th>Nombre de la Hoja</th>
                                <th>Dimensiones</th>
                                <th>Nombre Archivo CSV de Salida</th>
                                <th style="text-align: right;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="wb_tbody_${wbIndex}">
                            <!-- Filas de hojas -->
                        </tbody>
                    </table>
                </div>
            `;

            workbooksListContainer.appendChild(wbCard);

            // Inyectar filas de hojas
            const tbody = wbCard.querySelector(`#wb_tbody_${wbIndex}`);
            wb.sheets.forEach((sheet, sheetIndex) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="sheet-check-cell">
                        <input type="checkbox" class="sheet-select-checkbox" data-wb="${wbIndex}" data-sheet="${sheetIndex}" ${sheet.selected ? 'checked' : ''} style="accent-color: var(--accent-cyan); width: 16px; height: 16px; cursor: pointer;">
                    </td>
                    <td>
                        <span class="sheet-name-badge">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-cyan-light);"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                            ${escapeHtml(sheet.name)}
                        </span>
                    </td>
                    <td>
                        <span class="sheet-dim-badge">
                            ${sheet.rowCount.toLocaleString()} filas • ${sheet.colCount} cols
                        </span>
                    </td>
                    <td>
                        <input type="text" class="sheet-csv-filename-input" data-wb="${wbIndex}" data-sheet="${sheetIndex}" value="${escapeHtml(sheet.suggestedFileName)}">
                    </td>
                    <td class="sheet-actions-cell">
                        <div class="sheet-actions-cell-inner">
                            <button type="button" class="btn-action-icon" data-action="preview" data-wb="${wbIndex}" data-sheet="${sheetIndex}" title="Ver tabla de datos">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                <span>Vista Previa</span>
                            </button>
                            <button type="button" class="btn-action-icon btn-action-download" data-action="download-csv" data-wb="${wbIndex}" data-sheet="${sheetIndex}" title="Exportar y descargar esta hoja como CSV">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                <span>Descargar CSV</span>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });

        // Actualizar contadores
        totalSheetsBadge.textContent = `${totalSheets} hoja(s)`;
        updateGlobalActionStats(totalSheets, totalSelectedSheets);
        setupDynamicRowEvents();
    }

    /**
     * Vincula eventos sobre elementos generados dinámicamente
     */
    function setupDynamicRowEvents() {
        // Checkboxes de selección de hojas
        document.querySelectorAll('.sheet-select-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const wbIdx = parseInt(e.target.getAttribute('data-wb'), 10);
                const sheetIdx = parseInt(e.target.getAttribute('data-sheet'), 10);
                state.workbooks[wbIdx].sheets[sheetIdx].selected = e.target.checked;
                updateGlobalStatsOnly();
            });
        });

        // Inputs para editar nombre del archivo CSV
        document.querySelectorAll('.sheet-csv-filename-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const wbIdx = parseInt(e.target.getAttribute('data-wb'), 10);
                const sheetIdx = parseInt(e.target.getAttribute('data-sheet'), 10);
                let val = e.target.value.trim();
                if (!val.toLowerCase().endsWith('.csv')) {
                    val += '.csv';
                    e.target.value = val;
                }
                state.workbooks[wbIdx].sheets[sheetIdx].suggestedFileName = val;
            });
        });

        // Botones de acción dentro de las tablas
        workbooksListContainer.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.getAttribute('data-action');
                const wbIdx = parseInt(btn.getAttribute('data-wb'), 10);
                const sheetIdx = parseInt(btn.getAttribute('data-sheet'), 10);

                if (action === 'toggle-select-all') {
                    toggleSelectAllInWorkbook(wbIdx);
                } else if (action === 'zip-wb') {
                    exportWorkbookAsZip(wbIdx);
                } else if (action === 'remove-wb') {
                    removeWorkbook(wbIdx);
                } else if (action === 'preview') {
                    openSheetPreview(wbIdx, sheetIdx);
                } else if (action === 'download-csv') {
                    downloadSingleSheetCsv(wbIdx, sheetIdx);
                }
            });
        });
    }

    /**
     * Alternar selección de todas las hojas de un libro en particular
     */
    function toggleSelectAllInWorkbook(wbIndex) {
        const wb = state.workbooks[wbIndex];
        if (!wb) return;
        const allSelected = wb.sheets.every(s => s.selected);
        wb.sheets.forEach(s => s.selected = !allSelected);
        renderWorkbooksList();
    }

    /**
     * Quitar un libro cargado
     */
    function removeWorkbook(wbIndex) {
        state.workbooks.splice(wbIndex, 1);
        renderWorkbooksList();
        showToast('Libro removido de la lista.', 'info');
    }

    /**
     * Actualiza la barra global de acciones con la cantidad de hojas listas
     */
    function updateGlobalActionStats(totalSheets, totalSelected) {
        if (totalSheets > 0) {
            globalExportBar.style.display = 'flex';
            globalSelectedStats.textContent = `${totalSelected} de ${totalSheets} hojas seleccionadas para exportar`;
            
            btnDownloadAllZip.disabled = totalSelected === 0;
            btnDownloadAllIndividual.disabled = totalSelected === 0;
            btnDownloadAllZip.style.opacity = totalSelected === 0 ? '0.5' : '1';
            btnDownloadAllIndividual.style.opacity = totalSelected === 0 ? '0.5' : '1';
        } else {
            globalExportBar.style.display = 'none';
        }
    }

    function updateGlobalStatsOnly() {
        let total = 0;
        let selected = 0;
        state.workbooks.forEach(wb => {
            total += wb.sheets.length;
            selected += wb.sheets.filter(s => s.selected).length;
        });
        updateGlobalActionStats(total, selected);
    }

    /**
     * Descarga una hoja específica como CSV de inmediato
     */
    function downloadSingleSheetCsv(wbIndex, sheetIndex) {
        const wb = state.workbooks[wbIndex];
        if (!wb) return;
        const sheet = wb.sheets[sheetIndex];
        if (!sheet) return;

        const options = getExportOptions();
        const result = window.excelToCsvConverter.generateCsv(sheet.matrix, options);
        downloadBlob(result.blob, sheet.suggestedFileName);

        showToast(`Hoja "${sheet.name}" exportada con éxito (${result.rowCount.toLocaleString()} filas).`, 'success');
    }

    /**
     * Exporta en un archivo ZIP todas las hojas seleccionadas de un libro particular
     */
    async function exportWorkbookAsZip(wbIndex) {
        const wb = state.workbooks[wbIndex];
        if (!wb) return;

        const selectedSheets = wb.sheets.filter(s => s.selected);
        if (selectedSheets.length === 0) {
            showToast('Por favor, selecciona al menos una hoja para exportar.', 'warning');
            return;
        }

        try {
            showToast('Generando archivo ZIP...', 'info');
            const options = getExportOptions();
            const filesToZip = [];

            for (const sheet of selectedSheets) {
                const res = window.excelToCsvConverter.generateCsv(sheet.matrix, options);
                filesToZip.push({
                    filename: sheet.suggestedFileName,
                    blob: res.blob
                });
            }

            const zipBlob = await window.excelToCsvConverter.createZipPackage(filesToZip);
            const zipName = `${wb.baseName}_Hojas_CSV.zip`;
            downloadBlob(zipBlob, zipName);

            showToast(`¡Paquete ZIP creado con éxito! Contiene ${selectedSheets.length} archivo(s) CSV.`, 'success');
        } catch (err) {
            console.error(err);
            showToast('Error al empaquetar el archivo ZIP: ' + err.message, 'error');
        }
    }

    /**
     * Configuración de botones globales de descarga
     */
    function setupGlobalActions() {
        // Descargar todas las hojas seleccionadas en un único archivo ZIP
        btnDownloadAllZip.addEventListener('click', async () => {
            const allSelectedSheets = [];
            state.workbooks.forEach(wb => {
                wb.sheets.forEach(sheet => {
                    if (sheet.selected) {
                        allSelectedSheets.push(sheet);
                    }
                });
            });

            if (allSelectedSheets.length === 0) {
                showToast('No hay hojas seleccionadas para exportar.', 'warning');
                return;
            }

            try {
                showToast(`Generando archivo ZIP con ${allSelectedSheets.length} hojas CSV...`, 'info');
                const options = getExportOptions();
                const filesToZip = [];

                for (const sheet of allSelectedSheets) {
                    const res = window.excelToCsvConverter.generateCsv(sheet.matrix, options);
                    filesToZip.push({
                        filename: sheet.suggestedFileName,
                        blob: res.blob
                    });
                }

                const zipBlob = await window.excelToCsvConverter.createZipPackage(filesToZip);
                const defaultZipName = state.workbooks.length === 1 
                    ? `${state.workbooks[0].baseName}_Hojas_CSV.zip`
                    : `Excel_Export_${new Date().toISOString().slice(0, 10)}.zip`;

                downloadBlob(zipBlob, defaultZipName);
                showToast(`¡ZIP descargado exitosamente con ${allSelectedSheets.length} archivos CSV!`, 'success');
            } catch (err) {
                console.error(err);
                showToast('Error al exportar el archivo ZIP: ' + err.message, 'error');
            }
        });

        // Descargar cada hoja individualmente como archivos CSV independientes
        btnDownloadAllIndividual.addEventListener('click', () => {
            const allSelectedSheets = [];
            state.workbooks.forEach(wb => {
                wb.sheets.forEach(sheet => {
                    if (sheet.selected) {
                        allSelectedSheets.push(sheet);
                    }
                });
            });

            if (allSelectedSheets.length === 0) {
                showToast('No hay hojas seleccionadas para descargar.', 'warning');
                return;
            }

            const options = getExportOptions();
            showToast(`Iniciando descarga de ${allSelectedSheets.length} archivos CSV...`, 'info');

            allSelectedSheets.forEach((sheet, idx) => {
                setTimeout(() => {
                    const res = window.excelToCsvConverter.generateCsv(sheet.matrix, options);
                    downloadBlob(res.blob, sheet.suggestedFileName);
                }, idx * 200); // 200ms de intervalo para evitar bloqueos del navegador
            });
        });
    }

    /**
     * Abre el modal de vista previa con la tabla de datos de la hoja seleccionada
     */
    function openSheetPreview(wbIndex, sheetIndex) {
        const wb = state.workbooks[wbIndex];
        if (!wb) return;
        const sheet = wb.sheets[sheetIndex];
        if (!sheet) return;

        state.currentPreviewSheet = { wbIndex, sheetIndex, sheet };

        modalSheetTitle.textContent = `Hoja: ${sheet.name} (${wb.fileName})`;
        modalTableStats.textContent = `${sheet.rowCount.toLocaleString()} filas detectadas • ${sheet.colCount} columnas`;

        // Renderizar tabla
        renderSpreadsheetPreview(sheet.previewSample, sheet.colCount);

        // Mostrar modal
        previewModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Renderiza las celdas en el visor de tabla del modal
     */
    function renderSpreadsheetPreview(matrix, colCount) {
        modalTableHead.innerHTML = '';
        modalTableBody.innerHTML = '';

        if (!matrix || matrix.length === 0) {
            modalTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 2rem; color: var(--text-muted);">Esta hoja está vacía.</td></tr>';
            return;
        }

        // Encabezado con letras de columnas de Excel (A, B, C...)
        const headerTr = document.createElement('tr');
        const numTh = document.createElement('th');
        numTh.textContent = '#';
        numTh.style.width = '45px';
        numTh.style.textAlign = 'center';
        headerTr.appendChild(numTh);

        const totalCols = Math.max(colCount, matrix[0] ? matrix[0].length : 0);
        for (let c = 0; c < totalCols; c++) {
            const th = document.createElement('th');
            const colLetter = getColumnLetter(c);
            const firstRowVal = matrix[0] && matrix[0][c] !== undefined ? String(matrix[0][c]).trim() : '';
            th.textContent = firstRowVal ? `${colLetter}: ${firstRowVal}` : colLetter;
            th.title = firstRowVal;
            headerTr.appendChild(th);
        }
        modalTableHead.appendChild(headerTr);

        // Filas del cuerpo (a partir de la fila 0 o 1)
        matrix.forEach((row, rowIdx) => {
            const tr = document.createElement('tr');
            
            // Número de fila (1, 2, 3...)
            const numTd = document.createElement('td');
            numTd.className = 'row-num';
            numTd.textContent = rowIdx + 1;
            tr.appendChild(numTd);

            for (let c = 0; c < totalCols; c++) {
                const td = document.createElement('td');
                const cellVal = row && row[c] !== undefined ? row[c] : '';
                td.textContent = cellVal !== null ? String(cellVal) : '';
                tr.appendChild(td);
            }

            modalTableBody.appendChild(tr);
        });
    }

    /**
     * Convierte un índice numérico a letras de columna estilo Excel (0 -> A, 1 -> B, 26 -> AA)
     */
    function getColumnLetter(colIndex) {
        let temp, letter = '';
        while (colIndex >= 0) {
            temp = colIndex % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            colIndex = Math.floor(colIndex / 26) - 1;
        }
        return letter;
    }

    /**
     * Eventos del modal
     */
    function setupModalEvents() {
        modalCloseBtn.addEventListener('click', closeModal);
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && previewModal.classList.contains('open')) {
                closeModal();
            }
        });

        btnModalDownloadCsv.addEventListener('click', () => {
            if (state.currentPreviewSheet) {
                downloadSingleSheetCsv(state.currentPreviewSheet.wbIndex, state.currentPreviewSheet.sheetIndex);
            }
        });
    }

    function closeModal() {
        previewModal.classList.remove('open');
        document.body.style.overflow = '';
        state.currentPreviewSheet = null;
    }

    /**
     * Configuración del Modal de Ayuda y Guía de Uso
     */
    function setupHelpModalEvents() {
        const helpModal = document.getElementById('helpModal');
        const btnOpenHelpModal = document.getElementById('btnOpenHelpModal');
        const btnOpenHelpHero = document.getElementById('btnOpenHelpHero');
        const btnCloseHelpModal = document.getElementById('btnCloseHelpModal');
        const btnDismissHelp = document.getElementById('btnDismissHelp');
        const helpTabBtns = document.querySelectorAll('#helpModal .help-tab-btn');
        const helpTabContents = document.querySelectorAll('#helpModal .help-tab-content');

        function openHelpModal() {
            if (!helpModal) return;
            helpModal.classList.add('active', 'open');
            document.body.style.overflow = 'hidden';
        }

        function closeHelpModal() {
            if (!helpModal) return;
            helpModal.classList.remove('active', 'open');
            document.body.style.overflow = '';
        }

        if (btnOpenHelpModal) {
            btnOpenHelpModal.addEventListener('click', (e) => {
                e.preventDefault();
                openHelpModal();
            });
        }

        if (btnOpenHelpHero) {
            btnOpenHelpHero.addEventListener('click', (e) => {
                e.preventDefault();
                openHelpModal();
            });
        }

        if (btnCloseHelpModal) {
            btnCloseHelpModal.addEventListener('click', closeHelpModal);
        }

        if (btnDismissHelp) {
            btnDismissHelp.addEventListener('click', closeHelpModal);
        }

        if (helpModal) {
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) closeHelpModal();
            });
        }

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && helpModal && (helpModal.classList.contains('open') || helpModal.classList.contains('active'))) {
                closeHelpModal();
            }
        });

        helpTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-tab');
                helpTabBtns.forEach(b => b.classList.remove('active'));
                helpTabContents.forEach(c => {
                    c.classList.remove('active');
                    c.style.display = 'none';
                });
                btn.classList.add('active');
                const targetContent = document.getElementById(targetId);
                if (targetContent) {
                    targetContent.classList.add('active');
                    targetContent.style.display = 'block';
                }
            });
        });
    }

    /**
     * Eventos de cambio en las opciones
     */
    function setupOptionsEvents() {
        [optDelimiter, optEncoding, optQuotes, optTrim, optSkipEmpty].forEach(el => {
            el.addEventListener('change', () => {
                showToast('Opciones de exportación actualizadas.', 'info', 1800);
            });
        });
    }

    /**
     * Dispara la descarga de un Blob en el navegador
     */
    function downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 250);
    }

    /**
     * Sistema de Notificaciones Toast
     */
    function showToast(message, type = 'info', duration = 3500) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        } else {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
