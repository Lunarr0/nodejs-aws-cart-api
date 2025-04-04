"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('APP_PORT') || 4000;
    app.enableCors({
        origin: (req, callback) => callback(null, true),
    });
    app.use((0, helmet_1.default)());
    await app.listen(port, () => {
        console.log('App is running on %s port', port);
    });
}
bootstrap();
//# sourceMappingURL=main.js.map