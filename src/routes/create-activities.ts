import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../errors/client-error";



export async function createActivity(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/activities',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid()
        }),
        body: z.object({
          title: z.string().min(4),
          occursAt: z.coerce.date(),
        })
      }
    }, async (request, reply) => {
      const { tripId } = request.params
      const { occursAt, title } = request.body

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId
        }
      })

      if(!trip) throw new ClientError('Trip not found')

      if(dayjs(occursAt).isBefore(trip.startsAt)) throw new ClientError('Data inválida, não pode ser anterior a viagem') 

      if(dayjs(occursAt).isAfter(trip.endsAt)) throw new ClientError('Data inválida, não pode ser posterior a viagem')  


      const activity = await prisma.activity.create({
        data: {
          title,
          occursAt,
          tripId
        }
      })

      return reply.status(201).send(activity)

    }
  )

}