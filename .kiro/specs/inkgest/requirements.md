# Documento de Requisitos - InkGest

## Introducción

InkGest es una aplicación web integral de gestión para centros de tatuaje, piercing y otras prácticas de arte corporal. La aplicación está diseñada para ser multi-empresa y multi-tienda, permitiendo la gestión independiente de múltiples empresas y sus sucursales con configuraciones propias. Incluye funcionalidades completas de gestión de citas, clientes, personal, inventario, pagos y cumplimiento normativo español.

## Requisitos

### Requisito 1

**Historia de Usuario:** Como propietario de múltiples centros de tatuaje, quiero gestionar independientemente cada empresa y sucursal, para que cada ubicación tenga sus propias configuraciones, horarios, servicios y precios.

#### Criterios de Aceptación

1. CUANDO un usuario administrador accede al sistema ENTONCES el sistema DEBERÁ mostrar una lista de todas las empresas y tiendas disponibles
2. CUANDO se selecciona una empresa específica ENTONCES el sistema DEBERÁ cargar las configuraciones específicas de esa empresa (horarios, servicios, precios, permisos)
3. CUANDO se realizan cambios en una tienda ENTONCES el sistema DEBERÁ mantener la independencia de configuraciones entre diferentes tiendas
4. CUANDO un usuario tiene permisos limitados ENTONCES el sistema DEBERÁ restringir el acceso solo a las tiendas autorizadas

### Requisito 2

**Historia de Usuario:** Como usuario del sistema, quiero poder utilizar la aplicación en español, català o inglés, para que pueda trabajar en mi idioma preferido.

#### Criterios de Aceptación

1. CUANDO un usuario accede al sistema ENTONCES el sistema DEBERÁ permitir seleccionar entre español, català e inglés
2. CUANDO se cambia el idioma ENTONCES el sistema DEBERÁ actualizar toda la interfaz y contenidos al idioma seleccionado
3. CUANDO se configura un idioma por defecto para una tienda ENTONCES el sistema DEBERÁ aplicar ese idioma a todos los nuevos usuarios de esa tienda
4. CUANDO se generan documentos ENTONCES el sistema DEBERÁ crearlos en el idioma configurado del usuario o tienda

### Requisito 3

**Historia de Usuario:** Como recepcionista, quiero crear y gestionar citas de forma visual y rápida, para que pueda organizar eficientemente la agenda de los artistas.

#### Criterios de Aceptación

1. CUANDO accedo al calendario ENTONCES el sistema DEBERÁ mostrar una vista visual con disponibilidad de artistas y cabinas
2. CUANDO creo una nueva cita ENTONCES el sistema DEBERÁ permitir seleccionar cliente, artista, servicio, duración y cabina
3. CUANDO se programa una cita ENTONCES el sistema DEBERÁ verificar disponibilidad y evitar conflictos de horarios
4. CUANDO se modifica una cita ENTONCES el sistema DEBERÁ actualizar automáticamente las integraciones con Google Calendar
5. CUANDO se cancela una cita ENTONCES el sistema DEBERÁ liberar el horario y notificar a las partes involucradas

### Requisito 4

**Historia de Usuario:** Como cliente, quiero poder reservar citas online a través de un perfil público, para que pueda agendar servicios sin necesidad de llamar al estudio.

#### Criterios de Aceptación

1. CUANDO un cliente accede al perfil público ENTONCES el sistema DEBERÁ mostrar servicios disponibles, artistas y horarios
2. CUANDO se selecciona un servicio ENTONCES el sistema DEBERÁ mostrar solo los artistas capacitados para ese servicio
3. CUANDO se confirma una reserva ENTONCES el sistema DEBERÁ enviar confirmación por email y WhatsApp
4. CUANDO se acerca la fecha de la cita ENTONCES el sistema DEBERÁ enviar recordatorios automáticos 24 y 2 horas antes

### Requisito 5

