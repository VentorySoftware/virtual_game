# TODO - Agregar funcionalidad al botón "Explorar Catálogo"

## Tareas Pendientes
- [x] Editar HeroSection.tsx para agregar navegación al botón "Explorar Catálogo"
- [x] Importar useNavigate de react-router-dom
- [x] Agregar onClick handler para redirigir a "/categories"
- [x] Verificar que la navegación funcione correctamente

## Información Recopilada
- Botón localizado en: src/components/sections/HeroSection.tsx
- Página de destino: src/pages/Categories.tsx (ruta: "/categories")
- Usa React Router para navegación
- Componente CyberButton para botones

## Cambios Realizados
- Agregado import de useNavigate de react-router-dom
- Agregado hook useNavigate en el componente HeroSection
- Agregado onClick handler al botón "Explorar Catálogo" que navega a "/categories"
- Servidor de desarrollo ejecutándose en http://localhost:8084/

## Estado: COMPLETADO
