import Bee from 'bee-queue';
import CancellationMail from '../app/jobs/CancellationMail';
import redisConfig from '../config/redis';

const jobs = [CancellationMail];


class Queue{
  constructor(){
    this.queues = {};

    this.init();
  }

  init(){
    jobs.forEach(({ key, handle}) => {
      this.queues[key] = {
        bee: new Bee( key, {
          redis: redisConfig,
        }),
        handle,
      };
    });  
  }

  // adiciona a fila
  add(queue, job){
    return this.queues[queue].bee.createJob(job).save();
  }

  // processa a fila
  processQueue(){
    jobs.forEach( job => {
      const { bee, handle } = this.queues[job.key];      
      bee.on('failed', this.handleFailure).process(handle);
    });
  }

  // monitorando erros na fila
  handleFailure(job, err) {
    console.log(`Queue ${job.queue.name}: FAILED`, err);
  }

}

export default new Queue();