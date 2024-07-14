import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { prisma } from "../lib/prisma";
import {dayjs} from "../lib/dayjs";
import { ClientError } from "../errors/client-error";


export async function updateTrip(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>().put('/trips/:tripId', {
    schema: {
      params: z.object({
        tripId: z.string().uuid()
      }),
      body: z.object({
        destination: z.string().min(4),
        startsAt: z.coerce.date(),
        endsAt: z.coerce.date(),
      })
    }
  }, async (request, reply) => {
    const {tripId} = request.params
    const { destination, endsAt, startsAt, } = request.body

    if (dayjs(startsAt).isBefore(new Date)) {
      throw new ClientError('Invalid trip start date')
    }

    if (dayjs(endsAt).isBefore(startsAt)) {
      throw new ClientError('Invalid trip end date')
    }

    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId
      }
    })

    if(!trip) throw new ClientError('Trip not found')

    
    const res = await prisma.trip.update({
      where: {
        id: tripId
      },
      data: {
        destination,
        endsAt,
        startsAt,
      }
    })

    return reply.status(200).send(res)

  })

}