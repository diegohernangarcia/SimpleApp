# 📑 Módulo #06 • Generador de Árbol de Carpetas (ASCII Tree)

Documentación técnica y manual operativo del generador y parseador inverso bidireccional de estructuras de directorios en texto plano ASCII/Unicode.

---

## 🎯 Propósito y Alcance

Permite documentar, visualizar y crear arquitecturas de archivos y carpetas de proyectos de software.

Proporciona una **experiencia bidireccional completa**:
1. **Rutas a Diagrama Gráfico:** Convierte una lista de rutas relativas o texto tabulado en un árbol visual formateado en Unicode o ASCII listo para copiar a archivos `README.md`, especificaciones de arquitectura o wikis.
2. **Modo Inverso (Árbol a Comandos CLI):** Parsea cualquier árbol de texto existente (copiado de un README, documentación técnica o chat de IA) y genera instantáneamente los scripts ejecutables de terminal (**Bash / Zsh, PowerShell o CMD**) con comandos `mkdir` y `touch` para materializar físicamente toda la estructura de carpetas y archivos en el disco en un solo paso.

---

## ✨ Características Principales

1. **Doble Modalidad de Operación:**
   - **Generador Gráfico:** Transforma rutas tipo path (`src/components/Button.jsx`) o texto con sangría jerárquica en árboles con ramas alineadas.
   - **Modo Inverso:** Descompone diagramas con caracteres `├──`, `└──`, `│`, `+--`, `\--` y extrae las rutas absolutas y relativas para generar scripts de terminal.
