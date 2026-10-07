# 📑 Módulo #07 • Cruzador y Conciliador de Tablas (JOIN Express)

Documentación técnica y manual operativo del motor relacional en memoria para cruce de datos, VLOOKUP/BUSCAV multidimensional, auditoría contable y conciliación de discrepancias.

---

## 🎯 Propósito y Alcance

El **Cruzador y Conciliador de Tablas (JOIN Express)** resuelve la necesidad recurrente en finanzas, contabilidad, logística, auditoría y desarrollo de software de cruzar dos fuentes de información mediante identificadores comunes sin requerir bases de datos relacionales externas (como PostgreSQL o MySQL) ni fórmulas frágiles de Excel (`BUSCAV`, `INDICE+COINCIDIR` o `BUSCARX`) que congelan hojas de cálculo con miles de filas.

Proporciona una experiencia integral de conciliación:
1. **Cruce Relacional Completo:** Soporta los 7 tipos fundamentales de operaciones de teoría de conjuntos (Inner, Left, Right, Full Outer, Exclusivo A, Exclusivo B y Discrepancias Simétricas).
2. **Conciliación Financiera y Numérica:** Compara columnas de saldos, cantidades o montos calculando la diferencia exacta (*Delta*) y categorizando automáticamente cada registro como `CUADRADO` o `DESCUADRADO` bajo una tolerancia configurable.
3. **Indexación Hash en Memoria O(N + M):** Procesamiento instantáneo ejecutado 100% en el navegador con latencia imperceptible (milisegundos) y confidencialidad absoluta garantizada (*Zero-Upload*).

---

## ✨ Características Principales

### 1. Tipos de Cruce Relacional Soportados (Álgebra Relacional & SQL)

| Tipo de Cruce | Notación de Conjuntos | Comportamiento | Caso de Uso Típico |
|---|---|---|---|
| **LEFT JOIN (VLOOKUP)** | $A \cup (A \cap B)$ | Mantiene todas las filas de la Tabla A y agrega los campos coincidentes de la Tabla B. | Enriquecer un listado de ventas con datos maestros de clientes o tarifas. |
| **INNER JOIN** | $A \cap B$ | Retorna únicamente los registros que tienen coincidencia exacta en ambas tablas. | Identificar operaciones confirmadas simultáneamente en ambos sistemas. |
| **FULL OUTER JOIN** | $A \cup B$ | Mantiene todos los registros de ambas tablas, vinculando las coincidencias y rellenando con vacíos los huérfanos. | Conciliación global completa de dos balances contables o padrones. |
| **RIGHT JOIN** | $B \cup (A \cap B)$ | Mantiene todas las filas de la Tabla B y agrega los datos de la Tabla A cuando coincidan. | Análisis desde la perspectiva de la base de datos secundaria. |
| **SOLO EN TABLA A (Left Exclusive)** | $A \setminus B$ | Retorna únicamente los registros de la Tabla A que **NO** existen en la Tabla B. | Facturas emitidas aún no reflejadas en el banco (pagos pendientes de cobro). |
| **SOLO EN TABLA B (Right Exclusive)** | $B \setminus A$ | Retorna únicamente los registros de la Tabla B que **NO** existen en la Tabla A. | Cargos o comisiones bancarias no contabilizadas en el libro mayor. |
| **DISCREPANCIAS (Diferencia Simétrica)** | $(A \setminus B) \cup (B \setminus A)$ | Retorna todos los registros huérfanos presentes en una tabla pero ausentes en la otra. | Auditoría directa de faltantes y sobrantes entre sistemas. |

### 2. Multi-Columna Clave Compuesta
- Permite vincular tablas mediante una clave simple (ej. `ID_Cliente` $\leftrightarrow$ `Codigo`) o mediante múltiples columnas simultáneas (ej. `Sucursal` + `Fecha` + `SKU`).
- Genera un hash compuesto delimitado de forma segura en memoria, garantizando unicidad y velocidad extrema.

