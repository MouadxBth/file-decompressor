require("dotenv").config();

import express, { Request, Response } from "express";
import path from "path";
import multer from "multer";
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
const DECOMPRESSOR_DIR: string = process.env.DECOMPRESSOR_DIR || "/tmp";
const DECOMPRESSOR_BACKUP_DIR: string = process.env.DECOMPRESSOR_BACKUP_DIR || "./backup";



/**
 * Creates an instance of the multer middleware configured to accept only compressed files.
 * The middleware saves the file in the directory specified in the DECOMPRESSOR_DIR variable.
 * The name of the file is a combination of the current timestamp and the original file name.
 *
 * @constant {object} upload - An instance of the multer middleware configured to accept compressed files.
 * @memberof module:server
 */
const upload = multer({
	storage: multer.diskStorage({
		destination: function (req: Request, file: Express.Multer.File, callback: Function) {
			callback(null, DECOMPRESSOR_DIR);
		},
		filename: (req: Request, file: Express.Multer.File, callback: Function) => {
			callback(null, `${Date.now()}-${file.originalname}`);
		}
	}),
	fileFilter: function (req: Request, file: Express.Multer.File, callback: Function) {
		const extension = path.extname(file.originalname);
		if (extension === '.zip'
			|| extension === '.gz'
			|| extension === '.tar'
			|| extension === '.tar'
			|| extension === '.rar'
			|| extension === '.7z') {
			return callback(null, true);
		}
		return callback(new Error('Only compressed files are allowed'));
	}
}).single('file');


/**
 * Creates an instance of the express app with body-parser middleware enabled for JSON and urlencoded bodies.
 * The server listens on the port specified in the DECOMPRESSOR_PORT variable.
 *
 * @constant {object} app - An instance of the express app with body-parser middleware enabled.
 * @memberof module:server
 */
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post(DECOMPRESSOR_ROUTE, (request: Request, response: Response) => {
	upload(request, response, async (error: any) => {

		if (error || !request.file) {
			return (console.error(error), response.status(400).send({ error: error ? error.message : 'No file uploaded' }));
		}

		try {
			const data = await decompressFile(request.file.path, DECOMPRESSOR_BACKUP_DIR);
			return response.send(data);
		} catch (decompressionError) {
			return response.status(500).send(decompressionError);
		}
	});

});

app.listen(DECOMPRESSOR_PORT, () => {
	console.log(`Server started on port ${DECOMPRESSOR_PORT}`);
});

module.exports = app;
