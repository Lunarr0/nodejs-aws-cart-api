import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Handler, Context } from 'aws-lambda';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import * as serverless from 'aws-serverless-express';

const expressApp = express();
let cachedServer: any = null;

async function bootstrap() {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
    await app.init();
    return serverless.createServer(expressApp);
}

export const handler: Handler = async (event: any, context: Context) => {
    if (!cachedServer) {
        cachedServer = await bootstrap();
    }
    return serverless.proxy(cachedServer, event, context, 'PROMISE').promise;
};
