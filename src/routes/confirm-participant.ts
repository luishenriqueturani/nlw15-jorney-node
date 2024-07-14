import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { env } from "../env";


export async function confirmParticipant(app: FastifyInstance){
  app.withTypeProvider<ZodTypeProvider>().get('/participants/:participantId/confirm', {
    schema: {
      params: z.object({
        participantId: z.string().uuid()
      })
    }
  }, async (request, reply) => {

    const {participantId} = request.params

    const participant = await prisma.participant.findUnique({
      where: {
        id: participantId
      }
    })

    if(!participant) throw new ClientError('Particioant not found')

    if(participant.isConfirmed) return reply.redirect(`${env.WEB_BASE_URL}/trips/${participant.tripId}`)

    await prisma.participant.update({
      where: { id: participantId },
      data: {
        isConfirmed: true
      }
    })

    return reply.redirect(`${env.WEB_BASE_URL}/trips/${participant.tripId}`)
  })
}


