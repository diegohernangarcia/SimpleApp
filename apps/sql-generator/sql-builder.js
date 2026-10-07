/**
 * =============================================================================
 * SQL BUILDER ENGINE (Vanilla JS / In-Memory Processor)
 * Módulo #09 • Generador SQL INSERT / UPDATE desde Excel • SimpleApps Suite
 * =============================================================================
 * Motor de análisis de esquemas, tipado heurístico, escape seguro de cadenas
 * y generación de scripts SQL optimizados en bloques de inserción masiva.
 * Soporta múltiples dialectos: MySQL, PostgreSQL, SQLite, MS SQL Server, Oracle y ANSI.
 * =============================================================================
 */

class SqlBuilderEngine {
    constructor() {
        this.dialects = {
            mysql: {
                name: 'MySQL / MariaDB',
                identifierQuote: '`',
                escapeString: (s) => s.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
                    switch (char) {
                        case "\0": return "\\0";
                        case "\x08": return "\\b";
                        case "\x09": return "\\t";
                        case "\x1a": return "\\z";
                        case "\n": return "\\n";
                        case "\r": return "\\r";
                        case "\"":
                        case "'":
                        case "\\":
                        case "%":
                            return "\\" + char; // MySQL backslash escape
                        default: return char;
                    }
                }),
                booleanTrue: '1',
                booleanFalse: '0',
                transactionStart: 'START TRANSACTION;',
                transactionCommit: 'COMMIT;',
                supportsUpsert: true,
                supportsReplace: true,
                supportsInsertIgnore: true
            },
            postgres: {
                name: 'PostgreSQL',
                identifierQuote: '"',
                escapeString: (s) => s.replace(/'/g, "''"),
                booleanTrue: 'TRUE',
                booleanFalse: 'FALSE',
                transactionStart: 'BEGIN;',
                transactionCommit: 'COMMIT;',
                supportsUpsert: true,
                supportsReplace: false,
                supportsInsertIgnore: true
            },
            sqlite: {
                name: 'SQLite',
                identifierQuote: '`',
                escapeString: (s) => s.replace(/'/g, "''"),
                booleanTrue: '1',
                booleanFalse: '0',
                transactionStart: 'BEGIN TRANSACTION;',
                transactionCommit: 'COMMIT;',
                supportsUpsert: true,
                supportsReplace: true,
                supportsInsertIgnore: true
            },
            mssql: {
                name: 'Microsoft SQL Server',
                identifierQuoteStart: '[',
                identifierQuoteEnd: ']',
                escapeString: (s) => s.replace(/'/g, "''"),
                booleanTrue: '1',
                booleanFalse: '0',
                transactionStart: 'BEGIN TRANSACTION;',
                transactionCommit: 'COMMIT TRANSACTION;',
                supportsUpsert: true, // via MERGE
                supportsReplace: false,
                supportsInsertIgnore: false
            },
            oracle: {
                name: 'Oracle Database',
                identifierQuote: '"',
                escapeString: (s) => s.replace(/'/g, "''"),
                booleanTrue: '1',
                booleanFalse: '0',
                transactionStart: 'SET TRANSACTION READ WRITE;',
                transactionCommit: 'COMMIT;',
                supportsUpsert: true, // via MERGE
                supportsReplace: false,
                supportsInsertIgnore: false
            },
            ansi: {
                name: 'Estándar ANSI SQL',
                identifierQuote: '"',
                escapeString: (s) => s.replace(/'/g, "''"),
                booleanTrue: 'TRUE',
                booleanFalse: 'FALSE',
                transactionStart: 'COMMIT;',
                transactionCommit: 'COMMIT;',
                supportsUpsert: false,
                supportsReplace: false,
                supportsInsertIgnore: false
            }
        };
    }

    /**
     * Sanitiza un identificador (nombre de columna o tabla) para convertirlo
     * a snake_case seguro y válido en SQL.
     */
    sanitizeIdentifier(rawName) {
        if (!rawName || typeof rawName !== 'string') return 'columna';

        let clean = rawName.trim();
        // Quitar acentos y diacríticos
        clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // Reemplazar espacios, guiones y caracteres no alfanuméricos por guiones bajos
        clean = clean.replace(/[^a-zA-Z0-9_]/g, '_');
        // Eliminar guiones bajos consecutivos
        clean = clean.replace(/_+/g, '_');
        // Eliminar guiones bajos al inicio o al final
        clean = clean.replace(/^_+|_+$/g, '');
        // Si comienza con un número, anteponer prefijo
        if (/^[0-9]/.test(clean)) {
            clean = 'col_' + clean;
        }

        return clean.toLowerCase() || 'columna';
    }

    /**
     * Envuelve un identificador con las comillas del dialecto correspondiente
     */
    quoteIdentifier(name, dialectKey = 'mysql') {
        const d = this.dialects[dialectKey] || this.dialects.mysql;
        if (d.identifierQuoteStart && d.identifierQuoteEnd) {
            return `${d.identifierQuoteStart}${name}${d.identifierQuoteEnd}`;
        }
        const q = d.identifierQuote || '`';
        return `${q}${name}${q}`;
    }

    /**
     * Infiere el tipo de dato SQL más apropiado para una lista de valores muestreados.
     * Retorna: 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'TEXT' | 'VARCHAR'
     */
    inferColumnType(values) {
        let nonEmptyValues = 0;
        let intCount = 0;
        let decCount = 0;
        let boolCount = 0;
        let dateCount = 0;
        let dateTimeCount = 0;
        let maxStrLength = 0;

        const dateRegex = /^\d{4}[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])$/;
        const dateAltRegex = /^(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/]\d{4}$/;
        const dateTimeRegex = /^\d{4}[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])[T\s]([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/i;

        for (const raw of values) {
            if (raw === null || raw === undefined) continue;
            const str = String(raw).trim();
            if (str === '' || str.toUpperCase() === 'NULL' || str.toUpperCase() === 'N/A' || str.toUpperCase() === 'NAN') {
                continue;
            }

            nonEmptyValues++;
            maxStrLength = Math.max(maxStrLength, str.length);

            // Boolean check
            const lower = str.toLowerCase();
            if (['true', 'false', 'si', 'no', 'yes', '0', '1'].includes(lower) && str.length <= 5) {
                boolCount++;
            }

            // Integer check
            if (/^-?\d+$/.test(str) && !/^0\d+/.test(str)) { // Evita códigos postales o ceros a la izquierda
                const num = Number(str);
                if (Number.isSafeInteger(num)) {
                    intCount++;
                }
            }

            // Decimal / Float check (acepta punto o coma decimal si no hay ambigüedad)
            const normalizedNum = str.replace(',', '.');
            if (/^-?\d+\.\d+$/.test(normalizedNum)) {
                decCount++;
            }

            // DateTime check
            if (dateTimeRegex.test(str)) {
                dateTimeCount++;
            } else if (dateRegex.test(str) || dateAltRegex.test(str)) {
                dateCount++;
            }
        }

        if (nonEmptyValues === 0) {
            return 'VARCHAR(255)';
        }

        // Si todos los valores no vacíos son enteros
        if (intCount === nonEmptyValues) {
            return 'INTEGER';
        }

        // Si son números mixtos (enteros y decimales)
        if ((intCount + decCount) === nonEmptyValues && decCount > 0) {
            return 'DECIMAL(12, 2)';
        }

        // Si son booleanos
        if (boolCount === nonEmptyValues && intCount !== nonEmptyValues) {
            return 'BOOLEAN';
        }

        // Si son fechas y horas
        if (dateTimeCount === nonEmptyValues) {
            return 'DATETIME';
        }

        // Si son fechas puras
        if (dateCount === nonEmptyValues) {
            return 'DATE';
        }

        // Por longitud de texto
        if (maxStrLength > 255) {
            return 'TEXT';
        }

        return 'VARCHAR(255)';
    }

    /**
     * Mapea un tipo detectado a la sintaxis DDL correspondiente según el dialecto
     */
    mapTypeToDialect(baseType, dialectKey = 'mysql') {
        const type = (baseType || 'VARCHAR(255)').toUpperCase();

        switch (dialectKey) {
            case 'postgres':
                if (type.includes('INT')) return 'INTEGER';
                if (type.includes('DECIMAL')) return type.replace('DECIMAL', 'NUMERIC');
                if (type === 'BOOLEAN') return 'BOOLEAN';
                if (type === 'DATETIME') return 'TIMESTAMP';
                if (type === 'DATE') return 'DATE';
                if (type === 'TEXT') return 'TEXT';
                return type;

            case 'sqlite':
                if (type.includes('INT')) return 'INTEGER';
                if (type.includes('DECIMAL')) return 'REAL';
                if (type === 'BOOLEAN') return 'INTEGER';
                if (type === 'DATETIME' || type === 'DATE') return 'TEXT';
                return 'TEXT';

            case 'mssql':
                if (type.includes('INT')) return 'INT';
                if (type.includes('DECIMAL')) return type;
                if (type === 'BOOLEAN') return 'BIT';
                if (type === 'DATETIME') return 'DATETIME2';
                if (type === 'DATE') return 'DATE';
                if (type === 'TEXT') return 'NVARCHAR(MAX)';
                if (type.includes('VARCHAR')) return type.replace('VARCHAR', 'NVARCHAR');
                return type;

            case 'oracle':
                if (type.includes('INT')) return 'NUMBER(10)';
                if (type.includes('DECIMAL')) return type.replace('DECIMAL', 'NUMBER');
                if (type === 'BOOLEAN') return 'NUMBER(1)';
                if (type === 'DATETIME') return 'TIMESTAMP';
                if (type === 'DATE') return 'DATE';
                if (type === 'TEXT') return 'CLOB';
                if (type.includes('VARCHAR')) return type.replace('VARCHAR', 'VARCHAR2');
                return type;

            case 'mysql':
            default:
                if (type === 'DATETIME') return 'DATETIME';
                if (type === 'BOOLEAN') return 'TINYINT(1)';
                return type;
        }
    }

    /**
     * Formatea y escapa de forma 100% segura un valor de celda según su tipo y dialecto
     */
    formatSqlValue(val, type = 'VARCHAR(255)', dialectKey = 'mysql', emptyAsNull = true) {
        if (val === null || val === undefined) {
            return 'NULL';
        }

        const d = this.dialects[dialectKey] || this.dialects.mysql;
        let str = String(val).trim();

        // Tratamiento de valores nulos o vacíos
        if (str === '') {
            return emptyAsNull ? 'NULL' : "''";
        }

        if (str.toUpperCase() === 'NULL' || str.toUpperCase() === 'N/A' || str.toUpperCase() === 'NAN') {
            return 'NULL';
        }

        const upperType = type.toUpperCase();

        // 1. Tipo INTEGER
        if (upperType.includes('INT')) {
            const cleanInt = str.replace(/[^\d-]/g, '');
            if (/^-?\d+$/.test(cleanInt)) {
                return cleanInt;
            }
            return emptyAsNull ? 'NULL' : '0';
        }

        // 2. Tipo DECIMAL / NUMERIC / FLOAT
        if (upperType.includes('DECIMAL') || upperType.includes('NUMERIC') || upperType.includes('FLOAT') || upperType.includes('REAL')) {
            // Normalizar coma a punto si aplica
            const cleanNum = str.replace(',', '.').replace(/[^\d.-]/g, '');
            if (!isNaN(cleanNum) && cleanNum !== '') {
                return cleanNum;
            }
            return emptyAsNull ? 'NULL' : '0.00';
        }

        // 3. Tipo BOOLEAN / BIT
        if (upperType === 'BOOLEAN' || upperType === 'BIT' || upperType === 'TINYINT(1)') {
            const lower = str.toLowerCase();
            if (['1', 'true', 'si', 'yes', 't', 's', 'y'].includes(lower)) {
                return d.booleanTrue;
            }
            if (['0', 'false', 'no', 'f', 'n'].includes(lower)) {
                return d.booleanFalse;
            }
            return emptyAsNull ? 'NULL' : d.booleanFalse;
        }

        // 4. Tipo DATE
        if (upperType === 'DATE') {
            // Si es un formato de fecha DD/MM/YYYY, convertir a YYYY-MM-DD
            if (/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.test(str)) {
                const parts = str.split(/[-/]/);
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                str = `${year}-${month}-${day}`;
            }
            // Escapar cadena estándar
            return `'${d.escapeString(str)}'`;
        }

        // 5. Tipo DATETIME / TIMESTAMP
        if (upperType.includes('DATETIME') || upperType.includes('TIMESTAMP')) {
            // Reemplazar separadores T si viene de formato ISO
            str = str.replace('T', ' ').replace('Z', '');
            return `'${d.escapeString(str)}'`;
        }

        // 6. Cadenas de Texto (VARCHAR, TEXT, CLOB, etc.)
        return `'${d.escapeString(str)}'`;
    }

    /**
     * Construye la sentencia CREATE TABLE con tipos inferidos y claves primarias
     */
    buildCreateTable(tableName, columns, dialectKey = 'mysql') {
        const quotedTable = this.quoteIdentifier(tableName, dialectKey);
        const colDefinitions = [];
        const primaryKeys = [];

        columns.forEach(col => {
            if (!col.included) return;
            const quotedCol = this.quoteIdentifier(col.sqlName, dialectKey);
            const mappedType = this.mapTypeToDialect(col.type, dialectKey);
            let def = `${quotedCol} ${mappedType}`;

            if (col.isPk) {
                primaryKeys.push(quotedCol);
                def += ' NOT NULL';
            }

            colDefinitions.push(def);
        });

        if (primaryKeys.length > 0) {
            colDefinitions.push(`PRIMARY KEY (${primaryKeys.join(', ')})`);
        }

        const ifNotExists = dialectKey === 'oracle' ? '' : 'IF NOT EXISTS ';
        return `CREATE TABLE ${ifNotExists}${quotedTable} (\n    ${colDefinitions.join(',\n    ')}\n);`;
    }

    /**
     * Genera el script SQL completo según configuración de lote, dialecto y operación
     */
    generateSqlScript(options) {
        const {
            rows = [],
            columns = [],
            tableName = 'mi_tabla',
            dialectKey = 'mysql',
            operation = 'insert', // 'insert', 'insert_ignore', 'upsert', 'replace', 'update'
            batchSize = 500, // número de filas por sentencia (0 o Infinity para todo en una sola)
            includeTransaction = true,
            includeCreateTable = false,
            includeDropTable = false,
            includeComments = true,
            emptyAsNull = true
        } = options;

        const d = this.dialects[dialectKey] || this.dialects.mysql;
        const activeColumns = columns.filter(c => c.included);

        if (activeColumns.length === 0) {
            return {
                sql: '-- ⚠️ No hay columnas seleccionadas para generar el script SQL.',
                stats: { totalStatements: 0, totalRows: 0, dialect: d.name, bytes: 0 }
            };
        }

        if (rows.length === 0) {
            return {
                sql: '-- ⚠️ No hay datos cargados para generar sentencias.',
                stats: { totalStatements: 0, totalRows: 0, dialect: d.name, bytes: 0 }
            };
        }

        const primaryKeyCols = activeColumns.filter(c => c.isPk);
        const nonPkCols = activeColumns.filter(c => !c.isPk);

        // Si la operación requiere clave primaria y no hay ninguna definida
        if ((operation === 'update' || operation === 'upsert') && primaryKeyCols.length === 0) {
            if (operation === 'update') {
                return {
                    sql: `-- ⚠️ ERROR: La operación UPDATE por lotes requiere al menos una Columna Clave Primaria (PK) para generar la cláusula WHERE.\n-- Por favor, marca la casilla "PK" en la columna que identifique unívocamente a cada registro en la tabla de configuración.`,
                    stats: { totalStatements: 0, totalRows: 0, dialect: d.name, bytes: 0, error: 'Falta PK' }
                };
            }
        }

        const chunks = [];
        const lines = [];
        const now = new Date();
        const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

        // Cabecera Informativa
        if (includeComments) {
            lines.push(`-- =============================================================================`);
            lines.push(`-- SCRIPT GENERADO POR: SimpleApps Suite • Módulo #09 (Generador SQL)`);
            lines.push(`-- Tabla Destino: ${tableName}`);
            lines.push(`-- Dialecto SQL:  ${d.name}`);
            lines.push(`-- Operación:     ${operation.toUpperCase()}`);
            lines.push(`-- Registros:     ${rows.length.toLocaleString()}`);
            lines.push(`-- Columnas (${activeColumns.length}): ${activeColumns.map(c => c.sqlName + (c.isPk ? ' [PK]' : '')).join(', ')}`);
            lines.push(`-- Fecha:         ${dateStr}`);
            lines.push(`-- =============================================================================\n`);
        }

        // DROP TABLE si fue solicitada
        if (includeDropTable) {
            const dropStmt = dialectKey === 'oracle' 
                ? `DROP TABLE ${this.quoteIdentifier(tableName, dialectKey)};`
                : `DROP TABLE IF EXISTS ${this.quoteIdentifier(tableName, dialectKey)};`;
            lines.push(dropStmt + '\n');
        }

        // CREATE TABLE si fue solicitada
        if (includeCreateTable) {
            lines.push(this.buildCreateTable(tableName, activeColumns, dialectKey) + '\n');
        }

        // Inicio de Transacción
        if (includeTransaction && d.transactionStart) {
            lines.push(d.transactionStart);
        }

        const quotedTableName = this.quoteIdentifier(tableName, dialectKey);
        const colListStr = activeColumns.map(c => this.quoteIdentifier(c.sqlName, dialectKey)).join(', ');
        let totalStatements = 0;

        // =========================================================================
        // MODO 1: UPDATE POR LOTES
        // =========================================================================
        if (operation === 'update') {
            rows.forEach((row, idx) => {
                const setClauses = [];
                const whereClauses = [];

                activeColumns.forEach(col => {
                    const val = row[col.originalName] !== undefined ? row[col.originalName] : row[col.name];
                    const formatted = this.formatSqlValue(val, col.type, dialectKey, emptyAsNull);
                    const quotedCol = this.quoteIdentifier(col.sqlName, dialectKey);

                    if (col.isPk) {
                        whereClauses.push(`${quotedCol} = ${formatted}`);
                    } else {
                        setClauses.push(`${quotedCol} = ${formatted}`);
                    }
                });

                if (setClauses.length > 0 && whereClauses.length > 0) {
                    lines.push(`UPDATE ${quotedTableName} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')};`);
                    totalStatements++;
                }
            });
        }
        // =========================================================================
        // MODO 2: INSERCIÓN / UPSERT / REPLACE / INSERT IGNORE EN LOTES
        // =========================================================================
        else {
            const effectiveBatch = (batchSize > 0 && isFinite(batchSize)) ? batchSize : rows.length;

            for (let i = 0; i < rows.length; i += effectiveBatch) {
                const batchRows = rows.slice(i, i + effectiveBatch);
                totalStatements++;

                const valuesList = batchRows.map(row => {
                    const rowValues = activeColumns.map(col => {
                        const val = row[col.originalName] !== undefined ? row[col.originalName] : row[col.name];
                        return this.formatSqlValue(val, col.type, dialectKey, emptyAsNull);
                    });
                    return `    (${rowValues.join(', ')})`;
                });

                // 2.A: INSERT IGNORE
                if (operation === 'insert_ignore') {
                    if (dialectKey === 'mysql') {
                        lines.push(`INSERT IGNORE INTO ${quotedTableName} (${colListStr}) VALUES\n${valuesList.join(',\n')};`);
                    } else if (dialectKey === 'postgres' || dialectKey === 'sqlite') {
                        const pkList = primaryKeyCols.map(c => this.quoteIdentifier(c.sqlName, dialectKey)).join(', ');
                        const conflictClause = pkList ? ` ON CONFLICT (${pkList}) DO NOTHING` : ' ON CONFLICT DO NOTHING';
                        lines.push(`INSERT INTO ${quotedTableName} (${colListStr}) VALUES\n${valuesList.join(',\n')}${conflictClause};`);
                    } else {
                        // ANSI / MSSQL fallback
                        lines.push(`INSERT INTO ${quotedTableName} (${colListStr}) VALUES\n${valuesList.join(',\n')};`);
                    }
                }
                // 2.B: REPLACE INTO (MySQL & SQLite)
                else if (operation === 'replace') {
                    if (dialectKey === 'mysql' || dialectKey === 'sqlite') {
                        lines.push(`REPLACE INTO ${quotedTableName} (${colListStr}) VALUES\n${valuesList.join(',\n')};`);
                    } else {
                        // Si el dialecto no soporta REPLACE, delegar a UPSERT con advertencia
                        lines.push(`-- Nota: El dialecto ${d.name} no soporta REPLACE INTO nativo. Se utiliza UPSERT.`);
                        lines.push(this._buildUpsertChunk(quotedTableName, colListStr, valuesList, activeColumns, primaryKeyCols, nonPkCols, dialectKey));
                    }
                }
                // 2.C: UPSERT (ON DUPLICATE KEY UPDATE / ON CONFLICT)
                else if (operation === 'upsert') {
                    lines.push(this._buildUpsertChunk(quotedTableName, colListStr, valuesList, activeColumns, primaryKeyCols, nonPkCols, dialectKey));
                }
                // 2.D: INSERT INTO ESTÁNDAR
                else {
                    lines.push(`INSERT INTO ${quotedTableName} (${colListStr}) VALUES\n${valuesList.join(',\n')};`);
                }
            }
        }

        // Fin de Transacción
        if (includeTransaction && d.transactionCommit) {
            lines.push(d.transactionCommit);
        }

        const fullSql = lines.join('\n');
        const bytes = new Blob([fullSql]).size;

        return {
            sql: fullSql,
            stats: {
                totalStatements,
                totalRows: rows.length,
                activeColumns: activeColumns.length,
                dialect: d.name,
                bytes,
                formattedSize: this._formatBytes(bytes)
            }
        };
    }

    /**
     * Construye un bloque UPSERT según el dialecto
     */
    _buildUpsertChunk(quotedTable, colListStr, valuesList, allCols, pkCols, nonPkCols, dialectKey) {
        // En MySQL: ON DUPLICATE KEY UPDATE col = VALUES(col)
        if (dialectKey === 'mysql') {
            const updateClauses = (nonPkCols.length > 0 ? nonPkCols : allCols).map(col => {
                const qCol = this.quoteIdentifier(col.sqlName, dialectKey);
                return `${qCol} = VALUES(${qCol})`;
            }).join(', ');

            return `INSERT INTO ${quotedTable} (${colListStr}) VALUES\n${valuesList.join(',\n')}\nON DUPLICATE KEY UPDATE\n    ${updateClauses};`;
        }

        // En PostgreSQL / SQLite: ON CONFLICT (pks) DO UPDATE SET col = EXCLUDED.col
        if (dialectKey === 'postgres' || dialectKey === 'sqlite') {
            const pkStr = pkCols.map(c => this.quoteIdentifier(c.sqlName, dialectKey)).join(', ');
            const targetCols = nonPkCols.length > 0 ? nonPkCols : allCols;
            const updateClauses = targetCols.map(col => {
                const qCol = this.quoteIdentifier(col.sqlName, dialectKey);
                return `${qCol} = EXCLUDED.${qCol}`;
            }).join(', ');

            return `INSERT INTO ${quotedTable} (${colListStr}) VALUES\n${valuesList.join(',\n')}\nON CONFLICT (${pkStr || 'id'}) DO UPDATE SET\n    ${updateClauses};`;
        }

        // Fallback genérico para otros dialectos
        return `INSERT INTO ${quotedTable} (${colListStr}) VALUES\n${valuesList.join(',\n')};`;
    }

    _formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

// Exportación modular y global
if (typeof window !== 'undefined') {
    window.SqlBuilderEngine = SqlBuilderEngine;
    window.sqlBuilderEngine = new SqlBuilderEngine();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SqlBuilderEngine;
    module.exports.SqlBuilderEngine = SqlBuilderEngine;
}
