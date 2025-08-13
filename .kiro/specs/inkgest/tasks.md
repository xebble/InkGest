# Plan de Implementación - InkGest

## ⚠️ REGLA CRÍTICA DE IMPLEMENTACIÓN

**ANTES DE PASAR A LA SIGUIENTE TAREA:**

1. **OBLIGATORIO**: Ejecutar `tsc --noEmit` y resolver TODOS los errores de TypeScript
2. **OBLIGATORIO**: Ejecutar `npm run lint` y resolver TODOS los errores de ESLint
3. **OBLIGATORIO**: Verificar que no existan tipos `any` implícitos o explícitos
4. **OBLIGATORIO**: Asegurar que todos los imports y exports estén correctamente tipados
5. **OBLIGATORIO**: Validar que todos los componentes, hooks y servicios tengan tipos estrictos

**NO CONTINUAR** hasta que el proyecto compile sin errores de TypeScript. Iterar y corregir hasta lograr cero errores antes de avanzar a la siguiente tarea.

- [x] 1. Configuración inicial del proyecto y estructura base
  - Crear monorepo con Next.js 15, configurar TypeScript estricto, Prisma, y herramientas de desarrollo
  - Configurar ESLint, Prettier, Jest, y estructura de carpetas según buenas prácticas
  - Implementar configuración de base de datos SQLite con Prisma y esquemas iniciales
  - **CRÍTICO**: Verificar que no existan errores de TypeScript (`tsc --noEmit`) antes de continuar
  - **CRÍTICO**: Ejecutar `npm run type-check` y resolver todos los errores antes de pasar a la siguiente tarea
  - _Requisitos: 1, 2_

- [x] 2. Sistema de autenticación y autorización multi-tenant
  - Implementar NextAuth.js con soporte multi-empresa y roles de usuario
  - Crear middleware de autorización con permisos tipados por rol
  - Desarrollar sistema de gestión de empresas y tiendas con aislamiento de datos
  - Escribir tests unitarios para autenticación y autorización
  - **CRÍTICO**: Verificar que no existan errores de TypeScript (`tsc --noEmit`) antes de continuar
  - **CRÍTICO**: Resolver todos los tipos `any` implícitos y explícitos
  - **CRÍTICO**: Validar que todos los tipos de NextAuth estén correctamente tipados
  - _Requisitos: 1, 12_

- [x] 3. Internacionalización y temas
  - Configurar next-intl para español, català e inglés con tipos estrictos
  - Implementar sistema de temas con modo claro/oscuro usando Tailwind CSS
  - Crear componentes de layout base con soporte multi-idioma
  - Desarrollar tests para cambio de idiomas y temas
  - **CRÍTICO**: Verificar que no existan errores de TypeScript (`tsc --noEmit`) antes de continuar
  - **CRÍTICO**: Asegurar que todos los tipos de next-intl estén correctamente importados y tipados
  - **CRÍTICO**: Validar que los tipos de tema ('light' | 'dark') estén definidos estrictamente
  - _Requisitos: 2, 18_

- [x] 4. Modelos de datos y servicios base

- [x] 4.1 Implementar esquemas Prisma completos
  - Crear todos los modelos de base de datos (Company, Store, User, Client, Artist, etc.)
  - Configurar relaciones y constraints con tipos generados automáticamente
  - Implementar migraciones y seeders para datos de prueba
  - **CRÍTICO**: Ejecutar `npx prisma generate` y verificar que todos los tipos Prisma se generen correctamente
  - **CRÍTICO**: Verificar que no existan errores de TypeScript (`tsc --noEmit`) antes de continuar
  - _Requisitos: 1, 7, 8_

- [x] 4.2 Desarrollar servicios de acceso a datos
  - Crear servicios tipados para cada entidad con operaciones CRUD
  - Implementar patrón Repository con interfaces tipadas
  - Desarrollar validación con Zod para todos los esquemas de entrada
  - Escribir tests unitarios para servicios de datos
  - **CRÍTICO**: Asegurar que todos los servicios usen tipos Prisma generados, no `any`
  - **CRÍTICO**: Validar que todos los esquemas Zod estén correctamente tipados
  - **CRÍTICO**: Verificar que no existan errores de TypeScript (`tsc --noEmit`) antes de continuar
  - _Requisitos: 1, 7, 8_

- [-] 5. Gestión de clientes

