# 📑 Módulo #04 • Calculadora de Permisos Linux

Documentación técnica y manual operativo de la calculadora visual e interactiva de permisos Unix/Linux y generador de comandos `chmod` y `chown`.

---

## 🎯 Propósito y Alcance

Permite calcular, comprender y generar permisos de archivos y carpetas en sistemas operativos tipo Unix (Linux, macOS, BSD).

Proporciona una **conversión bidireccional instantánea** entre la notación octal (números como `755` o `644`), la notación simbólica (cadenas como `rwxr-xr-x` o `drwxr-xr-x`), la matriz interactiva de casillas de verificación (*checkboxes*) y la representación binaria aritmética, incorporando además auditoría de riesgos de seguridad y cálculo de máscaras de usuario (`umask`).

---

## ✨ Características Principales

1. **Sincronización Bidireccional Completa:**
   - Escribir en el campo octal actualiza inmediatamente los checkboxes, la notación simbólica, el desglose binario y los comandos CLI.
   - Modificar cualquier casilla de verificación o la cadena simbólica recalcula al instante el valor octal.
2. **Soporte Exhaustivo de Bits Especiales (Special Bits):**
   - **SUID (`4000` / `s`):** Ejecución con privilegios del propietario del archivo.
   - **SGID (`2000` / `s`):** Ejecución con privilegios del grupo o herencia automática del grupo en nuevos archivos creados dentro de carpetas colaborativas.
   - **Sticky Bit (`1000` / `t`):** Restringe el borrado y cambio de nombre de archivos exclusivamente a su dueño o a root en directorios públicos como `/tmp`.
3. **Generador Inteligente de Comandos Terminal:**
   - Selector dinámico de ruta (ej. `/var/www/html`).
   - Flags conmutables: `-R` (recursivo), `-v` (verbose), `-c` (solo reportar cambios).
   - Generación de comandos octales (`chmod 755`), simbólicos absolutos (`chmod u=rwx,g=rx,o=rx`) y propiedad (`chown usuario:grupo`).
   - **Comando Find & Chmod (Estándar de la Industria):** Separa automáticamente carpetas (`755`) de archivos (`644`) para evitar desastres de permisos en servidores web:
     - Carpetas: `find /var/www/html -type d -exec chmod 755 {} +`
     - Archivos: `find /var/www/html -type f -exec chmod 644 {} +`
4. **Auditor de Seguridad y Traductor Humano:**
   - Evaluación heurística del conjunto de permisos:
     - 🟢 **Seguro:** Permisos estándar restrictivos (`600`, `644`, `755`).
     - 🟡 **Advertencia:** Grupos con permisos de escritura o bits SUID/SGID activos.
     - 🔴 **Peligro Crítico:** Recursos con escritura abierta al público general (`777`, `666`).
   - Desglose explicativo en español de qué acciones puede realizar el Propietario, el Grupo y Otros.
5. **Calculadora Interactiva de Umask:**
   - Calcula permisos por omisión resultantes para nuevos archivos (base `666`) y carpetas (base `777`) mediante la fórmula `base & ~umask`.
   - Botón para transferir directamente el resultado a la calculadora principal.
6. **Biblioteca de Presets en 1 Clic:**
   - 12 configuraciones habituales listas para cargar: Servidores Web, Llaves privadas y públicas SSH, Scripts DevOps, `/tmp` y carpetas compartidas.

---

## 📂 Arquitectura de Archivos

```
apps/linux-permissions/
├── index.html           # Interfaz modular de 12 columnas con diseño glassmorphism
├── style.css            # Estilos con tema ámbar neón (#F59E0B / #D97706)
├── permissions-engine.js # Clase PermissionsEngine (Matemática binaria y validaciones)
└── app.js               # Coordinador DOM, portapapeles y presets interactivos
```

---

## ⚙️ Métodos y API del Motor (`permissions-engine.js`)

### `PermissionsEngine`

| Método | Argumentos | Descripción |
|---|---|---|
| `getOctal(includeSpecial)` | `includeSpecial: boolean` | Retorna el valor octal (3 dígitos si no hay bits especiales, o 4 dígitos si los hay). |
| `getSymbolic(includeFileType)` | `includeFileType: boolean` | Retorna la cadena de 9 o 10 caracteres con letras `rwx` y soporte para `s`, `S`, `t`, `T`. |
| `getBinaryBreakdown()` | *Ninguno* | Retorna la descomposición binaria bit a bit de cada categoría y sus fórmulas aritméticas. |
| `setFromOctal(octalStr)` | `octalStr: string` | Parsea una cadena octal de 3 o 4 dígitos (0-7) y actualiza todo el estado interno. |
| `setFromSymbolic(symbolicStr)` | `symbolicStr: string` | Parsea una cadena simbólica (ej. `-rwxr-xr-x`) y extrae permisos y bits especiales. |
| `generateCommands(options)` | `options: Object` | Genera los bloques de comandos `chmod` y `chown` basados en los flags y ruta especificados. |
| `getSecurityAudit()` | *Ninguno* | Evalúa riesgos de seguridad y retorna nivel (`safe`, `warning`, `danger`), título y advertencias. |
| `PermissionsEngine.calculateUmask(umaskStr)` | `umaskStr: string` | Método estático que calcula la sustracción booleana para archivos (666) y carpetas (777). |

---

## 🚀 Flujo de Trabajo del Usuario

1. **Selección o Ajuste:**
   - Marcar o desmarcar las casillas de verificación de la matriz, o
   - Escribir un número en el campo octal (ej. `644`), o
   - Hacer clic en una de las tarjetas de la **Biblioteca de Plantillas** (ej. *Llave Privada SSH 600*).
2. **Personalización del Comando:**
   - Ingresar la ruta del recurso (ej. `/var/www/html` o `deploy.sh`).
   - Activar si se requiere el flag recursivo (`-R`) o verbose (`-v`).
3. **Copia Inmediata:** Hacer clic en el botón *"Copiar"* del comando deseado para pegarlo directamente en la terminal.
