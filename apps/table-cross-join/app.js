/**
 * Cruzador y Conciliador de Tablas (JOIN Express) - app.js
 * Módulo #07 • Datos & Conciliación • SimpleApps Suite
 * 
 * Controlador de interfaz de usuario, eventos, presets, renderizado reactivo y exportación.
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. ESTADO GLOBAL DE LA APLICACIÓN
    // =========================================================================
    const state = {
        tableA: {
            name: '',
            headers: [],
            rows: [],
            workbook: null,
            sheetNames: [],
            activeSheet: '',
            isLoaded: false
        },
        tableB: {
            name: '',
            headers: [],
            rows: [],
            workbook: null,
            sheetNames: [],
            activeSheet: '',
            isLoaded: false
        },
        joinType: 'left',
        keyPairs: [
            { colA: '', colB: '' }
        ],
        reconciliation: {
            enabled: false,
            colA: '',
            colB: '',
            tolerance: 0
        },
        result: null,
        currentFilter: 'all', // 'all' | 'match' | 'only-a' | 'only-b' | 'diff'
        searchQuery: '',
        currentPage: 1,
        pageSize: 25,
        sortCol: null,
        sortAsc: true,
        pasteTarget: 'A'
    };

    // =========================================================================
    // 2. REFERENCIAS AL DOM
    // =========================================================================
    const DOM = {
        // Presets
        btnPresetBanking: document.getElementById('btnPresetBanking'),
        btnPresetInventory: document.getElementById('btnPresetInventory'),
        btnPresetCRM: document.getElementById('btnPresetCRM'),

        // Tabla A
        cardTableA: document.getElementById('cardTableA'),
        dropzoneA: document.getElementById('dropzoneA'),
        fileInputA: document.getElementById('fileInputA'),
        btnPasteA: document.getElementById('btnPasteA'),
        statusBadgeA: document.getElementById('statusBadgeA'),
        summaryA: document.getElementById('summaryA'),
        nameTextA: document.getElementById('nameTextA'),
        metaCountsA: document.getElementById('metaCountsA'),
        sheetRowA: document.getElementById('sheetRowA'),
        sheetSelectA: document.getElementById('sheetSelectA'),
        btnPreviewA: document.getElementById('btnPreviewA'),
        btnClearA: document.getElementById('btnClearA'),

        // Tabla B
        cardTableB: document.getElementById('cardTableB'),
        dropzoneB: document.getElementById('dropzoneB'),
        fileInputB: document.getElementById('fileInputB'),
        btnPasteB: document.getElementById('btnPasteB'),
        statusBadgeB: document.getElementById('statusBadgeB'),
        summaryB: document.getElementById('summaryB'),
        nameTextB: document.getElementById('nameTextB'),
        metaCountsB: document.getElementById('metaCountsB'),
        sheetRowB: document.getElementById('sheetRowB'),
        sheetSelectB: document.getElementById('sheetSelectB'),
        btnPreviewB: document.getElementById('btnPreviewB'),
        btnClearB: document.getElementById('btnClearB'),

        // Configuración JOIN
        joinTypesGrid: document.getElementById('joinTypesGrid'),
        keyPairsList: document.getElementById('keyPairsList'),
        btnAddKeyPair: document.getElementById('btnAddKeyPair'),
        btnAutoDetectKeys: document.getElementById('btnAutoDetectKeys'),

        // Auditoría / Conciliación
        chkEnableRecon: document.getElementById('chkEnableRecon'),
        reconciliationCard: document.getElementById('reconciliationCard'),
        reconColA: document.getElementById('reconColA'),
        reconColB: document.getElementById('reconColB'),
        reconTolerance: document.getElementById('reconTolerance'),

        // Opciones avanzadas
        btnAccordionToggle: document.getElementById('btnAccordionToggle'),
        accordionContent: document.getElementById('accordionContent'),
        accordionArrow: document.getElementById('accordionArrow'),
        optCaseInsensitive: document.getElementById('optCaseInsensitive'),
        optTrim: document.getElementById('optTrim'),
        optIgnoreLeadingZeros: document.getElementById('optIgnoreLeadingZeros'),
        optIgnorePunctuation: document.getElementById('optIgnorePunctuation'),
        optMultiMatchMode: document.getElementById('optMultiMatchMode'),
        optIncludeMatchStatus: document.getElementById('optIncludeMatchStatus'),
        optConflictMode: document.getElementById('optConflictMode'),

        // Ejecución
        btnExecuteJoin: document.getElementById('btnExecuteJoin'),

        // Resultados
        sectionResults: document.getElementById('sectionResults'),
        resultsExecutionBadge: document.getElementById('resultsExecutionBadge'),
        kpiTotalRows: document.getElementById('kpiTotalRows'),
        kpiMatches: document.getElementById('kpiMatches'),
        kpiOnlyA: document.getElementById('kpiOnlyA'),
        kpiOnlyB: document.getElementById('kpiOnlyB'),
        kpiReconCard: document.getElementById('kpiReconCard'),
        kpiSquare: document.getElementById('kpiSquare'),
        kpiDiff: document.getElementById('kpiDiff'),
        kpiSourceSummary: document.getElementById('kpiSourceSummary'),

        // Filtros y Búsqueda
        resultsFilterPills: document.getElementById('resultsFilterPills'),
        countPillAll: document.getElementById('countPillAll'),
        countPillMatch: document.getElementById('countPillMatch'),
        countPillOnlyA: document.getElementById('countPillOnlyA'),
        countPillOnlyB: document.getElementById('countPillOnlyB'),
        pillFilterDiff: document.getElementById('pillFilterDiff'),
        countPillDiff: document.getElementById('countPillDiff'),
        tableSearchInput: document.getElementById('tableSearchInput'),
        pageSizeSelect: document.getElementById('pageSizeSelect'),

        // Tabla y Paginación
        resultsDataTable: document.getElementById('resultsDataTable'),
        resultsTableHead: document.getElementById('resultsTableHead'),
        resultsTableBody: document.getElementById('resultsTableBody'),
        paginationInfo: document.getElementById('paginationInfo'),
        pageIndicator: document.getElementById('pageIndicator'),
        btnPagePrev: document.getElementById('btnPagePrev'),
        btnPageNext: document.getElementById('btnPageNext'),

        // Exportación
        btnExportExcel: document.getElementById('btnExportExcel'),
        btnExportCSV: document.getElementById('btnExportCSV'),
        btnCopyClipboard: document.getElementById('btnCopyClipboard'),
        btnExportReport: document.getElementById('btnExportReport'),

        // Modales
        helpModal: document.getElementById('helpModal'),
        btnOpenHelpModal: document.getElementById('btnOpenHelpModal'),
        btnOpenHelpHero: document.getElementById('btnOpenHelpHero'),
        btnCloseHelpModal: document.getElementById('btnCloseHelpModal'),
        btnDismissHelp: document.getElementById('btnDismissHelp'),
        btnHelpTryPreset: document.getElementById('btnHelpTryPreset'),
        helpTabsNav: document.getElementById('helpTabsNav'),

        pasteModal: document.getElementById('pasteModal'),
        pasteModalTitle: document.getElementById('pasteModalTitle'),
        pasteModalTextarea: document.getElementById('pasteModalTextarea'),
        chkPasteHasHeaders: document.getElementById('chkPasteHasHeaders'),
        btnCancelPaste: document.getElementById('btnCancelPaste'),
        btnConfirmPaste: document.getElementById('btnConfirmPaste'),
        btnClosePasteModal: document.getElementById('btnClosePasteModal'),

        previewModal: document.getElementById('previewModal'),
        previewModalTitle: document.getElementById('previewModalTitle'),
        previewModalSubtitle: document.getElementById('previewModalSubtitle'),
        previewTableHead: document.getElementById('previewTableHead'),
        previewTableBody: document.getElementById('previewTableBody'),
        btnClosePreviewModal: document.getElementById('btnClosePreviewModal'),
        btnDismissPreview: document.getElementById('btnDismissPreview'),

        // Toast
        toastContainer: document.getElementById('toastContainer')
    };

    // =========================================================================
    // 3. DATOS DE DEMOSTRACIÓN / PRESETS
    // =========================================================================
    const PRESETS = {
        banking: {
            tableA: {
                name: 'Mayor_Contable_Enero.xlsx',
                headers: ['ID_Asiento', 'Fecha', 'Ref_Pago', 'Monto_Libro', 'Beneficiario'],
                rows: [
                    { ID_Asiento: 'AS-1001', Fecha: '2026-01-05', Ref_Pago: 'TRF-9081', Monto_Libro: '150000.00', Beneficiario: 'Distribuidora Norte' },
                    { ID_Asiento: 'AS-1002', Fecha: '2026-01-08', Ref_Pago: 'TRF-9082', Monto_Libro: '45200.50', Beneficiario: 'Servicios Cloud Tech' },
                    { ID_Asiento: 'AS-1003', Fecha: '2026-01-12', Ref_Pago: 'TRF-9083', Monto_Libro: '89000.00', Beneficiario: 'Papelera Central' },
                    { ID_Asiento: 'AS-1004', Fecha: '2026-01-15', Ref_Pago: 'CHQ-5001', Monto_Libro: '120000.00', Beneficiario: 'Alquiler Oficinas' },
                    { ID_Asiento: 'AS-1005', Fecha: '2026-01-20', Ref_Pago: 'TRF-9085', Monto_Libro: '31500.00', Beneficiario: 'Mantenimiento Redes' },
                    { ID_Asiento: 'AS-1006', Fecha: '2026-01-22', Ref_Pago: 'TRF-9086', Monto_Libro: '76800.00', Beneficiario: 'Logística Exprés' },
                    { ID_Asiento: 'AS-1007', Fecha: '2026-01-28', Ref_Pago: 'TRF-9087', Monto_Libro: '14300.00', Beneficiario: 'Suministros Café' }
                ]
            },
            tableB: {
                name: 'Extracto_Bancario_BancoChile.csv',
                headers: ['Nro_Operacion', 'Fecha_Valor', 'Referencia_Doc', 'Cargo_Banco', 'Descripcion_Banco'],
                rows: [
                    { Nro_Operacion: 'OP-4401', Fecha_Valor: '2026-01-05', Referencia_Doc: 'TRF-9081', Cargo_Banco: '150000.00', Descripcion_Banco: 'TRANSFERENCIA A DISTRIB NORTE' },
                    { Nro_Operacion: 'OP-4402', Fecha_Valor: '2026-01-08', Referencia_Doc: 'TRF-9082', Cargo_Banco: '45200.50', Descripcion_Banco: 'PAGO CLOUD SERVICIOS' },
                    { Nro_Operacion: 'OP-4403', Fecha_Valor: '2026-01-12', Referencia_Doc: 'TRF-9083', Cargo_Banco: '88500.00', Descripcion_Banco: 'CARGO PAPELERA (CON DESCTO)' }, // Descuadre de monto
                    { Nro_Operacion: 'OP-4404', Fecha_Valor: '2026-01-20', Referencia_Doc: 'TRF-9085', Cargo_Banco: '31500.00', Descripcion_Banco: 'TRANSF MANT REDES' },
                    { Nro_Operacion: 'OP-4405', Fecha_Valor: '2026-01-22', Referencia_Doc: 'TRF-9086', Cargo_Banco: '76800.00', Descripcion_Banco: 'LOGISTICA EXPRES CARGO' },
                    { Nro_Operacion: 'OP-4406', Fecha_Valor: '2026-01-30', Referencia_Doc: 'COM-9901', Cargo_Banco: '5000.00', Descripcion_Banco: 'COMISION MANTENCION CUENTA' } // Solo en Banco
                ]
            },
            joinType: 'left',
            keys: [{ colA: 'Ref_Pago', colB: 'Referencia_Doc' }],
            recon: { enabled: true, colA: 'Monto_Libro', colB: 'Cargo_Banco', tolerance: 0 }
        },
        inventory: {
            tableA: {
                name: 'Inventario_Fisico_Deposito.csv',
                headers: ['SKU', 'Pasillo', 'Conteo_Fisico', 'Inspector'],
                rows: [
                    { SKU: 'PROD-001', Pasillo: 'A-12', Conteo_Fisico: '150', Inspector: 'Carlos M.' },
                    { SKU: 'PROD-002', Pasillo: 'A-14', Conteo_Fisico: '80', Inspector: 'Carlos M.' },
                    { SKU: 'PROD-003', Pasillo: 'B-01', Conteo_Fisico: '45', Inspector: 'Ana P.' },
                    { SKU: 'PROD-004', Pasillo: 'B-05', Conteo_Fisico: '300', Inspector: 'Ana P.' },
                    { SKU: 'PROD-005', Pasillo: 'C-02', Conteo_Fisico: '12', Inspector: 'Roberto G.' },
                    { SKU: 'PROD-007', Pasillo: 'C-09', Conteo_Fisico: '95', Inspector: 'Roberto G.' }
                ]
            },
            tableB: {
                name: 'Maestro_ERP_Stock.xlsx',
                headers: ['Codigo_SKU', 'Descripcion_Articulo', 'Stock_Teorico_ERP', 'Precio_Unitario'],
                rows: [
                    { Codigo_SKU: 'PROD-001', Descripcion_Articulo: 'Teclado Mecánico RGB', Stock_Teorico_ERP: '150', Precio_Unitario: '45.00' },
                    { Codigo_SKU: 'PROD-002', Descripcion_Articulo: 'Mouse Inalámbrico Pro', Stock_Teorico_ERP: '85', Precio_Unitario: '25.00' }, // Diferencia de 5 unidades
                    { Codigo_SKU: 'PROD-003', Descripcion_Articulo: 'Auriculares Noise Cancel', Stock_Teorico_ERP: '45', Precio_Unitario: '89.00' },
                    { Codigo_SKU: 'PROD-004', Descripcion_Articulo: 'Alfombrilla Gaming XL', Stock_Teorico_ERP: '300', Precio_Unitario: '15.00' },
                    { Codigo_SKU: 'PROD-006', Descripcion_Articulo: 'Webcam 1080p 60fps', Stock_Teorico_ERP: '40', Precio_Unitario: '55.00' }, // Solo en ERP
                    { Codigo_SKU: 'PROD-007', Descripcion_Articulo: 'Hub USB-C 7 en 1', Stock_Teorico_ERP: '95', Precio_Unitario: '32.00' }
                ]
            },
            joinType: 'full',
            keys: [{ colA: 'SKU', colB: 'Codigo_SKU' }],
            recon: { enabled: true, colA: 'Conteo_Fisico', colB: 'Stock_Teorico_ERP', tolerance: 0 }
        },
        crm: {
            tableA: {
                name: 'Ventas_Facturadas_Q1.csv',
                headers: ['Nro_Factura', 'Cod_Cliente', 'Total_Factura', 'Fecha_Venta'],
                rows: [
                    { Nro_Factura: 'F-8801', Cod_Cliente: 'CLI-100', Total_Factura: '1250.00', Fecha_Venta: '2026-02-01' },
                    { Nro_Factura: 'F-8802', Cod_Cliente: 'CLI-102', Total_Factura: '3400.00', Fecha_Venta: '2026-02-03' },
                    { Nro_Factura: 'F-8803', Cod_Cliente: 'CLI-105', Total_Factura: '780.00', Fecha_Venta: '2026-02-05' },
                    { Nro_Factura: 'F-8804', Cod_Cliente: 'CLI-100', Total_Factura: '920.00', Fecha_Venta: '2026-02-10' },
                    { Nro_Factura: 'F-8805', Cod_Cliente: 'CLI-109', Total_Factura: '5100.00', Fecha_Venta: '2026-02-14' }
                ]
            },
            tableB: {
                name: 'Directorio_Clientes_CRM.xlsx',
                headers: ['ID_Cliente', 'Nombre_Empresa', 'Segmento', 'Pais', 'Ejecutivo_Comercial'],
                rows: [
                    { ID_Cliente: 'CLI-100', Nombre_Empresa: 'Soluciones Globales S.A.', Segmento: 'Corporativo', Pais: 'Chile', Ejecutivo_Comercial: 'Marcela V.' },
                    { ID_Cliente: 'CLI-102', Nombre_Empresa: 'Inversiones Austral SpA', Segmento: 'Mediana Empresa', Pais: 'Chile', Ejecutivo_Comercial: 'Diego R.' },
                    { ID_Cliente: 'CLI-105', Nombre_Empresa: 'Retail del Pacífico', Segmento: 'Retail', Pais: 'Perú', Ejecutivo_Comercial: 'Marcela V.' },
                    { ID_Cliente: 'CLI-108', Nombre_Empresa: 'Farmacéutica Andina', Segmento: 'Salud', Pais: 'Colombia', Ejecutivo_Comercial: 'Lucía S.' }
                ]
            },
            joinType: 'left',
            keys: [{ colA: 'Cod_Cliente', colB: 'ID_Cliente' }],
            recon: { enabled: false, colA: '', colB: '', tolerance: 0 }
        }
    };

    // =========================================================================
    // 4. FUNCIONES DE CARGA Y PARSEO DE ARCHIVOS
    // =========================================================================

    /**
     * Procesa un archivo subido para una tabla objetivo ('A' o 'B')
     */
    function handleFileUpload(file, target) {
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();

        if (ext === 'xlsx' || ext === 'xls') {
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    processWorkbook(workbook, file.name, target);
                    showToast(`Archivo Excel cargado en Tabla ${target} (${file.name})`, 'success');
                } catch (err) {
                    console.error(err);
                    showToast(`Error al leer archivo Excel: ${err.message}`, 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            // CSV / TSV / TXT
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const parsed = RelationalEngine.parseCSV(text);
                    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
                        showToast(`El archivo no contiene filas válidas de datos.`, 'error');
                        return;
                    }
                    setTableData(target, {
                        name: file.name,
                        headers: parsed.headers,
                        rows: parsed.rows,
                        workbook: null,
                        sheetNames: [],
                        activeSheet: ''
                    });
                    showToast(`Archivo CSV cargado en Tabla ${target} (${parsed.rows.length} filas)`, 'success');
                } catch (err) {
                    console.error(err);
                    showToast(`Error al procesar archivo CSV: ${err.message}`, 'error');
                }
            };
            reader.readAsText(file);
        }
    }

    /**
     * Extrae las hojas y la primera hoja activa de un libro SheetJS
     */
    function processWorkbook(workbook, fileName, target) {
        const sheetNames = workbook.SheetNames || [];
        if (sheetNames.length === 0) {
            showToast('El archivo Excel no tiene hojas disponibles.', 'error');
            return;
        }

        const activeSheet = sheetNames[0];
        const worksheet = workbook.Sheets[activeSheet];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Determinar encabezados
        let headers = [];
        if (rows.length > 0) {
            headers = Object.keys(rows[0]);
        } else {
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
            for (let C = range.s.c; C <= range.e.c; ++C) {
                headers.push(XLSX.utils.encode_col(C));
            }
        }

        setTableData(target, {
            name: fileName,
            headers,
            rows,
            workbook,
            sheetNames,
            activeSheet
        });
    }

    /**
     * Actualiza el estado y el DOM de la tabla especificada
     */
    function setTableData(target, data) {
        const isA = target === 'A';
        const tbl = isA ? state.tableA : state.tableB;

        tbl.name = data.name || (isA ? 'Tabla_A.csv' : 'Tabla_B.csv');
        tbl.headers = data.headers || [];
        tbl.rows = data.rows || [];
        tbl.workbook = data.workbook || null;
        tbl.sheetNames = data.sheetNames || [];
        tbl.activeSheet = data.activeSheet || '';
        tbl.isLoaded = tbl.rows.length > 0;

        // Elementos DOM
        const card = isA ? DOM.cardTableA : DOM.cardTableB;
        const statusBadge = isA ? DOM.statusBadgeA : DOM.statusBadgeB;
        const nameText = isA ? DOM.nameTextA : DOM.nameTextB;
        const metaCounts = isA ? DOM.metaCountsA : DOM.metaCountsB;
        const sheetRow = isA ? DOM.sheetRowA : DOM.sheetRowB;
        const sheetSelect = isA ? DOM.sheetSelectA : DOM.sheetSelectB;

        if (tbl.isLoaded) {
            card.classList.add('loaded');
            statusBadge.textContent = '✓ Cargada';
            statusBadge.style.color = '#10B981';
            nameText.textContent = tbl.name;
            metaCounts.textContent = `${tbl.rows.length} filas • ${tbl.headers.length} cols`;

            if (tbl.sheetNames.length > 1) {
                sheetRow.style.display = 'flex';
                sheetSelect.innerHTML = tbl.sheetNames.map(s => `<option value="${s}" ${s === tbl.activeSheet ? 'selected' : ''}>${s}</option>`).join('');
            } else {
                sheetRow.style.display = 'none';
            }
        } else {
            card.classList.remove('loaded');
            statusBadge.textContent = 'Pendiente';
            statusBadge.style.color = 'var(--text-muted)';
            sheetRow.style.display = 'none';
        }

        // Actualizar selectores de clave y auditoría
        updateKeySelectors();
        updateReconciliationSelectors();

        // Autodetectar claves si ambas están listas
        if (state.tableA.isLoaded && state.tableB.isLoaded) {
            autoDetectKeys(false); // silencioso
        }
    }

    /**
     * Cambia de hoja activa en una tabla Excel
     */
    function switchSheet(target, sheetName) {
        const tbl = target === 'A' ? state.tableA : state.tableB;
        if (!tbl.workbook || !tbl.workbook.Sheets[sheetName]) return;

        tbl.activeSheet = sheetName;
        const worksheet = tbl.workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        let headers = [];
        if (rows.length > 0) {
            headers = Object.keys(rows[0]);
        }

        tbl.headers = headers;
        tbl.rows = rows;

        const metaCounts = target === 'A' ? DOM.metaCountsA : DOM.metaCountsB;
        metaCounts.textContent = `${rows.length} filas • ${headers.length} cols`;

        updateKeySelectors();
        updateReconciliationSelectors();
        showToast(`Cargada hoja "${sheetName}" con ${rows.length} filas`, 'info');
    }

    /**
     * Limpia los datos de una tabla
     */
    function clearTable(target) {
        setTableData(target, {
            name: '',
            headers: [],
            rows: [],
            workbook: null,
            sheetNames: [],
            activeSheet: ''
        });
        showToast(`Datos de Tabla ${target} eliminados`, 'info');
    }

    // =========================================================================
    // 5. GESTIÓN DE COLUMNAS CLAVE & SELECTORES DINÁMICOS
    // =========================================================================

    /**
     * Renderiza la lista de pares de claves vinculadas
     */
    function updateKeySelectors() {
        const headersA = state.tableA.headers;
        const headersB = state.tableB.headers;

        DOM.keyPairsList.innerHTML = '';

        state.keyPairs.forEach((pair, index) => {
            const row = document.createElement('div');
            row.className = 'key-pair-row';
            row.dataset.index = index;

            // Selector Col A
            const wrapA = document.createElement('div');
            wrapA.className = 'key-select-wrap';
            const labelA = document.createElement('label');
            labelA.className = 'key-select-label';
            labelA.textContent = `Columna en Tabla A ${headersA.length ? `(${headersA.length})` : ''}`;
            const selectA = document.createElement('select');
            selectA.className = 'key-select select-key-a';
            selectA.innerHTML = headersA.length === 0
                ? '<option value="">(Carga Tabla A primero)</option>'
                : headersA.map(h => `<option value="${h}" ${h === pair.colA ? 'selected' : ''}>${h}</option>`).join('');
            selectA.addEventListener('change', (e) => {
                pair.colA = e.target.value;
            });
            wrapA.appendChild(labelA);
            wrapA.appendChild(selectA);

            // Icono Enlace
            const linkIcon = document.createElement('div');
            linkIcon.className = 'key-link-icon';
            linkIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

            // Selector Col B
            const wrapB = document.createElement('div');
            wrapB.className = 'key-select-wrap';
            const labelB = document.createElement('label');
            labelB.className = 'key-select-label';
            labelB.textContent = `Columna en Tabla B ${headersB.length ? `(${headersB.length})` : ''}`;
            const selectB = document.createElement('select');
            selectB.className = 'key-select select-key-b';
            selectB.innerHTML = headersB.length === 0
                ? '<option value="">(Carga Tabla B primero)</option>'
                : headersB.map(h => `<option value="${h}" ${h === pair.colB ? 'selected' : ''}>${h}</option>`).join('');
            selectB.addEventListener('change', (e) => {
                pair.colB = e.target.value;
            });
            wrapB.appendChild(labelB);
            wrapB.appendChild(selectB);

            // Botón Eliminar fila de clave
            const btnRemove = document.createElement('button');
            btnRemove.type = 'button';
            btnRemove.className = 'btn-remove-key';
            btnRemove.title = 'Eliminar este par de clave';
            btnRemove.innerHTML = '&times;';
            btnRemove.style.fontSize = '1.3rem';
            if (state.keyPairs.length <= 1) {
                btnRemove.style.visibility = 'hidden';
            }
            btnRemove.addEventListener('click', () => {
                if (state.keyPairs.length > 1) {
                    state.keyPairs.splice(index, 1);
                    updateKeySelectors();
                }
            });

            // Sincronizar selección por defecto si no estaba definida
            if (!pair.colA && headersA.length > 0) pair.colA = headersA[0];
            if (!pair.colB && headersB.length > 0) pair.colB = headersB[0];

            row.appendChild(wrapA);
            row.appendChild(linkIcon);
            row.appendChild(wrapB);
            row.appendChild(btnRemove);

            DOM.keyPairsList.appendChild(row);
        });
    }

    /**
     * Actualiza los selectores para la conciliación de montos / saldos
     */
    function updateReconciliationSelectors() {
        const headersA = state.tableA.headers;
        const headersB = state.tableB.headers;

        DOM.reconColA.innerHTML = headersA.length === 0
            ? '<option value="">(Sin columnas en A)</option>'
            : headersA.map(h => `<option value="${h}" ${h === state.reconciliation.colA ? 'selected' : ''}>${h}</option>`).join('');

        DOM.reconColB.innerHTML = headersB.length === 0
            ? '<option value="">(Sin columnas en B)</option>'
            : headersB.map(h => `<option value="${h}" ${h === state.reconciliation.colB ? 'selected' : ''}>${h}</option>`).join('');

        // Autodetectar columnas que contengan nombres típicos de saldo/monto
        if (headersA.length > 0 && !state.reconciliation.colA) {
            const foundA = headersA.find(h => /monto|saldo|precio|total|importe|valor|costo|cantidad|count/i.test(h));
            if (foundA) {
                state.reconciliation.colA = foundA;
                DOM.reconColA.value = foundA;
            }
        }
        if (headersB.length > 0 && !state.reconciliation.colB) {
            const foundB = headersB.find(h => /monto|saldo|precio|total|importe|valor|costo|cantidad|count/i.test(h));
            if (foundB) {
                state.reconciliation.colB = foundB;
                DOM.reconColB.value = foundB;
            }
        }
    }

    /**
     * Algoritmo de autodetección de columnas clave
     */
    function autoDetectKeys(showNotify = true) {
        const headersA = state.tableA.headers;
        const headersB = state.tableB.headers;

        if (headersA.length === 0 || headersB.length === 0) {
            if (showNotify) showToast('Carga ambas tablas primero para autodetectar claves.', 'info');
            return;
        }

        const cleanStr = s => s.toLowerCase().replace(/[\_\-\s]/g, '');
        let bestPair = null;

        // 1. Coincidencia exacta de nombre limpio
        for (const ha of headersA) {
            for (const hb of headersB) {
                if (cleanStr(ha) === cleanStr(hb)) {
                    bestPair = { colA: ha, colB: hb };
                    break;
                }
            }
            if (bestPair) break;
        }

        // 2. Coincidencia semántica con patrones comunes (id, sku, codigo, rut, email)
        if (!bestPair) {
            const patterns = [/id/i, /sku/i, /cod/i, /codigo/i, /código/i, /rut/i, /dni/i, /cuit/i, /ref/i, /email/i];
            for (const pat of patterns) {
                const candA = headersA.find(h => pat.test(h));
                const candB = headersB.find(h => pat.test(h));
                if (candA && candB) {
                    bestPair = { colA: candA, colB: candB };
                    break;
                }
            }
        }

        if (bestPair) {
            state.keyPairs = [bestPair];
            updateKeySelectors();
            if (showNotify) {
                showToast(`Clave detectada: "${bestPair.colA}" (Tabla A) ↔ "${bestPair.colB}" (Tabla B)`, 'success');
            }
        } else if (showNotify) {
            showToast('No se encontró coincidencia automática evidente. Selecciona manualmente.', 'info');
        }
    }

    // =========================================================================
    // 6. EJECUCIÓN DEL CRUCE RELACIONAL (JOIN)
    // =========================================================================

    function executeJoin() {
        if (!state.tableA.isLoaded) {
            showToast('Por favor carga los datos de la Tabla A.', 'error');
            return;
        }
        if (!state.tableB.isLoaded) {
            showToast('Por favor carga los datos de la Tabla B.', 'error');
            return;
        }

        // Validar claves
        const validKeys = state.keyPairs.filter(p => p.colA && p.colB);
        if (validKeys.length === 0) {
            showToast('Debes seleccionar al menos un par de columnas clave para cruzar.', 'error');
            return;
        }

        // Configuración de conciliación de valores
        const reconciliations = [];
        if (DOM.chkEnableRecon.checked) {
            const colA = DOM.reconColA.value;
            const colB = DOM.reconColB.value;
            const tolerance = parseFloat(DOM.reconTolerance.value) || 0;
            if (colA && colB) {
                reconciliations.push({
                    colA,
                    colB,
                    tolerance,
                    label: `${colA}_vs_${colB}`
                });
            }
        }

        const config = {
            joinType: state.joinType,
            keys: validKeys,
            keyOptions: {
                trim: DOM.optTrim.checked,
                caseInsensitive: DOM.optCaseInsensitive.checked,
                ignoreLeadingZeros: DOM.optIgnoreLeadingZeros.checked,
                ignorePunctuation: DOM.optIgnorePunctuation.checked
            },
            multiMatchMode: DOM.optMultiMatchMode.value,
            conflictMode: DOM.optConflictMode.value,
            includeMatchStatus: DOM.optIncludeMatchStatus.checked,
            reconciliations
        };

        try {
            const result = RelationalEngine.join(state.tableA, state.tableB, config);
            state.result = result;
            state.currentPage = 1;
            state.currentFilter = 'all';
            state.searchQuery = '';
            DOM.tableSearchInput.value = '';

            renderResultsDashboard();

            DOM.sectionResults.classList.add('visible');
            DOM.sectionResults.scrollIntoView({ behavior: 'smooth' });

            showToast(`¡Cruce relacional completado en ${result.stats.executionTimeMs} ms! (${result.stats.resultRowCount} filas generadas)`, 'success');
        } catch (err) {
            console.error(err);
            showToast(`Error al ejecutar el cruce: ${err.message}`, 'error');
        }
    }

    // =========================================================================
    // 7. RENDERIZADO DE RESULTADOS, KPIS Y TABLA
    // =========================================================================

    function renderResultsDashboard() {
        if (!state.result) return;
        const stats = state.result.stats;

        // Insignia de ejecución
        DOM.resultsExecutionBadge.textContent = `Procesamiento en memoria completado en ${stats.executionTimeMs} ms • Modalidad: ${stats.joinType.toUpperCase()} JOIN`;

        // KPIs
        DOM.kpiTotalRows.textContent = stats.resultRowCount.toLocaleString();
        DOM.kpiMatches.textContent = stats.matchesCount.toLocaleString();
        DOM.kpiOnlyA.textContent = stats.unmatchedCountA.toLocaleString();
        DOM.kpiOnlyB.textContent = stats.unmatchedCountB.toLocaleString();
        DOM.kpiSourceSummary.textContent = `${stats.totalRowsA} en A • ${stats.totalRowsB} en B`;

        // KPI Conciliación si aplica
        if (state.result.meta.reconciliations && state.result.meta.reconciliations.length > 0) {
            DOM.kpiReconCard.style.display = 'flex';
            DOM.kpiSquare.textContent = stats.reconciledSquareCount.toLocaleString();
            DOM.kpiDiff.textContent = stats.reconciledDiffCount.toLocaleString();

            DOM.pillFilterDiff.style.display = 'inline-block';
            DOM.countPillDiff.textContent = stats.reconciledDiffCount;
        } else {
            DOM.kpiReconCard.style.display = 'none';
            DOM.pillFilterDiff.style.display = 'none';
        }

        // Contadores en los pills
        DOM.countPillAll.textContent = stats.resultRowCount;
        DOM.countPillMatch.textContent = stats.matchesCount;
        DOM.countPillOnlyA.textContent = stats.unmatchedCountA;
        DOM.countPillOnlyB.textContent = stats.unmatchedCountB;

        renderResultsTable();
    }

    function renderResultsTable() {
        if (!state.result) return;

        const headers = state.result.headers;
        let rows = state.result.rows;

        // 1. Filtrar por tipo (match, only-a, only-b, diff)
        if (state.currentFilter === 'match') {
            rows = rows.filter(r => r['_ESTADO_CRUCE'] === 'COINCIDENCIA (A + B)');
        } else if (state.currentFilter === 'only-a') {
            rows = rows.filter(r => r['_ESTADO_CRUCE'] === 'SOLO EN TABLA A');
        } else if (state.currentFilter === 'only-b') {
            rows = rows.filter(r => r['_ESTADO_CRUCE'] === 'SOLO EN TABLA B');
        } else if (state.currentFilter === 'diff') {
            rows = rows.filter(r => {
                return Object.keys(r).some(k => k.startsWith('_AUDIT_') && r[k] === 'DESCUADRADO');
            });
        }

        // 2. Filtrar por término de búsqueda
        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            rows = rows.filter(row => {
                return headers.some(h => String(row[h] || '').toLowerCase().includes(q));
            });
        }

        // 3. Ordenación
        if (state.sortCol) {
            const col = state.sortCol;
            const asc = state.sortAsc;
            rows = [...rows].sort((a, b) => {
                const valA = a[col] !== undefined ? a[col] : '';
                const valB = b[col] !== undefined ? b[col] : '';
                const numA = parseFloat(valA);
                const numB = parseFloat(valB);

                if (!isNaN(numA) && !isNaN(numB)) {
                    return asc ? numA - numB : numB - numA;
                }
                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();
                if (strA < strB) return asc ? -1 : 1;
                if (strA > strB) return asc ? 1 : -1;
                return 0;
            });
        }

        // 4. Paginación
        const totalFiltered = rows.length;
        const pSize = state.pageSize === Infinity ? totalFiltered : state.pageSize;
        const totalPages = Math.max(1, Math.ceil(totalFiltered / (pSize || 1)));

        if (state.currentPage > totalPages) state.currentPage = totalPages;
        if (state.currentPage < 1) state.currentPage = 1;

        const startIdx = (state.currentPage - 1) * pSize;
        const pageRows = rows.slice(startIdx, startIdx + pSize);

        // 5. Renderizar Encabezados
        DOM.resultsTableHead.innerHTML = `
            <tr>
                <th style="width: 40px; text-align: center;">#</th>
                ${headers.map(h => {
                    const isSorted = state.sortCol === h;
                    const arrow = isSorted ? (state.sortAsc ? ' ▲' : ' ▼') : '';
                    return `<th data-col="${h}" title="Clic para ordenar">${h}${arrow}</th>`;
                }).join('')}
            </tr>
        `;

        // 6. Renderizar Filas
        if (pageRows.length === 0) {
            DOM.resultsTableBody.innerHTML = `
                <tr>
                    <td colspan="${headers.length + 1}" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                        No hay registros que coincidan con los criterios o filtros seleccionados.
                    </td>
                </tr>
            `;
        } else {
            DOM.resultsTableBody.innerHTML = pageRows.map((row, idx) => {
                const globalIdx = startIdx + idx + 1;
                const status = row['_ESTADO_CRUCE'];

                let rowClass = '';
                if (status === 'COINCIDENCIA (A + B)') rowClass = 'tr-match';
                else if (status === 'SOLO EN TABLA A') rowClass = 'tr-only-a';
                else if (status === 'SOLO EN TABLA B') rowClass = 'tr-only-b';

                // Si tiene descuadre
                const hasDiff = Object.keys(row).some(k => k.startsWith('_AUDIT_') && row[k] === 'DESCUADRADO');
                if (hasDiff) rowClass = 'tr-diff';

                const cells = headers.map(h => {
                    const val = row[h] !== undefined ? row[h] : '';

                    // Formateo visual especial para columnas de estado y auditoría
                    if (h === '_ESTADO_CRUCE') {
                        if (val === 'COINCIDENCIA (A + B)') {
                            return `<td><span class="badge-status badge-match">MATCH</span></td>`;
                        } else if (val === 'SOLO EN TABLA A') {
                            return `<td><span class="badge-status badge-only-a">SOLO A</span></td>`;
                        } else if (val === 'SOLO EN TABLA B') {
                            return `<td><span class="badge-status badge-only-b">SOLO B</span></td>`;
                        }
                    }

                    if (h.startsWith('_AUDIT_')) {
                        if (val === 'CUADRADO') {
                            return `<td><span class="badge-status badge-square">✓ CUADRADO</span></td>`;
                        } else if (val === 'DESCUADRADO') {
                            return `<td><span class="badge-status badge-diff">⚠ DESCUADRE</span></td>`;
                        } else if (val === 'SIN_PAR') {
                            return `<td><span style="color:var(--text-muted); font-size:0.75rem;">-</span></td>`;
                        }
                    }

                    if (h.startsWith('_DIF_')) {
                        const num = parseFloat(val);
                        if (!isNaN(num)) {
                            const color = Math.abs(num) > 0 ? '#F87171' : 'var(--text-secondary)';
                            const sign = num > 0 ? `+${num}` : `${num}`;
                            return `<td style="color:${color}; font-family:var(--font-mono); font-weight:600;">${sign}</td>`;
                        }
                    }

                    return `<td>${escapeHtml(String(val))}</td>`;
                }).join('');

                return `<tr class="${rowClass}"><td style="text-align: center; color: var(--text-muted); font-family: var(--font-mono); font-size: 0.72rem;">${globalIdx}</td>${cells}</tr>`;
            }).join('');
        }

        // Actualizar barra de paginación
        const displayStart = totalFiltered > 0 ? startIdx + 1 : 0;
        const displayEnd = Math.min(startIdx + pSize, totalFiltered);
        DOM.paginationInfo.textContent = `Mostrando filas ${displayStart}-${displayEnd} de ${totalFiltered.toLocaleString()} (Total global: ${state.result.rows.length.toLocaleString()})`;
        DOM.pageIndicator.textContent = `Pág. ${state.currentPage} / ${totalPages}`;

        DOM.btnPagePrev.disabled = state.currentPage <= 1;
        DOM.btnPageNext.disabled = state.currentPage >= totalPages;
    }

    // =========================================================================
    // 8. EXPORTACIONES (EXCEL, CSV, TSV, MARKDOWN)
    // =========================================================================

    function exportToExcel() {
        if (!state.result || state.result.rows.length === 0) {
            showToast('No hay datos para exportar.', 'error');
            return;
        }

        try {
            const wb = XLSX.utils.book_new();

            // Hoja principal: Tabla Conciliada Completa
            const wsAll = XLSX.utils.json_to_sheet(state.result.rows);
            XLSX.utils.book_append_sheet(wb, wsAll, 'Conciliacion_Completa');

            // Si hay descuadres, crear hoja adicional dedicada para auditoría rápida
            const diffRows = state.result.rows.filter(r => {
                return Object.keys(r).some(k => k.startsWith('_AUDIT_') && r[k] === 'DESCUADRADO');
            });
            if (diffRows.length > 0) {
                const wsDiff = XLSX.utils.json_to_sheet(diffRows);
                XLSX.utils.book_append_sheet(wb, wsDiff, 'Solo_Descuadrados');
            }

            // Descargar
            const fileName = `Conciliacion_${state.joinType.toUpperCase()}_${Date.now()}.xlsx`;
            XLSX.writeFile(wb, fileName);
            showToast(`Archivo Excel "${fileName}" generado exitosamente`, 'success');
        } catch (err) {
            console.error(err);
            showToast(`Error al exportar a Excel: ${err.message}`, 'error');
        }
    }

    function exportToCSV() {
        if (!state.result || state.result.rows.length === 0) {
            showToast('No hay datos para exportar.', 'error');
            return;
        }

        try {
            const csv = RelationalEngine.exportToCSV(state.result.headers, state.result.rows, ',');
            downloadBlob(csv, `Conciliacion_${state.joinType}_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
            showToast('Archivo CSV descargado exitosamente.', 'success');
        } catch (err) {
            console.error(err);
            showToast(`Error al exportar CSV: ${err.message}`, 'error');
        }
    }

    function copyToClipboardTSV() {
        if (!state.result || state.result.rows.length === 0) {
            showToast('No hay datos para copiar.', 'error');
            return;
        }

        try {
            const tsv = RelationalEngine.exportToTSV(state.result.headers, state.result.rows);
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(tsv).then(() => {
                    showToast('¡Copiado al portapapeles en formato TSV! Pégalo en Excel con Ctrl+V.', 'success');
                }).catch(() => fallbackCopy(tsv));
            } else {
                fallbackCopy(tsv);
            }
        } catch (err) {
            console.error(err);
            showToast(`Error al copiar: ${err.message}`, 'error');
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('¡Copiado al portapapeles! Pégalo en Excel con Ctrl+V.', 'success');
    }

    function exportAuditReport() {
        if (!state.result) {
            showToast('Ejecuta un cruce primero para generar el reporte.', 'error');
            return;
        }

        try {
            const report = RelationalEngine.generateAuditReport(state.result.stats, {
                keys: state.keyPairs,
                multiMatchMode: DOM.optMultiMatchMode.value
            });
            downloadBlob(report, `Informe_Conciliacion_${state.joinType}_${Date.now()}.md`, 'text/markdown;charset=utf-8;');
            showToast('Informe de Auditoría en Markdown descargado.', 'success');
        } catch (err) {
            console.error(err);
            showToast(`Error al generar reporte: ${err.message}`, 'error');
        }
    }

    // =========================================================================
    // 9. MODALES (PEGAR DATOS & VISTA PREVIA)
    // =========================================================================

    function openPasteModal(target) {
        state.pasteTarget = target;
        DOM.pasteModalTitle.textContent = `Pegar Datos para Tabla ${target} (${target === 'A' ? 'Principal' : 'Secundaria'})`;
        DOM.pasteModalTextarea.value = '';
        DOM.pasteModal.classList.add('open');
        DOM.pasteModalTextarea.focus();
    }

    function closePasteModal() {
        DOM.pasteModal.classList.remove('open');
    }

    function confirmPaste() {
        const text = DOM.pasteModalTextarea.value.trim();
        if (!text) {
            showToast('Por favor pega algún texto o tabla con datos.', 'error');
            return;
        }

        const hasHeaders = DOM.chkPasteHasHeaders.checked;
        const parsed = RelationalEngine.parseCSV(text, { hasHeaders });

        if (parsed.headers.length === 0 || parsed.rows.length === 0) {
            showToast('No se pudieron detectar columnas ni filas válidas.', 'error');
            return;
        }

        setTableData(state.pasteTarget, {
            name: `Datos_Pegados_Tabla_${state.pasteTarget}.tsv`,
            headers: parsed.headers,
            rows: parsed.rows,
            workbook: null,
            sheetNames: [],
            activeSheet: ''
        });

        closePasteModal();
        showToast(`Datos cargados en Tabla ${state.pasteTarget} (${parsed.rows.length} filas)`, 'success');
    }

    function openPreviewModal(target) {
        const tbl = target === 'A' ? state.tableA : state.tableB;
        if (!tbl.isLoaded) return;

        DOM.previewModalTitle.textContent = `Vista Previa • Tabla ${target}: ${tbl.name}`;
        DOM.previewModalSubtitle.textContent = `${tbl.rows.length} filas totales • ${tbl.headers.length} columnas`;

        const slice = tbl.rows.slice(0, 25);
        DOM.previewTableHead.innerHTML = `
            <tr>
                <th style="width:40px; text-align:center;">#</th>
                ${tbl.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
            </tr>
        `;

        DOM.previewTableBody.innerHTML = slice.map((row, idx) => {
            const cells = tbl.headers.map(h => `<td>${escapeHtml(String(row[h] !== undefined ? row[h] : ''))}</td>`).join('');
            return `<tr><td style="text-align:center; color:var(--text-muted);">${idx + 1}</td>${cells}</tr>`;
        }).join('');

        DOM.previewModal.classList.add('open');
    }

    function closePreviewModal() {
        DOM.previewModal.classList.remove('open');
    }

    // Funciones del Centro de Ayuda
    function openHelpModal(targetTabId = 'tabHelpOverview') {
        if (!DOM.helpModal) return;
        switchHelpTab(targetTabId);
        DOM.helpModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeHelpModal() {
        if (!DOM.helpModal) return;
        DOM.helpModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    function switchHelpTab(tabId) {
        document.querySelectorAll('.help-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        document.querySelectorAll('.help-tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId);
        });
    }

    // =========================================================================
    // 10. CARGA DE PRESETS DE PRUEBA
    // =========================================================================

    function loadPreset(presetKey) {
        const preset = PRESETS[presetKey];
        if (!preset) return;

        setTableData('A', {
            name: preset.tableA.name,
            headers: [...preset.tableA.headers],
            rows: JSON.parse(JSON.stringify(preset.tableA.rows)),
            workbook: null,
            sheetNames: [],
            activeSheet: ''
        });

        setTableData('B', {
            name: preset.tableB.name,
            headers: [...preset.tableB.headers],
            rows: JSON.parse(JSON.stringify(preset.tableB.rows)),
            workbook: null,
            sheetNames: [],
            activeSheet: ''
        });

        // Tipo de JOIN
        state.joinType = preset.joinType;
        document.querySelectorAll('.join-type-card').forEach(card => {
            card.classList.toggle('active', card.dataset.type === state.joinType);
        });

        // Claves
        state.keyPairs = JSON.parse(JSON.stringify(preset.keys));
        updateKeySelectors();

        // Conciliación
        if (preset.recon && preset.recon.enabled) {
            DOM.chkEnableRecon.checked = true;
            DOM.reconciliationCard.classList.add('enabled');
            state.reconciliation.enabled = true;
            state.reconciliation.colA = preset.recon.colA;
            state.reconciliation.colB = preset.recon.colB;
            state.reconciliation.tolerance = preset.recon.tolerance || 0;
            DOM.reconColA.value = preset.recon.colA;
            DOM.reconColB.value = preset.recon.colB;
            DOM.reconTolerance.value = preset.recon.tolerance || 0;
        } else {
            DOM.chkEnableRecon.checked = false;
            DOM.reconciliationCard.classList.remove('enabled');
        }

        showToast(`Caso de demostración cargado con éxito. Presiona "Cruzar y Conciliar".`, 'success');
    }

    // =========================================================================
    // 11. REGISTRO DE EVENTOS DOM
    // =========================================================================

    // Drag and Drop Tabla A
    setupDropzone(DOM.dropzoneA, (file) => handleFileUpload(file, 'A'));
    DOM.fileInputA.addEventListener('change', (e) => handleFileUpload(e.target.files[0], 'A'));
    DOM.btnPasteA.addEventListener('click', () => openPasteModal('A'));
    DOM.btnPreviewA.addEventListener('click', () => openPreviewModal('A'));
    DOM.btnClearA.addEventListener('click', () => clearTable('A'));
    DOM.sheetSelectA.addEventListener('change', (e) => switchSheet('A', e.target.value));

    // Drag and Drop Tabla B
    setupDropzone(DOM.dropzoneB, (file) => handleFileUpload(file, 'B'));
    DOM.fileInputB.addEventListener('change', (e) => handleFileUpload(e.target.files[0], 'B'));
    DOM.btnPasteB.addEventListener('click', () => openPasteModal('B'));
    DOM.btnPreviewB.addEventListener('click', () => openPreviewModal('B'));
    DOM.btnClearB.addEventListener('click', () => clearTable('B'));
    DOM.sheetSelectB.addEventListener('change', (e) => switchSheet('B', e.target.value));

    // Presets
    DOM.btnPresetBanking.addEventListener('click', () => loadPreset('banking'));
    DOM.btnPresetInventory.addEventListener('click', () => loadPreset('inventory'));
    DOM.btnPresetCRM.addEventListener('click', () => loadPreset('crm'));

    // Selector de Tipos de JOIN
    DOM.joinTypesGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.join-type-card');
        if (!card) return;
        document.querySelectorAll('.join-type-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.joinType = card.dataset.type;
        showToast(`Tipo de cruce establecido en: ${card.querySelector('.join-type-name').textContent}`, 'info');
    });

    // Agregar / Detectar Claves
    DOM.btnAddKeyPair.addEventListener('click', () => {
        state.keyPairs.push({ colA: '', colB: '' });
        updateKeySelectors();
    });
    DOM.btnAutoDetectKeys.addEventListener('click', () => autoDetectKeys(true));

    // Conciliación de Montos
    DOM.chkEnableRecon.addEventListener('change', (e) => {
        state.reconciliation.enabled = e.target.checked;
        DOM.reconciliationCard.classList.toggle('enabled', e.target.checked);
    });

    // Acordeón
    DOM.btnAccordionToggle.addEventListener('click', () => {
        const isOpen = DOM.accordionContent.classList.toggle('open');
        DOM.accordionArrow.style.transform = isOpen ? 'rotate(180deg)' : '';
    });

    // Botón Ejecutar
    DOM.btnExecuteJoin.addEventListener('click', executeJoin);

    // Filtros de Resultados
    DOM.resultsFilterPills.addEventListener('click', (e) => {
        const pill = e.target.closest('.res-pill');
        if (!pill) return;
        document.querySelectorAll('.res-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.currentFilter = pill.dataset.filter;
        state.currentPage = 1;
        renderResultsTable();
    });

    // Búsqueda en tabla
    DOM.tableSearchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        state.currentPage = 1;
        renderResultsTable();
    });

    // Tamaño de página
    DOM.pageSizeSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        state.pageSize = val === 'all' ? Infinity : parseInt(val, 10);
        state.currentPage = 1;
        renderResultsTable();
    });

    // Ordenación por columna al hacer click en TH
    DOM.resultsTableHead.addEventListener('click', (e) => {
        const th = e.target.closest('th[data-col]');
        if (!th) return;
        const col = th.dataset.col;
        if (state.sortCol === col) {
            state.sortAsc = !state.sortAsc;
        } else {
            state.sortCol = col;
            state.sortAsc = true;
        }
        renderResultsTable();
    });

    // Paginación anterior / siguiente
    DOM.btnPagePrev.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderResultsTable();
        }
    });
    DOM.btnPageNext.addEventListener('click', () => {
        state.currentPage++;
        renderResultsTable();
    });

    // Exportaciones
    DOM.btnExportExcel.addEventListener('click', exportToExcel);
    DOM.btnExportCSV.addEventListener('click', exportToCSV);
    DOM.btnCopyClipboard.addEventListener('click', copyToClipboardTSV);
    DOM.btnExportReport.addEventListener('click', exportAuditReport);

    // Modales
    DOM.btnCancelPaste.addEventListener('click', closePasteModal);
    DOM.btnClosePasteModal.addEventListener('click', closePasteModal);
    DOM.btnConfirmPaste.addEventListener('click', confirmPaste);

    DOM.btnDismissPreview.addEventListener('click', closePreviewModal);
    DOM.btnClosePreviewModal.addEventListener('click', closePreviewModal);

    // Eventos del Centro de Ayuda
    if (DOM.btnOpenHelpModal) {
        DOM.btnOpenHelpModal.addEventListener('click', () => openHelpModal('tabHelpOverview'));
    }
    if (DOM.btnOpenHelpHero) {
        DOM.btnOpenHelpHero.addEventListener('click', () => openHelpModal('tabHelpOverview'));
    }
    if (DOM.btnCloseHelpModal) {
        DOM.btnCloseHelpModal.addEventListener('click', closeHelpModal);
    }
    if (DOM.btnDismissHelp) {
        DOM.btnDismissHelp.addEventListener('click', closeHelpModal);
    }
    if (DOM.helpModal) {
        DOM.helpModal.addEventListener('click', (e) => {
            if (e.target === DOM.helpModal) closeHelpModal();
        });
    }
    if (DOM.btnHelpTryPreset) {
        DOM.btnHelpTryPreset.addEventListener('click', () => {
            closeHelpModal();
            loadPreset('banking');
            setTimeout(() => executeJoin(), 200);
        });
    }

    // Pestañas internas del modal de ayuda
    if (DOM.helpTabsNav) {
        DOM.helpTabsNav.addEventListener('click', (e) => {
            const btn = e.target.closest('.help-tab-btn');
            if (btn && btn.dataset.tab) {
                switchHelpTab(btn.dataset.tab);
            }
        });
    }

    // Botones de ayuda contextuales en cada paso (Paso 1, Paso 2, Paso 3)
    document.querySelectorAll('.btn-step-help').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.helpTab || 'tabHelpOverview';
            openHelpModal(tabId);
        });
    });

    // Cerrar modales con Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeHelpModal();
            closePasteModal();
            closePreviewModal();
        }
    });

    // =========================================================================
    // 12. UTILIDADES AUXILIARES
    // =========================================================================

    function setupDropzone(element, onFileDrop) {
        ['dragenter', 'dragover'].forEach(eventName => {
            element.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                element.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            element.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                element.classList.remove('drag-over');
            });
        });

        element.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                onFileDrop(files[0]);
            }
        });
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        } else {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
        DOM.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 4000);
    }

    function downloadBlob(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Inicializar selectores vacíos al cargar
    updateKeySelectors();
    updateReconciliationSelectors();

    // Auto-cargar preset bancario para una primera impresión inmediata y sin fricción
    loadPreset('banking');

    // Soporte para autoejecución en pruebas y captura de pantalla (?autojoin=1 / ?openhelp=1)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('autojoin')) {
        setTimeout(() => executeJoin(), 300);
    }
    if (urlParams.has('openhelp')) {
        const tab = urlParams.get('helptab') || 'tabHelpOverview';
        setTimeout(() => openHelpModal(tab), 250);
    }
});
