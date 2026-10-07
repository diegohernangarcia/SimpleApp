/**
 * DuplicateEngine - Motor de Detección y Resolución Jerárquica de Duplicados
 * Módulo #08 • Datos & Conciliación • SimpleApps Suite
 * 
 * Implementa indexación hash en memoria O(N) para detección instantánea de duplicados,
 * encadenamiento determinista de reglas jerárquicas de prioridad (completitud, fechas,
 * valores numéricos, valores específicos, orden de aparición) y auditoría detallada
 * de motivos de descarte.
 * 
 * Compatible con Navegadores (Vanilla JS) y Node.js (CommonJS / ES Modules).
 */

class DuplicateEngine {
    constructor() {}

    /**
     * Parsea un texto CSV/TSV respetando comillas, comas, saltos de línea internos y delimitadores variables.
     * @param {string} text - Contenido en texto plano del archivo CSV o TSV.
     * @param {Object} [options] - Opciones de parseo.
     * @returns {{ headers: string[], rows: Array<Record<string, any>> }}
     */
    static parseCSV(text, options = {}) {
        if (!text || typeof text !== 'string') {
            return { headers: [], rows: [] };
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
                        i++;
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
                    if (nextChar === '\n') i++;
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
            return { headers: [], rows: [] };
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
            if (rowData.every(cell => !cell || cell.trim() === '')) continue;

            const rowObj = {};
            for (let c = 0; c < headers.length; c++) {
                const header = headers[c];
                rowObj[header] = rowData[c] !== undefined ? rowData[c] : '';
            }
            rows.push(rowObj);
        }

        return { headers, rows, errors: [] };
    }

    /**
     * Autodetecta el delimitador analizando las primeras 15 líneas.
     * @param {string} text 
     * @returns {string} (',', ';', '\t', '|')
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
     * Normaliza los valores de la clave según las opciones configuradas.
     * @param {Array<any>} keyValues 
     * @param {Object} [options] 
     * @returns {string}
     */
    static normalizeKey(keyValues, options = {}) {
        const {
            trim = true,
            caseInsensitive = true,
            ignoreLeadingZeros = false,
            ignorePunctuation = false
        } = options;

        const parts = keyValues.map(val => {
            if (val === null || val === undefined) return '';
            let s = String(val);

            if (trim) s = s.trim();
            if (caseInsensitive) s = s.toLowerCase();
            if (ignorePunctuation) s = s.replace(/[\.\,\-\_\/\\ ]+/g, '');
            if (ignoreLeadingZeros) s = s.replace(/^0+([0-9A-Za-z]+)/, '$1');

            return s;
        });

        return parts.join('\x1F');
    }

    /**
     * Calcula la cantidad de campos completos (no vacíos) de una fila.
     * @param {Record<string, any>} row 
     * @param {string[]} [columns] - Si se especifica, solo cuenta en esas columnas.
     * @returns {number}
     */
    static countCompletedFields(row, columns = null) {
        const colsToCheck = columns || Object.keys(row);
        let count = 0;

        colsToCheck.forEach(col => {
            const val = row[col];
            if (val !== null && val !== undefined) {
                const s = String(val).trim().toLowerCase();
                // Excluir cadenas vacías o marcadores nulos habituales
                if (s !== '' && s !== 'null' && s !== 'undefined' && s !== 'n/a' && s !== 'na' && s !== '-' && s !== '--') {
                    count++;
                }
            }
        });

        return count;
    }

    /**
     * Intenta parsear un valor como fecha Timestamp en milisegundos.
     * Admite ISO (YYYY-MM-DD), formato latino (DD/MM/YYYY), marcas de tiempo, etc.
     * @param {any} val 
     * @returns {number} Timestamp en ms o NaN
     */
    static parseDate(val) {
        if (!val) return NaN;
        if (val instanceof Date) return val.getTime();
        let s = String(val).trim();
        if (!s) return NaN;

        // Intentar formato DD/MM/YYYY o DD-MM-YYYY
        const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
        if (dmyMatch) {
            let day = parseInt(dmyMatch[1], 10);
            let month = parseInt(dmyMatch[2], 10) - 1;
            let year = parseInt(dmyMatch[3], 10);
            if (year < 100) year += 2000;
            let hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
            let min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
            let sec = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;

            const dt = new Date(year, month, day, hour, min, sec);
            if (!isNaN(dt.getTime())) return dt.getTime();
        }

        // Parseo estándar Date.parse
        const parsed = Date.parse(s);
        return !isNaN(parsed) ? parsed : NaN;
    }

