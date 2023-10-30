/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function usersRoutes(app: FastifyInstance) {
  // Lista todos os usuários
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req) => {
      const { sessionId } = req.cookies
      const users = await knex('users').where('session_id', sessionId).select()

      return { users }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req) => {
      const getUserParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getUserParamsSchema.parse(req.params)

      const { sessionId } = req.cookies

      const user = await knex('users')
        .where({
          session_id: sessionId,
          id,
        })
        .first()

      return { user }
    },
  )

  // Criando um novo usuário
  app.post('/', async (req, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      cpf: z.string(),
      email: z.string(),
      date_birth: z.string(),
    })

    const { name, cpf, email, date_birth } = createUserBodySchema.parse(
      req.body,
    )

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('users')
      .where({ cpf })
      .insert({
        id: randomUUID(),
        cpf,
        name,
        email,
        date_birth,
        session_id: sessionId,
      })
      .then((cpfExists) => {
        if (cpf) {
          return reply.status(400).send()
        } else {
          return reply.status(201).send()
        }
      })
  })

  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, reply) => {
      // zod está validando todos os valores e os seus respectivos tipos
      const alterUserBodySchema = z.object({
        name: z.string(),
        cpf: z.string(),
        email: z.string(),
        date_birth: z.string(),
      })

      // validando o id
      const getUserParamsSchema = z.object({
        id: z.string().uuid(),
      })

      // pegando o id pelo o parâmetro da URL
      const { id } = getUserParamsSchema.parse(req.params)

      // pegando os dados que vão se alterados pelo o corpo da requisição(BODY)
      const { name, cpf, email, date_birth } = alterUserBodySchema.parse(
        req.body,
      )

      /* aqui esta fazendo a consulta no banco de dados pelo o ID que foi recebido da URL e 
        alterando na tabela  
    */

      await knex('users')
        .where({
          id,
        })
        .update({
          cpf,
          name,
          email,
          date_birth,
        })

      return reply.status(200).send()
    },
  )
}
