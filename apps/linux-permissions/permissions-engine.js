/**
 * permissions-engine.js
 * Motor lógico para la Calculadora de Permisos Linux / Unix.
 * Manejo bidireccional de Notación Octal (3 y 4 dígitos), Simbólica, Matriz Binaria,
 * Permisos Especiales (SUID, SGID, Sticky Bit), Umask y Auditoría de Seguridad.
 */

(function (global) {
    'use strict';

    // Constantes de permisos
    const READ = 4;
    const WRITE = 2;
    const EXECUTE = 1;

    const SUID = 4;   // 4000
    const SGID = 2;   // 2000
    const STICKY = 1; // 1000

    class PermissionsEngine {
        constructor() {
            // Estado interno:
            // special: { suid: bool, sgid: bool, sticky: bool }
            // user: { r: bool, w: bool, x: bool }
            // group: { r: bool, w: bool, x: bool }
            // others: { r: bool, w: bool, x: bool }
            // fileType: '-' | 'd' | 'l'
            this.state = {
                fileType: '-',
                special: { suid: false, sgid: false, sticky: false },
                user: { r: true, w: true, x: true },
                group: { r: true, w: false, x: true },
                others: { r: true, w: false, x: true }
            };
        }

        // =========================================================================
        // GETTERS / CÁLCULOS
        // =========================================================================

        /**
         * Retorna el valor octal del bloque special (0 a 7)
         */
        getSpecialOctal() {
            let val = 0;
            if (this.state.special.suid) val += SUID;
            if (this.state.special.sgid) val += SGID;
            if (this.state.special.sticky) val += STICKY;
            return val;
        }

        /**
         * Retorna el valor octal de una categoría ('user', 'group', 'others')
         */
        getCategoryOctal(category) {
            const cat = this.state[category];
            if (!cat) return 0;
            let val = 0;
            if (cat.r) val += READ;
            if (cat.w) val += WRITE;
            if (cat.x) val += EXECUTE;
            return val;
        }

        /**
         * Retorna el octal de 3 dígitos (ej: "755")
         */
        getOctal3() {
            const u = this.getCategoryOctal('user');
            const g = this.getCategoryOctal('group');
            const o = this.getCategoryOctal('others');
            return `${u}${g}${o}`;
        }

        /**
         * Retorna el octal de 4 dígitos (ej: "0755" o "4755")
         */
        getOctal4() {
            const s = this.getSpecialOctal();
            return `${s}${this.getOctal3()}`;
        }

        /**
         * Retorna la notación octal canónica más apropiada:
         * Si hay special bits, 4 dígitos. Si no, 3 dígitos (con opción de forzar 4).
         */
        getOctal(includeSpecial = false) {
            const s = this.getSpecialOctal();
            if (includeSpecial || s > 0) {
                return this.getOctal4();
            }
            return this.getOctal3();
        }

        /**
         * Retorna la cadena simbólica de 9 caracteres (rwxr-xr-x) o 10 con tipo (-rwxr-xr-x)
         */
        getSymbolic(includeFileType = true) {
            const u = this.state.user;
            const g = this.state.group;
            const o = this.state.others;
            const sp = this.state.special;

            // User execute + SUID
            let ux = '-';
            if (sp.suid) {
                ux = u.x ? 's' : 'S';
            } else if (u.x) {
                ux = 'x';
            }

            // Group execute + SGID
            let gx = '-';
            if (sp.sgid) {
                gx = g.x ? 's' : 'S';
            } else if (g.x) {
                gx = 'x';
            }

            // Others execute + Sticky
            let ox = '-';
            if (sp.sticky) {
                ox = o.x ? 't' : 'T';
            } else if (o.x) {
                ox = 'x';
            }

            const uStr = `${u.r ? 'r' : '-'}${u.w ? 'w' : '-'}${ux}`;
            const gStr = `${g.r ? 'r' : '-'}${g.w ? 'w' : '-'}${gx}`;
            const oStr = `${o.r ? 'r' : '-'}${o.w ? 'w' : '-'}${ox}`;

            const base = `${uStr}${gStr}${oStr}`;
            return includeFileType ? `${this.state.fileType}${base}` : base;
        }

        /**
         * Retorna la representación binaria desglosada
         */
        getBinaryBreakdown() {
            const toBin = (val) => val.toString(2).padStart(3, '0');
            const uVal = this.getCategoryOctal('user');
            const gVal = this.getCategoryOctal('group');
            const oVal = this.getCategoryOctal('others');
            const sVal = this.getSpecialOctal();

            return {
                special: {
                    value: sVal,
                    binary: toBin(sVal),
                    bits: [this.state.special.suid ? 1 : 0, this.state.special.sgid ? 1 : 0, this.state.special.sticky ? 1 : 0],
                    formula: `${this.state.special.suid ? '4' : '0'} + ${this.state.special.sgid ? '2' : '0'} + ${this.state.special.sticky ? '1' : '0'} = ${sVal}`
                },
                user: {
                    value: uVal,
                    binary: toBin(uVal),
                    bits: [this.state.user.r ? 1 : 0, this.state.user.w ? 1 : 0, this.state.user.x ? 1 : 0],
                    formula: `${this.state.user.r ? '4' : '0'} + ${this.state.user.w ? '2' : '0'} + ${this.state.user.x ? '1' : '0'} = ${uVal}`
                },
                group: {
                    value: gVal,
                    binary: toBin(gVal),
                    bits: [this.state.group.r ? 1 : 0, this.state.group.w ? 1 : 0, this.state.group.x ? 1 : 0],
                    formula: `${this.state.group.r ? '4' : '0'} + ${this.state.group.w ? '2' : '0'} + ${this.state.group.x ? '1' : '0'} = ${gVal}`
                },
                others: {
                    value: oVal,
                    binary: toBin(oVal),
                    bits: [this.state.others.r ? 1 : 0, this.state.others.w ? 1 : 0, this.state.others.x ? 1 : 0],
                    formula: `${this.state.others.r ? '4' : '0'} + ${this.state.others.w ? '2' : '0'} + ${this.state.others.x ? '1' : '0'} = ${oVal}`
                },
                fullBinary: `${toBin(uVal)} ${toBin(gVal)} ${toBin(oVal)}`
            };
        }

        // =========================================================================
        // SETTERS / PARSEADORES
        // =========================================================================

        /**
         * Asigna un permiso individual
         */
        setPermission(target, perm, isGranted) {
            if (target === 'special') {
                if (['suid', 'sgid', 'sticky'].includes(perm)) {
                    this.state.special[perm] = Boolean(isGranted);
                }
            } else if (['user', 'group', 'others'].includes(target)) {
                if (['r', 'w', 'x'].includes(perm)) {
                    this.state[target][perm] = Boolean(isGranted);
                }
            }
        }

        /**
         * Asigna el tipo de archivo ('-', 'd', 'l')
         */
        setFileType(type) {
            if (['-', 'd', 'l', 'c', 'b', 's', 'p'].includes(type)) {
                this.state.fileType = type;
            }
        }

        /**
         * Parsea y carga desde cadena octal (3 o 4 dígitos)
         * Ej: "755", "0755", "644", "4755", "1777"
         */
        setFromOctal(octalStr) {
            const clean = String(octalStr || '').trim();
            if (!/^[0-7]{3,4}$/.test(clean)) {
                return { success: false, message: 'La notación octal debe tener 3 o 4 dígitos entre 0 y 7.' };
            }

            let sDigit = 0;
            let uDigit = 0;
            let gDigit = 0;
            let oDigit = 0;

            if (clean.length === 4) {
                sDigit = parseInt(clean[0], 10);
                uDigit = parseInt(clean[1], 10);
                gDigit = parseInt(clean[2], 10);
                oDigit = parseInt(clean[3], 10);
            } else {
                uDigit = parseInt(clean[0], 10);
                gDigit = parseInt(clean[1], 10);
                oDigit = parseInt(clean[2], 10);
            }

            // Aplicar special
            this.state.special.suid = Boolean(sDigit & SUID);
            this.state.special.sgid = Boolean(sDigit & SGID);
            this.state.special.sticky = Boolean(sDigit & STICKY);

            // Aplicar user
            this.state.user.r = Boolean(uDigit & READ);
            this.state.user.w = Boolean(uDigit & WRITE);
            this.state.user.x = Boolean(uDigit & EXECUTE);

            // Aplicar group
            this.state.group.r = Boolean(gDigit & READ);
            this.state.group.w = Boolean(gDigit & WRITE);
            this.state.group.x = Boolean(gDigit & EXECUTE);

            // Aplicar others
            this.state.others.r = Boolean(oDigit & READ);
            this.state.others.w = Boolean(oDigit & WRITE);
            this.state.others.x = Boolean(oDigit & EXECUTE);

            return { success: true };
        }

        /**
         * Parsea y carga desde notación simbólica.
         * Acepta 9 caracteres (rwxr-xr-x) o 10 caracteres (-rwxr-xr-x o drwxr-xr-x)
         * Maneja 's', 'S', 't', 'T' para bits especiales.
         */
        setFromSymbolic(symbolicStr) {
            let str = String(symbolicStr || '').trim();
            if (!str) return { success: false, message: 'Cadena simbólica vacía.' };

            // Si tiene 10 caracteres, el primero es el tipo de archivo
            if (str.length === 10) {
                const ft = str[0];
                if ('-dlcbsp'.includes(ft)) {
                    this.state.fileType = ft;
                }
                str = str.substring(1);
            }

            if (str.length !== 9) {
                return { success: false, message: 'La cadena simbólica debe contener 9 o 10 caracteres.' };
            }

            const chars = str.split('');

            // Validar caracteres
            const validPattern = /^[r-][w-][xsS-][r-][w-][xsS-][r-][w-][xtT-]$/;
            if (!validPattern.test(str)) {
                return { success: false, message: 'Formato simbólico inválido. Usa [r,w,x,s,t,-].' };
            }

            // User
            this.state.user.r = chars[0] === 'r';
            this.state.user.w = chars[1] === 'w';
            const uChar = chars[2];
            this.state.user.x = (uChar === 'x' || uChar === 's');
            this.state.special.suid = (uChar === 's' || uChar === 'S');

            // Group
            this.state.group.r = chars[3] === 'r';
            this.state.group.w = chars[4] === 'w';
            const gChar = chars[5];
            this.state.group.x = (gChar === 'x' || gChar === 's');
            this.state.special.sgid = (gChar === 's' || gChar === 'S');

            // Others
            this.state.others.r = chars[6] === 'r';
            this.state.others.w = chars[7] === 'w';
            const oChar = chars[8];
            this.state.others.x = (oChar === 'x' || oChar === 't');
            this.state.special.sticky = (oChar === 't' || oChar === 'T');

            return { success: true };
        }

        /**
         * Asigna una categoría completa con un valor octal (0 a 7)
         */
        setCategoryOctal(category, val) {
            val = Math.max(0, Math.min(7, parseInt(val, 10) || 0));
            if (category === 'special') {
                this.state.special.suid = Boolean(val & SUID);
                this.state.special.sgid = Boolean(val & SGID);
                this.state.special.sticky = Boolean(val & STICKY);
            } else if (['user', 'group', 'others'].includes(category)) {
                this.state[category].r = Boolean(val & READ);
                this.state[category].w = Boolean(val & WRITE);
                this.state[category].x = Boolean(val & EXECUTE);
            }
        }

        // =========================================================================
        // GENERADOR DE COMANDOS CLI
        // =========================================================================

        /**
         * Genera los comandos CLI en base al estado actual y opciones del usuario
         */
        generateCommands(options = {}) {
            const {
                targetPath = 'archivo.txt',
                isRecursive = false,
                isVerbose = false,
                isChangesOnly = false,
                referenceFile = '',
                userOwner = 'usuario',
                groupOwner = 'grupo'
            } = options;

            const path = targetPath.trim() || 'archivo.txt';
            const octal = this.getOctal();
            const octal4 = this.getOctal4();

            // Flags para chmod
            const flags = [];
            if (isRecursive) flags.push('-R');
            if (isChangesOnly) flags.push('-c');
            else if (isVerbose) flags.push('-v');

            const flagStr = flags.length > 0 ? `${flags.join(' ')} ` : '';

            // 1. Comando octal canónico
            const chmodOctal = `chmod ${flagStr}${octal} ${path}`;

            // 2. Comando octal de 4 dígitos explícito
            const chmodOctal4 = `chmod ${flagStr}${octal4} ${path}`;

            // 3. Comando simbólico absoluto: chmod u=rwx,g=rx,o=rx
            const uSymbols = (this.state.user.r ? 'r' : '') + (this.state.user.w ? 'w' : '') + (this.state.user.x ? 'x' : '');
            const gSymbols = (this.state.group.r ? 'r' : '') + (this.state.group.w ? 'w' : '') + (this.state.group.x ? 'x' : '');
            const oSymbols = (this.state.others.r ? 'r' : '') + (this.state.others.w ? 'w' : '') + (this.state.others.x ? 'x' : '');

            const parts = [];
            parts.push(`u=${uSymbols}`);
            parts.push(`g=${gSymbols}`);
            parts.push(`o=${oSymbols}`);

            // Special bits en simbólico si aplican
            if (this.state.special.suid) parts.push('u+s');
            if (this.state.special.sgid) parts.push('g+s');
            if (this.state.special.sticky) parts.push('+t');

            const chmodSymbolic = `chmod ${flagStr}${parts.join(',')} ${path}`;

            // 4. Comando Find + Chmod (Best practice para separar carpetas de archivos)
            const findDirectories = `find ${path} -type d -exec chmod 755 {} +`;
            const findFiles = `find ${path} -type f -exec chmod 644 {} +`;

            // 5. Comando Chown asociado
            const chownCmd = `chown ${isRecursive ? '-R ' : ''}${userOwner.trim() || 'usuario'}:${groupOwner.trim() || 'grupo'} ${path}`;

            // 6. Comando con --reference si aplica
            const chmodReference = referenceFile.trim()
                ? `chmod ${flagStr}--reference=${referenceFile.trim()} ${path}`
                : null;

            return {
                chmodOctal,
                chmodOctal4,
                chmodSymbolic,
                findDirectories,
                findFiles,
                chownCmd,
                chmodReference
            };
        }

        // =========================================================================
        // TRADUCTOR A LENGUAJE NATURAL
        // =========================================================================

        /**
         * Devuelve explicaciones claras en español de cada rol y permisos especiales
         */
        getHumanDescription() {
            const describe = (cat, name) => {
                const { r, w, x } = cat;
                if (!r && !w && !x) {
                    return `<strong>${name}:</strong> Sin ningún acceso (denegado por completo).`;
                }
                const actions = [];
                if (r) actions.push('leer / ver contenido');
                if (w) actions.push('modificar / crear / borrar');
                if (x) actions.push('ejecutar como programa / ingresar al directorio');

                return `<strong>${name}:</strong> Puede ${actions.join(', ')}.`;
            };

            const userDesc = describe(this.state.user, 'Propietario (User)');
            const groupDesc = describe(this.state.group, 'Grupo (Group)');
            const othersDesc = describe(this.state.others, 'Otros (Others / World)');

            // Special bits info
            const specialDescs = [];
            if (this.state.special.suid) {
                specialDescs.push('<strong>SUID (4000):</strong> El archivo se ejecutará con los privilegios del dueño (User), no de quien lo ejecuta.');
            }
            if (this.state.special.sgid) {
                specialDescs.push('<strong>SGID (2000):</strong> Se ejecuta con permisos del Grupo, o en directorios los nuevos archivos heredan automáticamente el grupo.');
            }
            if (this.state.special.sticky) {
                specialDescs.push('<strong>Sticky Bit (1000):</strong> En directorios (como /tmp), solo el dueño del archivo o root puede borrarlo o renombrarlo.');
            }

            return {
                userDesc,
                groupDesc,
                othersDesc,
                specialDescs
            };
        }

        // =========================================================================
        // AUDITORÍA DE SEGURIDAD
        // =========================================================================

        /**
         * Evalúa el nivel de seguridad del conjunto de permisos actual
         * Retorna { level: 'safe'|'warning'|'danger', title: string, reason: string, badgeClass: string }
         */
        getSecurityAudit() {
            const octal = this.getOctal3();
            const sp = this.state.special;
            const o = this.state.others;
            const g = this.state.group;
            const u = this.state.user;

            // 1. Peligro crítico: 777 o permisos de escritura para 'others'
            if (o.w) {
                return {
                    level: 'danger',
                    badgeClass: 'audit-danger',
                    icon: 'alert-triangle',
                    title: 'Peligro Crítico: Escritura pública permitida',
                    reason: 'Cualquier usuario local o servicio puede modificar o borrar este recurso. Evita siempre permisos con escritura en Otros (como 777 o 666) en entornos de producción.'
                };
            }

            // 2. SUID en archivos que no son binarios del sistema
            if (sp.suid) {
                return {
                    level: 'warning',
                    badgeClass: 'audit-warning',
                    icon: 'shield-alert',
                    title: 'Atención: Bit SUID activado (4000)',
                    reason: 'El programa se ejecutará con los privilegios de su propietario (frecuentemente root). Un fallo en este binario puede permitir elevación de privilegios no autorizada.'
                };
            }

            // 3. Grupo con permisos de escritura (colaborativo / cuidado)
            if (g.w && !o.w) {
                return {
                    level: 'warning',
                    badgeClass: 'audit-warning',
                    icon: 'info',
                    title: 'Advertencia: Escritura compartida por grupo',
                    reason: 'Los integrantes del grupo asignado pueden modificar el archivo. Asegúrate de que los miembros del grupo pertenezcan al mismo equipo de confianza.'
                };
            }

            // 4. Claves SSH o archivos muy privados
            if (['600', '700', '400'].includes(octal)) {
                return {
                    level: 'safe',
                    badgeClass: 'audit-safe',
                    icon: 'shield-check',
                    title: 'Máxima Seguridad: Acceso exclusivo del Propietario',
                    reason: 'Ideal para llaves privadas SSH (~/.ssh/id_rsa), credenciales .env o directorios confidenciales del usuario.'
                };
            }

            // 5. Configuración estándar segura (644 / 755)
            if (['644', '755', '640', '750'].includes(octal)) {
                return {
                    level: 'safe',
                    badgeClass: 'audit-safe',
                    icon: 'check-circle',
                    title: 'Seguridad Estándar Unix / Web',
                    reason: 'Cumple el principio de privilegios mínimos para servidores web, scripts de despliegue y documentación pública.'
                };
            }

            // Caso general seguro
            return {
                level: 'safe',
                badgeClass: 'audit-safe',
                icon: 'check-circle',
                title: 'Nivel de Aislamiento Aceptable',
                reason: 'El acceso público restringido a solo lectura o ejecución previene adulteraciones no autorizadas.'
            };
        }

        // =========================================================================
        // CALCULADORA DE UMASK
        // =========================================================================

        /**
         * Calcula los permisos resultantes a partir de un valor umask
         * @param {string} umaskStr - Ej: "022", "027", "002"
         */
        static calculateUmask(umaskStr) {
            const clean = String(umaskStr || '022').trim();
            if (!/^[0-7]{3,4}$/.test(clean)) {
                return { success: false, message: 'El valor umask debe ser octal de 3 o 4 dígitos (0-7).' };
            }

            const umaskVal = clean.length === 4 ? clean.substring(1) : clean;
            const u1 = parseInt(umaskVal[0], 10);
            const u2 = parseInt(umaskVal[1], 10);
            const u3 = parseInt(umaskVal[2], 10);

            // Permisos base de archivos en Unix: 666 (rw-rw-rw-)
            // Fórmula: base & ~umask
            const fileBase = [6, 6, 6];
            const fileRes = [
                fileBase[0] & (~u1 & 7),
                fileBase[1] & (~u2 & 7),
                fileBase[2] & (~u3 & 7)
            ];

            // Permisos base de carpetas en Unix: 777 (rwxrwxrwx)
            const dirBase = [7, 7, 7];
            const dirRes = [
                dirBase[0] & (~u1 & 7),
                dirBase[1] & (~u2 & 7),
                dirBase[2] & (~u3 & 7)
            ];

            const fileOctal = `${fileRes[0]}${fileRes[1]}${fileRes[2]}`;
            const dirOctal = `${dirRes[0]}${dirRes[1]}${dirRes[2]}`;

            // Convertir a cadenas simbólicas
            const octToSym = (oct) => {
                const r = Boolean(oct & READ);
                const w = Boolean(oct & WRITE);
                const x = Boolean(oct & EXECUTE);
                return `${r ? 'r' : '-'}${w ? 'w' : '-'}${x ? 'x' : '-'}`;
            };

            const fileSym = `-${octToSym(fileRes[0])}${octToSym(fileRes[1])}${octToSym(fileRes[2])}`;
            const dirSym = `d${octToSym(dirRes[0])}${octToSym(dirRes[1])}${octToSym(dirRes[2])}`;

            return {
                success: true,
                umask: clean,
                file: {
                    baseOctal: '666',
                    baseSymbolic: '-rw-rw-rw-',
                    resultOctal: fileOctal,
                    resultSymbolic: fileSym,
                    explanation: `666 AND NOT ${umaskVal} = ${fileOctal}`
                },
                directory: {
                    baseOctal: '777',
                    baseSymbolic: 'drwxrwxrwx',
                    resultOctal: dirOctal,
                    resultSymbolic: dirSym,
                    explanation: `777 AND NOT ${umaskVal} = ${dirOctal}`
                }
            };
        }
    }

    // Exportación global / Node
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PermissionsEngine;
    } else {
        global.PermissionsEngine = PermissionsEngine;
    }

})(typeof window !== 'undefined' ? window : this);
