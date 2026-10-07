# 📑 Módulo #08 • Detector de Duplicados con Jerarquía

Documentación técnica y manual operativo del motor heurístico en memoria para deduplicación inteligente, preservación de registros por cascada de prioridades y auditoría de descartes justificados.

---

## 🎯 Propósito y Alcance

En la gestión de bases de datos, migraciones de sistemas ERP/CRM, conciliación de padrones y planillas de cálculo, los registros duplicados son un problema crítico. Las herramientas convencionales (como la función *"Quitar Duplicados"* de Microsoft Excel o la cláusula `DISTINCT` / `GROUP BY` básica en SQL) sufren de una limitación severa: **descartan filas de forma arbitraria o ciega** (usualmente conservando solo la primera fila leída), provocando la pérdida irreparable de información enriquecida (teléfonos agregados posteriormente, domicilios completos, fechas más recientes o saldos actualizados).

El **Detector de Duplicados con Jerarquía** introduce un motor de deduplicación determinista basado en **reglas jerárquicas en cascada**:

1. **Agrupación Hash en Memoria $O(N)$:** Identifica al instante todos los clústeres de filas duplicadas mediante llaves simples o compuestas (una o más columnas simultáneas).
2. **Evaluación Jerárquica en Cascada:** Resuelve cada grupo evaluando una lista priorizada de reglas de desempate:
   - **Mayor Completitud de Datos:** Conserva la fila que tenga más celdas informadas (campos no vacíos).
   - **Cronología / Fecha:** Conserva la fila con la fecha más reciente (o más antigua para primer alta).
   - **Magnitud Numérica:** Conserva la fila con mayor monto, saldo, stock o versión.
   - **Coincidencia Específica:** Prioriza estados comerciales de negocio (ej. `Estado == "Activo"`).
   - **Aparición en Archivo:** Control del orden original de lectura.
3. **Auditoría Transparente y Trazabilidad:** Nunca borra datos sin justificación. Genera en paralelo dos conjuntos:
   - **Conjunto Limpio Depurado:** Listo para importar en producción.
   - **Archivo de Auditoría de Descartes:** Con el ID del clúster (`_GRUPO_ID`) y el motivo exacto por el cual cada fila redundante fue descartada (`_MOTIVO_DESCARTE`).
4. **Privacidad Absoluta (Zero-Upload):** Procesamiento 100% ejecutado en la memoria RAM del navegador web sin envío de datos a servidores externos.

---

## ✨ Características Principales

### 1. Llaves Compuestas Multicolumna
- Permite seleccionar una columna única (ej. `email`, `cuit`, `sku`) o una combinación de múltiples columnas que definan la identidad del registro (ej. `sucursal` + `fecha` + `id_transaccion`, o `nombre` + `apellido` + `fecha_nacimiento`).
- Genera un hash compuesto delimitado de forma segura en memoria para búsqueda inmediata en tiempo constante $O(1)$.

### 2. Normalización Inteligente de Valores Clave
Para evitar que diferencias ortográficas o de formato impidan detectar duplicados evidentes, el motor incluye opciones de normalización configurables:
- **Trim:** Remueve espacios en blanco accidentales al inicio y final.
- **Case-Insensitive:** Ignora diferencias entre mayúsculas y minúsculas (`"CARLOS@TEST.COM"` coincide con `"carlos@test.com"`).
- **Ignorar Tildes / Acentos:** Normaliza caracteres diacríticos con descomposición Unicode NFD (`"López"` $\leftrightarrow$ `"Lopez"`).
- **Colapsar Espacios Dobles:** Reduce múltiples espacios internos contiguos a un único espacio simple.

### 3. Reglas Jerárquicas de Descarte en Cascada

Las reglas se configuran en una lista ordenada por prioridad. Cuando se detecta un grupo con dos o más filas, el motor evalúa las reglas en orden estricto de arriba hacia abajo:

| Tipo de Regla | Parámetros | Comportamiento del Motor |
|---|---|---|
| **Más Completa** | Ninguno (toda la fila) | Cuenta los campos con valores no vacíos, no nulos y distintos de marcas comodín (`"-"`, `"n/a"`). La fila con mayor puntaje gana. |
| **Fecha Más Reciente** | Columna de fecha | Parsea fechas ISO 8601, formatos latinos (`DD/MM/YYYY`) o timestamps y conserva la fecha más nueva. |
| **Fecha Más Antigua** | Columna de fecha | Conserva la fecha más antigua (ideal para determinar fecha de alta original de un cliente). |
| **Mayor Valor Numérico** | Columna numérica | Parsea importes, monedas, cantidades o decimales y conserva el número más alto. |
| **Menor Valor Numérico** | Columna numérica | Conserva el número más bajo (ej. menor costo, menor número de reclamo). |
| **Coincidencia Específica** | Columna y Valor esperado | Prioriza filas donde el valor coincida exactamente con el criterio (ej. `estado_lead == "Calificado"`). |
| **Primera Aparición** | Ninguno | Fallback por omisión: conserva la primera fila encontrada en el archivo. |
| **Última Aparición** | Ninguno | Conserva la última fila física encontrada en el archivo. |

