import fastify from "fastify";
import { prisma } from "./lib/prisma";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";


const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.listen({ port: 3333 }).then(() => {
  console.log('server running on port: 3333')
})


