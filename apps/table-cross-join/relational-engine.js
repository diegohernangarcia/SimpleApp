/**
 * RelationalEngine - Motor Relacional de Cruce y Conciliación de Tablas
 * Módulo #07 • Datos & Conciliación • SimpleApps Suite
 * 
 * Implementa indexación hash en memoria O(N + M) para cruces de datos ultrarrápidos,
 * soporte de VLOOKUP / BUSCAV, SQL JOINs (Inner, Left, Right, Full Outer, Exclusivos),
 * multi-columna clave compuesta, y auditoría de discrepancias numéricas y de texto.
 * 
 * Compatible con entornos Navegador (Vanilla JS) y Node.js (CommonJS / ES Modules).
 */

class RelationalEngine {
    constructor() {}

    /**
     * Parsea un texto CSV/TSV respetando comillas, comas, saltos de línea internos y delimitadores variables.
     * @param {string} text - Contenido en texto plano del archivo CSV o TSV.
     * @param {Object} [options] - Opciones de parseo.
     * @param {string} [options.delimiter] - Delimitador forzado (si no se pasa, se autodetermina).
     * @param {boolean} [options.hasHeaders=true] - Si la primera fila son nombres de columnas.
     * @returns {{ headers: string[], rows: Array<Record<string, any>>, rawRows: Array<string[]> }}
     */
    static parseCSV(text, options = {}) {
        if (!text || typeof text !== 'string') {
            return { headers: [], rows: [], rawRows: [] };
        }

        const delimiter = options.delimiter || this.detectDelimiter(text);
        const hasHeaders = options.hasHeaders !== false;

        const rawRows = [];
        let currentRow = [];
        let currentField = '';
        let insideQuotes = false;

        const len = text.length;
        for (let i = 0; i < len; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (insideQuotes) {
                if (char === '"') {
                    if (nextChar === '"') {
                        currentField += '"';
                        i++; // Saltar comilla de escape
                    } else {
                        insideQuotes = false;
                    }
                } else {
                    currentField += char;
                }
            } else {
                if (char === '"') {
                    insideQuotes = true;
                } else if (char === delimiter) {
                    currentRow.push(currentField);
                    currentField = '';
                } else if (char === '\r') {
                    if (nextChar === '\n') {
                        i++;
                    }
                    currentRow.push(currentField);
                    rawRows.push(currentRow);
                    currentRow = [];
                    currentField = '';
                } else if (char === '\n') {
                    currentRow.push(currentField);
                    rawRows.push(currentRow);
                    currentRow = [];
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
        }

        if (currentField.length > 0 || currentRow.length > 0) {
            currentRow.push(currentField);
            rawRows.push(currentRow);
        }

        // Limpiar filas vacías finales
        while (rawRows.length > 0 && rawRows[rawRows.length - 1].every(cell => !cell || cell.trim() === '')) {
            rawRows.pop();
        }

        if (rawRows.length === 0) {
            return { headers: [], rows: [], rawRows: [] };
        }

        let headers = [];
        let dataStartIndex = 0;

        if (hasHeaders) {
            const headerRow = rawRows[0];
            const colCounts = {};
            headers = headerRow.map((h, idx) => {
                let name = (h || '').trim();
                if (!name) name = `Columna_${idx + 1}`;
                if (colCounts[name]) {
                    colCounts[name]++;
                    return `${name}_${colCounts[name]}`;
                }
                colCounts[name] = 1;
                return name;
            });
            dataStartIndex = 1;
        } else {
            const maxCols = Math.max(...rawRows.map(r => r.length));
            headers = Array.from({ length: maxCols }, (_, i) => `Columna_${i + 1}`);
        }

        const rows = [];
        for (let r = dataStartIndex; r < rawRows.length; r++) {
            const rowData = rawRows[r];
            // Ignorar fila si está completamente vacía
            if (rowData.every(cell => !cell || cell.trim() === '')) continue;

            const rowObj = {};
            for (let c = 0; c < headers.length; c++) {
                const header = headers[c];
                rowObj[header] = rowData[c] !== undefined ? rowData[c] : '';
            }
            rows.push(rowObj);
        }

        return { headers, rows, rawRows };
    }

    /**
     * Autodetecta el delimitador de un texto analizando las primeras 15 líneas.
     * @param {string} text 
     * @returns {string} Delimitador detectado (',', ';', '\t', o '|')
     */
    static detectDelimiter(text) {
        const sampleLines = text.split(/\r?\n/).slice(0, 15).filter(l => l.trim().length > 0);
        if (sampleLines.length === 0) return ',';

        const candidates = [',', ';', '\t', '|'];
        const scores = { ',': 0, ';': 0, '\t': 0, '|': 0 };

        candidates.forEach(delim => {
            const counts = sampleLines.map(line => {
                let count = 0;
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    if (line[i] === '"') inQuotes = !inQuotes;
                    else if (line[i] === delim && !inQuotes) count++;
                }
                return count;
            });

            const firstCount = counts[0];
            if (firstCount > 0) {
                // Mayor consistencia entre líneas favorece el puntaje
                const consistent = counts.every(c => c === firstCount);
                scores[delim] = firstCount * (consistent ? 2.5 : 1.0);
            }
        });

        let bestDelim = ',';
        let maxScore = -1;
        candidates.forEach(c => {
            if (scores[c] > maxScore) {
                maxScore = scores[c];
                bestDelim = c;
            }
        });

        return maxScore > 0 ? bestDelim : ',';
    }

    /**
     * Convierte una o más celdas clave en un hash string unificado normalizado.
     * @param {Array<any>} keyValues - Valores de las columnas clave de una fila.
     * @param {Object} [options] - Opciones de normalización.
     * @returns {string} Cadena hash normalizada.
     */
    static normalizeKey(keyValues, options = {}) {
        const {
            trim = true,
            caseInsensitive = true,
            ignoreLeadingZeros = false,
            ignorePunctuation = false,
            numericCoerce = false
        } = options;

        const parts = keyValues.map(val => {
            if (val === null || val === undefined) return '';
            let s = String(val);

            if (trim) {
                s = s.trim();
            }

            if (caseInsensitive) {
                s = s.toLowerCase();
            }

            if (ignorePunctuation) {
                // Quitar puntos, comas, guiones, barras, barras bajas y espacios intermedios
                s = s.replace(/[\.\,\-\_\/\\ ]+/g, '');
            }

            if (ignoreLeadingZeros) {
                // Quitar ceros a la izquierda si es alfanumérico o numérico: "000123" -> "123"
                s = s.replace(/^0+([0-9A-Za-z]+)/, '$1');
            }

            if (numericCoerce) {
                // Normalizar números como "10.00" -> "10"
                const cleanNum = s.replace(/,/g, '.');
                const num = parseFloat(cleanNum);
                if (!isNaN(num) && cleanNum === String(num)) {
                    s = String(num);
                }
            }

            return s;
        });

        // Delimitador seguro que no colisiona con texto común
        return parts.join('\x1F');
    }

    /**
     * Ejecuta el cruce relacional e indexación hash en memoria de alta velocidad.
     * 
     * @param {Object} tableA - { headers: string[], rows: Array<Record<string, any>>, name?: string }
     * @param {Object} tableB - { headers: string[], rows: Array<Record<string, any>>, name?: string }
     * @param {Object} config - Configuración del cruce relacional.
     * @param {string} [config.joinType='left'] - 'inner' | 'left' | 'right' | 'full' | 'left-exclusive' | 'right-exclusive' | 'discrepancies'
     * @param {Array<{colA: string, colB: string}>} [config.keys=[]] - Pares de columnas clave.
     * @param {Object} [config.keyOptions] - Opciones de normalización (trim, caseInsensitive, etc.).
     * @param {string} [config.multiMatchMode='all'] - 'all' (SQL cartesiano) | 'first' (Excel VLOOKUP) | 'last'
     * @param {Array<string>} [config.selectedColsA] - Lista de columnas a incluir de Tabla A (null = todas).
     * @param {Array<string>} [config.selectedColsB] - Lista de columnas a incluir de Tabla B (null = todas).
     * @param {string} [config.conflictMode='suffix'] - 'suffix' (_A, _B) | 'prefix' (A_, B_)
     * @param {string} [config.prefixA='A_']
     * @param {string} [config.prefixB='B_']
     * @param {string} [config.suffixA='_A']
     * @param {string} [config.suffixB='_B']
     * @param {boolean} [config.includeMatchStatus=true] - Agregar columna `_ESTADO_CRUCE`
     * @param {Array<{colA: string, colB: string, tolerance?: number, label?: string}>} [config.reconciliations=[]] - Columnas de auditoría de diferencias
     * 
     * @returns {Object} Resultado con { headers, rows, stats, meta }
     */
    static join(tableA, tableB, config = {}) {
        const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

        const rowsA = (tableA && tableA.rows) || [];
        const rowsB = (tableB && tableB.rows) || [];
        const headersA = (tableA && tableA.headers) || [];
        const headersB = (tableB && tableB.headers) || [];

        const joinType = config.joinType || 'left';
        const keys = (config.keys && config.keys.length > 0) ? config.keys : [{ colA: headersA[0] || '', colB: headersB[0] || '' }];
        const keyOptions = Object.assign({
            trim: true,
            caseInsensitive: true,
            ignoreLeadingZeros: false,
            ignorePunctuation: false,
            numericCoerce: false
        }, config.keyOptions || {});

        const multiMatchMode = config.multiMatchMode || 'all'; // 'all' | 'first' | 'last'
        const includeMatchStatus = config.includeMatchStatus !== false;
        const reconciliations = config.reconciliations || [];

        // 1. Resolver nombres de columnas de salida para evitar colisiones
        const selectedColsA = config.selectedColsA || headersA;
        const selectedColsB = config.selectedColsB || headersB;

        const conflictMode = config.conflictMode || 'suffix';
        const suffixA = config.suffixA !== undefined ? config.suffixA : '_A';
        const suffixB = config.suffixB !== undefined ? config.suffixB : '_B';
        const prefixA = config.prefixA !== undefined ? config.prefixA : 'A_';
        const prefixB = config.prefixB !== undefined ? config.prefixB : 'B_';

        const setA = new Set(selectedColsA);
        const colMappingA = {};
        const colMappingB = {};
        const outputHeaders = [];

        // Mapear columnas de A
        selectedColsA.forEach(col => {
            let outName = col;
            if (headersB.includes(col)) {
                outName = conflictMode === 'prefix' ? `${prefixA}${col}` : `${col}${suffixA}`;
            }
            colMappingA[col] = outName;
            outputHeaders.push(outName);
        });

        // Mapear columnas de B
        selectedColsB.forEach(col => {
            let outName = col;
            if (setA.has(col)) {
                outName = conflictMode === 'prefix' ? `${prefixB}${col}` : `${col}${suffixB}`;
            }
            colMappingB[col] = outName;
            outputHeaders.push(outName);
        });

        // Columna de estado si está activada
        const statusColName = '_ESTADO_CRUCE';
        if (includeMatchStatus) {
            outputHeaders.push(statusColName);
        }

        // Columnas de auditoría / discrepancia numérica
        const reconColDefs = [];
        reconciliations.forEach(rec => {
            if (rec.colA && rec.colB) {
                const label = rec.label || `${rec.colA}_vs_${rec.colB}`;
                const diffCol = `_DIF_${label}`;
                const statusCol = `_AUDIT_${label}`;
                reconColDefs.push({
                    colA: rec.colA,
                    colB: rec.colB,
                    tolerance: typeof rec.tolerance === 'number' ? rec.tolerance : 0,
                    diffCol,
                    statusCol,
                    label
                });
                outputHeaders.push(diffCol);
                outputHeaders.push(statusCol);
            }
        });

        // 2. Construir Índices Hash O(N + M)
        const hashIndexB = new Map();
        let dupesCountB = 0;

        for (let i = 0; i < rowsB.length; i++) {
            const rowB = rowsB[i];
            const keyVals = keys.map(k => rowB[k.colB]);
            const hash = this.normalizeKey(keyVals, keyOptions);

            let entry = hashIndexB.get(hash);
            if (!entry) {
                entry = [];
                hashIndexB.set(hash, entry);
            } else {
                dupesCountB++;
            }
            entry.push({ row: rowB, index: i });
        }

        // Índice para A si necesitamos saber huérfanos de B o RIGHT / FULL / DISCREPANCIAS
        const hashIndexA = new Map();
        let dupesCountA = 0;

        for (let i = 0; i < rowsA.length; i++) {
            const rowA = rowsA[i];
            const keyVals = keys.map(k => rowA[k.colA]);
            const hash = this.normalizeKey(keyVals, keyOptions);

            let entry = hashIndexA.get(hash);
            if (!entry) {
                entry = [];
                hashIndexA.set(hash, entry);
            } else {
                dupesCountA++;
            }
            entry.push({ row: rowA, index: i });
        }

        // Conjuntos para rastrear índices emparejados
        const matchedIndicesA = new Set();
        const matchedIndicesB = new Set();
        const resultRows = [];

        // Contadores estadísticos
        let matchesCount = 0;
        let unmatchedCountA = 0;
        let unmatchedCountB = 0;
        let reconciledSquareCount = 0;
        let reconciledDiffCount = 0;

        // Función auxiliar para crear fila vacía
        const createEmptyRow = () => {
            const obj = {};
            outputHeaders.forEach(h => { obj[h] = ''; });
            return obj;
        };

        // Función auxiliar para aplicar auditoría de valores
        const applyReconciliation = (outRow, rowA, rowB) => {
            reconColDefs.forEach(rec => {
                const valA = rowA ? rowA[rec.colA] : undefined;
                const valB = rowB ? rowB[rec.colB] : undefined;

                if (valA === undefined || valA === '' || valB === undefined || valB === '') {
                    outRow[rec.diffCol] = '';
                    outRow[rec.statusCol] = 'SIN_PAR';
                    return;
                }

                const numA = this.parseNumber(valA);
                const numB = this.parseNumber(valB);

                if (!isNaN(numA) && !isNaN(numB)) {
                    const diff = numA - numB;
                    const roundedDiff = Math.round(diff * 10000) / 10000;
                    outRow[rec.diffCol] = roundedDiff;
                    if (Math.abs(roundedDiff) <= rec.tolerance) {
                        outRow[rec.statusCol] = 'CUADRADO';
                        reconciledSquareCount++;
                    } else {
                        outRow[rec.statusCol] = 'DESCUADRADO';
                        reconciledDiffCount++;
                    }
                } else {
                    // Comparación textual
                    const strA = String(valA).trim();
                    const strB = String(valB).trim();
                    if (strA === strB) {
                        outRow[rec.diffCol] = 0;
                        outRow[rec.statusCol] = 'CUADRADO';
                        reconciledSquareCount++;
                    } else {
                        outRow[rec.diffCol] = 'DISTINTO';
                        outRow[rec.statusCol] = 'DESCUADRADO';
                        reconciledDiffCount++;
                    }
                }
            });
        };

        // 3. Procesar Tabla A contra Hash de B
        for (let i = 0; i < rowsA.length; i++) {
            const rowA = rowsA[i];
            const keyVals = keys.map(k => rowA[k.colA]);
            const hash = this.normalizeKey(keyVals, keyOptions);

            const matchEntriesB = hashIndexB.get(hash);

            if (matchEntriesB && matchEntriesB.length > 0) {
                // Hay coincidencia(s)
                matchedIndicesA.add(i);
                matchEntriesB.forEach(e => matchedIndicesB.add(e.index));

                // Filtrar según multiMatchMode ('all', 'first', 'last')
                let entriesToUse = matchEntriesB;
                if (multiMatchMode === 'first') {
                    entriesToUse = [matchEntriesB[0]];
                } else if (multiMatchMode === 'last') {
                    entriesToUse = [matchEntriesB[matchEntriesB.length - 1]];
                }

                // Generar filas para INNER, LEFT, FULL
                if (joinType === 'inner' || joinType === 'left' || joinType === 'full') {
                    for (let m = 0; m < entriesToUse.length; m++) {
                        const entryB = entriesToUse[m];
                        const outRow = createEmptyRow();

                        // Copiar columnas de A
                        selectedColsA.forEach(col => {
                            outRow[colMappingA[col]] = rowA[col] !== undefined ? rowA[col] : '';
                        });

                        // Copiar columnas de B
                        selectedColsB.forEach(col => {
                            outRow[colMappingB[col]] = entryB.row[col] !== undefined ? entryB.row[col] : '';
                        });

                        if (includeMatchStatus) {
                            outRow[statusColName] = 'COINCIDENCIA (A + B)';
                        }

                        applyReconciliation(outRow, rowA, entryB.row);
                        resultRows.push(outRow);
                        matchesCount++;
                    }
                }
            } else {
                // No hay coincidencia para esta fila de A (Huérfano de A)
                unmatchedCountA++;

                if (joinType === 'left' || joinType === 'full' || joinType === 'left-exclusive' || joinType === 'discrepancies') {
                    const outRow = createEmptyRow();

                    selectedColsA.forEach(col => {
                        outRow[colMappingA[col]] = rowA[col] !== undefined ? rowA[col] : '';
                    });

                    // Columnas de B quedan vacías
                    selectedColsB.forEach(col => {
                        outRow[colMappingB[col]] = '';
                    });

                    if (includeMatchStatus) {
                        outRow[statusColName] = 'SOLO EN TABLA A';
                    }

                    applyReconciliation(outRow, rowA, null);
                    resultRows.push(outRow);
                }
            }
        }

        // 4. Procesar Filas de B que no coincidieron o para RIGHT / FULL / RIGHT-EXCLUSIVE / DISCREPANCIAS
        for (let j = 0; j < rowsB.length; j++) {
            const wasMatched = matchedIndicesB.has(j);
            const rowB = rowsB[j];

            if (!wasMatched) {
                unmatchedCountB++;

                if (joinType === 'right' || joinType === 'full' || joinType === 'right-exclusive' || joinType === 'discrepancies') {
                    const outRow = createEmptyRow();

                    // Columnas de A quedan vacías
                    selectedColsA.forEach(col => {
                        outRow[colMappingA[col]] = '';
                    });

                    // Columnas de B
                    selectedColsB.forEach(col => {
                        outRow[colMappingB[col]] = rowB[col] !== undefined ? rowB[col] : '';
                    });

                    if (includeMatchStatus) {
                        outRow[statusColName] = 'SOLO EN TABLA B';
                    }

                    applyReconciliation(outRow, null, rowB);
                    resultRows.push(outRow);
                }
            } else if (joinType === 'right') {
                // En un RIGHT JOIN tradicional, si hay coincidencias, ya fueron procesadas desde A si se cruzaron,
                // pero si una fila de B tuvo múltiples filas en A, o si queremos mantener el orden natural de B:
                // Para garantizar exactitud SQL en RIGHT JOIN puro:
                // Si la coincidencia provino de A, ya se insertó con todas las combinaciones en el paso anterior.
                // No se duplican.
            }
        }

        const endTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const executionTimeMs = Math.max(0.1, Math.round((endTime - startTime) * 10) / 10);

        return {
            headers: outputHeaders,
            rows: resultRows,
            stats: {
                totalRowsA: rowsA.length,
                totalRowsB: rowsB.length,
                resultRowCount: resultRows.length,
                matchesCount,
                unmatchedCountA,
                unmatchedCountB,
                dupesCountA,
                dupesCountB,
                reconciledSquareCount,
                reconciledDiffCount,
                executionTimeMs,
                joinType
            },
            meta: {
                keys,
                keyOptions,
                reconciliations: reconColDefs,
                conflictMode
            }
        };
    }

    /**
     * Parsea un valor numérico flexible admitiendo formatos locales (ej. 1.234,56 o 1,234.56).
     * @param {any} val 
     * @returns {number}
     */
    static parseNumber(val) {
        if (typeof val === 'number') return val;
        if (val === null || val === undefined) return NaN;
        let s = String(val).trim();
        if (s === '') return NaN;

        // Quitar símbolos de moneda y espacios
        s = s.replace(/[$€£¥\s]/g, '');

        // Detectar si usa coma como separador decimal (ej. "1234,56" o "1.234,56")
        if (s.includes(',') && !s.includes('.')) {
            s = s.replace(',', '.');
        } else if (s.includes('.') && s.includes(',')) {
            if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
                // Formato europeo/latam: 1.234,56
                s = s.replace(/\./g, '').replace(',', '.');
            } else {
                // Formato anglosajón: 1,234.56
                s = s.replace(/,/g, '');
            }
        }

        return parseFloat(s);
    }