### 3. Normalización Inteligente de Claves
- **Case-Insensitive:** Ignora diferencias entre mayúsculas y minúsculas (`"FAC-01"` coincide con `"fac-01"`).
- **Trim:** Elimina espacios en blanco invisibles al inicio y al final de las celdas.
- **Ignorar Ceros a la Izquierda:** Normaliza códigos numéricos o alfanuméricos con longitud fija (`"00123"` $\leftrightarrow$ `"123"`).
- **Ignorar Signos de Puntuación:** Remueve automáticamente puntos, guiones, barras y espacios intermedios (ideal para comparar RUTs, DNIs, números de tarjeta o códigos con formatos dispares como `"12.345.678-9"` $\leftrightarrow$ `"123456789"`).

### 4. Auditoría de Valores y Conciliación Numérica (Deltas & Descuadres)
- Permite seleccionar un par de columnas numéricas (ej. `Monto_Libro` vs `Cargo_Banco` o `Conteo_Fisico` vs `Stock_ERP`).
- Realiza el cálculo del diferencial: $\Delta = \text{Valor}_A - \text{Valor}_B$.
- Evalúa si $|\Delta| \le \text{Tolerancia}$. Si cumple, etiqueta la fila como `CUADRADO`; si excede el umbral, la resalta como `DESCUADRADO`.

### 5. Manejo de Coincidencias Múltiples (Cardinalidad)
- **Todas las Filas (Cartesiano / SQL Estándar):** Si una clave se repite en B, genera una fila de resultado por cada duplicado.
- **Primera Coincidencia (Modo VLOOKUP / BUSCAV de Excel):** Toma exclusivamente el primer registro encontrado en la tabla secundaria.
- **Última Coincidencia:** Toma el registro más reciente según el orden del archivo.

### 6. Resolución de Colisiones de Nombres de Columna
- Si ambas tablas contienen campos con el mismo nombre (ej. `Fecha`, `Monto`, `Estado`), el sistema permite aplicar automáticamente:
  - **Sufijos:** `Fecha_A` y `Fecha_B`.
  - **Prefijos:** `A_Fecha` y `B_Fecha`.
- Adición opcional de la columna de metadatos `_ESTADO_CRUCE` (`COINCIDENCIA (A + B)`, `SOLO EN TABLA A`, `SOLO EN TABLA B`).

### 7. Biblioteca de Casos de Prueba en 1 Clic (Presets)
- 💼 **Conciliación Bancaria:** Extracto del banco frente a libro mayor contable con saldos, comisiones bancarias y diferencias de centavos.
- 📦 **Auditoría de Inventarios:** Conteo físico en depósito frente a stock teórico del ERP.
- 👥 **Cruce Ventas vs CRM:** Enriquecimiento de facturas con datos maestros de clientes y ejecutivos de cuenta.

### 8. Exportación Directa Multi-Formato
- **Excel (.xlsx):** Libro de trabajo con formato limpio y una hoja adicional opcional para `Solo_Descuadrados`.
- **CSV (.csv):** Archivo delimitado por comas con entrecomillado seguro.
- **Portapapeles TSV:** Copia directa tabulada compatible con pegado inmediato en Excel (`Ctrl + V`).
- **Informe Ejecutivo (.md):** Documento Markdown estructurado con métricas porcentuales, resumen de integridad y detalle de descuadres para reportes de auditoría.

### 9. Centro de Ayuda y Manual Operativo Interactivo Integrado
- **Botón Prominente en Cabecera y Hero:** Acceso directo visible desde cualquier punto de la aplicación (`📘 Ayuda & Guía de Uso`).
- **Navegación Contextual por Pasos:** Botones de ayuda específicos en cada paso (`Paso 1: Carga`, `Paso 2: JOIN`, `Paso 3: Auditoría`) que abren directamente la sección correspondiente del manual.
- **Manual con 5 Pestañas Temáticas:** Explicación didáctica completa de conceptos relacionales, fórmulas algebraicas, casos de prueba, resolución de inconsistencias y exportaciones sin salir de la herramienta.

---

## 📂 Arquitectura de Archivos