**Historia de Usuario:** Como artista, quiero que mis citas se sincronicen automáticamente con mi Google Calendar, para que pueda gestionar mi agenda personal y profesional en un solo lugar.

#### Criterios de Aceptación

1. CUANDO se asigna una cita a un artista ENTONCES el sistema DEBERÁ crear automáticamente el evento en su Google Calendar
2. CUANDO se modifica una cita ENTONCES el sistema DEBERÁ actualizar el evento correspondiente en Google Calendar
3. CUANDO se cancela una cita ENTONCES el sistema DEBERÁ eliminar el evento de Google Calendar
4. CUANDO hay conflictos de horario ENTONCES el sistema DEBERÁ alertar antes de confirmar la cita

### Requisito 6

**Historia de Usuario:** Como administrador del estudio, quiero generar consentimientos informados digitales personalizables, para que cumplamos con la normativa legal y tengamos documentación segura.

#### Criterios de Aceptación

1. CUANDO se programa una cita ENTONCES el sistema DEBERÁ generar automáticamente el consentimiento informado correspondiente
2. CUANDO se envía un consentimiento ENTONCES el sistema DEBERÁ permitir firma digital presencial o remota
3. CUANDO un cliente firma remotamente ENTONCES el sistema DEBERÁ enviar el documento por WhatsApp o email
4. CUANDO se completa la firma ENTONCES el sistema DEBERÁ almacenar el documento vinculado al perfil del cliente
5. CUANDO se requiere acceso al consentimiento ENTONCES el sistema DEBERÁ permitir búsqueda y descarga segura

### Requisito 7

**Historia de Usuario:** Como recepcionista, quiero gestionar perfiles completos de clientes incluyendo menores de edad, para que tenga toda la información necesaria y cumpla con los requisitos legales.

#### Criterios de Aceptación

1. CUANDO registro un nuevo cliente ENTONCES el sistema DEBERÁ capturar datos personales, contacto, historial médico relevante y origen
2. CUANDO el cliente es menor de edad ENTONCES el sistema DEBERÁ requerir datos del tutor legal y consentimiento parental
3. CUANDO se registra información de imagen ENTONCES el sistema DEBERÁ gestionar permisos de derechos de imagen
4. CUANDO se actualiza el perfil ENTONCES el sistema DEBERÁ mantener un historial completo de cambios y servicios
5. CUANDO es el cumpleaños del cliente ENTONCES el sistema DEBERÁ enviar felicitaciones personalizadas automáticamente

### Requisito 8

**Historia de Usuario:** Como propietario, quiero gestionar mi equipo de artistas con control de horarios, ausencias y rendimiento, para que pueda optimizar las operaciones del estudio.

#### Criterios de Aceptación

1. CUANDO registro un nuevo artista ENTONCES el sistema DEBERÁ capturar especialidades, horarios, documentación y permisos
2. CUANDO un artista registra ausencias ENTONCES el sistema DEBERÁ actualizar automáticamente la disponibilidad en el calendario
3. CUANDO se completa un servicio ENTONCES el sistema DEBERÁ registrar la información para cálculos de liquidación
4. CUANDO se generan reportes ENTONCES el sistema DEBERÁ mostrar estadísticas de rendimiento por artista
5. CUANDO hay comunicaciones internas ENTONCES el sistema DEBERÁ notificar automáticamente a los artistas relevantes

### Requisito 9

**Historia de Usuario:** Como propietario, quiero acceder a paneles de Business Intelligence, para que pueda tomar decisiones informadas sobre el negocio.

#### Criterios de Aceptación

1. CUANDO accedo al dashboard ENTONCES el sistema DEBERÁ mostrar métricas clave como ingresos, citas, y rendimiento
2. CUANDO consulto estadísticas de artistas ENTONCES el sistema DEBERÁ mostrar el artista más rentable y productivo
3. CUANDO analizo servicios ENTONCES el sistema DEBERÁ identificar los estilos más demandados y rentables
4. CUANDO reviso clientes ENTONCES el sistema DEBERÁ mostrar clientes recurrentes y patrones de comportamiento
5. CUANDO genero reportes ENTONCES el sistema DEBERÁ permitir exportación en diferentes formatos y períodos