- [x] 5.1 Crear componentes de gestión de clientes
  - Desarrollar formularios tipados para alta y edición de clientes
  - Implementar validación para menores de edad con información del tutor
  - Crear componente de perfil de cliente con historial completo
  - Implementar sistema de derechos de imagen y consentimientos
  - **CRÍTICO**: Asegurar que todas las props de componentes estén tipadas con interfaces específicas
  - **CRÍTICO**: Validar que todos los eventos de formulario tengan tipos React correctos
  - **CRÍTICO**: Verificar que no existan errores de TypeScript (`tsc --noEmit`) antes de continuar
  - _Requisitos: 7_

- [x] 5.2 Sistema de comunicaciones automáticas
  - Integrar WhatsApp Business API para envío de mensajes
  - Implementar sistema de templates de mensajes multiidioma
  - Crear servicio de felicitaciones de cumpleaños automáticas
  - Desarrollar sistema de seguimiento post-cuidado
  - Escribir tests de integración para comunicaciones
  - **CRÍTICO**: Asegurar que todos los servicios usen tipos Prisma generados, no `any`
  - **CRÍTICO**: Validar que todos los esquemas Zod estén correctamente tipados
  - **CRÍTICO**: Verificar que no existan errores de TypeScript (`tsc --noEmit`) antes de continuar
  - _Requisitos: 7_

- [x] 6. Gestión de artistas y personal

- [x] 6.1 Módulo de gestión de artistas
  - Crear formularios para registro de artistas con especialidades
  - Implementar gestión de horarios y disponibilidad
  - Desarrollar sistema de ausencias y permisos
  - Crear componente de perfil de artista con documentación
  - _Requisitos: 8_

- [x] 6.2 Sistema de liquidaciones y reportes de personal
  - Implementar cálculo automático de comisiones por artista
  - Crear reportes de rendimiento y productividad
  - Desarrollar sistema de comunicaciones internas
  - Implementar notificaciones automáticas para artistas
  - Escribir tests para cálculos de liquidación
  - _Requisitos: 8, 9_

- [ ] 7. Sistema de citas y calendario

- [x] 7.1 Componente de calendario visual




  - Crear vista de calendario drag-and-drop con tipos estrictos
  - Implementar filtros por artista, servicio y estado
  - Desarrollar creación rápida de citas con validación
  - Crear componente de gestión de cabinas y modalidades
  - **CRÍTICO**: Tipar correctamente todos los eventos de drag-and-drop (DragEvent, DropResult, etc.)
  - **CRÍTICO**: Asegurar que todos los callbacks tengan tipos de parámetros específicos
  - **CRÍTICO**: Verificar que no existan errores de TypeScript (`tsc --noEmit`) antes de continuar
  - _Requisitos: 3_

- [ ] 7.2 Integración con Google Calendar, Microsoft y Apple
  - Implementar sincronización bidireccional con Google Calendar API, Microsoft Calendar y Apple
  - Crear servicio de gestión de eventos con manejo de errores
  - Desarrollar detección y resolución de conflictos de horarios
  - Implementar actualización automática de cambios
  - Escribir tests de integración para Google Calendar, Microsoft y Apple
  - _Requisitos: 3, 5_

- [ ] 7.3 Sistema de recordatorios automáticos
  - Crear servicio de envío de recordatorios por email y WhatsApp
  - Implementar programación de recordatorios 24h y 2h antes
  - Desarrollar templates personalizables de recordatorios
  - Crear sistema de confirmación de citas
  - _Requisitos: 4_

- [ ] 8. Reservas online y perfil público
- [ ] 8.1 Portal de reservas público
  - Crear interfaz pública para reserva de citas
  - Implementar selección de servicios, artistas y horarios disponibles
  - Desarrollar sistema de disponibilidad en tiempo real
  - Crear formulario de datos del cliente con validación
  - _Requisitos: 4_

- [ ] 8.2 Panel de cliente
  - Desarrollar dashboard personal para clientes
  - Implementar gestión de citas y historial de servicios
  - Crear sistema de consultas y comunicación con el estudio
  - Desarrollar funcionalidad de subida de fotos e ideas
  - Implementar herramienta de previsualización de tatuajes
  - _Requisitos: 14_