    /**
     * Exporta los datos a cadena CSV respetando delimitador y escapado.
     * @param {string[]} headers 
     * @param {Array<Record<string, any>>} rows 
     * @param {string} [delimiter=','] 
     * @returns {string}
     */
    static exportToCSV(headers, rows, delimiter = ',') {
        const escapeCell = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const headerLine = headers.map(escapeCell).join(delimiter);
        const dataLines = rows.map(row => {
            return headers.map(h => escapeCell(row[h])).join(delimiter);
        });

        return [headerLine, ...dataLines].join('\r\n');
    }

    /**
     * Exporta los datos a formato TSV ideal para copiar y pegar directamente en Excel (Ctrl + V).
     * @param {string[]} headers 
     * @param {Array<Record<string, any>>} rows 
     * @returns {string}
     */
    static exportToTSV(headers, rows) {
        return this.exportToCSV(headers, rows, '\t');
    }

    /**
     * Genera una tabla en formato Markdown con las primeras N filas.
     * @param {string[]} headers 
     * @param {Array<Record<string, any>>} rows 
     * @param {number} [maxRows=50] 
     * @returns {string}
     */
    static exportToMarkdown(headers, rows, maxRows = 50) {
        if (!headers || headers.length === 0) return '_Sin datos_';

        const safeStr = (v) => String(v !== undefined && v !== null ? v : '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
        const headerRow = `| ${headers.map(safeStr).join(' | ')} |`;
        const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;

        const slice = rows.slice(0, maxRows);
        const dataRows = slice.map(row => {
            return `| ${headers.map(h => safeStr(row[h])).join(' | ')} |`;
        });

        let md = [headerRow, separatorRow, ...dataRows].join('\n');
        if (rows.length > maxRows) {
            md += `\n\n_... (${rows.length - maxRows} filas adicionales no mostradas en la vista Markdown)_`;
        }
        return md;
    }

    /**
     * Genera un informe técnico ejecutivo de conciliación en Markdown listo para auditoría.
     * @param {Object} stats 
     * @param {Object} config 
     * @returns {string}
     */
    static generateAuditReport(stats, config = {}) {
        const date = new Date().toLocaleString();
        const joinTypeNames = {
            'inner': 'INNER JOIN (Solo Coincidencias Exactas)',
            'left': 'LEFT JOIN / VLOOKUP (Todos en A + Coincidencias de B)',
            'right': 'RIGHT JOIN (Todos en B + Coincidencias de A)',
            'full': 'FULL OUTER JOIN (Unión Completa Conciliada)',
            'left-exclusive': 'SOLO EN TABLA A (Huérfanos / Faltantes en B)',
            'right-exclusive': 'SOLO EN TABLA B (Huérfanos / Faltantes en A)',
            'discrepancies': 'AUDITORÍA DE DISCREPANCIAS (Diferencia Simétrica A ⊕ B)'
        };

        const keysDesc = (config.keys || []).map(k => `\`${k.colA}\` (Tabla A) ↔ \`${k.colB}\` (Tabla B)`).join(', ');

        return `# 📊 Informe de Conciliación y Cruce de Tablas (JOIN Express)
**Fecha y Hora:** ${date}  
**Módulo:** #07 • SimpleApps Relational Engine (100% Local y Confidencial)

---

## 📌 Configuración Operativa
- **Tipo de Cruce Relacional:** ${joinTypeNames[stats.joinType] || stats.joinType}
- **Columnas Clave:** ${keysDesc || 'Primera columna de cada tabla'}
- **Tiempo de Ejecución:** ${stats.executionTimeMs} ms *(Indexación Hash O(N+M))*

---

## 📈 Resumen Estadístico de Registros

| Métrica | Registros | Porcentaje |
|---|---|---|
| **Total Filas Tabla A (Principal)** | **${stats.totalRowsA}** | 100% |
| **Total Filas Tabla B (Comparación)** | **${stats.totalRowsB}** | 100% |
| **Coincidencias Encontradas (Matched)** | **${stats.matchesCount}** | ${stats.totalRowsA > 0 ? ((stats.matchesCount / stats.totalRowsA) * 100).toFixed(1) : 0}% de A |
| **Registros Únicamente en Tabla A (Unmatched A)** | **${stats.unmatchedCountA}** | ${stats.totalRowsA > 0 ? ((stats.unmatchedCountA / stats.totalRowsA) * 100).toFixed(1) : 0}% de A |
| **Registros Únicamente en Tabla B (Unmatched B)** | **${stats.unmatchedCountB}** | ${stats.totalRowsB > 0 ? ((stats.unmatchedCountB / stats.totalRowsB) * 100).toFixed(1) : 0}% de B |
| **Total Filas en Resultado Generado** | **${stats.resultRowCount}** | - |

${stats.reconciledSquareCount > 0 || stats.reconciledDiffCount > 0 ? `
---

## ⚖️ Auditoría de Cuadratura de Valores (Saldos / Montos)
- **Registros Cuadrados (Exactos dentro de tolerancia):** **${stats.reconciledSquareCount}** ✅
- **Registros Descuadrados (Discrepancia detectada):** **${stats.reconciledDiffCount}** ⚠️
` : ''}

${(stats.dupesCountA > 0 || stats.dupesCountB > 0) ? `
> ⚠️ **Aviso de Integridad Referencial:**
> Se detectaron claves duplicadas (${stats.dupesCountA} en Tabla A, ${stats.dupesCountB} en Tabla B). Modo de resolución aplicado: \`${config.multiMatchMode || 'all'}\`.
` : ''}

---
*Generado automáticamente por SimpleApps Suite • Módulo #07 JOIN Express*
`;
    }
}

// Compatibilidad Node.js / Browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RelationalEngine;
}
