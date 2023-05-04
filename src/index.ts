require("dotenv").config();

import express, { Request, Response } from "express";
import { decompressFile } from './decompressFile';

/**
 * Configuration variables for the decompression server.
 *
 * @constant {number} DECOMPRESSOR_PORT - The port on which the decompression server should listen.
 * The value is read from the environment variable "DECOMPRESSOR_PORT" if set, otherwise defaults to 3000.
 * @constant {string} DECOMPRESSOR_ROUTE - The route on which the server will accept file uploads.
 * The value is read from the environment variable "DECOMPRESSOR_ROUTE" if set, otherwise defaults to "/upload".
 * @constant {string} DECOMPRESSOR_DIR - The directory where the uploaded files will be stored.
 * The value is read from the environment variable "DECOMPRESSOR_DIR" if set, otherwise defaults to "/tmp".
 * @constant {string} DECOMPRESSOR_BACKUP_DIR - The directory where the backup of the compressed files will be stored.
 * The value is read from the environment variable "DECOMPRESSOR_BACKUP_DIR" if set, otherwise defaults to "./backup".
 */
const DECOMPRESSOR_PORT: number = process.env.DECOMPRESSOR_PORT ? parseInt(process.env.DECOMPRESSOR_PORT) : 3000;
const DECOMPRESSOR_ROUTE: string = process.env.DECOMPRESSOR_ROUTE || "/upload";
const DECOMPRESSOR_DIR: string = process.env.DECOMPRESSOR_DIR || "/tmp"; // DEPRACATED
const DECOMPRESSOR_BACKUP_DIR: string = process.env.DECOMPRESSOR_BACKUP_DIR || "./backup"; // DEPRACATED


/**
 * Creates an instance of the express app with body-parser middleware enabled for JSON and urlencoded bodies.
 * The server listens on the port specified in the DECOMPRESSOR_PORT variable.
 *
 * @constant {object} app - An instance of the express app with body-parser middleware enabled.
 * @memberof module:server
 */
const app = express();
app.use(express.json({
	verify: (request: Request, response: Response, buffer: Buffer, encoding: string) => {
		try {
			JSON.parse(buffer.toString('utf-8'));
		}
		catch (error: any) {
			response.status(400).send("Invalid JSON body!\n \
			an example of a valid Request:\n{ \"fileName\": \"test.txt\", \"fileContent\": \"content in base64\" }");
			throw Error("Invalid request body!");
		}
	}

}));
app.use(express.urlencoded({ extended: true }));

app.post(DECOMPRESSOR_ROUTE, async (request: Request, response: Response) => {

	try {
		const fileName: string | null = request.body['fileName'];
		const fileContentString: string | null = request.body['fileContent'];

		if (fileName == null || fileName.length == 0
			|| fileContentString == null || fileContentString.length == 0) {
				return response.status(400).send("Error! fileName and fileContent are either missing or empty!");
		}

		decompressFile({
			fileName: "/tmp/" + request.body['fileName'],
			fileContent: Buffer.from(request.body['fileContent'], "base64")
		})
		.then((result) => {
			return response.send(result);
		})
		.catch((error: any) => {
			return response.status(500).send((error as Error).message);
		});

	} catch (decompressionError) {
		return response.status(500).send(decompressionError);
	}

});

app.listen(DECOMPRESSOR_PORT, () => {
	console.log(`Server started on port ${DECOMPRESSOR_PORT}`);
});

module.exports = app;
