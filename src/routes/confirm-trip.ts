import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../lib/prisma";

import {dayjs} from "../lib/dayjs";
import { getMailClient } from "../lib/mail";

import nodemailer from "nodemailer"


export async function confirmTrip(app: FastifyInstance){
  app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/confirm', {
    schema: {
      params: z.object({
        tripId: z.string().uuid()
      })
    }
  }, async (request, reply) => {

    const {tripId} = request.params

    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId
      },
      include: {
        Participant: {
          where: {
            isOwner: false
          }
        }
      }
    })

    if(!trip) return reply.status(400).send({ message: 'Viagem não encontrada' })


    if(trip.isConfirmed) return reply.redirect(`http://localhost:3000/trips/${tripId}`)

    const updated = await prisma.trip.update({
      where: {
        id: tripId
      },
      data: {
        isConfirmed: true
      }
    })

    

    const startFormated = dayjs(trip.startsAt).format('LL')
    const endsFormated = dayjs(trip.endsAt).format('LL')

    
    const mail = await getMailClient()
    
    await Promise.all(
      trip.Participant.map(async (participant) => {
        const confirm = `http://localhost:3333/participants/${participant.id}/confirm`
        const message = await mail.sendMail({
          from: {
            name: 'Equipe plann.er',
            address: 'oi@plan.er',
          },
          to: participant.email,
          subject: `Confirme sua presença na viagem para ${trip.destination} em ${startFormated}`,
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
                          <h2 style="color: #4CAF50;">Confirmação do convite de Viagem</h2>
                          <p>Confirme sua presença no convite da viagem clicando abaixo</p>
                          
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

      })
    )


    return reply.redirect(`http://localhost:3000/trips/${tripId}`)
  })
}