> **Mecanismo de Desempate en Cascada:**  
> Si la **Regla 1** resulta en un empate entre candidatos del clúster (por ejemplo, ambas filas tienen 6 campos completos), el motor pasa a evaluar la **Regla 2** (ej. fecha más reciente). La primera regla que rompa el empate elige a la ganadora y etiqueta a las perdedoras con la razón exacta del descarte.

### 4. Auditoría de Descartes con Motivo Explícito
A diferencia de los filtros comunes, cada fila descartada recibe metadatos de auditoría:
- `_ESTADO`: Marcador claro (`CONSERVADO`, `DESCARTADO` o `UNICO`).
- `_GRUPO_ID`: Identificador unívoco del clúster (ej. `C-1`, `C-2`).
- `_MOTIVO_DESCARTE`: Razón detallada generada automáticamente por el motor:
  - *Ejemplo 1:* `Descartado por Regla #1 (Menor completitud: 4 campos vs 7 del ganador)`
  - *Ejemplo 2:* `Descartado por Regla #2 (Fecha en "fecha_contacto": 2023-11-10 vs 2024-05-18)`
  - *Ejemplo 3:* `Descartado por Regla #1 ("estado" diferente de "Activo")`
- `_FILA_GANADORA`: Número de fila del registro vencedor que sustituye al descartado.

### 5. Biblioteca de Presets de Demostración en 1 Clic
- 👥 **Clientes CRM & Leads:** Base de contactos con correos repetidos, completitud parcial de teléfonos y fechas de interacción.
- 📦 **Catálogo Productos & SKU:** Artículos de múltiples depósitos con estados (*Activo*, *Agotado*, *Descontinuado*) y stock variable.
- 💳 **Movimientos Financieros:** Transacciones bancarias duplicadas con diferentes canales, estados y montos de liquidación.

### 6. Exportación Directa Multi-Formato
- **Excel Maestro (.xlsx con 2 Hojas):**
  - **Hoja 1 ("Datos Únicos"):** Colección depurada lista para base de datos o sistema transaccional.
  - **Hoja 2 ("Auditoría Descartes"):** Registros excluidos con `_GRUPO_ID` y `_MOTIVO_DESCARTE` para revisión de cumplimiento.
- **Excel Datos Únicos (.xlsx):** Libro exclusivo con registros ganadores.
- **Excel Descartes (.xlsx):** Libro exclusivo con registros descartados.
- **CSV Datos Únicos (.csv):** Archivo delimitado estándar UTF-8.
- **CSV Descartes + Motivo (.csv):** Archivo con auditoría de bajas.
- **Copiar al Portapapeles (TSV):** Formato con tabuladores listo para pegar directamente en celdas de Microsoft Excel o Google Sheets con `Ctrl + V`.
- **Informe de Auditoría Markdown (.md):** Reporte ejecutivo con métricas de redundancia, detalle de reglas aplicadas y distribución porcentual de motivos de descarte.

### 7. Centro de Ayuda y Manual Operativo Integrado
- **Botón Prominente en Encabezado:** `📘 Ayuda & Guía de Uso` con animación de brillo.
- **Botones Contextuales por Paso:** Accesos directos en cada etapa (`Paso 1`, `Paso 2` y `Paso 3`) que abren la pestaña temática pertinente.
- **Manual con 5 Pestañas Temáticas:**
  1. *Visión General & Flujo:* Arquitectura conceptual y comparativa con herramientas estándar.
  2. *Presets de Prueba:* Guía de los 3 casos de demostración incluidos.
  3. *Paso 1 (Carga):* Detección de delimitadores, formatos y hojas de cálculo.
  4. *Paso 2 (Reglas):* Detalle de cada tipo de regla y resolución en cascada.
  5. *Paso 3 (Auditoría & Descargas):* Descripción de métricas y formatos de exportación.

---

## 📂 Arquitectura de Archivos

```
apps/duplicate-detector/
├── index.html           # Interfaz accesible con estética Aithm AI (Teal & Emerald Neon)
├── style.css            # Estilos completos: dropzone, constructor de reglas, tabla, badges y modales
├── duplicate-engine.js  # Motor determinista desacoplado, compatible con Browser y Node.js
├── app.js               # Controlador DOM, presets, auto-detección de claves, paginación y exportaciones
└── libs/
    ├── xlsx.full.min.js # Motor SheetJS para importación y exportación de libros Excel
    └── jszip.min.js     # Motor de compresión ZIP
```

---

## ⚙️ Métodos y API del Motor (`duplicate-engine.js`)