- [ ] 9. Sistema de consentimientos informados
- [ ] 9.1 Generador de consentimientos digitales
  - Crear templates configurables de consentimientos por servicio
  - Implementar generación automática basada en tipo de cita
  - Desarrollar sistema de personalización por empresa/tienda
  - Crear validación de campos obligatorios
  - _Requisitos: 6_

- [ ] 9.2 Sistema de firma digital
  - Implementar firma digital presencial y remota
  - Crear envío automático por WhatsApp y email
  - Desarrollar almacenamiento seguro vinculado al cliente
  - Implementar generación de PDFs con firmas
  - Crear sistema de búsqueda y descarga de documentos
  - Escribir tests para flujo completo de consentimientos
  - _Requisitos: 6, 12_

- [ ] 10. Sistema de punto de venta (POS)
- [ ] 10.1 Interfaz de punto de venta
  - Crear componente de carrito de compras tipado
  - Implementar catálogo de productos y servicios
  - Desarrollar cálculo automático de impuestos y descuentos
  - Crear interfaz de selección de métodos de pago
  - **CRÍTICO**: Tipar estrictamente todos los tipos de pago ('cash' | 'bizum' | 'paypal' | 'stripe' | 'crypto')
  - **CRÍTICO**: Asegurar que todos los cálculos matemáticos tengan tipos number explícitos
  - **CRÍTICO**: Verificar que no existan errores de TypeScript (`tsc --noEmit`) antes de continuar
  - _Requisitos: 10_

- [ ] 10.2 Procesamiento de pagos múltiples
  - Integrar Stripe para pagos con tarjeta y online
  - Implementar soporte para Bizum y PayPal
  - Desarrollar procesamiento de pagos en efectivo
  - Crear integración con plataformas de criptomonedas (BitPay/Coinbase)
  - Implementar conversión automática de criptomonedas a EUR/USD
  - _Requisitos: 10_

- [ ] 10.3 Sistema de pagos fraccionados
  - Integrar Klarna, SeQura y PayPal Credit
  - Implementar configuración de planes de cuotas
  - Desarrollar gestión de pagos parciales y depósitos
  - Crear seguimiento de pagos pendientes
  - Escribir tests para todos los métodos de pago
  - _Requisitos: 10_

- [ ] 11. Gestión de inventario
- [ ] 11.1 Control de productos y stock
  - Crear módulo de gestión de productos con lotes
  - Implementar control de fechas de caducidad
  - Desarrollar sistema de alertas de stock mínimo
  - Crear reportes de inventario y movimientos
  - _Requisitos: 16_

- [ ] 11.2 Sistema de pedidos automáticos
  - Implementar configuración de proveedores
  - Crear generación automática de pedidos por umbral
  - Desarrollar seguimiento de pedidos y recepciones
  - Implementar actualización automática de inventario
  - Escribir tests para gestión de inventario
  - _Requisitos: 16_

- [ ] 12. Sistema de arqueos de caja
- [ ] 12.1 Gestión de caja diaria
  - Crear componente de apertura y cierre de caja
  - Implementar registro automático de movimientos por método de pago
  - Desarrollar cálculo de diferencias contables
  - Crear sistema de ajustes manuales con justificación
  - _Requisitos: 11_

- [ ] 12.2 Reportes de caja y permisos
  - Implementar informes detallados de ingresos por método
  - Crear sistema de permisos para acceso a arqueos
  - Desarrollar exportación de reportes de caja
  - Implementar auditoría de movimientos de caja
  - Escribir tests para arqueos y permisos
  - _Requisitos: 11_

- [ ] 13. Business Intelligence y reportes
- [ ] 13.1 Dashboard principal con métricas
  - Crear dashboard con KPIs principales del negocio
  - Implementar gráficos de ingresos, citas y rendimiento
  - Desarrollar métricas por artista, servicio y cliente
  - Crear filtros por período y comparativas
  - _Requisitos: 9_

- [ ] 13.2 Reportes avanzados y análisis
  - Implementar análisis de artista más rentable
  - Crear reportes de estilos más demandados
  - Desarrollar análisis de clientes recurrentes
  - Implementar exportación de reportes en múltiples formatos
  - Crear sistema de reportes programados
  - Escribir tests para cálculos de BI
  - _Requisitos: 9_

- [ ] 14. Cumplimiento normativo español
- [ ] 14.1 Documentación sanitaria
  - Implementar gestión de declaración responsable
  - Crear sistema de registro de inspecciones sanitarias
  - Desarrollar documentación de cumplimiento Decreto 71/2017
  - Implementar registro de formación del personal
  - _Requisitos: 12_

