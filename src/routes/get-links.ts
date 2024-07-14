import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { prisma } from "../lib/prisma";



export async function getLinks(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/links',
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
          Link: true
        }
      })

      if(!trip) return reply.status(400).send({message: 'Viagem não encontrada'})

      return reply.status(201).send(trip.Link)

    }
  )

}