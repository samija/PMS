import Bull, { QueueOptions } from 'bull';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

const defaultOptions: QueueOptions = {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  },
};

export const createQueue = <T = any>(name: string, options?: Partial<QueueOptions>): Bull.Queue<T> => {
  return new Bull<T>(name, { ...defaultOptions, ...options });
};

export { redisConfig };
export default createQueue;
