import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { prisma } from "../lib/prisma";

import { getMailClient } from "../lib/mail";
import nodemailer from "nodemailer"
import {dayjs} from "../lib/dayjs";
import { ClientError } from "../errors/client-error";
import { env } from "../env";



export async function createInvite(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/invites', {
    schema: {
      params: z.object({
        tripId: z.string().uuid()
      }),
      body: z.object({
        email: z.string().email()
      })
    }
  }, async (request, reply) => {
    const {tripId} = request.params
    const { email } = request.body

    const trip = await prisma.trip.findUnique({
      where: {id: tripId}
    })

    if(!trip) throw new ClientError('Trip not found')

    const participant = await prisma.participant.create({
      data: {
        email,
        tripId
      }
    })


    const startFormated = dayjs(trip.startsAt).format('LL')
    const endsFormated = dayjs(trip.endsAt).format('LL')

    const confirm = `${env.API_BASE_URL}/trips/${trip.id}/confirm`

    const mail = await getMailClient()

    const message = await mail.sendMail({
      from: {
        name: 'Equipe plann.er',
        address: 'oi@plan.er',
      },
      to: participant.email,
      subject: `Confirme sua viagem para ${trip.destination} em ${startFormated}`,
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
                      <p>Recebemos seu pedido de viagem com os seguintes detalhes:</p>
                      <ul>
                        <li><strong>Destino:</strong> ${trip.destination}</li>
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

    return reply.status(201).send(trip)

  })

}