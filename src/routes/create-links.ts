import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { prisma } from "../lib/prisma";



export async function createLinks(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/links',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid()
        }),
        body: z.object({
          title: z.string().min(4),
          url: z.string().url(),
        })
      }
    }, async (request, reply) => {
      const { tripId } = request.params
      const { url, title } = request.body

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId
        }
      })

      if(!trip) return reply.status(400).send({message: 'Viagem não encontrada'})


      const link = await prisma.link.create({
        data: {
          title,
          url,
          tripId
        }
      })

      return reply.status(201).send(link)

    }
  )

}