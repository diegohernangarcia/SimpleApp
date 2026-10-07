/**
 * Detector de Duplicados con Jerarquía - app.js
 * Módulo #08 • Datos & Conciliación • SimpleApps Suite
 * Procesamiento Heurístico Determinista 100% en memoria
 */

(function () {
    'use strict';

    // =========================================================================
    // 1. ESTADO DE LA APLICACIÓN
    // =========================================================================
    const state = {
        dataset: {
            fileName: '',
            headers: [],
            rows: [],
            totalRows: 0,
            workbook: null,
            sheets: [],
            currentSheet: ''
        },
        keyColumns: new Set(),
        normalization: {
            trim: true,
            ignoreCase: true,
            ignoreAccents: true,
            collapseSpaces: true
        },
        rules: [],
        results: null,
        activeFilter: 'all',
        searchTerm: '',
        currentPage: 1,
        pageSize: 50,
        sortColumn: null,
        sortDirection: 'asc'
    };

    let nextRuleId = 1;

    // =========================================================================
    // 2. CASOS DE PRUEBA (PRESETS)
    // =========================================================================
    const PRESETS = {
        crm: {
            fileName: 'crm_leads_contactos.csv',
            keys: ['email'],
            rules: [
                { type: 'most_complete', column: '', targetValue: '' },
                { type: 'newest_date', column: 'fecha_contacto', targetValue: '' },
                { type: 'specific_value', column: 'estado_lead', targetValue: 'Calificado' }
            ],
            csv: `email,nombre_completo,telefono,empresa,cargo,pais,estado_lead,fecha_contacto
carlos.m@innova.com,Carlos Mendoza,+54 9 11 4455-8899,Innova Tech,CTO,Argentina,Calificado,2024-05-18
carlos.m@innova.com,Carlos M.,,Innova Tech,CTO,Argentina,Prospecto,2023-11-10
carlos.m@innova.com,Carlos Mendoza,+54 9 11 4455-8899,,,Argentina,,2024-01-20
maria.lopez@globex.org,María López,+52 55 1234-5678,Globex Inc.,Directora Comercial,México,Calificado,2024-06-01
maria.lopez@globex.org,Maria Lopez,+52 55 1234-5678,Globex Inc.,,México,Interesado,2024-05-25
roberto.g@acme.corp,Roberto Gómez,+56 9 8765-4321,ACME Corp,Gerente Compras,Chile,Calificado,2024-04-12
roberto.g@acme.corp,Roberto Gomez,,ACME Corp,,Chile,Calificado,2024-04-12
ana.torres@fintech.io,Ana Torres,+57 300 123-4567,Fintech Soluciones,Lead Engineer,Colombia,Calificado,2024-06-10
diego.v@startups.co,Diego Vega,,,CEO,Uruguay,Nuevo,2024-02-01
diego.v@startups.co,Diego Vega,+598 99 112 233,Startups Co,CEO,Uruguay,Calificado,2024-06-05
diego.v@startups.co,D. Vega,+598 99 112 233,Startups Co,,Uruguay,Interesado,2024-03-15
lucia.r@biohealth.es,Lucía Ramos,+34 91 555-1234,BioHealth Labs,Investigadora Principal,España,Calificado,2024-05-30
lucia.r@biohealth.es,Lucia Ramos,,,Investigadora,España,Nuevo,2024-01-14
martin.p@logistica.net,Martín Peralta,+54 11 9876-5432,Logística Express,Jefe de Operaciones,Argentina,Calificado,2024-06-12`
        },

        inventory: {
            fileName: 'inventario_multi_sucursal.csv',
            keys: ['sku'],
            rules: [
                { type: 'specific_value', column: 'estado', targetValue: 'Activo' },
                { type: 'highest_value', column: 'stock_disponible', targetValue: '' },
                { type: 'newest_date', column: 'ultima_auditoria', targetValue: '' }
            ],
            csv: `sku,descripcion,categoria,sucursal,stock_disponible,precio_unitario,estado,ultima_auditoria
SKU-MON-27,Monitor LED 27 Pulgadas 4K,Periféricos,Sucursal Central,45,289.99,Activo,2024-06-15
SKU-MON-27,Monitor LED 27 Pulgadas 4K,Periféricos,Depósito Norte,12,289.99,Activo,2024-05-10
SKU-MON-27,Monitor LED 27 Pulgadas 4K,Hardware,Outlet Sur,5,249.00,Inactivo,2024-03-01
SKU-KEY-MEC,Teclado Mecánico RGB Switch Red,Accesorios,Sucursal Central,110,65.50,Activo,2024-06-20
SKU-KEY-MEC,Teclado Mecánico RGB Switch Red,Accesorios,Depósito Norte,85,65.50,Activo,2024-06-18
SKU-MOU-WIR,Mouse Inalámbrico Ergonómico,Accesorios,Sucursal Central,70,32.00,Activo,2024-06-14
SKU-MOU-WIR,Mouse Inalámbrico Ergonómico,Accesorios,Depósito Norte,0,32.00,Agotado,2024-04-20
SKU-LAP-PRO,Notebook Ultra Slim i7 16GB,Computadoras,Sucursal Central,18,1150.00,Activo,2024-06-22
SKU-LAP-PRO,Notebook Ultra Slim i7 16GB,Computadoras,Depósito Norte,24,1150.00,Activo,2024-06-19
SKU-LAP-PRO,Notebook Ultra Slim i7 16GB,Computadoras,Outlet Sur,2,990.00,En Revisión,2024-02-15
SKU-SSD-1TB,Disco Solido SSD NVMe 1TB,Almacenamiento,Sucursal Central,95,78.50,Activo,2024-06-21
SKU-SSD-1TB,Disco Solido SSD NVMe 1TB,Almacenamiento,Depósito Norte,140,78.50,Activo,2024-06-20
SKU-AUR-ANC,Auriculares Noise Cancelling BT,Audio,Sucursal Central,30,140.00,Activo,2024-06-12
SKU-AUR-ANC,Auriculares Noise Cancelling BT,Audio,Outlet Sur,8,120.00,Descontinuado,2024-01-10`
        },

        transactions: {
            fileName: 'movimientos_bancarios_conciliacion.csv',
            keys: ['id_transaccion'],
            rules: [
                { type: 'highest_value', column: 'monto_liquidado', targetValue: '' },
                { type: 'newest_date', column: 'fecha_operacion', targetValue: '' },
                { type: 'specific_value', column: 'estado_transaccion', targetValue: 'Aprobada' }
            ],
            csv: `id_transaccion,cuenta_origen,beneficiario,monto_liquidado,moneda,canal,estado_transaccion,fecha_operacion
TRX-884920,C-001248,Distribuidora San Juan SA,145000.50,ARS,Transferencia API,Aprobada,2024-06-14 18:30:00
TRX-884920,C-001248,Distribuidora San Juan SA,145000.50,ARS,Transferencia Web,Pendiente,2024-06-14 18:25:00
TRX-993011,C-005521,Constructora del Valle SRL,98200.00,ARS,Home Banking,Aprobada,2024-06-15 10:15:00
TRX-993011,C-005521,Constructora del Valle SRL,98200.00,ARS,Home Banking,Rechazada,2024-06-15 10:12:00
TRX-771245,C-008910,Papelera Central SA,34500.00,ARS,Cheque Electrónico,Aprobada,2024-06-12 14:00:00
TRX-771245,C-008910,Papelera Central SA,34500.00,ARS,Cheque Electrónico,Aprobada,2024-06-12 13:58:00
TRX-662190,C-003314,Servicios Informáticos Tech,210500.00,ARS,Transferencia Inmediata,Aprobada,2024-06-16 11:45:00
TRX-662190,C-003314,Servicios Informáticos Tech,210000.00,ARS,Transferencia Inmediata,Reintento,2024-06-16 11:40:00
TRX-551029,C-009944,Logística Patagónica SA,87400.25,ARS,Débito Automático,Aprobada,2024-06-13 09:20:00
TRX-440188,C-002155,Seguros Integrales SA,52300.00,ARS,Débito Automático,Aprobada,2024-06-10 08:30:00
TRX-440188,C-002155,Seguros Integrales SA,52300.00,ARS,Débito Automático,Pendiente,2024-06-10 08:29:00`
        }
    };

    // =========================================================================
    // 3. INICIALIZACIÓN Y EVENT LISTENERS
    // =========================================================================
    function initApp() {
        initPresets();
        initDropzoneAndUpload();
        initKeyColumnControls();
        initRulesHierarchyControls();
        initExecutionButton();
        initResultsControls();
        initExportActions();
        initModals();

        // Cargar por defecto el primer preset para demostración inmediata
        loadPreset('crm');
    }

    if (document.body) {
        initApp();
    } else {
        document.addEventListener('DOMContentLoaded', initApp);
    }

    // =========================================================================
    // 4. PRESETS CONTROLLER
    // =========================================================================
    function initPresets() {
        const btnCrm = document.getElementById('btnPresetCRM');
        const btnInv = document.getElementById('btnPresetInventory');
        const btnTrx = document.getElementById('btnPresetTransactions');

        if (btnCrm) btnCrm.addEventListener('click', () => loadPreset('crm'));
        if (btnInv) btnInv.addEventListener('click', () => loadPreset('inventory'));
        if (btnTrx) btnTrx.addEventListener('click', () => loadPreset('transactions'));
    }

    function loadPreset(key) {
        const preset = PRESETS[key];
        if (!preset) return;

        const parsed = DuplicateEngine.parseCSV(preset.csv);
        if (parsed.errors && parsed.errors.length > 0) {
            showToast('Error al parsear el preset: ' + parsed.errors[0], 'error');
            return;
        }

        state.dataset.fileName = preset.fileName;
        state.dataset.headers = parsed.headers;
        state.dataset.rows = parsed.rows;
        state.dataset.totalRows = parsed.rows.length;
        state.dataset.workbook = null;
        state.dataset.sheets = [];
        state.dataset.currentSheet = '';

        // Actualizar UI del dataset
        updateUploadSummaryUI();

        // Configurar claves del preset
        state.keyColumns = new Set(preset.keys);
        renderKeyColumnsChecklist();

        // Configurar reglas del preset
        state.rules = preset.rules.map(r => ({
            id: 'rule_' + (nextRuleId++),
            type: r.type,
            column: r.column || '',
            targetValue: r.targetValue || ''
        }));
        renderRulesHierarchy();

        showToast(`Caso de prueba cargado: ${preset.fileName} (${parsed.rows.length} filas)`, 'success');

        // Ejecutar deduplicación automáticamente para visualización instantánea
        executeDeduplication(false);
    }

    // =========================================================================
    // 5. CARGA DE ARCHIVOS, DRAG & DROP Y PASTE
    // =========================================================================
    function initDropzoneAndUpload() {
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileInput');
        const btnBrowse = document.getElementById('btnBrowseFile');
        const btnPaste = document.getElementById('btnPasteData');
        const btnClear = document.getElementById('btnClearData');
        const btnPreview = document.getElementById('btnPreviewRaw');
        const sheetSelect = document.getElementById('sheetSelect');

        if (btnBrowse && fileInput) {
            btnBrowse.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }

        if (dropzone && fileInput) {
            dropzone.addEventListener('click', () => fileInput.click());

            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('drag-over');
            });

            ['dragleave', 'dragend'].forEach(ev => {
                dropzone.addEventListener(ev, () => dropzone.classList.remove('drag-over'));
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('drag-over');
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processIncomingFile(e.dataTransfer.files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    processIncomingFile(e.target.files[0]);
                }
            });
        }

        if (btnClear) {
            btnClear.addEventListener('click', () => {
                clearDataset();
                showToast('Archivo y configuración reiniciados.', 'info');
            });
        }

        if (btnPreview) {
            btnPreview.addEventListener('click', () => openPreviewModal());
        }

        if (sheetSelect) {
            sheetSelect.addEventListener('change', (e) => {
                const sheetName = e.target.value;
                if (!state.dataset.workbook || !sheetName) return;
                loadExcelSheet(sheetName);
            });
        }
    }

    function processIncomingFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();

        if (['xlsx', 'xls'].includes(ext)) {
            // Leer como ArrayBuffer con SheetJS
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    state.dataset.workbook = workbook;
                    state.dataset.sheets = workbook.SheetNames;
                    state.dataset.fileName = file.name;

                    if (workbook.SheetNames.length === 0) {
                        showToast('El libro de Excel no contiene hojas.', 'error');
                        return;
                    }

                    // Configurar selector de hojas si hay más de 1
                    const sheetSelectContainer = document.getElementById('sheetSelectorContainer');
                    const sheetSelect = document.getElementById('sheetSelect');
                    if (sheetSelect && workbook.SheetNames.length > 1) {
                        sheetSelect.innerHTML = '';
                        workbook.SheetNames.forEach(sh => {
                            const opt = document.createElement('option');
                            opt.value = sh;
                            opt.textContent = sh;
                            sheetSelect.appendChild(opt);
                        });
                        if (sheetSelectContainer) sheetSelectContainer.style.display = 'flex';
                    } else if (sheetSelectContainer) {
                        sheetSelectContainer.style.display = 'none';
                    }

                    loadExcelSheet(workbook.SheetNames[0]);
                    showToast(`Archivo Excel '${file.name}' cargado con éxito.`, 'success');
                } catch (err) {
                    console.error(err);
                    showToast('Error al leer el archivo Excel: ' + err.message, 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            // Leer como texto delimitado CSV/TSV
            const reader = new FileReader();
            reader.onload = function (e) {
                const content = e.target.result;
                const parsed = DuplicateEngine.parseCSV(content);
                if (parsed.headers.length === 0 || parsed.rows.length === 0) {
                    showToast('No se detectaron registros válidos en el archivo.', 'error');
                    return;
                }

                state.dataset.fileName = file.name;
                state.dataset.headers = parsed.headers;
                state.dataset.rows = parsed.rows;
                state.dataset.totalRows = parsed.rows.length;
                state.dataset.workbook = null;
                state.dataset.sheets = [];
                state.dataset.currentSheet = '';

                const sheetSelectContainer = document.getElementById('sheetSelectorContainer');
                if (sheetSelectContainer) sheetSelectContainer.style.display = 'none';

                onNewDatasetLoaded();
                showToast(`Archivo '${file.name}' cargado (${parsed.rows.length} filas).`, 'success');
            };
            reader.readAsText(file, 'UTF-8');
        }
    }

    function loadExcelSheet(sheetName) {
        const wb = state.dataset.workbook;
        if (!wb || !wb.Sheets[sheetName]) return;

        state.dataset.currentSheet = sheetName;
        const worksheet = wb.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

        if (rawJson.length === 0) {
            showToast(`La hoja '${sheetName}' está vacía.`, 'error');
            return;
        }

        const headers = Object.keys(rawJson[0]);
        state.dataset.headers = headers;
        state.dataset.rows = rawJson;
        state.dataset.totalRows = rawJson.length;

        onNewDatasetLoaded();
    }

    function onNewDatasetLoaded() {
        updateUploadSummaryUI();
        autoDetectKeyColumns();
        renderKeyColumnsChecklist();

        // Si no hay reglas configuradas, agregar 'most_complete' por defecto
        if (state.rules.length === 0) {
            state.rules = [{
                id: 'rule_' + (nextRuleId++),
                type: 'most_complete',
                column: '',
                targetValue: ''
            }];
        }
        renderRulesHierarchy();

        // Ocultar resultados previos
        const resSec = document.getElementById('resultsSection');
        if (resSec) resSec.classList.remove('visible');
    }

    function updateUploadSummaryUI() {
        const uploadCard = document.getElementById('uploadCard');
        const fileNameTag = document.getElementById('fileNameTag');
        const fileMetaCounts = document.getElementById('fileMetaCounts');

        if (uploadCard) uploadCard.classList.add('loaded');
        if (fileNameTag) fileNameTag.textContent = state.dataset.fileName || 'datos_cargados.csv';
        if (fileMetaCounts) {
            fileMetaCounts.textContent = `${state.dataset.rows.length.toLocaleString()} filas • ${state.dataset.headers.length} columnas`;
        }
    }

    function clearDataset() {
        state.dataset = {
            fileName: '',
            headers: [],
            rows: [],
            totalRows: 0,
            workbook: null,
            sheets: [],
            currentSheet: ''
        };
        state.keyColumns.clear();
        state.rules = [];
        state.results = null;

        const uploadCard = document.getElementById('uploadCard');
        if (uploadCard) uploadCard.classList.remove('loaded');

        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';

        const sheetSelectContainer = document.getElementById('sheetSelectorContainer');
        if (sheetSelectContainer) sheetSelectContainer.style.display = 'none';

        const keysGrid = document.getElementById('keysChecklistGrid');
        if (keysGrid) {
            keysGrid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                    Carga un archivo o activa un caso de prueba arriba para ver las columnas disponibles.
                </div>`;
        }

        const rulesList = document.getElementById('rulesList');
        if (rulesList) rulesList.innerHTML = '';

        const resSec = document.getElementById('resultsSection');
        if (resSec) resSec.classList.remove('visible');
    }

    // =========================================================================
    // 6. COLUMNAS CLAVE & NORMALIZACIÓN
    // =========================================================================
    function initKeyColumnControls() {
        const btnAuto = document.getElementById('btnAutoDetectKeys');
        const btnSelectAll = document.getElementById('btnSelectAllKeys');
        const btnClearAll = document.getElementById('btnClearAllKeys');
        const searchInput = document.getElementById('searchKeyColsInput');

        if (btnAuto) {
            btnAuto.addEventListener('click', () => {
                autoDetectKeyColumns();
                renderKeyColumnsChecklist();
                showToast(`Claves auto-detectadas: ${Array.from(state.keyColumns).join(', ') || 'Ninguna sugerida'}`, 'info');
            });
        }

        if (btnSelectAll) {
            btnSelectAll.addEventListener('click', () => {
                state.keyColumns = new Set(state.dataset.headers);
                renderKeyColumnsChecklist();
            });
        }

        if (btnClearAll) {
            btnClearAll.addEventListener('click', () => {
                state.keyColumns.clear();
                renderKeyColumnsChecklist();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterKeyCheckboxes(e.target.value.toLowerCase().trim());
            });
        }

        // Checkboxes de normalización
        const chkTrim = document.getElementById('chkTrim');
        const chkCase = document.getElementById('chkIgnoreCase');
        const chkAccents = document.getElementById('chkIgnoreAccents');
        const chkSpaces = document.getElementById('chkCollapseSpaces');

        if (chkTrim) chkTrim.addEventListener('change', (e) => state.normalization.trim = e.target.checked);
        if (chkCase) chkCase.addEventListener('change', (e) => state.normalization.ignoreCase = e.target.checked);
        if (chkAccents) chkAccents.addEventListener('change', (e) => state.normalization.ignoreAccents = e.target.checked);
        if (chkSpaces) chkSpaces.addEventListener('change', (e) => state.normalization.collapseSpaces = e.target.checked);
    }

    function autoDetectKeyColumns() {
        state.keyColumns.clear();
        const patterns = [/email/i, /^id$/i, /_id$/i, /id_/i, /codigo/i, /sku/i, /dni/i, /cuit/i, /rut/i, /documento/i, /uuid/i, /hash/i];

        state.dataset.headers.forEach(h => {
            if (patterns.some(p => p.test(h))) {
                state.keyColumns.add(h);
            }
        });

        // Si no hubo coincidencia, tomar la primera columna como fallback
        if (state.keyColumns.size === 0 && state.dataset.headers.length > 0) {
            state.keyColumns.add(state.dataset.headers[0]);
        }
    }

    function renderKeyColumnsChecklist() {
        const container = document.getElementById('keysChecklistGrid');
        if (!container) return;

        if (state.dataset.headers.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                    Carga un archivo o activa un caso de prueba arriba para ver las columnas disponibles.
                </div>`;
            return;
        }

        container.innerHTML = '';
        state.dataset.headers.forEach(h => {
            const isChecked = state.keyColumns.has(h);
            const card = document.createElement('label');
            card.className = `key-checkbox-card ${isChecked ? 'checked' : ''}`;
            card.setAttribute('data-col', h.toLowerCase());

            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.checked = isChecked;
            chk.value = h;

            chk.addEventListener('change', (e) => {
                if (e.target.checked) {
                    state.keyColumns.add(h);
                    card.classList.add('checked');
                } else {
                    state.keyColumns.delete(h);
                    card.classList.remove('checked');
                }
            });

            const span = document.createElement('span');
            span.className = 'key-name-label';
            span.textContent = h;
            span.title = h;

            card.appendChild(chk);
            card.appendChild(span);
            container.appendChild(card);
        });
    }

    function filterKeyCheckboxes(term) {
        const cards = document.querySelectorAll('#keysChecklistGrid .key-checkbox-card');
        cards.forEach(card => {
            const col = card.getAttribute('data-col') || '';
            card.style.display = col.includes(term) ? 'flex' : 'none';
        });
    }

    // =========================================================================
    // 7. CONSTRUCTOR DE REGLAS JERÁRQUICAS
    // =========================================================================
    function initRulesHierarchyControls() {
        const btnAdd = document.getElementById('btnAddRule');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                state.rules.push({
                    id: 'rule_' + (nextRuleId++),
                    type: 'most_complete',
                    column: state.dataset.headers.length > 0 ? state.dataset.headers[0] : '',
                    targetValue: ''
                });
                renderRulesHierarchy();
            });
        }
    }

    function renderRulesHierarchy() {
        const container = document.getElementById('rulesList');
        if (!container) return;

        container.innerHTML = '';

        if (state.rules.length === 0) {
            container.innerHTML = `
                <div style="padding: 1.5rem; text-align: center; color: var(--text-secondary); font-size: 0.85rem; border: 1px dashed var(--border-medium); border-radius: 8px;">
                    No hay reglas de jerarquía definidas. Haz clic en "Agregar Regla de Prioridad".
                </div>`;
            return;
        }

        state.rules.forEach((rule, index) => {
            const card = document.createElement('div');
            card.className = 'rule-row-card';
            card.setAttribute('data-rule-id', rule.id);

            // 1. Badge de prioridad
            const badge = document.createElement('div');
            badge.className = 'rule-priority-badge';
            badge.textContent = `Prioridad #${index + 1}`;
            card.appendChild(badge);

            // 2. Configuración de la regla
            const settings = document.createElement('div');
            settings.className = 'rule-settings-flex';

            // Select de Tipo de Regla
            const typeSelect = document.createElement('select');
            typeSelect.className = 'rule-select';
            const ruleTypes = [
                { value: 'most_complete', label: '🌟 Más Completa (más celdas con datos)' },
                { value: 'newest_date', label: '📅 Fecha Más Reciente (timestamp nuevo)' },
                { value: 'oldest_date', label: '⏳ Fecha Más Antigua (primer registro)' },
                { value: 'highest_value', label: '📈 Mayor Valor Numérico (monto/stock)' },
                { value: 'lowest_value', label: '📉 Menor Valor Numérico (monto menor)' },
                { value: 'specific_value', label: '🎯 Coincidencia Específica (campo == valor)' },
                { value: 'first_seen', label: '📄 Primera Aparición en Archivo' },
                { value: 'last_seen', label: '📄 Última Aparición en Archivo' }
            ];

            ruleTypes.forEach(rt => {
                const opt = document.createElement('option');
                opt.value = rt.value;
                opt.textContent = rt.label;
                if (rule.type === rt.value) opt.selected = true;
                typeSelect.appendChild(opt);
            });

            settings.appendChild(typeSelect);

            // Select de Columna (si aplica)
            const needsCol = ['newest_date', 'oldest_date', 'highest_value', 'lowest_value', 'specific_value'].includes(rule.type);
            const colSelect = document.createElement('select');
            colSelect.className = 'rule-col-select';
            colSelect.style.display = needsCol ? 'inline-block' : 'none';

            // Opción vacía o columnas
            state.dataset.headers.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h;
                opt.textContent = h;
                if (rule.column === h) opt.selected = true;
                colSelect.appendChild(opt);
            });

            // Si rule.column está vacía y hay columnas, asignar la primera
            if (!rule.column && state.dataset.headers.length > 0) {
                rule.column = state.dataset.headers[0];
            }

            settings.appendChild(colSelect);

            // Input de Valor Específico (si aplica)
            const valInput = document.createElement('input');
            valInput.type = 'text';
            valInput.className = 'table-search-input';
            valInput.placeholder = 'Valor esperado (ej: Activo)';
            valInput.value = rule.targetValue || '';
            valInput.style.display = rule.type === 'specific_value' ? 'inline-block' : 'none';
            valInput.style.width = '170px';
            settings.appendChild(valInput);

            // Event Listeners de la Regla
            typeSelect.addEventListener('change', (e) => {
                rule.type = e.target.value;
                const requiresCol = ['newest_date', 'oldest_date', 'highest_value', 'lowest_value', 'specific_value'].includes(rule.type);
                colSelect.style.display = requiresCol ? 'inline-block' : 'none';
                valInput.style.display = rule.type === 'specific_value' ? 'inline-block' : 'none';
            });

            colSelect.addEventListener('change', (e) => {
                rule.column = e.target.value;
            });

            valInput.addEventListener('input', (e) => {
                rule.targetValue = e.target.value;
            });

            card.appendChild(settings);

            // 3. Acciones de Regla (Mover Arriba, Mover Abajo, Eliminar)
            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.alignItems = 'center';
            actions.style.gap = '0.35rem';

            if (index > 0) {
                const btnUp = document.createElement('button');
                btnUp.type = 'button';
                btnUp.className = 'btn-page-nav';
                btnUp.title = 'Subir prioridad';
                btnUp.innerHTML = '&#9650;';
                btnUp.addEventListener('click', () => {
                    const temp = state.rules[index - 1];
                    state.rules[index - 1] = state.rules[index];
                    state.rules[index] = temp;
                    renderRulesHierarchy();
                });
                actions.appendChild(btnUp);
            }

            if (index < state.rules.length - 1) {
                const btnDown = document.createElement('button');
                btnDown.type = 'button';
                btnDown.className = 'btn-page-nav';
                btnDown.title = 'Bajar prioridad';
                btnDown.innerHTML = '&#9660;';
                btnDown.addEventListener('click', () => {
                    const temp = state.rules[index + 1];
                    state.rules[index + 1] = state.rules[index];
                    state.rules[index] = temp;
                    renderRulesHierarchy();
                });
                actions.appendChild(btnDown);
            }

            const btnDelete = document.createElement('button');
            btnDelete.type = 'button';
            btnDelete.className = 'btn-remove-rule';
            btnDelete.title = 'Eliminar regla';
            btnDelete.innerHTML = '&times;';
            btnDelete.addEventListener('click', () => {
                state.rules.splice(index, 1);
                renderRulesHierarchy();
            });
            actions.appendChild(btnDelete);

            card.appendChild(actions);
            container.appendChild(card);
        });
    }

    // =========================================================================
    // 8. EJECUCIÓN DEL MOTOR DE DEDUPLICACIÓN
    // =========================================================================
    function initExecutionButton() {
        const btnExec = document.getElementById('btnExecuteDedupe');
        if (btnExec) {
            btnExec.addEventListener('click', () => executeDeduplication(true));
        }
    }

    function executeDeduplication(shouldScroll = true) {
        // Validaciones
        if (!state.dataset.rows || state.dataset.rows.length === 0) {
            showToast('Por favor carga un archivo o selecciona un caso de prueba antes de ejecutar.', 'error');
            return;
        }

        if (state.keyColumns.size === 0) {
            showToast('Debes seleccionar al menos una columna clave para identificar duplicados.', 'error');
            return;
        }

        const keysArray = Array.from(state.keyColumns);

        // Ejecutar motor
        const t0 = performance.now();
        const results = DuplicateEngine.process(
            state.dataset.rows,
            keysArray,
            state.rules,
            state.normalization
        );
        const t1 = performance.now();
        results.stats.executionTimeMs = (t1 - t0).toFixed(1);

        state.results = results;
        state.currentPage = 1;
        state.activeFilter = 'all';

        // Actualizar KPIs
        updateKPIsUI(results.stats);

        // Actualizar Tabla y Pestañas
        renderResultsTable();

        // Mostrar sección de resultados
        const resSec = document.getElementById('resultsSection');
        if (resSec) {
            resSec.classList.add('visible');
            if (shouldScroll) {
                resSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        showToast(
            `¡Depuración completada! ${results.stats.uniqueRows.toLocaleString()} únicos conservados, ${results.stats.discardedRows.toLocaleString()} descartados en ${results.stats.executionTimeMs} ms.`,
            'success'
        );
    }

    function updateKPIsUI(stats) {
        const kpiTotal = document.getElementById('kpiTotalRows');
        const kpiClusters = document.getElementById('kpiDuplicateClusters');
        const kpiUnique = document.getElementById('kpiUniqueRows');
        const kpiDiscarded = document.getElementById('kpiDiscardedRows');
        const kpiRate = document.getElementById('kpiDupeRate');

        if (kpiTotal) kpiTotal.textContent = stats.totalRows.toLocaleString();
        if (kpiClusters) kpiClusters.textContent = stats.duplicateClusters.toLocaleString();
        if (kpiUnique) kpiUnique.textContent = stats.uniqueRows.toLocaleString();
        if (kpiDiscarded) kpiDiscarded.textContent = stats.discardedRows.toLocaleString();
        if (kpiRate) {
            const rate = stats.totalRows > 0 ? ((stats.discardedRows / stats.totalRows) * 100).toFixed(1) : '0';
            kpiRate.textContent = `${rate}%`;
        }

        // Conteo de pills
        const countAll = document.getElementById('countAll');
        const countUnique = document.getElementById('countUnique');
        const countDiscarded = document.getElementById('countDiscarded');
        const countClusters = document.getElementById('countClusters');

        if (countAll) countAll.textContent = stats.totalRows.toLocaleString();
        if (countUnique) countUnique.textContent = stats.uniqueRows.toLocaleString();
        if (countDiscarded) countDiscarded.textContent = stats.discardedRows.toLocaleString();

        // Conteo de filas en clústeres duplicados (todas las filas pertenecientes a grupos duplicados)
        let clusterRowsCount = 0;
        if (state.results && state.results.clusters) {
            state.results.clusters.forEach(c => {
                clusterRowsCount += (c.totalInGroup || (c.items ? c.items.length : 0));
            });
        }
        if (countClusters) countClusters.textContent = clusterRowsCount.toLocaleString();
    }

    // =========================================================================
    // 9. CONTROLES DE RESULTADOS, FILTRADO & TABLA
    // =========================================================================
    function initResultsControls() {
        // Pestañas de Filtro
        const pills = document.querySelectorAll('.results-filter-pills .res-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', (e) => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                state.activeFilter = pill.getAttribute('data-filter') || 'all';
                state.currentPage = 1;
                renderResultsTable();
            });
        });

        // Buscador en Resultados
        const searchInput = document.getElementById('tableSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                state.searchTerm = e.target.value.toLowerCase().trim();
                state.currentPage = 1;
                renderResultsTable();
            });
        }

        // Paginación
        const btnPrev = document.getElementById('btnPagePrev');
        const btnNext = document.getElementById('btnPageNext');
        const pageSizeSelect = document.getElementById('pageSizeSelect');

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (state.currentPage > 1) {
                    state.currentPage--;
                    renderResultsTable();
                }
            });
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                const totalFiltered = getFilteredRows().length;
                const totalPages = Math.ceil(totalFiltered / state.pageSize) || 1;
                if (state.currentPage < totalPages) {
                    state.currentPage++;
                    renderResultsTable();
                }
            });
        }

        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                state.pageSize = parseInt(e.target.value, 10) || 50;
                state.currentPage = 1;
                renderResultsTable();
            });
        }
    }

    function getFilteredRows() {
        if (!state.results || !state.results.allRowsWithAudit) return [];

        let rows = state.results.allRowsWithAudit;

        // 1. Filtro por Estado / Pestaña
        if (state.activeFilter === 'unique') {
            rows = rows.filter(r => r._ES_GANADOR === true);
        } else if (state.activeFilter === 'discarded') {
            rows = rows.filter(r => r._ES_GANADOR === false);
        } else if (state.activeFilter === 'clusters') {
            rows = rows.filter(r => r._GRUPO_TOTAL > 1);
        }

        // 2. Filtro por Término de Búsqueda
        if (state.searchTerm) {
            const term = state.searchTerm;
            rows = rows.filter(r => {
                for (const key in r) {
                    const val = String(r[key] ?? '').toLowerCase();
                    if (val.includes(term)) return true;
                }
                return false;
            });
        }

        // 3. Ordenamiento si aplica
        if (state.sortColumn) {
            const col = state.sortColumn;
            const dir = state.sortDirection === 'asc' ? 1 : -1;
            rows = [...rows].sort((a, b) => {
                const va = a[col] ?? '';
                const vb = b[col] ?? '';
                if (va < vb) return -1 * dir;
                if (va > vb) return 1 * dir;
                return 0;
            });
        }

        return rows;
    }

    function renderResultsTable() {
        const theadRow = document.getElementById('resultsTableHeadRow');
        const tbody = document.getElementById('resultsTableBody');
        const pageInfo = document.getElementById('pageInfo');
        const pageCurrent = document.getElementById('pageCurrent');
        const pageTotal = document.getElementById('pageTotal');
        const btnPrev = document.getElementById('btnPagePrev');
        const btnNext = document.getElementById('btnPageNext');

        if (!theadRow || !tbody || !state.results) return;

        const filtered = getFilteredRows();
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / state.pageSize) || 1;

        if (state.currentPage > totalPages) state.currentPage = totalPages;
        if (state.currentPage < 1) state.currentPage = 1;

        const startIdx = (state.currentPage - 1) * state.pageSize;
        const endIdx = Math.min(startIdx + state.pageSize, totalItems);
        const pagedRows = filtered.slice(startIdx, endIdx);

        // Render Thead
        theadRow.innerHTML = '';

        // Columnas fijas de auditoría
        const auditCols = [
            { key: '_INDICE_ORIGINAL', label: '#' },
            { key: '_ESTADO', label: 'ESTADO' },
            { key: '_GRUPO_ID', label: 'CLÚSTER' },
            { key: '_MOTIVO_DESCARTE', label: 'MOTIVO DE AUDITORÍA' }
        ];

        auditCols.forEach(ac => {
            const th = document.createElement('th');
            th.textContent = ac.label;
            th.title = `Ordenar por ${ac.label}`;
            th.addEventListener('click', () => toggleSort(ac.key));
            theadRow.appendChild(th);
        });

        // Columnas originales del dataset
        state.dataset.headers.forEach(h => {
            const th = document.createElement('th');
            const isKey = state.keyColumns.has(h);
            th.textContent = isKey ? `🔑 ${h}` : h;
            if (isKey) {
                th.style.color = 'var(--dupe-teal-light)';
                th.title = 'Columna Clave de Duplicidad';
            }
            th.addEventListener('click', () => toggleSort(h));
            theadRow.appendChild(th);
        });

        // Render Tbody
        tbody.innerHTML = '';

        if (pagedRows.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = auditCols.length + state.dataset.headers.length;
            td.style.textAlign = 'center';
            td.style.padding = '2.5rem';
            td.style.color = 'var(--text-secondary)';
            td.textContent = 'No se encontraron registros que coincidan con los filtros seleccionados.';
            tr.appendChild(td);
            tbody.appendChild(tr);
        } else {
            pagedRows.forEach(row => {
                const tr = document.createElement('tr');
                tr.className = row._ES_GANADOR ? 'tr-winner' : 'tr-discard';

                // 1. Índice
                const tdIdx = document.createElement('td');
                tdIdx.style.fontFamily = 'var(--font-mono)';
                tdIdx.style.color = 'var(--text-muted)';
                tdIdx.textContent = row._INDICE_ORIGINAL;
                tr.appendChild(tdIdx);

                // 2. Estado Badge
                const tdStatus = document.createElement('td');
                const badge = document.createElement('span');
                if (row._ES_GANADOR && row._GRUPO_TOTAL > 1) {
                    badge.className = 'badge-status badge-winner';
                    badge.innerHTML = '🏆 Ganador';
                } else if (row._ES_GANADOR) {
                    badge.className = 'badge-status badge-single';
                    badge.innerHTML = '✓ Único';
                } else {
                    badge.className = 'badge-status badge-discard';
                    badge.innerHTML = '✕ Descarte';
                }
                tdStatus.appendChild(badge);
                tr.appendChild(tdStatus);

                // 3. Clúster ID
                const tdGroup = document.createElement('td');
                const groupBadge = document.createElement('span');
                groupBadge.style.fontFamily = 'var(--font-mono)';
                groupBadge.style.fontSize = '0.72rem';
                groupBadge.style.padding = '0.15rem 0.4rem';
                groupBadge.style.borderRadius = '4px';
                groupBadge.style.background = 'rgba(255,255,255,0.05)';
                groupBadge.style.border = '1px solid var(--border-subtle)';
                groupBadge.textContent = row._GRUPO_ID;
                tdGroup.appendChild(groupBadge);
                tr.appendChild(tdGroup);

                // 4. Motivo
                const tdMotivo = document.createElement('td');
                if (!row._ES_GANADOR) {
                    tdMotivo.style.color = '#F87171';
                    tdMotivo.style.fontWeight = '600';
                    tdMotivo.textContent = row._MOTIVO_DESCARTE;
                    tdMotivo.title = row._MOTIVO_DESCARTE;
                } else if (row._GRUPO_TOTAL > 1) {
                    tdMotivo.style.color = 'var(--status-winner)';
                    tdMotivo.textContent = 'Ganador del clúster por jerarquía';
                } else {
                    tdMotivo.style.color = 'var(--text-muted)';
                    tdMotivo.textContent = 'Sin duplicados';
                }
                tr.appendChild(tdMotivo);

                // 5. Celdas del dataset original
                state.dataset.headers.forEach(h => {
                    const td = document.createElement('td');
                    const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
                    td.textContent = val;
                    td.title = val;
                    if (state.keyColumns.has(h)) {
                        td.style.fontWeight = '700';
                        td.style.color = 'var(--dupe-teal-light)';
                    }
                    tr.appendChild(td);
                });

                tbody.appendChild(tr);
            });
        }

        // Paginación UI
        if (pageInfo) {
            pageInfo.textContent = `Mostrando ${totalItems === 0 ? 0 : startIdx + 1} - ${endIdx} de ${totalItems.toLocaleString()} filas`;
        }
        if (pageCurrent) pageCurrent.textContent = state.currentPage;
        if (pageTotal) pageTotal.textContent = totalPages;
        if (btnPrev) btnPrev.disabled = state.currentPage <= 1;
        if (btnNext) btnNext.disabled = state.currentPage >= totalPages;
    }

    function toggleSort(colKey) {
        if (state.sortColumn === colKey) {
            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortColumn = colKey;
            state.sortDirection = 'asc';
        }
        renderResultsTable();
    }

    // =========================================================================
    // 10. EXPORTACIÓN & DESCARGAS
    // =========================================================================
    function initExportActions() {
        const btnExcelBoth = document.getElementById('btnExportExcelBoth');
        const btnExcelClean = document.getElementById('btnExportExcelClean');
        const btnExcelDiscards = document.getElementById('btnExportExcelDiscards');
        const btnCsvClean = document.getElementById('btnExportCsvClean');
        const btnCsvDiscards = document.getElementById('btnExportCsvDiscards');
        const btnCopyTsv = document.getElementById('btnCopyClipboard');
        const btnReportMd = document.getElementById('btnExportReportMd');

        if (btnExcelBoth) btnExcelBoth.addEventListener('click', () => exportExcelFull());
        if (btnExcelClean) btnExcelClean.addEventListener('click', () => exportExcelCleanOnly());
        if (btnExcelDiscards) btnExcelDiscards.addEventListener('click', () => exportExcelDiscardsOnly());
        if (btnCsvClean) btnCsvClean.addEventListener('click', () => exportCsvCleanOnly());
        if (btnCsvDiscards) btnCsvDiscards.addEventListener('click', () => exportCsvDiscardsOnly());
        if (btnCopyTsv) btnCopyTsv.addEventListener('click', () => copyActiveTableToClipboard());
        if (btnReportMd) btnReportMd.addEventListener('click', () => exportMarkdownReport());
    }

    function sanitizeBaseName() {
        const orig = state.dataset.fileName || 'datos_depurados';
        return orig.replace(/\.[^/.]+$/, '');
    }

    // Exportar Excel con 2 Hojas (Únicos + Descartes)
    function exportExcelFull() {
        if (!state.results) return;
        try {
            const wb = XLSX.utils.book_new();

            // Hoja 1: Únicos
            const cleanRows = state.results.uniqueRows;
            const wsClean = XLSX.utils.json_to_sheet(cleanRows);
            XLSX.utils.book_append_sheet(wb, wsClean, 'Datos Únicos');

            // Hoja 2: Descartes
            const discardRows = state.results.discardedRows;
            const wsDiscard = XLSX.utils.json_to_sheet(discardRows);
            XLSX.utils.book_append_sheet(wb, wsDiscard, 'Auditoría Descartes');

            const fileName = `${sanitizeBaseName()}_depurado_maestro.xlsx`;
            XLSX.writeFile(wb, fileName);
            showToast(`Excel Maestro descargado: ${fileName}`, 'success');
        } catch (err) {
            console.error(err);
            showToast('Error al exportar Excel: ' + err.message, 'error');
        }
    }

    // Exportar Excel solo únicos
    function exportExcelCleanOnly() {
        if (!state.results) return;
        try {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(state.results.uniqueRows);
            XLSX.utils.book_append_sheet(wb, ws, 'Datos Únicos');
            const fileName = `${sanitizeBaseName()}_unicos.xlsx`;
            XLSX.writeFile(wb, fileName);
            showToast(`Excel de datos únicos descargado: ${fileName}`, 'success');
        } catch (err) {
            console.error(err);
            showToast('Error al exportar Excel: ' + err.message, 'error');
        }
    }

    // Exportar Excel solo descartes
    function exportExcelDiscardsOnly() {
        if (!state.results) return;
        try {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(state.results.discardedRows);
            XLSX.utils.book_append_sheet(wb, ws, 'Descartes');
            const fileName = `${sanitizeBaseName()}_descartes.xlsx`;
            XLSX.writeFile(wb, fileName);
            showToast(`Excel de descartes descargado: ${fileName}`, 'success');
        } catch (err) {
            console.error(err);
            showToast('Error al exportar Excel: ' + err.message, 'error');
        }
    }

    // Exportar CSV Limpio
    function exportCsvCleanOnly() {
        if (!state.results) return;
        const csvContent = DuplicateEngine.toCSV(state.results.uniqueRows, state.dataset.headers);
        downloadFile(csvContent, `${sanitizeBaseName()}_unicos.csv`, 'text/csv;charset=utf-8;');
        showToast('CSV de datos únicos descargado con éxito.', 'success');
    }

    // Exportar CSV Descartes con Motivo
    function exportCsvDiscardsOnly() {
        if (!state.results) return;
        const discardHeaders = ['_GRUPO_ID', '_MOTIVO_DESCARTE', ...state.dataset.headers];
        const csvContent = DuplicateEngine.toCSV(state.results.discardedRows, discardHeaders);
        downloadFile(csvContent, `${sanitizeBaseName()}_descartes.csv`, 'text/csv;charset=utf-8;');
        showToast('CSV de descartes con motivo descargado con éxito.', 'success');
    }

    // Copiar al Portapapeles (TSV)
    function copyActiveTableToClipboard() {
        if (!state.results) return;
        const filtered = getFilteredRows();
        if (filtered.length === 0) {
            showToast('No hay filas visibles para copiar.', 'error');
            return;
        }

        const headers = ['_INDICE_ORIGINAL', '_ESTADO', '_GRUPO_ID', '_MOTIVO_DESCARTE', ...state.dataset.headers];
        const tsv = DuplicateEngine.toTSV(filtered, headers);

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(tsv).then(() => {
                showToast(`¡Copiadas ${filtered.length.toLocaleString()} filas en formato TSV al portapapeles!`, 'success');
            }).catch(() => {
                fallbackCopy(tsv);
            });
        } else {
            fallbackCopy(tsv);
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showToast('¡Copiado al portapapeles con éxito!', 'success');
        } catch (e) {
            showToast('No se pudo copiar automáticamente al portapapeles.', 'error');
        }
        document.body.removeChild(ta);
    }

    // Exportar Informe Markdown
    function exportMarkdownReport() {
        if (!state.results) return;
        const md = DuplicateEngine.generateMarkdownReport(
            state.results,
            Array.from(state.keyColumns),
            state.rules,
            state.dataset.fileName
        );
        downloadFile(md, `auditoria_duplicados_${sanitizeBaseName()}.md`, 'text/markdown;charset=utf-8;');
        showToast('Informe de auditoría (.md) descargado.', 'success');
    }

    function downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // =========================================================================
    // 11. GESTIÓN DE MODALES (AYUDA, PEGAR, PREVIEW)
    // =========================================================================
    function initModals() {
        // Modal de Ayuda
        const helpModal = document.getElementById('helpModal');
        const btnOpenHelp = document.getElementById('btnOpenHelpModal');
        const btnOpenHelpHero = document.getElementById('btnOpenHelpHero');
        const btnCloseHelp = document.getElementById('btnCloseHelpModal');
        const btnCloseHelpFooter = document.getElementById('btnCloseHelpModalFooter');
        const btnFooterHelp = document.getElementById('btnFooterHelp');

        const openHelp = (defaultTabId) => {
            if (helpModal) {
                helpModal.classList.add('open');
                if (defaultTabId) switchHelpTab(defaultTabId);
            }
        };

        const closeHelp = () => {
            if (helpModal) helpModal.classList.remove('open');
        };

        if (btnOpenHelp) btnOpenHelp.addEventListener('click', () => openHelp('tabHelpOverview'));
        if (btnOpenHelpHero) btnOpenHelpHero.addEventListener('click', () => openHelp('tabHelpPresets'));
        if (btnFooterHelp) btnFooterHelp.addEventListener('click', () => openHelp('tabHelpOverview'));
        if (btnCloseHelp) btnCloseHelp.addEventListener('click', closeHelp);
        if (btnCloseHelpFooter) btnCloseHelpFooter.addEventListener('click', closeHelp);
        if (helpModal) {
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) closeHelp();
            });
        }

        // Botones de ayuda contextual en cada paso
        const stepHelpButtons = document.querySelectorAll('.btn-step-help');
        stepHelpButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabTarget = btn.getAttribute('data-help-tab') || 'tabHelpOverview';
                openHelp(tabTarget);
            });
        });

        // Pestañas del Modal de Ayuda
        const helpTabBtns = document.querySelectorAll('.help-tab-btn');
        helpTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-tab');
                switchHelpTab(targetId);
            });
        });

        function switchHelpTab(tabId) {
            helpTabBtns.forEach(b => {
                if (b.getAttribute('data-tab') === tabId) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });

            const panes = document.querySelectorAll('.help-tab-pane');
            panes.forEach(p => {
                if (p.id === tabId) {
                    p.classList.add('active');
                } else {
                    p.classList.remove('active');
                }
            });
        }

        // Modal de Pegar Datos
        const pasteModal = document.getElementById('pasteModal');
        const btnOpenPaste = document.getElementById('btnPasteData');
        const btnClosePaste = document.getElementById('btnClosePasteModal');
        const btnCancelPaste = document.getElementById('btnCancelPaste');
        const btnConfirmPaste = document.getElementById('btnConfirmPaste');
        const pasteTextarea = document.getElementById('pasteTextarea');

        if (btnOpenPaste && pasteModal) {
            btnOpenPaste.addEventListener('click', (e) => {
                e.stopPropagation();
                pasteModal.classList.add('open');
                if (pasteTextarea) {
                    pasteTextarea.value = '';
                    setTimeout(() => pasteTextarea.focus(), 100);
                }
            });
        }

        const closePaste = () => {
            if (pasteModal) pasteModal.classList.remove('open');
        };

        if (btnClosePaste) btnClosePaste.addEventListener('click', closePaste);
        if (btnCancelPaste) btnCancelPaste.addEventListener('click', closePaste);

        if (btnConfirmPaste && pasteTextarea) {
            btnConfirmPaste.addEventListener('click', () => {
                const text = pasteTextarea.value.trim();
                if (!text) {
                    showToast('Por favor pega texto o datos antes de continuar.', 'error');
                    return;
                }

                const parsed = DuplicateEngine.parseCSV(text);
                if (parsed.headers.length === 0 || parsed.rows.length === 0) {
                    showToast('No se pudieron detectar columnas o filas en el texto pegado.', 'error');
                    return;
                }

                state.dataset.fileName = 'datos_pegados.csv';
                state.dataset.headers = parsed.headers;
                state.dataset.rows = parsed.rows;
                state.dataset.totalRows = parsed.rows.length;
                state.dataset.workbook = null;
                state.dataset.sheets = [];
                state.dataset.currentSheet = '';

                closePaste();
                onNewDatasetLoaded();
                showToast(`Se cargaron ${parsed.rows.length.toLocaleString()} filas desde el portapapeles.`, 'success');
            });
        }

        // Modal de Vista Previa
        const previewModal = document.getElementById('previewModal');
        const btnClosePreview = document.getElementById('btnClosePreviewModal');
        const btnClosePreviewFooter = document.getElementById('btnClosePreviewModalFooter');

        const closePreview = () => {
            if (previewModal) previewModal.classList.remove('open');
        };

        if (btnClosePreview) btnClosePreview.addEventListener('click', closePreview);
        if (btnClosePreviewFooter) btnClosePreviewFooter.addEventListener('click', closePreview);

        // Cerrar modales con tecla Escape y clic en backdrop
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeHelp();
                closePaste();
                closePreview();
            }
        });

        [helpModal, pasteModal, previewModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('open');
                    }
                });
            }
        });
    }

    function openPreviewModal() {
        const previewModal = document.getElementById('previewModal');
        const theadRow = document.getElementById('previewTableHeadRow');
        const tbody = document.getElementById('previewTableBody');

        if (!previewModal || !theadRow || !tbody || state.dataset.headers.length === 0) {
            showToast('No hay datos cargados para previsualizar.', 'error');
            return;
        }

        theadRow.innerHTML = '';
        state.dataset.headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            theadRow.appendChild(th);
        });

        tbody.innerHTML = '';
        const sampleRows = state.dataset.rows.slice(0, 50);

        sampleRows.forEach(row => {
            const tr = document.createElement('tr');
            state.dataset.headers.forEach(h => {
                const td = document.createElement('td');
                const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
                td.textContent = val;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        previewModal.classList.add('open');
    }

    // =========================================================================
    // 12. SISTEMA DE NOTIFICACIONES TOAST
    // =========================================================================
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '⚠️';

        toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = 'all 0.3s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 4000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

})();
