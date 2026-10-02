/**
 * SimpleApps - Diff Engine v2.0
 * Motor de comparación caracter a caracter de alta precisión basado en Myers Diff.
 * Detecta con exactitud matemática el número de línea, la columna de inicio y fin,
 * y segmenta los caracteres idénticos, eliminados y añadidos.
 * 100% Vanilla JavaScript - Cero dependencias externas.
 */

class DiffEngine {
    constructor(options = {}) {
        this.options = {
            ignoreWhitespace: options.ignoreWhitespace || false,
            ignoreCase: options.ignoreCase || false,
            trimLines: options.trimLines || false
        };
    }

    /**
     * Compara dos textos caracter a caracter, alineando líneas y extrayendo cada diferencia
     * con su número de línea, columna de inicio y columna de fin.
     */
    compare(textA, textB) {
        const rawLinesA = textA.split(/\r?\n/);
        const rawLinesB = textB.split(/\r?\n/);

        // Preprocesar según opciones si están activas
        const prepLinesA = rawLinesA.map(l => this._preprocess(l));
        const prepLinesB = rawLinesB.map(l => this._preprocess(l));

        // 1. Alineación de líneas mediante Myers Diff
        const lineEdits = this._myersDiff(prepLinesA, prepLinesB);

        // 2. Agrupar ediciones en bloques contiguos (equal vs reemplazo: deletes + inserts)
        const blocks = [];
        let bIdx = 0;
        while (bIdx < lineEdits.length) {
            if (lineEdits[bIdx].type === 'equal') {
                blocks.push({ type: 'equal', edit: lineEdits[bIdx] });
                bIdx++;
            } else {
                const deletes = [];
                const inserts = [];
                while (bIdx < lineEdits.length && lineEdits[bIdx].type !== 'equal') {
                    if (lineEdits[bIdx].type === 'delete') deletes.push(lineEdits[bIdx]);
                    else if (lineEdits[bIdx].type === 'insert') inserts.push(lineEdits[bIdx]);
                    bIdx++;
                }
                blocks.push({ type: 'change', deletes, inserts });
            }
        }

        const rows = [];
        const diffList = [];
        let lineNumA = 1;
        let lineNumB = 1;
        let diffId = 1;

        let stats = {
            totalLinesA: rawLinesA.length,
            totalLinesB: rawLinesB.length,
            totalCharDiffs: 0,
            additions: 0,
            deletions: 0,
            modifications: 0,
            unchanged: 0
        };

        for (const block of blocks) {
            if (block.type === 'equal') {
                const edit = block.edit;
                rows.push({
                    type: 'equal',
                    lineNumA: lineNumA,
                    lineNumB: lineNumB,
                    contentA: rawLinesA[edit.idxA],
                    contentB: rawLinesB[edit.idxB],
                    partsA: [{ text: rawLinesA[edit.idxA], isDiff: false }],
                    partsB: [{ text: rawLinesB[edit.idxB], isDiff: false }],
                    charDiffs: []
                });
                stats.unchanged++;
                lineNumA++;
                lineNumB++;
            } else {
                const numPairs = Math.min(block.deletes.length, block.inserts.length);

                // A) Emparejar líneas modificadas 1 a 1 y analizar caracter por caracter
                for (let k = 0; k < numPairs; k++) {
                    const origLine = rawLinesA[block.deletes[k].idxA];
                    const modLine = rawLinesB[block.inserts[k].idxB];

                    const charAnalysis = this._analyzeLineCharacters(origLine, modLine, lineNumA, lineNumB);

                    charAnalysis.charDiffs.forEach(cd => {
                        cd.id = diffId++;
                        diffList.push(cd);
                        if (cd.type === 'modify') stats.modifications++;
                        else if (cd.type === 'delete') stats.deletions++;
                        else if (cd.type === 'insert') stats.additions++;
                    });

                    rows.push({
                        type: 'modify',
                        lineNumA: lineNumA,
                        lineNumB: lineNumB,
                        contentA: origLine,
                        contentB: modLine,
                        partsA: charAnalysis.partsA,
                        partsB: charAnalysis.partsB,
                        charDiffs: charAnalysis.charDiffs
                    });

                    lineNumA++;
                    lineNumB++;
                }

                // B) Si hay eliminaciones sobrantes
                for (let k = numPairs; k < block.deletes.length; k++) {
                    const origLine = rawLinesA[block.deletes[k].idxA];
                    const colEnd = Math.max(1, origLine.length);

                    const diffItem = {
                        id: diffId++,
                        type: 'delete',
                        typeLabel: 'Línea Eliminada',
                        lineA: lineNumA,
                        lineB: null,
                        colStartA: 1,
                        colEndA: colEnd,
                        colStartB: null,
                        colEndB: null,
                        textA: origLine,
                        textB: '',
                        fullLineA: origLine,
                        fullLineB: '',
                        highlightA: [{ text: origLine, isDiff: true }],
                        highlightB: [],
                        description: `Línea ${lineNumA} [Col 1 a ${colEnd}]: Todo el texto fue eliminado`
                    };
                    diffList.push(diffItem);
                    stats.deletions++;

                    rows.push({
                        type: 'delete',
                        lineNumA: lineNumA,
                        lineNumB: null,
                        contentA: origLine,
                        contentB: '',
                        partsA: [{ text: origLine, isDiff: true }],
                        partsB: [],
                        charDiffs: [diffItem]
                    });

                    lineNumA++;
                }

                // C) Si hay inserciones sobrantes
                for (let k = numPairs; k < block.inserts.length; k++) {
                    const modLine = rawLinesB[block.inserts[k].idxB];
                    const colEnd = Math.max(1, modLine.length);

                    const diffItem = {
                        id: diffId++,
                        type: 'insert',
                        typeLabel: 'Línea Añadida',
                        lineA: null,
                        lineB: lineNumB,
                        colStartA: null,
                        colEndA: null,
                        colStartB: 1,
                        colEndB: colEnd,
                        textA: '',
                        textB: modLine,
                        fullLineA: '',
                        fullLineB: modLine,
                        highlightA: [],
                        highlightB: [{ text: modLine, isDiff: true }],
                        description: `Línea ${lineNumB} [Col 1 a ${colEnd}]: Nueva línea insertada`
                    };
                    diffList.push(diffItem);
                    stats.additions++;

                    rows.push({
                        type: 'insert',
                        lineNumA: null,
                        lineNumB: lineNumB,
                        contentA: '',
                        contentB: modLine,
                        partsA: [],
                        partsB: [{ text: modLine, isDiff: true }],
                        charDiffs: [diffItem]
                    });

                    lineNumB++;
                }
            }
        }

        stats.totalCharDiffs = diffList.length;

        return {
            rows,
            diffList,
            stats
        };
    }

