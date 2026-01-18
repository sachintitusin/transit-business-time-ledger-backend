import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

export const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'transit-work-tracker',
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
})