La clase `DuplicateEngine` está construida de forma totalmente desacoplada de la interfaz gráfica, permitiendo su uso directo en scripts de Node.js, pipelines CLI o pruebas unitarias:

| Método | Argumentos | Retorno | Descripción |
|---|---|---|---|
| `parseCSV(text, options)` | `text: string, options: Object` | `{ headers, rows, errors }` | Parsea cadenas delimitadas conforme a RFC 4180 con autodetección de comas, punto y coma o tabulaciones. |
| `detectDelimiter(text)` | `text: string` | `string` (`','`, `';'`, `'\t'`, `'\|'`) | Analiza las primeras líneas del archivo para identificar el delimitador óptimo. |
| `normalizeKey(keyValues, options)` | `keyValues: Array, options: Object` | `string` | Genera una cadena hash normalizada aplicando trim, case-folding, remoción de acentos y colapso de espacios. |
| `countCompletedFields(row, headers)` | `row: Record, headers: string[]` | `number` | Heurística que cuenta cuántas celdas de una fila tienen datos reales y significativos. |
| `parseDate(val)` | `val: any` | `number` (timestamp o `NaN`) | Parser flexible para fechas ISO, formatos latinoamericanos (`DD/MM/YYYY`) o números seriales. |
| `parseNumber(val)` | `val: any` | `number` (float o `NaN`) | Parser para monedas, separadores de miles y comas decimales. |
| `resolveWinner(items, rules, headers)` | `items: Array, rules: Array, headers: string[]` | `{ winner, winnerReason, discardReasons }` | Ejecuta la evaluación jerárquica en cascada para determinar la fila ganadora en un clúster de duplicados. |
| `process(dataset, config)` | `dataset: Object\|Array, config: Object` | `{ cleanRows, discardedRows, allRowsWithMeta, clusters, stats, meta }` | **Método central.** Ejecuta la deduplicación integral en complejidad temporal $O(N)$. Admite firmas polimórficas. |
| `toCSV(rows, headers, delimiter)` | `rows: Array, headers: Array, delimiter: string` | `string` | Serializa un conjunto de filas a formato CSV con entrecomillado seguro. |
| `toTSV(rows, headers)` | `rows: Array, headers: Array` | `string` | Serializa filas a formato TSV compatible con el portapapeles. |
| `generateMarkdownReport(results, keys, rules, fileName)` | `results: Object, keys: Array, rules: Array, fileName: string` | `string` | Genera el informe ejecutivo de auditoría en formato Markdown estructurado. |

---

## 🚀 Flujos de Trabajo Operativos

### Flujo 1: Limpieza y Enriquecimiento de Base de Contactos CRM
1. Arrastrar la planilla de contactos (`contactos_crm.xlsx` o `.csv`) al área de carga.
2. En el **Paso 2**, seleccionar `email` como campo clave de unicidad.
3. Configurar la jerarquía de reglas:
   - **Prioridad #1:** *Más Completa* (prioriza filas que tengan teléfono, cargo y empresa informados).
   - **Prioridad #2:** *Fecha Más Reciente* en la columna `fecha_contacto`.
4. Hacer clic en **"⚡ Identificar & Depurar Duplicados con Jerarquía"**.
5. Revisar los KPIs y la tabla de resultados:
   - Verificar cuántos correos duplicados existían y qué filas ganaron.
   - En la pestaña *"Descartados con Motivo"*, comprobar que las filas perdedoras tenían menor completitud o fechas más antiguas.
6. Descargar el **"Excel Maestro (2 Hojas)"** para actualizar el CRM con la hoja de únicos y archivar los descartes como respaldo.

### Flujo 2: Consolidación de Catálogo de Productos Multialmacén
1. Cargar el archivo de inventario consolidado de sucursales.
2. Seleccionar `sku` como campo clave.
3. Configurar la jerarquía:
   - **Prioridad #1:** *Coincidencia Específica* en columna `estado` con valor `"Activo"`.
   - **Prioridad #2:** *Mayor Valor Numérico* en columna `stock_disponible`.
4. Ejecutar la depuración. Los productos descontinuados o sin inventario se descartan en favor de aquellos activos y con mayor volumen disponible.

---

## 🛡️ Seguridad y Privacidad Absoluta (Zero-Upload)

El procesamiento de **Detector de Duplicados con Jerarquía** se realiza íntegramente en la memoria de la máquina local:
- **Cero transferencia de red:** Ninguna fila, nombre, correo o dato contable se envía a la nube ni a servidores externos.
- **Sin persistencia remota:** Al recargar o cerrar la pestaña, los datos desaparecen de la memoria RAM del navegador.
- **Cumplimiento estricto:** Apto para el tratamiento de datos sensibles bajo regulaciones GDPR, HIPAA y normativas de confidencialidad financiera.
