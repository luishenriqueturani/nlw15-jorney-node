import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { prisma } from "../lib/prisma";

export async function createTrip(app: FastifyInstance){

  app.withTypeProvider<ZodTypeProvider>().post('/trips', {
    schema: {
      body: z.object({
        destination: z.string().min(4),
        startsAt: z.coerce.date(),
        endsAt: z.coerce.date()
      })
    }
  },async (request) => {
    const {destination,endsAt,startsAt} = request.body

    return await prisma.trip.create({
      data: {
        destination,
        endsAt,
        startsAt
      }
    })

  })

}