2. **Generador Directo desde Ruta y Soporte de Raíz (`/` o `C:\`):**
   - **Generación Directa Inmediata (Cliente):** Al pegar o escribir cualquier ruta (ej: `/home/dgarcia/Descargas/Distribuciones Linux - Windows - Office/Linux` o `C:\Proyectos\App`) y pulsar "Generar Árbol de la Ruta" (o presionar Enter / pegar), construye al instante el árbol jerárquico desde la raíz del sistema operativo (`/` en Linux o `C:\` en Windows) sin realizar ningún escaneo de red ni llamadas externas.
   - **100% Local y Privado:** No realiza peticiones a la red ni a servidores externos. Todo el cálculo de rutas se ejecuta en el navegador.
   - **Lectura Opcional de Disco Local (`scan.php`):** Dispone de un botón secundario ("Leer Archivos en Disco") para inspeccionar opcionalmente los archivos y carpetas reales existentes en el disco local de la máquina a través del servidor local, con límite de profundidad configurable.
   - Conmutador interactivo **"Desde la raíz (/ o C:)"** para alternar inmediatamente entre rutas completas desde la raíz del sistema y rutas relativas a la carpeta seleccionada.
   - Detección inteligente si se pega una ruta absoluta en el editor de texto.
3. **Filtro de Contenido (Solo Directorios vs Directorios y Archivos):**
   - Selector reactivo para alternar entre:
     - 📁 **Directorios y Archivos:** Muestra la jerarquía completa de carpetas y ficheros.
     - 📂 **Solo Directorios:** Omite todos los archivos y diagrama exclusivamente la estructura de carpetas (ideal para planos de arquitectura y diagramas limpios de proyectos grandes).
4. **Diversidad de Estilos de Ramas:**
   - **Unicode Clásico (Estándar GitHub/Linux):** `├── `, `└── `, `│   `.
   - **Unicode Doble Línea:** `╠══ `, `╚══ `, `║   `.
   - **ASCII Puro (+-- y \--):** Máxima compatibilidad con terminales heredadas y editores de texto plano.
   - **Minimal:** Formato compacto con barras verticales simples.
   - **Listas Markdown:** Formato de viñetas anidadas (`- item`) para renderizado dinámico en lectores de Markdown.
5. **Lector de Carpetas Locales (Drag & Drop Zero-Upload):**
   - Permite arrastrar una carpeta completa del sistema de archivos al navegador o seleccionarla mediante el explorador local.
   - Utiliza la Web API `webkitGetAsEntry` para recorrer la jerarquía de directorios en memoria sin subir ningún dato a internet.
6. **Filtros Inteligentes e Iconografía Heurística:**
   - Filtro de exclusión automática para omitir directorios pesados y temporales (`node_modules`, `.git`, `.DS_Store`, `dist`, `__pycache__`, etc.).
   - Mapeo heurístico opcional de iconos y emojis por extensión (📁 carpetas, 📜 JS, ⚛️ React/JSX, 🐍 Python, 🦀 Rust, 📦 JSON, 📝 Markdown, etc.).
   - Opciones para forzar carpetas primero, incluir/excluir raíz y agregar barra final `/`.
7. **Generador Multi-Shell (Modo Inverso):**
   - **Bash / Zsh (Linux & macOS):** Comandos optimizados con `mkdir -p "dir1" "dir2"` y `touch "file1" "file2"`.
   - **PowerShell (Windows):** Comandos nativos con `New-Item -ItemType Directory` y `New-Item -ItemType File`.
   - **CMD / Batch (Windows):** Scripts `.bat` compatibles con `if not exist mkdir` y `type nul >`.
8. **Biblioteca de Presets de Arquitectura en 1 Clic:**
   - Incluye plantillas listas para usar: *React / Vite SPA*, *Node / Express Clean Architecture*, *Python / FastAPI Microservice*, *Extensión Web para Navegador*, *Rust / Cargo CLI* y *Documentación Docsify / Wiki*.

---

## 📂 Arquitectura de Archivos

```
apps/ascii-tree/
├── index.html           # Interfaz con tabs de doble modo (Generador vs Inverso) y escáner de rutas
├── style.css            # Estilos con tema Electric Blue e Índigo (#3B82F6 / #6366F1)
├── scan.php             # Endpoint local para escaneo de directorios del sistema de archivos
├── tree-engine.js       # Clase AsciiTreeEngine (Parsing bidireccional y generador de scripts)
└── app.js               # Controlador DOM, lector WebKit, escáner local, portapapeles y presets
```

---

## ⚙️ Métodos y API del Motor (`tree-engine.js`)

### `AsciiTreeEngine`

| Método | Argumentos | Descripción |
|---|---|---|
| `parsePaths(paths, rootName, options)` | `paths: Array<string>, rootName: string, options: Object` | Procesa una lista de rutas (relativas o absolutas desde la raíz `/` en Linux o `C:\` en Windows) y construye el árbol de nodos jerárquico (`TreeNode`). |
| `parseIndentedText(text, rootName)` | `text: string, rootName: string` | Construye el árbol jerárquico a partir de la profundidad de espacios o tabulaciones de cada línea. |
| `renderTree(root, options)` | `root: TreeNode, options: Object` | Serializa el árbol en texto según el estilo visual seleccionado (`unicode`, `ascii`, etc.) aplicando filtros y opciones de ordenación. |
| `parseTreeTextToPaths(treeText)` | `treeText: string` | **(Modo Inverso)** Analiza un diagrama de texto plano y extrae un conjunto de rutas normalizadas de directorios y archivos. |
| `generateBashScript(parsed, options)` | `parsed: Object, options: Object` | Genera un script `.sh` con comandos `mkdir -p` y `touch`. |
| `generatePowerShellScript(parsed)` | `parsed: Object` | Genera un script `.ps1` para Windows PowerShell. |
| `generateCmdScript(parsed)` | `parsed: Object` | Genera un script `.bat` para la consola clásica de Windows. |

---

## 🚀 Flujo de Trabajo del Usuario

### Caso A: Generar Árbol para Documentación
1. En la pestaña **1. Rutas a Árbol Gráfico**, arrastrar una carpeta local o pegar una lista de rutas en el panel izquierdo.
2. Ajustar el estilo visual (ej. *Unicode Clásico* o *Con Iconos/Emojis*).
3. Presionar **"Copiar en Bloque Markdown"** y pegarlo directamente en el `README.md`.

### Caso B: Crear Estructura a partir de un Diagrama (Modo Inverso)
1. Cambiar a la pestaña **2. Árbol a Comandos Terminal (Inverso)**.
2. Pegar el diagrama de árbol copiado de un tutorial o especificación técnica.
3. Elegir el intérprete de comandos deseado (*Bash*, *PowerShell* o *CMD*).
4. Presionar **"Copiar Script al Portapapeles"** o **"Descargar Script Ejecutable"** y ejecutarlo en la terminal para crear todas las carpetas y archivos al instante.
