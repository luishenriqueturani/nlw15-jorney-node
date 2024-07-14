import fastify from "fastify";
import cors from "@fastify/cors";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { createTrip } from "./routes/create-trip";
import { confirmTrip } from "./routes/confirm-trip";
import { confirmParticipant } from "./routes/confirm-participant";
import { createActivity } from "./routes/create-activities";
import { getActivity } from "./routes/get-avtivities";
import { createLinks } from "./routes/create-links";
import { getLinks } from "./routes/get-links";


const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(createTrip)
app.register(confirmTrip)
app.register(confirmParticipant)
app.register(createActivity)
app.register(getActivity)
app.register(createLinks)
app.register(getLinks)

app.register(cors, {
  origin: '*'
})

app.listen({ port: 3333 }).then(() => {
  console.log('server running on port: 3333')
})


