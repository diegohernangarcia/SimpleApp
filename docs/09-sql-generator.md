# 📑 Módulo #09 • Generador SQL INSERT / UPDATE desde Excel

Documentación técnica y manual operativo del motor de transformación de datos ofimáticos (Excel, CSV, ODS, Portapapeles) a scripts SQL masivos optimizados con inferencia de tipos, escape seguro contra inyecciones y sintaxis multi-dialecto.

---

## 🎯 Propósito y Alcance

En tareas de desarrollo de software, migraciones de datos, sincronización de catálogos y administración de bases de datos relacionales (RDBMS), importar información proveniente de planillas de cálculo (Microsoft Excel, Google Sheets, LibreOffice Calc) suele implicar lidiar con herramientas de importación engorrosas, desajustes de codificación (UTF-8 vs Latin-1) o el riesgo de exponer credenciales y datos confidenciales en conversores web públicos de terceros.

El **Generador SQL INSERT / UPDATE desde Excel** resuelve esta problemática de forma integral:

1. **Transformación 100% en Memoria Local (Zero-Upload):** Ejecución directa en el navegador mediante JavaScript puro y SheetJS; ninguna fila ni metadato abandona tu computadora.
2. **Generación en Bloques Masivos (Batched Inserts):** En lugar de emitir miles de sentencias `INSERT` individuales (lo cual satura las conexiones y demora minutos), agrupa los registros en lotes configurables de **500 o 1.000 filas por sentencia** con la cláusula multi-tupla `VALUES (...), (...)`, acelerando la importación en más de un 95%.
3. **Mapeo y Tipado Heurístico Automático:** Muestrea las celdas de cada columna y detecta automáticamente si corresponden a `INTEGER`, `DECIMAL`, `BOOLEAN`, `DATE`, `DATETIME`, `VARCHAR` o `TEXT`, permitiendo además la edición interactiva del nombre SQL de columna y la designación de Claves Primarias (`PK`).
4. **Soporte Multi-Dialecto Estándar:** Genera sintaxis específica y delimitadores correctos para **MySQL / MariaDB**, **PostgreSQL**, **SQLite**, **Microsoft SQL Server**, **Oracle Database** y **ANSI SQL**.
5. **Estrategias Avanzadas de Inserción y Sincronización:**
   - `INSERT INTO`: Inserción estándar de nuevos registros.
   - `INSERT IGNORE` / `ON CONFLICT DO NOTHING`: Omite duplicados sin abortar el script.
   - `UPSERT` (`ON DUPLICATE KEY UPDATE` / `ON CONFLICT (...) DO UPDATE`): Inserta filas nuevas y actualiza las existentes por su clave primaria.
   - `REPLACE INTO`: Reemplazo atómico de registros existentes.
   - `UPDATE por lotes`: Emite sentencias de actualización con cláusula `WHERE pk = valPK`.

---

## ✨ Características Principales

### 1. Inferencia Heurística de Esquema y Tipado
El motor analiza los primeros 100 registros de cada columna para determinar con precisión el tipo SQL óptimo:
- **`INTEGER`:** Valores numéricos enteros positivos o negativos (`-45`, `1024`). Protege códigos con ceros a la izquierda (ej. `"0123"`) manteniéndolos como texto para preservar la longitud.
- **`DECIMAL(12, 2)`:** Números de punto flotante o moneda, con normalización automática de coma a punto decimal (`150,50` $\rightarrow$ `150.50`).
- **`BOOLEAN` / `BIT`:** Reconoce variantes textuales como `true`, `false`, `si`, `no`, `1`, `0` y los traduce a la sintaxis nativa del motor (`TRUE/FALSE` en Postgres, `1/0` en MySQL/SQLite).
- **`DATE` / `DATETIME`:** Reconoce formatos ISO (`2026-03-15`) y formatos latinoamericanos (`15/03/2026`), reformateándolos a `YYYY-MM-DD`.
- **`NULL` Seguro:** Celdas vacías o con leyendas `NULL`, `N/A`, `NaN` se transforman en la palabra clave `NULL` (sin comillas), respetando la semántica relacional.

