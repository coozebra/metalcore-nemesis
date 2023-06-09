import Bull, { Queue, Worker } from 'bullmq';
import { inject, injectable } from 'inversify';
import IORedis from 'ioredis';

export type WorkerType = {
  start(): void;
  enqueue<T>(params: T, opts?: Bull.JobsOptions): Promise<Bull.Job<T>>;
};

@injectable()
abstract class BasicWorker {
  connection: IORedis;
  #queueName!: string;
  #queue!: Bull.Queue;
  #worker!: Bull.Worker;

  abstract apply(job: Bull.Job): Promise<void>;

  constructor(@inject('Redis') connection: IORedis) {
    this.connection = connection;
  }

  get queueName(): string {
    return (this.#queueName = this.#queueName || this.constructor.name);
  }

  get queue(): Bull.Queue {
    return (this.#queue = this.#queue || new Queue(this.queueName, { connection: this.connection }));
  }

  get worker(): Bull.Worker {
    return (this.#worker = this.#worker || new Worker(this.queueName, this.apply, { connection: this.connection }));
  }

  enqueue = async <T>(params: T, opts?: Bull.JobsOptions): Promise<Bull.Job<T>> => {
    const jobOptions = {
      removeOnComplete: 100,
      removeOnFail: 100,
      stackTraceLimit: 100,
      ...opts,
    };

    return this.queue.add(this.queueName, params, jobOptions);
  };

  start = (): void => {
    this.worker;
  };
}

export default BasicWorker;