    /**
     * Realiza la comparación caracter a caracter exacta dentro de una línea modificada.
     */
    _analyzeLineCharacters(strA, strB, lineNumA, lineNumB) {
        if (strA === strB) {
            return {
                partsA: [{ text: strA, isDiff: false }],
                partsB: [{ text: strB, isDiff: false }],
                charDiffs: []
            };
        }

        // Optimización rápida de prefijo y sufijo común
        let prefixLen = 0;
        const minLen = Math.min(strA.length, strB.length);
        while (prefixLen < minLen && strA[prefixLen] === strB[prefixLen]) {
            prefixLen++;
        }

        let suffixLen = 0;
        while (
            suffixLen < (strA.length - prefixLen) &&
            suffixLen < (strB.length - prefixLen) &&
            strA[strA.length - 1 - suffixLen] === strB[strB.length - 1 - suffixLen]
        ) {
            suffixLen++;
        }

        const midA = strA.slice(prefixLen, strA.length - suffixLen);
        const midB = strB.slice(prefixLen, strB.length - suffixLen);

        // Myers Diff sobre los caracteres intermedios
        const midEdits = this._myersDiff(midA.split(''), midB.split(''));

        // Reconstruir lista completa de caracteres: prefijo + edits + sufijo
        const fullCharEdits = [];
        for (let idx = 0; idx < prefixLen; idx++) {
            fullCharEdits.push({ type: 'equal', char: strA[idx] });
        }
        midEdits.forEach(e => {
            fullCharEdits.push({
                type: e.type,
                char: (e.type === 'delete' || e.type === 'equal') ? midA[e.idxA] : midB[e.idxB]
            });
        });
        const startSuffixA = strA.length - suffixLen;
        for (let idx = 0; idx < suffixLen; idx++) {
            fullCharEdits.push({ type: 'equal', char: strA[startSuffixA + idx] });
        }

        // Agrupar caracteres contiguos del mismo tipo
        const groupedEdits = [];
        let colA = 1;
        let colB = 1;

        for (const e of fullCharEdits) {
            const last = groupedEdits[groupedEdits.length - 1];
            if (last && last.type === e.type) {
                last.text += e.char;
                if (e.type === 'equal') {
                    colA++;
                    colB++;
                    last.colEndA = colA - 1;
                    last.colEndB = colB - 1;
                } else if (e.type === 'delete') {
                    colA++;
                    last.colEndA = colA - 1;
                } else if (e.type === 'insert') {
                    colB++;
                    last.colEndB = colB - 1;
                }
            } else {
                const item = { type: e.type, text: e.char };
                if (e.type === 'equal') {
                    item.colStartA = colA;
                    item.colStartB = colB;
                    colA++;
                    colB++;
                    item.colEndA = colA - 1;
                    item.colEndB = colB - 1;
                } else if (e.type === 'delete') {
                    item.colStartA = colA;
                    colA++;
                    item.colEndA = colA - 1;
                } else if (e.type === 'insert') {
                    item.colStartB = colB;
                    colB++;
                    item.colEndB = colB - 1;
                }
                groupedEdits.push(item);
            }
        }

        // Extraer diferencias específicas para el Inspector
        const charDiffs = [];
        const partsA = [];
        const partsB = [];

        let gIdx = 0;
        while (gIdx < groupedEdits.length) {
            const g = groupedEdits[gIdx];

            if (g.type === 'equal') {
                partsA.push({ text: g.text, isDiff: false });
                partsB.push({ text: g.text, isDiff: false });
                gIdx++;
            }
            // Sustitución de caracteres (delete seguido de insert en la misma posición)
            else if (g.type === 'delete' && (gIdx + 1 < groupedEdits.length) && groupedEdits[gIdx + 1].type === 'insert') {
                const delChunk = g;
                const insChunk = groupedEdits[gIdx + 1];

                charDiffs.push({
                    type: 'modify',
                    typeLabel: 'Caracteres Modificados',
                    lineA: lineNumA,
                    lineB: lineNumB,
                    colStartA: delChunk.colStartA,
                    colEndA: delChunk.colEndA,
                    colStartB: insChunk.colStartB,
                    colEndB: insChunk.colEndB,
                    textA: delChunk.text,
                    textB: insChunk.text,
                    fullLineA: strA,
                    fullLineB: strB,
                    description: `Línea ${lineNumA} [Col ${delChunk.colStartA}-${delChunk.colEndA}] cambiado por Línea ${lineNumB} [Col ${insChunk.colStartB}-${insChunk.colEndB}]`
                });

                partsA.push({ text: delChunk.text, isDiff: true, colStart: delChunk.colStartA, colEnd: delChunk.colEndA });
                partsB.push({ text: insChunk.text, isDiff: true, colStart: insChunk.colStartB, colEnd: insChunk.colEndB });
                gIdx += 2;
            }
            // Eliminación pura de caracteres
            else if (g.type === 'delete') {
                charDiffs.push({
                    type: 'delete',
                    typeLabel: 'Caracteres Borrados',
                    lineA: lineNumA,
                    lineB: lineNumB,
                    colStartA: g.colStartA,
                    colEndA: g.colEndA,
                    colStartB: null,
                    colEndB: null,
                    textA: g.text,
                    textB: '',
                    fullLineA: strA,
                    fullLineB: strB,
                    description: `Línea ${lineNumA} [Col ${g.colStartA}-${g.colEndA}] caracteres eliminados`
                });

                partsA.push({ text: g.text, isDiff: true, colStart: g.colStartA, colEnd: g.colEndA });
                gIdx++;
            }
            // Inserción pura de caracteres
            else if (g.type === 'insert') {
                charDiffs.push({
                    type: 'insert',
                    typeLabel: 'Caracteres Añadidos',
                    lineA: lineNumA,
                    lineB: lineNumB,
                    colStartA: null,
                    colEndA: null,
                    colStartB: g.colStartB,
                    colEndB: g.colEndB,
                    textA: '',
                    textB: g.text,
                    fullLineA: strA,
                    fullLineB: strB,
                    description: `Línea ${lineNumB} [Col ${g.colStartB}-${g.colEndB}] caracteres insertados`
                });

                partsB.push({ text: g.text, isDiff: true, colStart: g.colStartB, colEnd: g.colEndB });
                gIdx++;
            }
        }

        return {
            partsA,
            partsB,
            charDiffs
        };
    }