    /**
     * Parsea un valor numérico flexible admitiendo monedas y formatos de coma/punto decimal.
     * @param {any} val 
     * @returns {number}
     */
    static parseNumber(val) {
        if (typeof val === 'number') return val;
        if (val === null || val === undefined) return NaN;
        let s = String(val).trim();
        if (s === '') return NaN;

        s = s.replace(/[$€£¥\s]/g, '');

        if (s.includes(',') && !s.includes('.')) {
            s = s.replace(',', '.');
        } else if (s.includes('.') && s.includes(',')) {
            if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
                s = s.replace(/\./g, '').replace(',', '.');
            } else {
                s = s.replace(/,/g, '');
            }
        }

        return parseFloat(s);
    }

    /**
     * Ejecuta el análisis de duplicados y aplica la jerarquía de reglas de prioridad.
     * 
     * @param {Object} dataset - { headers: string[], rows: Array<Record<string, any>> }
     * @param {Object} config - Configuración de deduplicación.
     * @param {string[]} config.keyColumns - Columnas que definen la unicidad.
     * @param {Object} [config.keyOptions] - Opciones de normalización de claves.
     * @param {Array<Object>} [config.priorityRules] - Reglas ordenadas por jerarquía.
     *        Ej: [
     *          { type: 'most_complete' },
     *          { type: 'date', column: 'Fecha', direction: 'newest' }, // 'newest' | 'oldest'
     *          { type: 'number', column: 'Monto', direction: 'highest' }, // 'highest' | 'lowest'
     *          { type: 'specific_value', column: 'Estado', value: 'Activo' },
     *          { type: 'appearance', direction: 'first' } // 'first' | 'last'
     *        ]
     * 
     * @returns {Object} Resultado con { cleanRows, discardedRows, allRowsWithMeta, clusters, stats, meta }
     */
    static process(dataset, config = {}) {
        const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

        // Soporte polimórfico de argumentos
        let rows = [];
        let headers = [];
        let keyColumns = [];
        let keyOptions = {};
        let rawRules = [];

        if (Array.isArray(dataset)) {
            rows = dataset;
            headers = rows.length > 0 ? Object.keys(rows[0]) : [];
            if (Array.isArray(config)) {
                keyColumns = config;
                rawRules = arguments[2] || [];
                keyOptions = arguments[3] || {};
            } else if (typeof config === 'object' && config !== null) {
                keyColumns = config.keyColumns || [];
                rawRules = config.priorityRules || config.rules || [];
                keyOptions = config.keyOptions || config.normalization || {};
            }
        } else if (dataset && typeof dataset === 'object') {
            rows = dataset.rows || [];
            headers = dataset.headers || (rows.length > 0 ? Object.keys(rows[0]) : []);
            keyColumns = config.keyColumns || [];
            rawRules = config.priorityRules || config.rules || [];
            keyOptions = config.keyOptions || config.normalization || {};
        }

        if (keyColumns.length === 0 && headers.length > 0) {
            keyColumns = [headers[0]];
        }

        const normalizedKeyOptions = Object.assign({
            trim: true,
            caseInsensitive: true,
            ignoreLeadingZeros: false,
            ignorePunctuation: false,
            ignoreAccents: true,
            collapseSpaces: true
        }, keyOptions);

        // Normalizar reglas para compatibilidad total con selectores
        const priorityRules = (rawRules.length > 0)
            ? rawRules.map(r => {
                const norm = Object.assign({}, r);
                if (norm.type === 'newest_date') {
                    norm.type = 'date';
                    norm.direction = 'newest';
                } else if (norm.type === 'oldest_date') {
                    norm.type = 'date';
                    norm.direction = 'oldest';
                } else if (norm.type === 'highest_value') {
                    norm.type = 'number';
                    norm.direction = 'highest';
                } else if (norm.type === 'lowest_value') {
                    norm.type = 'number';
                    norm.direction = 'lowest';
                } else if (norm.type === 'first_seen') {
                    norm.type = 'appearance';
                    norm.direction = 'first';
                } else if (norm.type === 'last_seen') {
                    norm.type = 'appearance';
                    norm.direction = 'last';
                }
                norm.value = norm.value || norm.targetValue || '';
                return norm;
            })
            : [
                { type: 'most_complete' },
                { type: 'appearance', direction: 'first' }
            ];

        // 1. Agrupar filas en Clusters por Clave Normalizada O(N)
        const clustersMap = new Map();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const keyVals = keyColumns.map(col => row[col]);
            const hash = this.normalizeKey(keyVals, normalizedKeyOptions);

            let cluster = clustersMap.get(hash);
            if (!cluster) {
                cluster = [];
                clustersMap.set(hash, cluster);
            }
            cluster.push({
                originalIndex: i,
                row,
                keyHash: hash
            });
        }

        // 2. Procesar cada Cluster aplicando la jerarquía de reglas
        const cleanRows = [];
        const discardedRows = [];
        const clusters = []; // Lista de grupos para análisis

        let totalDuplicatesFound = 0;
        let totalUniqueRetained = 0;
        const reasonsCount = {};

        clustersMap.forEach((clusterItems, hashKey) => {
            if (clusterItems.length === 1) {
                // Registro único sin duplicados
                const single = clusterItems[0];
                const cleanRow = Object.assign({}, single.row, {
                    _ESTADO_DEPURACION: 'CONSERVADO',
                    _ESTADO: 'UNICO',
                    _ES_GANADOR: true,
                    _MOTIVO_ACCION: 'Registro Único (Sin duplicados)',
                    _MOTIVO_DESCARTE: 'Sin duplicados',
                    _CLUSTER_ID: `U-${single.originalIndex + 1}`,
                    _GRUPO_ID: `U-${single.originalIndex + 1}`,
                    _GRUPO_TOTAL: 1,
                    _FILA_ORIGINAL: single.originalIndex + 1,
                    _INDICE_ORIGINAL: single.originalIndex + 1
                });
                cleanRows.push(cleanRow);
                totalUniqueRetained++;
            } else {
                // Hay duplicados en este cluster
                totalDuplicatesFound += (clusterItems.length - 1);
                const clusterId = `C-${clusters.length + 1}`;

                // Resolver ganador del cluster evaluando la jerarquía
                const evaluation = this.resolveWinner(clusterItems, priorityRules, headers);
                const winnerItem = evaluation.winner;

                // Fila ganadora
                const winnerCleanRow = Object.assign({}, winnerItem.row, {
                    _ESTADO_DEPURACION: 'CONSERVADO',
                    _ESTADO: 'CONSERVADO',
                    _ES_GANADOR: true,
                    _MOTIVO_ACCION: `Ganador del Grupo (${evaluation.winnerReason})`,
                    _MOTIVO_DESCARTE: `Ganador del clúster (${evaluation.winnerReason})`,
                    _CLUSTER_ID: clusterId,
                    _GRUPO_ID: clusterId,
                    _GRUPO_TOTAL: clusterItems.length,
                    _FILA_ORIGINAL: winnerItem.originalIndex + 1,
                    _INDICE_ORIGINAL: winnerItem.originalIndex + 1
                });
                cleanRows.push(winnerCleanRow);
                totalUniqueRetained++;

                // Filas descartadas
                const clusterSummary = {
                    clusterId,
                    keyHash: hashKey,
                    totalInGroup: clusterItems.length,
                    winnerOriginalRow: winnerItem.originalIndex + 1,
                    winnerReason: evaluation.winnerReason,
                    items: []
                };

                clusterItems.forEach(item => {
                    const isWinner = item.originalIndex === winnerItem.originalIndex;
                    const discardReason = isWinner
                        ? 'CONSERVADO (Ganador)'
                        : (evaluation.discardReasons.get(item.originalIndex) || 'Descartado por regla jerárquica');

                    if (!isWinner) {
                        const discardedRow = Object.assign({}, item.row, {
                            _ESTADO_DEPURACION: 'DESCARTADO',
                            _ESTADO: 'DESCARTADO',
                            _ES_GANADOR: false,
                            _MOTIVO_DESCARTE: discardReason,
                            _FILA_GANADORA: winnerItem.originalIndex + 1,
                            _CLUSTER_ID: clusterId,
                            _GRUPO_ID: clusterId,
                            _GRUPO_TOTAL: clusterItems.length,
                            _FILA_ORIGINAL: item.originalIndex + 1,
                            _INDICE_ORIGINAL: item.originalIndex + 1
                        });
                        discardedRows.push(discardedRow);

                        // Contabilizar motivos
                        reasonsCount[discardReason] = (reasonsCount[discardReason] || 0) + 1;
                    }

                    clusterSummary.items.push({
                        originalIndex: item.originalIndex,
                        row: item.row,
                        isWinner,
                        reason: discardReason
                    });
                });

                clusters.push(clusterSummary);
            }
        });

        // 3. Crear vista combinada completa ordenada según el archivo original
        const allRowsWithMeta = [];
        const cleanMap = new Map();
        cleanRows.forEach(r => cleanMap.set(r._FILA_ORIGINAL, r));
        const discMap = new Map();
        discardedRows.forEach(r => discMap.set(r._FILA_ORIGINAL, r));

        for (let i = 0; i < rows.length; i++) {
            const origIndex = i + 1;
            const r = cleanMap.get(origIndex) || discMap.get(origIndex);
            if (r) allRowsWithMeta.push(r);
        }

        const endTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const executionTimeMs = Math.max(0.1, Math.round((endTime - startTime) * 10) / 10);

        const dupesRate = rows.length > 0
            ? Math.round((totalDuplicatesFound / rows.length) * 1000) / 10
            : 0;

        return {
            cleanRows,
            uniqueRows: cleanRows,
            discardedRows,
            allRowsWithMeta,
            allRowsWithAudit: allRowsWithMeta,
            clusters,
            clustersMap,
            stats: {
                totalOriginalRows: rows.length,
                totalRows: rows.length,
                totalCleanRows: cleanRows.length,
                uniqueRows: cleanRows.length,
                totalDiscardedRows: discardedRows.length,
                discardedRows: discardedRows.length,
                clustersCount: clusters.length,
                duplicateClusters: clusters.length,
                duplicatesFound: totalDuplicatesFound,
                duplicatesRate: dupesRate,
                reasonsCount,
                executionTimeMs
            },
            meta: {
                keyColumns,
                keyOptions: normalizedKeyOptions,
                priorityRules
            }
        };
    }

    /**
     * Aplica la cadena jerárquica de reglas para determinar el registro ganador en un cluster.
     * @param {Array<{originalIndex: number, row: Record, keyHash: string}>} items 
     * @param {Array<Object>} rules 
     * @param {string[]} headers 
     * @returns {{ winner: Object, winnerReason: string, discardReasons: Map<number, string> }}
     */
    static resolveWinner(items, rules, headers) {
        let candidates = [...items];
        let decisiveRule = 'Primera fila encontrada';
        const discardReasons = new Map();

        for (let r = 0; r < rules.length; r++) {
            if (candidates.length <= 1) break;

            const rule = rules[r];
            const ruleNum = r + 1;

            if (rule.type === 'most_complete') {
                // Regla: Mayor completitud de campos no vacíos
                const counts = candidates.map(c => ({
                    candidate: c,
                    count: this.countCompletedFields(c.row, headers)
                }));
                const maxCount = Math.max(...counts.map(x => x.count));
                const minCount = Math.min(...counts.map(x => x.count));

                if (maxCount > minCount) {
                    decisiveRule = `Regla #${ruleNum} (Mayor Completitud: ${maxCount} campos vs menores)`;
                    // Registrar motivos de los que quedaron fuera
                    counts.forEach(x => {
                        if (x.count < maxCount) {
                            discardReasons.set(x.candidate.originalIndex, `Descartado por Regla #${ruleNum} (Menor completitud: ${x.count} campos vs ${maxCount} del ganador)`);
                        }
                    });
                    candidates = counts.filter(x => x.count === maxCount).map(x => x.candidate);
                }
            } else if (rule.type === 'date') {
                // Regla: Fecha más reciente o más antigua
                const col = rule.column;
                const dir = rule.direction || 'newest';

                if (col) {
                    const parsedDates = candidates.map(c => ({
                        candidate: c,
                        time: this.parseDate(c.row[col])
                    }));

                    const validDates = parsedDates.filter(x => !isNaN(x.time));

                    if (validDates.length > 0) {
                        const targetTime = dir === 'newest'
                            ? Math.max(...validDates.map(x => x.time))
                            : Math.min(...validDates.map(x => x.time));

                        const hadDifferences = validDates.some(x => x.time !== targetTime) || parsedDates.some(x => isNaN(x.time));

                        if (hadDifferences) {
                            const dateLabel = new Date(targetTime).toLocaleDateString();
                            decisiveRule = `Regla #${ruleNum} (Fecha ${dir === 'newest' ? 'más reciente' : 'más antigua'} en "${col}": ${dateLabel})`;

                            parsedDates.forEach(x => {
                                if (isNaN(x.time)) {
                                    discardReasons.set(x.candidate.originalIndex, `Descartado por Regla #${ruleNum} (Fecha inválida o ausente en "${col}")`);
                                } else if (x.time !== targetTime) {
                                    const otherDate = new Date(x.time).toLocaleDateString();
                                    discardReasons.set(x.candidate.originalIndex, `Descartado por Regla #${ruleNum} (Fecha ${dir === 'newest' ? 'anterior' : 'posterior'}: ${otherDate} vs ${dateLabel})`);
                                }
                            });

                            candidates = validDates.filter(x => x.time === targetTime).map(x => x.candidate);
                        }
                    }
                }
            } else if (rule.type === 'number') {
                // Regla: Valor numérico más alto o más bajo
                const col = rule.column;
                const dir = rule.direction || 'highest';

                if (col) {
                    const parsedNums = candidates.map(c => ({
                        candidate: c,
                        num: this.parseNumber(c.row[col])
                    }));

                    const validNums = parsedNums.filter(x => !isNaN(x.num));

                    if (validNums.length > 0) {
                        const targetVal = dir === 'highest'
                            ? Math.max(...validNums.map(x => x.num))
                            : Math.min(...validNums.map(x => x.num));

                        const hadDifferences = validNums.some(x => x.num !== targetVal) || parsedNums.some(x => isNaN(x.num));

                        if (hadDifferences) {
                            decisiveRule = `Regla #${ruleNum} (Valor ${dir === 'highest' ? 'más alto' : 'más bajo'} en "${col}": ${targetVal})`;

                            parsedNums.forEach(x => {
                                if (isNaN(x.num)) {
                                    discardReasons.set(x.candidate.originalIndex, `Descartado por Regla #${ruleNum} (Valor no numérico en "${col}")`);
                                } else if (x.num !== targetVal) {
                                    discardReasons.set(x.candidate.originalIndex, `Descartado por Regla #${ruleNum} (Valor en "${col}": ${x.num} vs ${targetVal})`);
                                }
                            });

                            candidates = validNums.filter(x => x.num === targetVal).map(x => x.candidate);
                        }
                    }
                }
            } else if (rule.type === 'specific_value') {
                // Regla: Preferencia por un valor textual específico (ej: "Activo" > otros)
                const col = rule.column;
                const targetValue = (rule.value || '').trim().toLowerCase();

                if (col && targetValue) {
                    const matches = candidates.filter(c => String(c.row[col] || '').trim().toLowerCase() === targetValue);
                    if (matches.length > 0 && matches.length < candidates.length) {
                        decisiveRule = `Regla #${ruleNum} (Valor preferido en "${col}" = "${rule.value}")`;
                        candidates.forEach(c => {
                            if (String(c.row[col] || '').trim().toLowerCase() !== targetValue) {
                                discardReasons.set(c.originalIndex, `Descartado por Regla #${ruleNum} ("${col}" diferente de "${rule.value}")`);
                            }
                        });
                        candidates = matches;
                    }
                }
            } else if (rule.type === 'appearance') {
                // Regla: Orden de aparición
                const dir = rule.direction || 'first';
                if (candidates.length > 1) {
                    const winner = dir === 'first'
                        ? candidates[0]
                        : candidates[candidates.length - 1];

                    decisiveRule = `Regla #${ruleNum} (Criterio de aparición: ${dir === 'first' ? 'primera' : 'última'} fila)`;

                    candidates.forEach(c => {
                        if (c.originalIndex !== winner.originalIndex) {
                            discardReasons.set(c.originalIndex, `Descartado por orden de aparición (${dir === 'first' ? 'fila posterior' : 'fila previa'})`);
                        }
                    });

                    candidates = [winner];
                }
            }
        }

        // Si aún hubiera empate absoluto, conservar la primera por defecto
        const winner = candidates[0];
        items.forEach(item => {
            if (item.originalIndex !== winner.originalIndex && !discardReasons.has(item.originalIndex)) {
                discardReasons.set(item.originalIndex, 'Descartado por coincidencia idéntica (se conserva primera fila)');
            }
        });

        return {
            winner,
            winnerReason: decisiveRule,
            discardReasons
        };
    }

    /**
     * Serializa filas a CSV respetando entrecomillado.
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
     * Serializa a TSV compatible con Excel (Ctrl + V).
     * @param {string[]} headers 
     * @param {Array<Record<string, any>>} rows 
     * @returns {string}
     */
    static exportToTSV(headers, rows) {
        return this.exportToCSV(headers, rows, '\t');
    }

    /**
     * Genera un informe ejecutivo de depuración y auditoría en Markdown.
     * @param {Object} stats 
     * @param {Object} meta 
     * @returns {string}
     */
    static generateAuditReport(stats, meta = {}) {
        const date = new Date().toLocaleString();
        const keysStr = (meta.keyColumns || []).map(k => `\`${k}\``).join(', ');

        const rulesDesc = (meta.priorityRules || []).map((r, i) => {
            if (r.type === 'most_complete') return `${i + 1}. **Mayor Completitud:** Conservar fila con más campos llenos.`;
            if (r.type === 'date') return `${i + 1}. **Fecha (${r.column}):** Conservar fecha ${r.direction === 'newest' ? 'más reciente' : 'más antigua'}.`;
            if (r.type === 'number') return `${i + 1}. **Valor Numérico (${r.column}):** Conservar valor ${r.direction === 'highest' ? 'más alto' : 'más bajo'}.`;
            if (r.type === 'specific_value') return `${i + 1}. **Valor Específico:** Preferir "${r.value}" en columna \`${r.column}\`.`;
            if (r.type === 'appearance') return `${i + 1}. **Orden de Aparición:** Conservar ${r.direction === 'first' ? 'primera' : 'última'} fila encontrada.`;
            return `${i + 1}. Regla personalizada.`;
        }).join('\n');

        const reasonsRows = Object.entries(stats.reasonsCount || {})
            .map(([reason, count]) => `| ${reason} | **${count}** | ${((count / (stats.totalDiscardedRows || 1)) * 100).toFixed(1)}% |`)
            .join('\n');

        return `# 🛡️ Informe de Auditoría de Duplicados & Depuración
**Fecha y Hora:** ${date}  
**Módulo:** #08 • SimpleApps Duplicate Detector (100% Local y Confidencial)

---

## 📌 Configuración Operativa
- **Campos Clave de Unicidad:** ${keysStr || 'Primera columna'}
- **Tiempo de Procesamiento:** ${stats.executionTimeMs} ms *(Indexación Hash O(N))*
- **Jerarquía de Reglas de Prioridad Aplicada:**
${rulesDesc}

---

## 📈 Resumen Estadístico de Registros

| Métrica | Registros | Porcentaje |
|---|---|---|
| **Total Filas Originales Procesadas** | **${stats.totalOriginalRows}** | 100% |
| **Registros Únicos Depurados (Conservados)** | **${stats.totalCleanRows}** | ${stats.totalOriginalRows > 0 ? ((stats.totalCleanRows / stats.totalOriginalRows) * 100).toFixed(1) : 0}% |
| **Grupos de Duplicados Detectados (Clusters)** | **${stats.clustersCount}** | - |
| **Filas Duplicadas Descartadas (Bajas)** | **${stats.totalDiscardedRows}** | **${stats.duplicatesRate}%** |

---

## 🔍 Desglose por Motivo de Descarte

| Motivo de Descarte | Filas Afectadas | % del Total Descartado |
|---|---|---|
${reasonsRows || '| Ningún duplicado descartado | 0 | 0% |'}

---
*Generado automáticamente por SimpleApps Suite • Módulo #08 Detector de Duplicados con Jerarquía*
`;
    }
}

// Compatibilidad Node.js / Browser
if (typeof window !== 'undefined') {
    window.DuplicateEngine = DuplicateEngine;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DuplicateEngine;
}
