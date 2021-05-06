import axios, { AxiosError } from 'axios'
import { setCookie, parseCookies } from 'nookies'
import { signOut } from '../contexts/AuthContext'
import { AuthTokenError } from './errors/AuthTokenError'

let isRefresing = false
let failedResquestsQueue = []

export function setupAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx)

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  })

  api.interceptors.response.use(
    response => {
      return response
    },
    (error: AxiosError) => {
      if (error.response.status === 401) {
        if (error.response.data?.code === 'token.expired') {
          cookies = parseCookies(ctx)

          const { 'nextauth.refreshToken': refreshToken } = cookies
          const originalConfig = error.config

          if (!isRefresing) {
            isRefresing = true

            api
              .post('/refresh', { refreshToken })
              .then(response => {
                const { token } = response.data

                setCookie(ctx, 'nextauth.token', token, {
                  maxAge: 60 * 60 * 24 * 30, // 30 days
                  path: '/'
                })

                setCookie(
                  ctx,
                  'nextauth.refreshToken',
                  response.data.refreshToken,
                  {
                    maxAge: 60 * 60 * 24 * 30, // 30 days
                    path: '/'
                  }
                )

                api.defaults.headers['Authorization'] = `Bearer ${token}`

                failedResquestsQueue.forEach(request =>
                  request.onSuccess(token)
                )
                failedResquestsQueue = []
              })
              .catch(err => {
                failedResquestsQueue.forEach(request => request.onFailure(err))
                failedResquestsQueue = []

                if (process.browser) {
                  signOut()
                }
              })
              .finally(() => {
                isRefresing = false
              })
          }

          return new Promise((resolve, reject) => {
            failedResquestsQueue.push({
              onSuccess: (token: string) => {
                originalConfig.headers['Authorization'] = `Bearer ${token}`

                resolve(api(originalConfig))
              },
              onFailure: (err: AxiosError) => {
                reject(err)
              }
            })
          })
        } else {
          if (process.browser) {
            signOut()
          } else {
            return Promise.reject(new AuthTokenError())
          }
        }

        return Promise.reject(error)
      }
    }
  )

  return api
}
