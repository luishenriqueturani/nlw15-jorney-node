import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../lib/prisma";


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

    if(!participant) return reply.status(400).send({ message: 'Participante não encontrado' })

    if(participant.isConfirmed) return reply.redirect(`http://localhost:3000/trips/${participant.tripId}`)

    await prisma.participant.update({
      where: { id: participantId },
      data: {
        isConfirmed: true
      }
    })

    return reply.redirect(`http://localhost:3000/trips/${participant.tripId}`)
  })
}


