# InkGest

Sistema integral de gestión para centros de tatuaje, piercing y arte corporal.

## Características Principales

- 🏢 **Multi-empresa y Multi-tienda**: Gestión independiente de múltiples empresas y sucursales
- 📅 **Gestión de Citas**: Calendario visual con sincronización Google Calendar
- 👥 **Gestión de Clientes**: Perfiles completos con historial y documentación
- 🎨 **Gestión de Artistas**: Control de horarios, especialidades y rendimiento
- 💳 **Punto de Venta**: Múltiples métodos de pago incluyendo criptomonedas
- 📊 **Business Intelligence**: Reportes y análisis avanzados
- 🌍 **Multiidioma**: Soporte para español, català e inglés
- 📱 **PWA**: Acceso desde cualquier dispositivo sin instalación
- ⚖️ **Cumplimiento Normativo**: Conforme a la normativa española

## Stack Tecnológico

- **Frontend**: Next.js 15, React 18, TypeScript (strict)
- **Styling**: Tailwind CSS
- **Base de Datos**: SQLite (desarrollo) → PostgreSQL (producción)
- **ORM**: Prisma
- **Autenticación**: NextAuth.js
- **Internacionalización**: next-intl
- **Testing**: Jest, React Testing Library
- **Monorepo**: Turbo

## Estructura del Proyecto

```
inkgest/
├── apps/
│   └── web/                 # Aplicación principal Next.js
├── packages/
│   ├── database/           # Esquemas Prisma y migraciones
│   ├── ui/                 # Componentes UI compartidos
│   └── utils/              # Utilidades compartidas
└── docs/                   # Documentación
```

## Instalación y Configuración

### Prerrequisitos

- Node.js >= 18.17.0
- npm >= 10.2.0

### Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd inkgest
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp apps/web/.env.example apps/web/.env.local
```

4. Generar cliente de Prisma:
```bash
npm run db:generate
```

5. Ejecutar migraciones:
```bash
npm run db:migrate
```

6. Poblar base de datos con datos de prueba:
```bash
npm run db:seed
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Ejecutar tests
npm run test

# Verificar tipos TypeScript
npm run type-check

# Ejecutar linter
npm run lint

# Formatear código
npm run format
```

### Comandos de Base de Datos

```bash
# Generar cliente Prisma
npm run db:generate

# Aplicar cambios al esquema
npm run db:push

# Crear y aplicar migraciones
npm run db:migrate

# Abrir Prisma Studio
npm run db:studio

# Poblar base de datos
npm run db:seed
```

## Verificación de Calidad

Antes de cada commit, asegúrate de que:

- [ ] `npm run type-check` ejecuta sin errores
- [ ] `npm run lint` ejecuta sin errores
- [ ] `npm run test` pasa todos los tests
- [ ] `npm run build` se ejecuta correctamente

## Estructura de Desarrollo

### TypeScript Estricto

El proyecto utiliza TypeScript en modo estricto con las siguientes reglas:

- No uso de `any` implícito o explícito
- Verificación estricta de nulos
- Parámetros no utilizados detectados
- Tipos de retorno explícitos recomendados

### Validación con Zod

Todos los datos de entrada se validan usando Zod:

```typescript
import { z } from 'zod';

const CreateClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
});

type CreateClientData = z.infer<typeof CreateClientSchema>;
```

### Testing

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API endpoints con base de datos
- **E2E Tests**: Playwright (próximamente)

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es privado y propietario.

## Soporte

Para soporte técnico, contacta con el equipo de desarrollo.