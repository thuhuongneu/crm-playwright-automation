import { createLogger, format, transports } from 'winston';

/** Logger riêng của suite API — ghi vào reports/api/logs, không lẫn log của suite UI */
export const apiLogger = createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: format.combine(
    format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`),
  ),
  transports: [new transports.File({ filename: 'reports/api/logs/api-run.log' })],
});
