/* eslint-disable prettier/prettier */
import { it, beforeAll, afterAll, describe, expect } from 'vitest'
  
import request from 'supertest'
import { app } from '../src/app'

describe('Users routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

 // deve ser possível criar um novo usuário
  it('should be able to create a new user', async () => {
    await request(app.server)
    .post('/users')
    .send({
       name: "New user",
			 cpf: "12345678910",
			 email: "marcos@gmail.com",
			 date_birth: "2000-04-01",
    })
    .expect(201)
  })

// deve ser possível listar usuários
  it('should be able to list all users', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: "New user",
        cpf: "12345678910",
        email: "marcos@gmail.com",
        date_birth: "2000-04-01",
     })

      const cookies = createUserResponse.get('Set-Cookie')

      const listUsersResponse = await request(app.server)
      .get('/users')
      .set('Cookie', cookies)
      .expect(200)

      expect(listUsersResponse.body.users).toEqual([
        expect.objectContaining({
          name: "New user",
          cpf: "12345678910",
          email: "marcos@gmail.com",
          date_birth: "2000-04-01",
        })
      ])
   
     

  
  })
})