### Requisito 10

**Historia de Usuario:** Como cajero, quiero procesar ventas de productos y servicios con múltiples métodos de pago, para que pueda atender eficientemente a los clientes.

#### Criterios de Aceptación

1. CUANDO proceso una venta ENTONCES el sistema DEBERÁ permitir pago en efectivo, Bizum, PayPal, Stripe y criptomonedas
2. CUANDO se selecciona un método de pago ENTONCES el sistema DEBERÁ procesar la transacción de forma segura
3. CUANDO se completa la venta ENTONCES el sistema DEBERÁ generar ticket y actualizar inventario automáticamente
4. CUANDO se ofrecen pagos fraccionados ENTONCES el sistema DEBERÁ integrar con Klarna, SeQura, PayPal Credit y Stripe
5. CUANDO se paga con criptomonedas ENTONCES el sistema DEBERÁ convertir automáticamente a EUR/USD y registrar la transacción

### Requisito 11

**Historia de Usuario:** Como encargado de caja, quiero realizar arqueos diarios con control de movimientos, para que pueda mantener un control preciso de los ingresos.

#### Criterios de Aceptación

1. CUANDO inicio el día ENTONCES el sistema DEBERÁ permitir apertura de caja con saldo inicial
2. CUANDO proceso transacciones ENTONCES el sistema DEBERÁ registrar automáticamente todos los movimientos por método de pago
3. CUANDO cierro la caja ENTONCES el sistema DEBERÁ generar informe con ingresos, salidas y diferencias contables
4. CUANDO hay discrepancias ENTONCES el sistema DEBERÁ permitir registro de ajustes con justificación
5. CUANDO accedo a arqueos ENTONCES el sistema DEBERÁ verificar permisos de usuario (solo administradores/encargados)

### Requisito 12

**Historia de Usuario:** Como administrador, quiero que el sistema cumpla con la normativa española de centros de tatuaje, para que pueda pasar inspecciones sanitarias sin problemas.

#### Criterios de Aceptación

1. CUANDO se registra el estudio ENTONCES el sistema DEBERÁ gestionar la declaración responsable según normativa
2. CUANDO se programa una inspección ENTONCES el sistema DEBERÁ generar todos los registros requeridos por el Decreto 71/2017
3. CUANDO se realizan servicios ENTONCES el sistema DEBERÁ documentar cumplimiento de requisitos de higiene y seguridad
4. CUANDO se requiere documentación ENTONCES el sistema DEBERÁ mostrar registros de formación del personal
5. CUANDO hay una inspección ENTONCES el sistema DEBERÁ facilitar el acceso a toda la documentación requerida

### Requisito 13

**Historia de Usuario:** Como usuario, quiero acceder al sistema desde cualquier dispositivo sin instalación, para que pueda trabajar desde móvil, tablet o computadora.

#### Criterios de Aceptación

1. CUANDO accedo desde cualquier dispositivo ENTONCES el sistema DEBERÁ funcionar correctamente sin instalación
2. CUANDO uso diferentes tamaños de pantalla ENTONCES el sistema DEBERÁ adaptar la interfaz responsivamente
3. CUANDO hay actualizaciones ENTONCES el sistema DEBERÁ aplicarlas automáticamente sin intervención
4. CUANDO necesito soporte ENTONCES el sistema DEBERÁ proporcionar canales de ayuda por email y WhatsApp
5. CUANDO trabajo offline temporalmente ENTONCES el sistema DEBERÁ sincronizar cambios al recuperar conexión

### Requisito 14

**Historia de Usuario:** Como cliente, quiero acceder a un panel personal para gestionar mis reservas y consultas, para que pueda tener control sobre mis citas y servicios.

#### Criterios de Aceptación