    /**
     * Algoritmo Myers Diff genérico para arreglos (líneas o caracteres)
     */
    _myersDiff(a, b) {
        const N = a.length;
        const M = b.length;
        const MAX = N + M;

        if (N === 0 && M === 0) return [];
        if (N === 0) {
            return b.map((_, idx) => ({ type: 'insert', idxB: idx }));
        }
        if (M === 0) {
            return a.map((_, idx) => ({ type: 'delete', idxA: idx }));
        }

        const v = {};
        v[1] = 0;
        const trace = [];

        for (let d = 0; d <= MAX; d++) {
            const vCopy = Object.assign({}, v);
            trace.push(vCopy);

            for (let k = -d; k <= d; k += 2) {
                let x;
                if (k === -d || (k !== d && (v[k - 1] === undefined ? -1 : v[k - 1]) < (v[k + 1] === undefined ? -1 : v[k + 1]))) {
                    x = v[k + 1];
                } else {
                    x = v[k - 1] + 1;
                }

                let y = x - k;

                while (x < N && y < M && a[x] === b[y]) {
                    x++;
                    y++;
                }

                v[k] = x;

                if (x >= N && y >= M) {
                    return this._backtrackMyers(trace, a, b);
                }
            }
        }

        return [];
    }

    _backtrackMyers(trace, a, b) {
        let x = a.length;
        let y = b.length;
        const edits = [];

        for (let d = trace.length - 1; d >= 0; d--) {
            const v = trace[d];
            const k = x - y;

            let prevK;
            if (k === -d || (k !== d && (v[k - 1] === undefined ? -1 : v[k - 1]) < (v[k + 1] === undefined ? -1 : v[k + 1]))) {
                prevK = k + 1;
            } else {
                prevK = k - 1;
            }

            const prevX = v[prevK];
            const prevY = prevX - prevK;

            while (x > prevX && y > prevY) {
                edits.unshift({ type: 'equal', idxA: x - 1, idxB: y - 1 });
                x--;
                y--;
            }

            if (d > 0) {
                if (x === prevX) {
                    edits.unshift({ type: 'insert', idxB: prevY });
                    y--;
                } else if (y === prevY) {
                    edits.unshift({ type: 'delete', idxA: prevX });
                    x--;
                }
            }
        }

        return edits;
    }

    _preprocess(str) {
        let res = str;
        if (this.options.ignoreWhitespace) {
            res = res.replace(/\s+/g, ' ').trim();
        }
        if (this.options.trimLines) {
            res = res.trim();
        }
        if (this.options.ignoreCase) {
            res = res.toLowerCase();
        }
        return res;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiffEngine;
}