```
apps/table-cross-join/
├── index.html           # Interfaz responsiva con diseño Aithm AI (Purple Neon & Cyan)
├── style.css            # Hoja de estilos con diagramas de Venn, grids y badges de estado
├── relational-engine.js # Motor relacional desacoplado, compatible con Browser y Node.js
├── app.js               # Controlador DOM, lector de archivos Excel/CSV, paginación y exportaciones
└── libs/
    ├── xlsx.full.min.js # Motor SheetJS para lectura y escritura de libros Excel
    └── jszip.min.js     # Motor de compresión ZIP
```

---

## ⚙️ Métodos y API del Motor Relacional (`relational-engine.js`)

La clase `RelationalEngine` está completamente desacoplada de la interfaz gráfica y puede ser utilizada tanto en el navegador como en pruebas unitarias automatizadas con Node.js:

| Método | Argumentos | Retorno | Descripción |
|---|---|---|---|
| `parseCSV(text, options)` | `text: string, options: Object` | `{ headers, rows, rawRows }` | Parsea cadenas CSV/TSV conforme a RFC 4180 con autodetección de delimitador. |
| `detectDelimiter(text)` | `text: string` | `string` (`','`, `';'`, `'\t'`, `'\|'`) | Analiza las primeras 15 líneas para identificar el delimitador óptimo. |
| `normalizeKey(keyValues, options)` | `keyValues: Array, options: Object` | `string` | Genera una clave hash normalizada aplicando trim, case-folding y limpieza de signos. |
| `join(tableA, tableB, config)` | `tableA: Object, tableB: Object, config: Object` | `{ headers, rows, stats, meta }` | **Función principal.** Ejecuta el cruce con indexación en memoria en complejidad temporal $O(N + M)$. |
| `parseNumber(val)` | `val: any` | `number` | Parser flexible que admite formatos monetarios, espacios y puntuación local europea o anglosajona. |
| `exportToCSV(headers, rows, delimiter)` | `headers: string[], rows: Object[], delimiter: string` | `string` | Serializa los registros a texto delimitado. |
| `exportToTSV(headers, rows)` | `headers: string[], rows: Object[]` | `string` | Serializa a TSV listo para el portapapeles. |
| `exportToMarkdown(headers, rows, maxRows)` | `headers: string[], rows: Object[], maxRows: number` | `string` | Genera una tabla de previsualización en Markdown. |
| `generateAuditReport(stats, config)` | `stats: Object, config: Object` | `string` | Compila un informe ejecutivo de auditoría en formato Markdown. |

---

## 🚀 Flujo de Trabajo del Usuario

### Caso A: Conciliación Bancaria Mensual
1. Arrastrar el archivo del **Libro Mayor** (`.xlsx`) en la casilla de **Tabla A**.
2. Arrastrar el extracto descargado del **Banco en Línea** (`.csv`) en la casilla de **Tabla B**.
3. En la sección de configuración, seleccionar la modalidad deseada (ej. `FULL OUTER JOIN` para conciliar ambos lados o `LEFT EXCLUSIVE` para ver pagos no cobrados).
4. El sistema autodetecta las columnas de clave (ej. `Ref_Pago` $\leftrightarrow$ `Referencia_Doc`).
5. Activar la casilla **"Auditoría de Saldos y Valores"**, seleccionar `Monto_Libro` contra `Cargo_Banco` y definir la tolerancia (ej. `0.00`).
6. Presionar **"⚡ Cruzar y Conciliar Tablas"**.
7. Inspeccionar los KPIs, filtrar con un clic en **"Descuadrados"** para revisar diferencias, y presionar **"Descargar Excel (.xlsx)"** o **"Informe Auditoría (.md)"**.

---

## 🛡️ Privacidad y Seguridad

Al igual que todos los módulos de **SimpleApps Suite**, el procesamiento se ejecuta íntegramente en la memoria RAM del navegador del usuario:
- **Cero telemetría.**
- **Cero llamadas de red salientes.**
- **Aislamiento total:** Ningún dato financiero o comercial es transmitido a servidores remotos.
