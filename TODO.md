# TODO: Módulo "Pedidos Realizados" en Panel de Administración

## Información Recopilada
- El módulo existente en `src/pages/admin/Orders.tsx` maneja todos los pedidos, pero se necesita uno específico para pedidos realizados.
- Se requiere visualizar estado de ventas, detalles de productos, importes, métodos de pago, saldos y estados de pedidos.
- Mantener interfaz y diseño actual del sistema.
- Usar AdminLayout y componentes UI existentes.

## Plan de Implementación
- [ ] Crear nuevo archivo `src/pages/admin/OrdersRealizados.tsx`
- [ ] Filtrar pedidos por estados completados ('paid', 'delivered')
- [ ] Mostrar tabla con: número pedido, fecha, cliente, estado, total, método pago, saldo
- [ ] Implementar modal de detalles con productos, importes, método pago, saldos, estados
- [ ] Añadir filtros por estado, rango fechas, cliente
- [ ] Funcionalidad de exportación a CSV/Excel
- [ ] Integrar con AdminLayout y componentes UI
- [ ] Verificar y extender consulta para obtener método pago y saldos si faltan
- [ ] Probar filtros, ordenamiento, paginación y modal
- [ ] Actualizar rutas si es necesario para acceder al nuevo módulo

## Archivos Dependientes
- `src/pages/admin/OrdersRealizados.tsx` (nuevo)
- Posiblemente actualizar rutas en `src/App.tsx` o similar
- Usar hooks existentes: useAuth, useNotifications, etc.

## Pasos de Seguimiento
- [ ] Implementar componente base
- [ ] Añadir funcionalidad de filtros y búsqueda
- [ ] Implementar modal de detalles
- [ ] Añadir exportación
- [ ] Probar y ajustar diseño
- [ ] Verificar integración con panel admin