### 2. Sanitización y Escape Seguro (SQL Injection Safe)
- **Escape de Caracteres Especiales:** Escapa comillas simples (`'`) duplicándolas (`''` en ANSI/Postgres/MSSQL) o con barra invertida (`\'` en MySQL), previene la ruptura de cadenas ante comillas dobles (`"`) y gestiona saltos de línea internos (`\n`, `\r`).
- **Sanitización de Identificadores:** Convierte nombres de columnas y tablas con espacios, caracteres especiales o tildes (ej. `"Precio Unitario ($)"`) a sintaxis estándar en `snake_case` (ej. `precio_unitario`).
- **Delimitación Contextual:** Aplica los delimitadores propios de cada base de datos:
  - MySQL / SQLite: Comillas invertidas (`` `tabla` `` y `` `columna` ``).
  - PostgreSQL / Oracle / ANSI: Comillas dobles (`"tabla"` y `"columna"`).
  - MS SQL Server: Corchetes (`[tabla]` y `[columna]`).

### 3. Modos de Inserción Masiva por Lotes
Permite configurar el tamaño del bloque de inserción:
- **500 filas por lote (Recomendado):** Equilibrio óptimo entre velocidad de ejecución y límites de memoria del paquete de red (`max_allowed_packet`).
- **1.000 o 2.000 filas por lote:** Para cargas masivas de cientos de miles de registros en servidores dedicados.
- **Todo en una sola sentencia:** Ideal para tablas maestras pequeñas o pruebas rápidas.
- **1 fila por sentencia (Atómica):** Genera sentencias individuales para escenarios donde se requiere auditar cada fallo de forma aislada.

### 4. Transacciones y Estructura DDL Integrada
- **Envoltorio Transaccional:** Incluye automáticamente `START TRANSACTION;` / `BEGIN;` y `COMMIT;` al inicio y final del script para garantizar atomicidad (todo se aplica o nada se aplica ante errores de red).
- **Generador DDL `CREATE TABLE`:** Genera un script complementario `CREATE TABLE IF NOT EXISTS` con los tipos detectados y las claves primarias (`NOT NULL PRIMARY KEY`) para crear la tabla desde cero antes de poblarla.
- **Comentarios Informativos:** Incluye metadatos de cabecera con fecha de generación, cantidad de registros procesados, columnas incluidas y motor de destino.

---

## 📂 Arquitectura de Archivos

```
apps/sql-generator/
├── index.html           # Interfaz dividida en 4 pasos (Carga, Mapeo, Configuración, Visor SQL)
├── style.css            # Estilos de diseño con tema Índigo/Violeta Neón (#6366F1 / #A855F7)
├── sql-builder.js       # Motor lógico independiente SqlBuilderEngine (Vanilla JS)
├── app.js               # Coordinador de eventos DOM, SheetJS, portapapeles y descargas
└── libs/                # Dependencias offline
    └── xlsx.full.min.js # SheetJS (procesamiento local de XLSX, XLS, ODS, CSV, TSV)
```

---

## ⚙️ Métodos y API del Motor (`sql-builder.js`)

### Clase `SqlBuilderEngine`

