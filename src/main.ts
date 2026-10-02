import http from 'http';
import logger from 'jet-logger';

import EnvVars from './common/constants/env';
import server from './server';
import SocketService from './services/SocketService';

/******************************************************************************
                                Constants
******************************************************************************/

const SERVER_START_MESSAGE =
  'Express server started on port: ' + EnvVars.Port.toString();

/******************************************************************************
                                  Run
******************************************************************************/

// Create HTTP Server wrapping the Express App
const httpServer = http.createServer(server);

// Initialize Socket.IO
SocketService.initSocket(httpServer);

// Seed default collections if empty (non-blocking)
void (async () => {
  try {
    const { default: CategoryRepo } = await import(
      './repos/CategoryRepo'
    );
    await CategoryRepo.seedDefaultCategoriesIfEmpty();

    const { default: CategoryFeatureRepo } = await import(
      './repos/CategoryFeatureRepo'
    );
    await CategoryFeatureRepo.seedDefaultFeaturesIfEmpty();

    const { default: GigRepo } = await import('./repos/GigRepo');
    await GigRepo.seedInitialGigsIfEmpty();
  } catch (err) {
    logger.err(err);
  }
})();

// Start the server
httpServer.listen(EnvVars.Port, () => {
  logger.info(SERVER_START_MESSAGE);
});