1. CUANDO accedo a mi panel ENTONCES el sistema DEBERÁ mostrar mi historial de citas y servicios
2. CUANDO quiero hacer una reserva ENTONCES el sistema DEBERÁ permitir selección de servicios y horarios disponibles
3. CUANDO tengo consultas ENTONCES el sistema DEBERÁ proporcionar un canal de comunicación con el estudio
4. CUANDO subo contenido ENTONCES el sistema DEBERÁ permitir cargar fotos de tatuajes anteriores e ideas
5. CUANDO uso la previsualización ENTONCES el sistema DEBERÁ mostrar cómo quedaría un diseño en mi cuerpo

### Requisito 15

**Historia de Usuario:** Como propietario, quiero automatizar publicaciones en redes sociales y gestionar un sistema de fidelización, para que pueda mejorar el marketing y retención de clientes.

#### Criterios de Aceptación

1. CUANDO programo contenido ENTONCES el sistema DEBERÁ publicar automáticamente en Instagram y Facebook
2. CUANDO hay promociones ENTONCES el sistema DEBERÁ generar publicaciones automáticas con los detalles
3. CUANDO un cliente acumula visitas ENTONCES el sistema DEBERÁ otorgar puntos de fidelización automáticamente
4. CUANDO se alcanzan umbrales de puntos ENTONCES el sistema DEBERÁ ofrecer recompensas y descuentos
5. CUANDO hay recomendaciones ENTONCES el sistema DEBERÁ bonificar tanto al cliente referidor como al nuevo cliente

### Requisito 16

**Historia de Usuario:** Como encargado de inventario, quiero control avanzado de productos con alertas automáticas, para que nunca me quede sin suministros esenciales.

#### Criterios de Aceptación

1. CUANDO registro productos ENTONCES el sistema DEBERÁ controlar lotes, fechas de caducidad y stock mínimo
2. CUANDO el stock baja del umbral ENTONCES el sistema DEBERÁ enviar alertas automáticas
3. CUANDO se acerca la caducidad ENTONCES el sistema DEBERÁ notificar con tiempo suficiente
4. CUANDO se configura un proveedor ENTONCES el sistema DEBERÁ permitir pedidos automáticos
5. CUANDO se recibe mercancía ENTONCES el sistema DEBERÁ actualizar automáticamente el inventario

### Requisito 17

**Historia de Usuario:** Como propietario, quiero integrar el sistema con plataformas contables y de pago externas, para que pueda automatizar la gestión fiscal y financiera.

#### Criterios de Aceptación

1. CUANDO se procesan ventas ENTONCES el sistema DEBERÁ sincronizar automáticamente con QuickBooks, Xero o Sage
2. CUANDO se generan facturas ENTONCES el sistema DEBERÁ crear documentos fiscales en formato PDF
3. CUANDO hay transacciones ENTONCES el sistema DEBERÁ registrar todos los movimientos para auditoría
4. CUANDO se conecta con TPV ENTONCES el sistema DEBERÁ procesar pagos de forma segura
5. CUANDO se requieren reportes fiscales ENTONCES el sistema DEBERÁ generar la documentación necesaria

### Requisito 18

**Historia de Usuario:** Como usuario del sistema, quiero poder alternar entre modo claro y modo oscuro, para que pueda trabajar cómodamente en diferentes condiciones de iluminación.

#### Criterios de Aceptación

1. CUANDO accedo a la configuración de usuario ENTONCES el sistema DEBERÁ mostrar la opción de seleccionar modo claro u oscuro
2. CUANDO selecciono modo oscuro ENTONCES el sistema DEBERÁ aplicar inmediatamente el tema oscuro a toda la interfaz
3. CUANDO selecciono modo claro ENTONCES el sistema DEBERÁ aplicar inmediatamente el tema claro a toda la interfaz
4. CUANDO cambio de dispositivo ENTONCES el sistema DEBERÁ recordar mi preferencia de tema
5. CUANDO no he configurado preferencia ENTONCES el sistema DEBERÁ usar el tema predeterminado del sistema operativo del usuario