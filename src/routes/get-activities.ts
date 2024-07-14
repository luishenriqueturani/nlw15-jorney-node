import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../errors/client-error";



export async function getActivity(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/activities',
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
          Activity: {
            orderBy: {
              occursAt: 'asc'
            }
          }
        }
      })

      if(!trip) throw new ClientError('Trip not found')

      const differenceInDaysBetweenTripStartAndEnd = dayjs(trip.endsAt).diff(trip.startsAt, 'days')

      const activities = Array.from({ length: differenceInDaysBetweenTripStartAndEnd + 1 }).map((_, index) => {
        const date = dayjs(trip.startsAt).add(index, 'days')

        return {
          date: date.toDate(),
          activities: trip.Activity.filter(activity => {
            return dayjs(activity.occursAt).isSame(date, 'day')
          })
        }
      })

      return reply.status(200).send({activities})

    }
  )

}