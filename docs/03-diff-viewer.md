# 📑 Módulo #03 • Diff Viewer

Documentación técnica y manual operativo del comparador visual de texto y código fuente con detección exacta carácter por carácter.

---

## 🎯 Propósito y Alcance

Permite comparar dos fragmentos de texto plano, código de programación o archivos de configuración (JSON, YAML, XML, SQL, Markdown) para identificar con precisión matemática cada adición, supresión o alteración de caracteres y líneas.

Proporciona una experiencia de inspección visual equivalente a herramientas como Git Diff o VS Code Diff, funcionando de manera **100% nativa en el navegador** y con cero telemetría.

---

## ✨ Características Principales

1. **Motor de Diferencias Myers (Exactitud Matemática):**
   - Implementación pura en Vanilla JavaScript del algoritmo *Myers Diff* (el mismo fundamento utilizado por `git diff`).
   - Alineación óptima de líneas emparejadas antes de la fase de análisis intra-línea.
2. **Resaltado Intra-Línea Carácter a Carácter:**
   - No se limita a marcar la línea entera en rojo o verde; desglosa los caracteres específicos añadidos, quitados o modificados dentro de cada renglón.
   - Detecta y muestra el número exacto de línea, columna de inicio y columna de fin de cada cambio.
3. **Modalidades de Visualización:**
   - **Lado a Lado (Side-by-Side):** Dos paneles paralelos con sincronización bidireccional suave de desplazamiento (*synchronized scroll*).
   - **Vista Unificada:** Panel único con marcas de adición (`+`) y eliminación (`-`) continuas.
4. **Opciones Avanzadas de Comparación:**
   - *Ignorar espacios en blanco:* Omite diferencias de indentación o espacios al final de las líneas.
   - *Ignorar mayúsculas y minúsculas:* Comparación *case-insensitive*.
   - *Invertir (Swap):* Intercambia el contenido de A y B con un clic.
5. **Barra de Métricas y Estadísticas:**
   - Contador en tiempo real de adiciones (verde), eliminaciones (rojo), modificaciones (amarillo) y líneas idénticas.

---

## 📂 Arquitectura de Archivos

```
apps/diff-viewer/
├── index.html           # Interfaz con paneles de entrada, tabla de diferencias y toolbar
├── style.css            # Estilos con tema violeta y azul (#8B5CF6 / #00F0FF)
├── diff-engine.js       # Clase DiffEngine (Algoritmo Myers e inspector de caracteres)
└── app.js               # Coordinador DOM, scroll sync y renderizado de celdas
```

---

## ⚙️ Métodos y API del Motor (`diff-engine.js`)

### `DiffEngine`

| Método | Argumentos | Descripción |
|---|---|---|
| `compare(textA, textB)` | `textA: string, textB: string` | Ejecuta la comparación integral entre el texto original (A) y el modificado (B). Retorna un objeto con filas alineadas (`rows`), lista de diferencias atómicas (`diffList`) y métricas globales (`stats`). |
| `_myersDiff(linesA, linesB)` | `linesA: Array, linesB: Array` | Calcula el camino de edición más corto (Shortest Edit Script) minimizando adiciones y borrados. |
| `_analyzeLineCharacters(lineA, lineB, lineNumA, lineNumB)` | `lineA: string, lineB: string, lineNumA: number, lineNumB: number` | Aplica una segunda pasada del algoritmo Myers a nivel de caracteres para aislar bloques exactos de texto modificado en una misma línea. |

---

## 🚀 Flujo de Trabajo del Usuario

1. **Ingreso de Textos:** Pegar el texto original en el cuadro izquierdo (*Texto Original A*) y la nueva versión en el derecho (*Texto Modificado B*). Se incluye un botón de *"Cargar Código de Ejemplo"*.
2. **Comparar:** Presionar el botón *"Comparar Diferencias"* (o utilizar el atajo `Ctrl + Enter`).
3. **Inspección Visual:**
   - Navegar por el visor con scroll sincronizado.
   - Alternar entre vista *Lado a Lado* o *Unificada*.
   - Activar filtros de espacios o mayúsculas si se desea ignorar cambios triviales de formato.
