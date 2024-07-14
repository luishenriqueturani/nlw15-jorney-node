import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../errors/client-error";



export async function getParticipants(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/participants',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid()
        })
      }
    }, async (request, reply) => {
      const { tripId } = request.params

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId
        },
        include: {
          Participant: {
            select: {
              id: true,
              email: true,
              isConfirmed: true,
              name: true,
              isOwner: true,
            }
          }
        }
      })

      if(!trip) throw new ClientError('Trip not found')

      

      return reply.status(200).send({participants: trip.Participant})

    }
  )

}