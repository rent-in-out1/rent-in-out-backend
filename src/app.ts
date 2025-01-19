import { NextFunction, Request, Response } from 'express';
import './utils/environment-variables';
import express from 'express';
import path from 'path';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import fileUpload from 'express-fileupload';
import { routesInit } from './routers/config_routes';
import { sockets } from './routers/socket';
import { PORT } from './utils/environment-variables';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger-docs.json';
import './db/mongoconnect';
import { parametersDefinitions, schemasDefinitions } from './models/swagger';
import { sessionConfig } from './config/session';
import { confirmedUrls } from './config/confirmedUrls.config';

const app = express();

app.use(
	cors({
		origin: confirmedUrls,
		credentials: true,
	})
);
app.use(fileUpload({ limits: { fileSize: 1024 * 1024 * 5 } }));
app.use(express.json());
app.use(sessionConfig);
app.use(express.static(path.join(__dirname, 'public')));

app.use((req: Request, _res: Response, next: NextFunction) => {
	console.log(`[${new Date().toISOString()}] ${req.method}: ${req.originalUrl}`);
	next();
});

// swagger options - start
// @ts-ignore
swaggerDocument.swaggerDefinition.components.schemas = schemasDefinitions;
// @ts-ignore
swaggerDocument.swaggerDefinition.components.parameters = parametersDefinitions;
const swaggerOptions = { customCssUrl: '/swagger.css' };

const swaggerDocs = swaggerJsDoc(swaggerDocument);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerOptions));
// swagger options - end

routesInit(app);

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: confirmedUrls,
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
	},
});

server.listen(PORT, () => {
	console.log(`Server is running on port: ${PORT}`);
});
io.on('connection', sockets);
