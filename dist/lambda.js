"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const platform_express_1 = require("@nestjs/platform-express");
const express = require("express");
const aws_serverless_express_1 = require("aws-serverless-express");
let cachedServer;
async function bootstrapServer() {
    const expressApp = express();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressApp));
    app.enableCors();
    await app.init();
    return (0, aws_serverless_express_1.createServer)(expressApp);
}
const handler = async (event, context) => {
    if (!cachedServer) {
        cachedServer = await bootstrapServer();
    }
    return (0, aws_serverless_express_1.proxy)(cachedServer, event, context, 'PROMISE').promise;
};
exports.handler = handler;
//# sourceMappingURL=lambda.js.map