| Método | Argumentos | Retorno | Descripción |
|---|---|---|---|
| `sanitizeIdentifier(rawName)` | `rawName: string` | `string` | Convierte texto arbitrario a un identificador seguro en `snake_case` sin tildes ni símbolos extraños. |
| `quoteIdentifier(name, dialectKey)` | `name: string, dialectKey: string` | `string` | Envuelve el identificador con los delimitadores correspondientes según el dialecto (`` ` ``, `""`, `[]`). |
| `inferColumnType(values)` | `values: Array` | `string` | Analiza una muestra de celdas y retorna el tipo SQL representativo (`INTEGER`, `DECIMAL`, `BOOLEAN`, `DATE`, `DATETIME`, `VARCHAR`, `TEXT`). |
| `mapTypeToDialect(baseType, dialectKey)` | `baseType: string, dialectKey: string` | `string` | Traduce el tipo abstracto al tipo nativo del motor (ej. `DATETIME` $\rightarrow$ `DATETIME2` en MSSQL, `TIMESTAMP` en Postgres). |
| `formatSqlValue(val, type, dialectKey, emptyAsNull)` | `val: any, type: string, dialectKey: string, emptyAsNull: boolean` | `string` | Escapa de forma segura el valor de la celda y lo formatea para SQL (con comillas o literales según corresponda). |
| `buildCreateTable(tableName, columns, dialectKey)` | `tableName: string, columns: Array, dialectKey: string` | `string` | Construye la sentencia DDL `CREATE TABLE IF NOT EXISTS` con definición de columnas y claves primarias. |
| `generateSqlScript(options)` | `options: Object` | `{ sql: string, stats: Object }` | Genera el script SQL masivo completo aplicando dialecto, operación, tamaño de lote y transacciones. |

---

## 🚀 Flujo Operativo Paso a Paso

1. **Paso 1: Entrada de Datos**
   - Arrastra un archivo (`.xlsx`, `.xls`, `.ods`, `.csv`, `.tsv`, `.txt`) a la zona de carga, o
   - Haz clic en *"Pegar Datos (Clipboard)"* para pegar tablas copiadas directamente desde Excel o Google Sheets con detección automática de delimitador (Tabulador, Coma, Punto y coma, Pipe), o
   - Haz clic en cualquiera de los **3 Presets de Demostración en 1 Clic** (*Productos & E-commerce*, *Usuarios & Roles*, *Libro Diario Contable*).

2. **Paso 2: Mapeo de Columnas, Tipado & Claves (PK)**
   - Revisa la tabla de esquema. Puedes incluir o excluir columnas desmarcando la casilla `Inc.`.
   - Modifica el **Nombre en SQL** si deseas renombrar campos para adaptarlos a tu modelo de base de datos.
   - Pulsa el botón `🪄 Sanitizar a snake_case` para normalizar todos los nombres instantáneamente.
   - Ajusta el **Tipo de Dato SQL** si deseas forzar un tipo diferente al inferido.
   - Asigna la **Clave Primaria (`🔑 PK`)** en la columna que identifique unívocamente a cada registro (imprescindible para operaciones `UPSERT` y `UPDATE`).

3. **Paso 3: Configuración del Script & Dialecto**
   - Escribe el nombre de la tabla de destino (ej. `productos`, `usuarios`).
   - Elige el dialecto del motor: **MySQL/MariaDB**, **PostgreSQL**, **SQLite**, **MS SQL Server**, **Oracle** o **ANSI SQL**.
   - Selecciona la operación: `INSERT INTO`, `INSERT IGNORE`, `UPSERT (ON DUPLICATE KEY UPDATE)`, `REPLACE INTO` o `UPDATE por lotes`.
   - Define el tamaño del lote (por defecto `500 filas por sentencia`).
   - Activa o desactiva las casillas de transacción (`BEGIN / COMMIT`), comentarios de cabecera y creación DDL.

4. **Paso 4: Generación, Vista Previa y Descarga**
   - Visualiza el código SQL resultante en el editor con resaltado monoespaciado.
   - Alterna a la pestaña *"Vista Previa de Datos"* para auditar visualmente las filas que componen la importación.
   - Alterna a la pestaña *"Definición DDL (CREATE TABLE)"* para obtener la sentencia de creación de tabla.
   - Haz clic en **"Copiar al Portapapeles"** para pegar directamente en tu cliente SQL (phpMyAdmin, DBeaver, HeidiSQL, DataGrip, VS Code).
   - Haz clic en **"Descargar Archivo .sql"** para guardar el archivo listo para despliegues automatizados en terminal o pipelines CI/CD.

---

## 💡 Guía de Buenas Prácticas y Rendimiento

1. **Evitar Sobrecarga del Buffer de Red:**
   Para tablas con más de 20.000 filas o columnas de texto muy extenso, se recomienda mantener el tamaño de lote en **500 filas** para prevenir errores de tipo `packet too large` en servidores con límites de memoria estrictos.
2. **Uso de Transacciones Atómicas:**
   Mantener activada la casilla *"Envolver en Transacción (START TRANSACTION / COMMIT)"* acelera drásticamente la velocidad de escritura de discos duros / SSDs, ya que el motor de base de datos realiza una única sincronización de log de transacciones (fsync) al finalizar el bloque completo en lugar de una por cada fila.
3. **Manejo de Fechas y Zonas Horarias:**
   El generador estandariza las fechas a formato `YYYY-MM-DD` y timestamps a `YYYY-MM-DD HH:MM:SS`, lo que garantiza compatibilidad universal sin ambigüedades de formato regional (evitando confusiones entre día y mes).
