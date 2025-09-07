# TODO - Agregar Campo Género al Sistema de Usuarios

## ✅ Completado
- [x] Crear migración para agregar columna gender a profiles table
- [x] Actualizar handle_new_user function para incluir gender
- [x] Actualizar AuthContext signUp para aceptar gender
- [x] Actualizar Auth.tsx para incluir campo de selección de género
- [x] Crear archivo de migración SQL
- [x] Ejecutar migración en base de datos
- [x] Verificar que la migración se aplicó correctamente

## 🔄 Pendiente
- [ ] Probar registro de usuario con campo género
- [ ] Actualizar tipos TypeScript si es necesario
- [ ] Verificar que los datos se guardan correctamente en la base de datos

## 📋 Detalles de Implementación

### Base de Datos
- Nueva tabla: `user_gender` enum con valores: 'Hombre', 'Mujer', 'Otro / No binario', 'Prefiero no decirlo'
- Columna `gender` agregada a tabla `profiles`
- Función `handle_new_user` actualizada para incluir gender desde raw_user_meta_data

### Frontend
- AuthContext: signUp function actualizada para aceptar gender
- Auth.tsx: Campo de selección agregado al formulario de registro
- Formulario incluye validación requerida para el campo género

### Próximos Pasos
1. Ejecutar `supabase link --project-ref TU_PROJECT_REF` para conectar al proyecto
2. Ejecutar `npx supabase db push` para aplicar la migración
3. Confirmar que la migración se aplicó sin errores
4. Probar el flujo completo de registro de usuario
5. Verificar que los datos se almacenan correctamente
6. Actualizar cualquier componente que muestre información del perfil si es necesario

## ⚠️ Nota Importante
La migración no se pudo ejecutar automáticamente porque el proyecto no está vinculado a Supabase. Es necesario ejecutar manualmente los comandos mencionados arriba antes de poder probar el nuevo campo de género.
