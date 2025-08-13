import type { MessageTemplate, MessageType } from '../services/communicationService';

/**
 * Predefined message templates for automated communications
 * These templates support multiple languages and channels (WhatsApp, Email, SMS)
 */
export const messageTemplates: MessageTemplate[] = [
  {
    id: 'appointment_reminder_24h',
    type: 'appointment_reminder_24h',
    name: 'Recordatorio de cita 24h',
    description: 'Recordatorio enviado 24 horas antes de la cita',
    channels: ['whatsapp', 'email'],
    templates: {
      es: {
        whatsapp: {
          templateName: 'appointment_reminder_24h_es',
          fallbackText: 'Hola {{clientName}}! Te recordamos que tienes una cita mañana para {{serviceName}} a las {{appointmentTime}}. ¡Te esperamos!'
        },
        email: {
          subject: 'Recordatorio: Tu cita de {{serviceName}} es mañana',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">¡Hola {{clientName}}!</h2>
              <p>Te recordamos que tienes una cita programada para mañana:</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #555;">Detalles de tu cita</h3>
                <p><strong>Servicio:</strong> {{serviceName}}</p>
                <p><strong>Fecha:</strong> {{appointmentDate}}</p>
                <p><strong>Hora:</strong> {{appointmentTime}}</p>
                <p><strong>Precio:</strong> €{{price}}</p>
              </div>
              <p>Si necesitas cancelar o reprogramar, por favor contáctanos con al menos 24 horas de antelación.</p>
              <p>¡Te esperamos!</p>
            </div>
          `,
          text: 'Hola {{clientName}}! Te recordamos que tienes una cita mañana para {{serviceName}} el {{appointmentDate}} a las {{appointmentTime}}. Precio: €{{price}}. ¡Te esperamos!'
        }
      },
      ca: {
        whatsapp: {
          templateName: 'appointment_reminder_24h_ca',
          fallbackText: 'Hola {{clientName}}! Et recordem que tens una cita demà per {{serviceName}} a les {{appointmentTime}}. T\'esperem!'
        },
        email: {
          subject: 'Recordatori: La teva cita de {{serviceName}} és demà',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Hola {{clientName}}!</h2>
              <p>Et recordem que tens una cita programada per demà:</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #555;">Detalls de la teva cita</h3>
                <p><strong>Servei:</strong> {{serviceName}}</p>
                <p><strong>Data:</strong> {{appointmentDate}}</p>
                <p><strong>Hora:</strong> {{appointmentTime}}</p>
                <p><strong>Preu:</strong> €{{price}}</p>
              </div>
              <p>Si necessites cancel·lar o reprogramar, si us plau contacta\'ns amb almenys 24 hores d\'antelació.</p>
              <p>T\'esperem!</p>
            </div>
          `,
          text: 'Hola {{clientName}}! Et recordem que tens una cita demà per {{serviceName}} el {{appointmentDate}} a les {{appointmentTime}}. Preu: €{{price}}. T\'esperem!'
        }
      },
      en: {
        whatsapp: {
          templateName: 'appointment_reminder_24h_en',
          fallbackText: 'Hi {{clientName}}! Reminder that you have an appointment tomorrow for {{serviceName}} at {{appointmentTime}}. See you there!'
        },
        email: {
          subject: 'Reminder: Your {{serviceName}} appointment is tomorrow',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Hi {{clientName}}!</h2>
              <p>This is a reminder that you have an appointment scheduled for tomorrow:</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #555;">Appointment Details</h3>
                <p><strong>Service:</strong> {{serviceName}}</p>
                <p><strong>Date:</strong> {{appointmentDate}}</p>
                <p><strong>Time:</strong> {{appointmentTime}}</p>
                <p><strong>Price:</strong> €{{price}}</p>
              </div>
              <p>If you need to cancel or reschedule, please contact us at least 24 hours in advance.</p>
              <p>See you tomorrow!</p>
            </div>
          `,
          text: 'Hi {{clientName}}! Reminder that you have an appointment tomorrow for {{serviceName}} on {{appointmentDate}} at {{appointmentTime}}. Price: €{{price}}. See you there!'
        }
      }
    },
    variables: ['clientName', 'serviceName', 'appointmentDate', 'appointmentTime', 'price'],
    isActive: true
  },
  {
    id: 'appointment_reminder_2h',
    type: 'appointment_reminder_2h',
    name: 'Recordatorio de cita 2h',
    description: 'Recordatorio enviado 2 horas antes de la cita',
    channels: ['whatsapp'],
    templates: {
      es: {
        whatsapp: {
          templateName: 'appointment_reminder_2h_es',
          fallbackText: '¡Hola {{clientName}}! Tu cita para {{serviceName}} es en 2 horas ({{appointmentTime}}). ¡Nos vemos pronto!'
        }
      },
      ca: {
        whatsapp: {
          templateName: 'appointment_reminder_2h_ca',
          fallbackText: 'Hola {{clientName}}! La teva cita per {{serviceName}} és en 2 hores ({{appointmentTime}}). Ens veiem aviat!'
        }
      },
      en: {
        whatsapp: {
          templateName: 'appointment_reminder_2h_en',
          fallbackText: 'Hi {{clientName}}! Your {{serviceName}} appointment is in 2 hours ({{appointmentTime}}). See you soon!'
        }
      }
    },
    variables: ['clientName', 'serviceName', 'appointmentTime'],
    isActive: true
  },
  {
    id: 'birthday_greeting',
    type: 'birthday_greeting',
    name: 'Felicitación de cumpleaños',
    description: 'Mensaje de felicitación automático en el cumpleaños del cliente',
    channels: ['whatsapp', 'email'],
    templates: {
      es: {
        whatsapp: {
          templateName: 'birthday_greeting_es',
          fallbackText: '¡Feliz cumpleaños {{clientName}}! 🎉 Esperamos que tengas un día maravilloso. Como regalo, tienes un 10% de descuento en tu próxima cita. ¡Felicidades!'
        },
        email: {
          subject: '¡Feliz cumpleaños {{clientName}}! 🎂',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
              <h1 style="color: #ff6b6b;">🎉 ¡Feliz Cumpleaños! 🎉</h1>
              <h2 style="color: #333;">{{clientName}}</h2>
              <p style="font-size: 18px;">Esperamos que tengas un día lleno de alegría y momentos especiales.</p>
              <div style="background: linear-gradient(135deg, #ff6b6b, #ffa500); color: white; padding: 30px; border-radius: 15px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0;">🎁 Regalo de Cumpleaños</h3>
                <p style="font-size: 20px; margin: 0;"><strong>10% de descuento</strong> en tu próxima cita</p>
              </div>
              <p>Tienes {{loyaltyPoints}} puntos de fidelidad acumulados. ¡Sigue coleccionando para obtener más beneficios!</p>
              <p>¡Que tengas un cumpleaños increíble!</p>
            </div>
          `,
          text: '¡Feliz cumpleaños {{clientName}}! Esperamos que tengas un día maravilloso. Como regalo, tienes un 10% de descuento en tu próxima cita. Tienes {{loyaltyPoints}} puntos de fidelidad. ¡Felicidades!'
        }
      },
      ca: {
        whatsapp: {
          templateName: 'birthday_greeting_ca',
          fallbackText: 'Feliç aniversari {{clientName}}! 🎉 Esperem que tinguis un dia meravellós. Com a regal, tens un 10% de descompte en la teva propera cita. Felicitats!'
        },
        email: {
          subject: 'Feliç aniversari {{clientName}}! 🎂',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
              <h1 style="color: #ff6b6b;">🎉 Feliç Aniversari! 🎉</h1>
              <h2 style="color: #333;">{{clientName}}</h2>
              <p style="font-size: 18px;">Esperem que tinguis un dia ple d\'alegria i moments especials.</p>
              <div style="background: linear-gradient(135deg, #ff6b6b, #ffa500); color: white; padding: 30px; border-radius: 15px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0;">🎁 Regal d\'Aniversari</h3>
                <p style="font-size: 20px; margin: 0;"><strong>10% de descompte</strong> en la teva propera cita</p>
              </div>
              <p>Tens {{loyaltyPoints}} punts de fidelitat acumulats. Continua col·leccionant per obtenir més beneficis!</p>
              <p>Que tinguis un aniversari increïble!</p>
            </div>
          `,
          text: 'Feliç aniversari {{clientName}}! Esperem que tinguis un dia meravellós. Com a regal, tens un 10% de descompte en la teva propera cita. Tens {{loyaltyPoints}} punts de fidelitat. Felicitats!'
        }
      },
      en: {
        whatsapp: {
          templateName: 'birthday_greeting_en',
          fallbackText: 'Happy Birthday {{clientName}}! 🎉 We hope you have a wonderful day. As a gift, you have a 10% discount on your next appointment. Congratulations!'
        },
        email: {
          subject: 'Happy Birthday {{clientName}}! 🎂',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
              <h1 style="color: #ff6b6b;">🎉 Happy Birthday! 🎉</h1>
              <h2 style="color: #333;">{{clientName}}</h2>
              <p style="font-size: 18px;">We hope you have a day filled with joy and special moments.</p>
              <div style="background: linear-gradient(135deg, #ff6b6b, #ffa500); color: white; padding: 30px; border-radius: 15px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0;">🎁 Birthday Gift</h3>
                <p style="font-size: 20px; margin: 0;"><strong>10% discount</strong> on your next appointment</p>
              </div>
              <p>You have {{loyaltyPoints}} loyalty points accumulated. Keep collecting for more benefits!</p>
              <p>Have an amazing birthday!</p>
            </div>
          `,
          text: 'Happy Birthday {{clientName}}! We hope you have a wonderful day. As a gift, you have a 10% discount on your next appointment. You have {{loyaltyPoints}} loyalty points. Congratulations!'
        }
      }
    },
    variables: ['clientName', 'loyaltyPoints'],
    isActive: true
  },
  {
    id: 'post_care_followup',
    type: 'post_care_followup',
    name: 'Seguimiento post-cuidado',
    description: 'Mensaje de seguimiento enviado después del servicio',
    channels: ['whatsapp', 'email'],
    templates: {
      es: {
        whatsapp: {
          templateName: 'post_care_followup_es',
          fallbackText: 'Hola {{clientName}}! ¿Cómo va la cicatrización de tu {{serviceName}}? Recuerda seguir las instrucciones de cuidado. Si tienes dudas, ¡contáctanos!'
        },
        email: {
          subject: 'Cuidados post-{{serviceName}} - ¿Cómo vas?',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">¡Hola {{clientName}}!</h2>
              <p>Esperamos que estés muy contento/a con tu {{serviceName}}.</p>
              <p>¿Cómo va el proceso de cicatrización? Es importante seguir las instrucciones de cuidado para obtener los mejores resultados.</p>
              
              <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1976d2;">📋 Recordatorio de Cuidados</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Mantén la zona limpia y seca</li>
                  <li>Aplica la crema recomendada 2-3 veces al día</li>
                  <li>Evita la exposición solar directa</li>
                  <li>No rasques ni frotes la zona</li>
                  <li>Usa ropa suelta que no roce</li>
                </ul>
              </div>
              
              <p>Si tienes alguna duda o notas algo inusual, no dudes en contactarnos. Estamos aquí para ayudarte.</p>
              <p>¡Gracias por confiar en nosotros!</p>
            </div>
          `,
          text: 'Hola {{clientName}}! ¿Cómo va la cicatrización de tu {{serviceName}}? Recuerda: mantén limpio, aplica crema 2-3 veces/día, evita sol directo, no rasques. Si tienes dudas, contáctanos.'
        }
      },
      ca: {
        whatsapp: {
          templateName: 'post_care_followup_ca',
          fallbackText: 'Hola {{clientName}}! Com va la cicatrització del teu {{serviceName}}? Recorda seguir les instruccions de cura. Si tens dubtes, contacta\'ns!'
        },
        email: {
          subject: 'Cures post-{{serviceName}} - Com vas?',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Hola {{clientName}}!</h2>
              <p>Esperem que estiguis molt content/a amb el teu {{serviceName}}.</p>
              <p>Com va el procés de cicatrització? És important seguir les instruccions de cura per obtenir els millors resultats.</p>
              
              <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1976d2;">📋 Recordatori de Cures</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Mantén la zona neta i seca</li>
                  <li>Aplica la crema recomanada 2-3 vegades al dia</li>
                  <li>Evita l\'exposició solar directa</li>
                  <li>No gratxis ni freguis la zona</li>
                  <li>Usa roba solta que no fregui</li>
                </ul>
              </div>
              
              <p>Si tens algun dubte o notes alguna cosa inusual, no dubtis a contactar-nos. Som aquí per ajudar-te.</p>
              <p>Gràcies per confiar en nosaltres!</p>
            </div>
          `,
          text: 'Hola {{clientName}}! Com va la cicatrització del teu {{serviceName}}? Recorda: mantén net, aplica crema 2-3 vegades/dia, evita sol directe, no gratxis. Si tens dubtes, contacta\'ns.'
        }
      },
      en: {
        whatsapp: {
          templateName: 'post_care_followup_en',
          fallbackText: 'Hi {{clientName}}! How is your {{serviceName}} healing? Remember to follow the aftercare instructions. If you have questions, contact us!'
        },
        email: {
          subject: 'Post-{{serviceName}} care - How are you doing?',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Hi {{clientName}}!</h2>
              <p>We hope you're very happy with your {{serviceName}}.</p>
              <p>How is the healing process going? It's important to follow the aftercare instructions to get the best results.</p>
              
              <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1976d2;">📋 Aftercare Reminder</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Keep the area clean and dry</li>
                  <li>Apply recommended cream 2-3 times daily</li>
                  <li>Avoid direct sun exposure</li>
                  <li>Don't scratch or rub the area</li>
                  <li>Wear loose clothing that doesn't rub</li>
                </ul>
              </div>
              
              <p>If you have any questions or notice anything unusual, don't hesitate to contact us. We're here to help.</p>
              <p>Thank you for trusting us!</p>
            </div>
          `,
          text: 'Hi {{clientName}}! How is your {{serviceName}} healing? Remember: keep clean, apply cream 2-3 times/day, avoid direct sun, don\'t scratch. If you have questions, contact us.'
        }
      }
    },
    variables: ['clientName', 'serviceName'],
    isActive: true
  },
  {
    id: 'appointment_confirmation',
    type: 'appointment_confirmation',
    name: 'Confirmación de cita',
    description: 'Confirmación enviada al crear o modificar una cita',
    channels: ['whatsapp', 'email'],
    templates: {
      es: {
        whatsapp: {
          templateName: 'appointment_confirmation_es',
          fallbackText: '¡Cita confirmada! {{clientName}}, tu {{serviceName}} está programado para el {{appointmentDate}} a las {{appointmentTime}}. Precio: €{{price}}.'
        },
        email: {
          subject: 'Cita confirmada - {{serviceName}}',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4caf50;">✅ ¡Cita Confirmada!</h2>
              <p>Hola {{clientName}},</p>
              <p>Tu cita ha sido confirmada exitosamente.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                <h3 style="margin: 0 0 15px 0; color: #333;">Detalles de tu cita</h3>
                <p><strong>Servicio:</strong> {{serviceName}}</p>
                <p><strong>Fecha:</strong> {{appointmentDate}}</p>
                <p><strong>Hora:</strong> {{appointmentTime}}</p>
                <p><strong>Precio:</strong> €{{price}}</p>
                <p><strong>Depósito:</strong> €{{deposit}}</p>
              </div>
              
              <p><strong>Importante:</strong> Si necesitas cancelar o reprogramar, por favor avísanos con al menos 24 horas de antelación.</p>
              <p>¡Esperamos verte pronto!</p>
            </div>
          `,
          text: '¡Cita confirmada! {{clientName}}, tu {{serviceName}} está programado para el {{appointmentDate}} a las {{appointmentTime}}. Precio: €{{price}}, Depósito: €{{deposit}}.'
        }
      },
      ca: {
        whatsapp: {
          templateName: 'appointment_confirmation_ca',
          fallbackText: 'Cita confirmada! {{clientName}}, el teu {{serviceName}} està programat per al {{appointmentDate}} a les {{appointmentTime}}. Preu: €{{price}}.'
        },
        email: {
          subject: 'Cita confirmada - {{serviceName}}',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4caf50;">✅ Cita Confirmada!</h2>
              <p>Hola {{clientName}},</p>
              <p>La teva cita ha estat confirmada amb èxit.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                <h3 style="margin: 0 0 15px 0; color: #333;">Detalls de la teva cita</h3>
                <p><strong>Servei:</strong> {{serviceName}}</p>
                <p><strong>Data:</strong> {{appointmentDate}}</p>
                <p><strong>Hora:</strong> {{appointmentTime}}</p>
                <p><strong>Preu:</strong> €{{price}}</p>
                <p><strong>Dipòsit:</strong> €{{deposit}}</p>
              </div>
              
              <p><strong>Important:</strong> Si necessites cancel·lar o reprogramar, si us plau avisa\'ns amb almenys 24 hores d\'antelació.</p>
              <p>Esperem veure\'t aviat!</p>
            </div>
          `,
          text: 'Cita confirmada! {{clientName}}, el teu {{serviceName}} està programat per al {{appointmentDate}} a les {{appointmentTime}}. Preu: €{{price}}, Dipòsit: €{{deposit}}.'
        }
      },
      en: {
        whatsapp: {
          templateName: 'appointment_confirmation_en',
          fallbackText: 'Appointment confirmed! {{clientName}}, your {{serviceName}} is scheduled for {{appointmentDate}} at {{appointmentTime}}. Price: €{{price}}.'
        },
        email: {
          subject: 'Appointment confirmed - {{serviceName}}',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4caf50;">✅ Appointment Confirmed!</h2>
              <p>Hi {{clientName}},</p>
              <p>Your appointment has been successfully confirmed.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                <h3 style="margin: 0 0 15px 0; color: #333;">Appointment Details</h3>
                <p><strong>Service:</strong> {{serviceName}}</p>
                <p><strong>Date:</strong> {{appointmentDate}}</p>
                <p><strong>Time:</strong> {{appointmentTime}}</p>
                <p><strong>Price:</strong> €{{price}}</p>
                <p><strong>Deposit:</strong> €{{deposit}}</p>
              </div>
              
              <p><strong>Important:</strong> If you need to cancel or reschedule, please let us know at least 24 hours in advance.</p>
              <p>Looking forward to seeing you!</p>
            </div>
          `,
          text: 'Appointment confirmed! {{clientName}}, your {{serviceName}} is scheduled for {{appointmentDate}} at {{appointmentTime}}. Price: €{{price}}, Deposit: €{{deposit}}.'
        }
      }
    },
    variables: ['clientName', 'serviceName', 'appointmentDate', 'appointmentTime', 'price', 'deposit'],
    isActive: true
  }
];

/**
 * Get template by type
 */
export function getMessageTemplate(type: MessageType): MessageTemplate | undefined {
  return messageTemplates.find(template => template.type === type);
}

/**
 * Get all active templates
 */
export function getActiveTemplates(): MessageTemplate[] {
  return messageTemplates.filter(template => template.isActive);
}

/**
 * Get templates by channel
 */
export function getTemplatesByChannel(channel: 'whatsapp' | 'email' | 'sms'): MessageTemplate[] {
  return messageTemplates.filter(template => 
    template.isActive && template.channels.includes(channel)
  );
}

export default messageTemplates;