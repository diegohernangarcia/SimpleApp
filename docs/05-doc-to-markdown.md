# 📑 Módulo #05 • Conversor Doc / PDF a Markdown

Documentación técnica y manual operativo del conversor local de documentos ofimáticos (PDF, Word, OpenDocument, HTML) y texto enriquecido a GitHub Flavored Markdown (.md).

---

## 🎯 Propósito y Alcance

Permite transformar documentos provenientes de Microsoft Word (**`.docx`, `.doc`**), documentos PDF (**`.pdf`**), archivos OpenDocument (**`.odt`**), archivos HTML y texto enriquecido copiado desde el portapapeles a formato **Markdown limpio y estructurado (.md)**.

Conserva encabezados (`# H1`, `## H2`), listas ordenadas y desordenadas, bloques de código, citas textuales y **tablas formateadas en sintaxis GFM** (`| Columna | Columna |`), permitiendo una migración fluida hacia repositorios Git, wikis de GitHub/GitLab, Obsidian o Notion.

---

## ✨ Características Principales

1. **Soporte Multi-Formato Integral (100% Offline):**
   - **Microsoft Word (.docx):** Procesado mediante *Mammoth.js*, preservando estilos semánticos, negritas, cursivas y tablas sin generar HTML redundante.
   - **Documentos PDF (.pdf):** Extracción local de capas de texto mediante *PDF.js* con normalización de saltos de línea y párrafos.
   - **OpenDocument (.odt):** Descompresión del XML interno (`content.xml`) utilizando *JSZip* y conversión a estructura semántica.
   - **Pegado Enriquecido (Clipboard):** Permite presionar `Ctrl + V` para capturar contenido formateado copiado directamente desde páginas web o editores de texto con formato.
2. **Motor Turndown con Reglas GFM Personalizadas:**
   - Reglas avanzadas para tablas con alineación y separadores de cabecera (`| --- | --- |`).
   - Soporte para texto tachado (`~~tachado~~`), listas anidadas y bloques de código con etiquetas de lenguaje.
3. **Visor Dividido en Vivo (Split-View):**
   - Panel izquierdo: Entrada de archivo o editor de texto enriquecido / HTML.
   - Panel derecho: Salida del código Markdown generado junto con una pestaña de visualización HTML renderizada en tiempo real.
4. **Opciones de Configuración de Sintaxis:**
   - Selector de viñetas para listas (`-`, `*`, `+`).
   - Formato de encabezados (`#` ATX estándar vs `===` Setext).
5. **Exportación y Descarga Directa:**
   - Botón de copiado del código Markdown al portapapeles con un clic.
   - Descarga directa como archivo `.md` listo para incluir en repositorios.

---

## 📂 Arquitectura de Archivos

```
apps/doc-to-markdown/
├── index.html           # Interfaz dividida con zona de drop, editor y preview
├── style.css            # Estilos con tema fucsia / rosa neón (#EC4899)
├── converter.js         # Clase DocToMarkdownConverter (Mammoth + PDF.js + Turndown)
├── app.js               # Coordinador de eventos DOM, portapapeles y descargas
└── libs/                # Dependencias offline (mammoth, turndown, pdf.js, jszip)
```

---

## ⚙️ Métodos y API del Motor (`converter.js`)

### `DocToMarkdownConverter`

| Método | Argumentos | Descripción |
|---|---|---|
| `convertFile(file, options)` | `file: File, options: Object` | Identifica la extensión del archivo y delega al sub-motor correspondiente (DOCX, PDF, ODT o HTML). |
| `convertHtmlToMarkdown(html, options)` | `html: string, options: Object` | Aplica el motor Turndown con reglas GFM para generar código Markdown estructurado. |
| `extractFromDocx(arrayBuffer)` | `arrayBuffer: ArrayBuffer` | Emplea Mammoth.js para convertir el binario DOCX a HTML semántico limpio y luego a Markdown. |
| `extractFromPdf(arrayBuffer)` | `arrayBuffer: ArrayBuffer` | Carga el documento en PDF.js, itera sobre cada página y extrae el contenido de la capa de texto. |
| `extractFromOdt(arrayBuffer)` | `arrayBuffer: ArrayBuffer` | Abre el archivo ODT como archivo ZIP y analiza el árbol XML de `content.xml`. |

---

## 🚀 Flujo de Trabajo del Usuario

1. **Carga del Documento:**
   - Arrastrar un archivo (`.pdf`, `.docx`, `.odt`, `.html`, `.txt`) a la zona de carga, o
   - Pegar contenido formateado con `Ctrl + V` en la pestaña de texto enriquecido, o
   - Presionar *"Cargar Documento de Ejemplo"*.
2. **Revisión y Ajuste:**
   - Inspeccionar el código Markdown resultante generado instantáneamente en el panel derecho.
   - Alternar a la pestaña *"Previsualizar"* para verificar cómo se renderiza el Markdown.
3. **Guardado:** Presionar *"Copiar Markdown"* o *"Descargar archivo .md"*.
