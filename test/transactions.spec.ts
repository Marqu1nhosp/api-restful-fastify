/* eslint-disable prettier/prettier */
import { it, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('yarn knex migrate:rollback --all')
    execSync('yarn knex migrate:latest')
  })

  // deve ser possível criar uma nova transição
  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)
  })

  // deve ser possível listar todas as transações
  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })

      const cookies = createTransactionResponse.get('Set-Cookie')
      
      const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

      expect(listTransactionsResponse.body.transactions).toEqual([
        expect.objectContaining({
          title: 'New transaction',
          amount: 5000,
        })
      ])
  })

    // deve ser possível de obter uma transação específica
    it('should be able to get a specefic transaction', async () => {
      const createTransactionResponse = await request(app.server)
        .post('/transactions')
        .send({
          title: 'New transaction',
          amount: 5000,
          type: 'credit',
        })
  
        const cookies = createTransactionResponse.get('Set-Cookie')
        
        const listTransactionsResponse = await request(app.server)
        .get('/transactions')
        .set('Cookie', cookies)
        .expect(200)

        const transactionId = listTransactionsResponse.body.transactions[0].id
  
        const getTransactionReponse = await request(app.server)
        .get(`/transactions/${transactionId}`)
        .set('Cookie', cookies)
        .expect(200)

        expect(getTransactionReponse.body.transaction).toEqual(
          expect.objectContaining({
            title: 'New transaction',
            amount: 5000,
          })
        )
    })

    // deve ser possível ober um resumo
    it('should be able to get the summary', async () => {
      const createTransactionResponse = await request(app.server)
        .post('/transactions')
        .send({
          title: 'Credit transaction',
          amount: 5000,
          type: 'credit',
        })

        const cookies = createTransactionResponse.get('Set-Cookie')

        await request(app.server)
        .post('/transactions')
        .set('Cookie', cookies)
        .send({
          title: 'Debit Transaction',
          amount: 2000,
          type: 'debit',
        })
      
        const summaryResponse = await request(app.server)
        .get('/transactions/summary')
        .set('Cookie', cookies)
        .expect(200)

        expect(summaryResponse.body.summary).toEqual({
          amount: 3000,
        })
    })
})
