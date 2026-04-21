# DATC CORP S.A.S. · Sistema de Control de Inventario

Sistema web de control de inventario diario diseñado para DATC CORP S.A.S., con identidad visual basada en el **Manual de Marca Legendarias 2025**. Soporte para múltiples sucursales, gestión de usuarios por roles, cálculo automático de cuadres, y **exportación de reportes en PDF y Excel** filtrados por fecha.

---

## 🎨 Identidad visual

Este sistema utiliza la paleta y tipografías oficiales del manual de marca:

**Paleta:**
- 🟠 Honey Mustard `#EE8312` (primario)
- 🔴 Paprica `#E5202A`
- 🟣 Morado Legendario `#673E91`
- 🟤 BBQ Clásico `#671C0B`
- ⚪ White `#FFFFFF`

**Tipografías** (alternativas web a las del manual):
- **Anton** (equivalente a Bondia Black) → títulos
- **Outfit** (equivalente a Rink Regular) → cuerpo

**Estilo general**: Inspirado en Apple — tipografía gigante, mucho espacio en blanco, animaciones al hacer scroll, iconos grandes custom, transiciones fluidas.

---

## 🚀 Instalación

### Opción A: Probar localmente (30 segundos)

1. Descarga los 4 archivos
2. Ponlos en una carpeta
3. Doble clic en `index.html` → se abre en tu navegador y funciona

### Opción B: Subir a tu hosting

1. Accede al **Administrador de Archivos** de tu hosting (cPanel, Plesk, etc.)
2. Entra a la carpeta `public_html` (o `www`)
3. Sube los 4 archivos: `index.html`, `styles.css`, `app.js`, `README.md`
4. Abre: `https://tudominio.com`

### Credenciales por defecto
- Usuario: **`admin`**
- Contraseña: **`admin2026`**

⚠️ Cambia la contraseña apenas ingreses.

---

## 👥 Roles

### Administrador
- Crea, edita y desactiva usuarios
- Gestiona sucursales y el catálogo de productos
- Ve el historial de **todas** las sucursales
- Puede eliminar cierres
- Exporta reportes

### Empleado
- Solo registra cierres en su sucursal asignada
- Solo ve el historial de su sucursal
- Exporta reportes de su sucursal

---

## 📄 Exportación de reportes (NUEVO)

En la vista **Historial**, aplica los filtros que quieras (fecha desde, fecha hasta, responsable) y luego presiona uno de los dos botones de descarga:

### 📕 Descargar PDF
Genera un PDF profesional con:
- Encabezado con marca DATC
- Filtros aplicados
- KPIs resumidos (total ventas, cierres, descuadres, promedio)
- Tabla completa con código de colores
- Paginación automática

**Archivo:** `DATC_Reporte_Cierres_YYYY-MM-DD.pdf`

### 📗 Descargar Excel
Genera un archivo `.xlsx` con **4 hojas**:
1. **Resumen** — cierres con totales
2. **Detalle por Producto** — un renglón por cada producto de cada cierre con inv. inicial, ventas, mermas, existencias y cuadre
3. **Gastos** — detalle de todos los gastos
4. **Mermas** — detalle de todas las mermas

**Archivo:** `DATC_Reporte_Cierres_YYYY-MM-DD.xlsx`

### Ejemplos de uso
- **Reporte mensual**: filtra Desde=1 abr 2026, Hasta=30 abr 2026 → Descargar Excel
- **Auditoría de un empleado**: filtra Responsable=Ximena → Descargar PDF
- **Reporte trimestral**: filtra Desde=1 ene, Hasta=31 mar → Descargar Excel

---

## 📋 Flujo de uso diario

1. **Ingresar** con usuario y contraseña
2. **Ir a "Cierre Diario"**
3. **Presionar "Cargar día anterior"** (precarga existencias del cierre previo como inv. inicial)
4. Completar por producto: Ingresos (si hubo), Ventas, Mermas, Existencias
5. El sistema calcula automáticamente Total 1, Total 2 y Cuadre
6. Registrar gastos y mermas del día
7. Ingresar total de ventas en $
8. **Guardar cierre**

---

## ✨ Características

- **Cálculo automático** en tiempo real de cuadres
- **Animaciones scroll-reveal** estilo Apple
- **Dashboard con iconos grandes**: Ventas semana · Último cierre · Descuadres · Bajo stock
- **Multi-sucursal**: Puyo, Tena, Riobamba (Norte, Sur, Centro)
- **Exportación PDF y Excel** con filtros aplicados
- **Responsive**: PC, tablet, celular
- **Funciona sin internet** después de cargar la página una vez
- **Contraseñas con hash SHA-256** (no se guardan en texto plano)

---

## 🗄️ Almacenamiento

Los datos se guardan en `localStorage` del navegador. Ventajas:

✅ Sin configuración, sin backend, sin base de datos
✅ Funciona offline
✅ Instalación en 30 segundos

Limitación: los datos están en el navegador de cada dispositivo. Para sincronización entre sucursales en tiempo real, la estructura está lista para migrar a Firebase, Supabase o un backend propio.

---

## 🔐 Seguridad

- Contraseñas con hash SHA-256 + salt
- Login obligatorio
- Restricción de sucursal por rol
- Confirmación antes de eliminar datos

---

## 📞 Soporte

Sistema diseñado específicamente para **DATC CORP S.A.S.** basado en el formato físico de Cierre Diario de Caja y el Manual de Marca Legendarias 2025.

---

**Versión 2.0** · Abril 2026 · © DATC CORP S.A.S.
