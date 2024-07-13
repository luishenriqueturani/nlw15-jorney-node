import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { prisma } from "../lib/prisma";
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/pt-br'
import dayjs from "dayjs";
import { getMailClient } from "../lib/mail";
import nodemailer from "nodemailer"

dayjs.locale('pt-br')
dayjs.extend(localizedFormat)

export async function createTrip(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>().post('/trips', {
    schema: {
      body: z.object({
        destination: z.string().min(4),
        startsAt: z.coerce.date(),
        endsAt: z.coerce.date(),
        ownerName: z.string(),
        ownerEmail: z.string().email(),
        emailsToInvite: z.array(z.string().email())
      })
    }
  }, async (request, reply) => {
    const { destination, endsAt, startsAt, ownerEmail, ownerName, emailsToInvite } = request.body

    if (dayjs(startsAt).isBefore(new Date)) {
      return reply.status(423).send({ message: 'Invalid trip start date' })
    }

    if (dayjs(endsAt).isBefore(startsAt)) {
      return reply.status(423).send({ message: 'Invalid trip end date' })
    }

    const trip = await prisma.trip.create({
      data: {
        destination,
        endsAt,
        startsAt,
        Participant: {
          createMany: {
            data: [
              {
                email: ownerEmail,
                name: ownerName,
                isOwner: true,
                isConfirmed: true
              },
              ...emailsToInvite.map(email => {
                return { email }
              })
            ]
          }
        }
      }
    })

    const startFormated = dayjs(startsAt).format('LL')
    const endsFormated = dayjs(endsAt).format('LL')

    const confirm = `http://localhost:3333/trips/${trip.id}/confirm`

    const mail = await getMailClient()

    const message = await mail.sendMail({
      from: {
        name: 'Equipe plann.er',
        address: 'oi@plan.er',
      },
      to: {
        name: ownerName,
        address: ownerEmail,
      },
      subject: `Confirme sua viagem para ${destination} em ${startFormated}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-br">

        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmação do Pedido de Viagem</title>
        </head>

        <body style="font-family: Arial, sans-serif; color: #333;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <table width="600" cellpadding="20" cellspacing="0"
                  style="border: 1px solid #eaeaea; border-radius: 5px; background-color: #f9f9f9;">
                  <tr>
                    <td>
                      <h2 style="color: #4CAF50;">Confirmação do Pedido de Viagem</h2>
                      <p>Olá <strong>${ownerName}</strong>,</p>
                      <p>Recebemos seu pedido de viagem com os seguintes detalhes:</p>
                      <ul>
                        <li><strong>Destino:</strong> ${destination}</li>
                        <li><strong>Data de Partida:</strong> ${startFormated}</li>
                        <li><strong>Data de Retorno:</strong> ${endsFormated}</li>
                      </ul>
                      <p>
                        <a href="${confirm}">Confirmar</a>
                      </p>
                      <p>Atenciosamente,</p>
                      <p><strong>Equipe plan.er</strong></p>

                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>

        </html>
      `.trim()
    })

    console.log(nodemailer.getTestMessageUrl(message))

    return trip

  })

}