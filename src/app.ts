import ExpressAppFactory from '@/shared/factories/express.app.factory.js';
import env from '@/config/environment.js';
import { logger } from '@/shared/logger.js';
import CronScheduler from '@/module/subscription/infrastructure/cron.scheduler.js';

class App {
  private readonly expressAppFactory: ExpressAppFactory;
  private readonly cronScheduler: CronScheduler;
  private server: any;

  constructor() {
    this.expressAppFactory = new ExpressAppFactory();
    this.cronScheduler = new CronScheduler();
  }

  public start(): void {
    this.expressAppFactory.finalizeApp();
    const app = this.expressAppFactory.getApp();

    this.server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);

      // Start background subscription jobs after server is ready
      this.cronScheduler.start();
    });

    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);

      // Stop cron jobs first
      this.cronScheduler.stop();

      this.server.close(() => {
        logger.info('✅ Process terminated gracefully');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  public getExpressApp() {
    return this.expressAppFactory.getApp();
  }
}

export default App;