- [ ] 14.2 Registros de higiene y seguridad
  - Crear sistema de registro de procedimientos de higiene
  - Implementar documentación de protocolos de seguridad
  - Desarrollar generación automática de documentos legales
  - Crear sistema de archivado y búsqueda de documentación
  - Escribir tests para cumplimiento normativo
  - _Requisitos: 12_

- [ ] 15. Integraciones externas
- [ ] 15.1 Sistemas contables
  - Integrar con QuickBooks, Xero y Sage
  - Implementar sincronización automática de ventas
  - Desarrollar generación de facturas y recibos
  - Crear exportación de datos fiscales
  - _Requisitos: 17_

- [ ] 15.2 Plataformas de pago adicionales
  - Integrar con sistemas TPV tradicionales
  - Implementar conexión con Square y otros gateways
  - Desarrollar reconciliación automática de pagos
  - Crear reportes de transacciones por plataforma
  - Escribir tests de integración para sistemas externos
  - _Requisitos: 17_

- [ ] 16. Marketing y fidelización
- [ ] 16.1 Automatización de redes sociales
  - Integrar APIs de Instagram y Facebook
  - Implementar publicaciones programadas automáticas
  - Desarrollar templates de contenido para promociones
  - Crear sistema de gestión de campañas
  - _Requisitos: 15_

- [ ] 16.2 Sistema de fidelización y gamificación
  - Implementar sistema de puntos por visitas y recomendaciones
  - Crear ranking mensual de artistas y clientes
  - Desarrollar sistema de recompensas y descuentos
  - Implementar notificaciones de logros y promociones
  - Escribir tests para sistema de fidelización
  - _Requisitos: 15_

- [ ] 17. Optimización y rendimiento
- [ ] 17.1 Optimización de componentes
  - Implementar lazy loading en componentes pesados
  - Optimizar queries de base de datos con índices
  - Crear sistema de caché para datos frecuentes
  - Implementar compresión de imágenes automática
  - _Requisitos: 13_

- [ ] 17.2 PWA y acceso multiplataforma
  - Configurar Progressive Web App con service workers
  - Implementar funcionalidad offline básica
  - Desarrollar sincronización automática al recuperar conexión
  - Crear instalación en dispositivos móviles
  - Escribir tests E2E para diferentes dispositivos
  - _Requisitos: 13_

- [ ] 18. Testing integral y documentación
- [ ] 18.1 Suite completa de tests
  - Completar tests unitarios para todos los servicios
  - Implementar tests de integración para APIs
  - Desarrollar tests E2E para flujos críticos de usuario
  - Crear tests de rendimiento y carga
  - _Requisitos: Todos_

- [ ] 18.2 Documentación y deployment
  - Crear documentación técnica completa
  - Implementar guías de usuario por rol
  - Configurar pipeline de CI/CD
  - Preparar scripts de migración a PostgreSQL
  - Crear documentación de deployment y mantenimiento
  - _Requisitos: Todos_

##

🔧 Comandos de Verificación TypeScript

Ejecutar estos comandos después de cada tarea para asegurar calidad del código:

```bash
# Verificar errores de TypeScript sin generar archivos
npm run type-check
# o directamente:
npx tsc --noEmit

# Verificar y corregir errores de ESLint
npm run lint
npm run lint:fix

# Verificar formateo de código
npm run format:check
npm run format

# Ejecutar todos los tests
npm run test
npm run test:coverage

# Verificar build completo
npm run build

# Generar tipos de Prisma (después de cambios en schema)
npx prisma generate

# Verificar que no hay dependencias no utilizadas
npx depcheck
```

## 📋 Checklist por Tarea

Antes de marcar cualquier tarea como completada, verificar:

- [ ] ✅ `tsc --noEmit` ejecuta sin errores
- [ ] ✅ `npm run lint` ejecuta sin errores
- [ ] ✅ No existen tipos `any` en el código nuevo
- [ ] ✅ Todas las interfaces y tipos están definidos
- [ ] ✅ Todos los imports/exports están tipados
- [ ] ✅ Los tests pasan correctamente
- [ ] ✅ El build se genera sin errores
- [ ] ✅ La funcionalidad implementada funciona como se espera
