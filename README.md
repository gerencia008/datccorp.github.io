# Alitas Legendarias · Sistema de Control de Inventario

Sistema web de control de inventario diario basado en el formato físico "Cierre Diario de Caja" de Alitas Legendarias, con soporte para múltiples sucursales, gestión de usuarios por roles y cálculo automático de cuadres.

---

## 🚀 Instalación en tu hosting

La aplicación es 100% frontend (HTML + CSS + JavaScript puro), no requiere servidor ni base de datos. Funciona en cualquier hosting básico.

### Pasos

1. **Sube los tres archivos** al directorio raíz (o subcarpeta) de tu hosting:
   - `index.html`
   - `styles.css`
   - `app.js`

2. **Accede desde el navegador** a la URL donde los subiste.

3. **Ingresa con el usuario administrador por defecto**:
   - Usuario: `admin`
   - Contraseña: `admin2026`

4. **¡Importante!** Cambia la contraseña del administrador inmediatamente (desde la sección Usuarios → Editar → Restablecer).

---

## 👥 Roles de usuario

### Administrador
- Acceso total
- Crea, edita y desactiva usuarios
- Gestiona sucursales
- Edita el catálogo de productos
- Ve el historial de todas las sucursales
- Puede eliminar cierres

### Empleado
- Solo puede registrar cierres diarios en su sucursal asignada
- Solo ve el historial de su sucursal
- No puede modificar usuarios, sucursales ni el catálogo de productos

---

## 📋 Flujo de uso diario (empleado)

1. **Ingresar** con usuario y contraseña
2. **Ir a "Cierre Diario"**
3. **Opcional**: presionar **"Cargar día anterior"** — esto precarga automáticamente las existencias del último cierre como *Inventario Inicial* del nuevo
4. **Completar** para cada producto:
   - Inv. Inicial (queda igual al último cierre si usaste "Cargar día anterior")
   - Ingresos (si hubo reposición ese día)
   - Ventas
   - Mermas
   - Existencias (conteo físico al cierre)
5. **El sistema calcula automáticamente**:
   - Total 1 = Inv. Inicial + Ingresos
   - Total 2 = Ventas + Mermas + Existencias
   - Cuadre = Total 1 − Total 2 (debe ser 0 ✓)
6. **Registrar** gastos del día y detalle de mermas (ej. "Pastel prueba", "Alas prueba Malith")
7. **Ingresar el total de ventas** del día (monto en $)
8. **Presionar "Guardar cierre"**

---

## ✨ Características

- **Cálculo en tiempo real**: escribe un número y todos los totales y cuadres se recalculan al instante
- **Indicador visual de estado**: el sistema te avisa cuántos descuadres hay antes de guardar
- **Continuidad entre días**: "Cargar día anterior" evita re-digitar el inventario inicial
- **Multi-sucursal**: un solo sistema para Puyo, Tena y las 3 sucursales de Riobamba
- **Historial con filtros**: por fecha, por responsable, por sucursal
- **Dashboard con indicadores**:
  - Ventas de la última semana
  - Descuadres pendientes de revisión
  - Productos bajo stock mínimo
- **Productos personalizables**: agrega, oculta o reordena productos desde Productos
- **Responsive**: funciona en computador, tablet y celular
- **Funciona sin internet**: una vez cargada la página, los datos quedan en el dispositivo

---

## 🗄️ Almacenamiento de datos

**Versión actual (v1.0)**: Los datos se guardan en `localStorage` del navegador. Esto significa:

✅ Funciona inmediatamente sin configuración adicional
✅ No requiere base de datos ni servidor backend
✅ Datos disponibles sin internet una vez cargada la app

⚠️ **Limitación importante**: los datos están guardados en el navegador de cada dispositivo. Si necesitas que varias computadoras/sucursales vean los mismos datos en tiempo real, se requiere agregar un backend (ver siguiente sección).

---

## 🔜 Escalabilidad: próximo paso recomendado

Cuando estés listo para que todas las sucursales compartan datos en tiempo real, el sistema ya está estructurado para migrar fácilmente a un backend real. Las opciones recomendadas son:

1. **Firebase / Firestore** (gratis hasta cierto volumen, sin servidor)
2. **Supabase** (alternativa open-source a Firebase con PostgreSQL)
3. **Backend propio** en PHP/Node + MySQL en tu hosting

La estructura de datos (`users`, `products`, `branches`, `cierres`) está diseñada para trasladarse directamente a tablas de base de datos sin cambios de lógica.

---

## 🔐 Seguridad

- Las contraseñas se guardan con hash SHA-256 + salt (no en texto plano)
- Login obligatorio antes de ver cualquier dato
- Los empleados solo acceden a su sucursal asignada
- Las acciones destructivas (eliminar cierre, desactivar usuarios) requieren confirmación

**Nota**: al ser una app 100% frontend, alguien técnicamente puede ver el código JavaScript. Para datos realmente sensibles (nómina, costos reales), se recomienda migrar a backend antes de usar en producción con múltiples empleados.

---

## 📞 Soporte

Este sistema fue diseñado específicamente para Alitas Legendarias basándose en el formato físico actual de Cierre Diario de Caja. Si necesitas ajustes (productos nuevos, campos adicionales, reportes específicos), se pueden agregar fácilmente.

---

**Versión 1.0** · Abril 2026
