require("dotenv").config();

import express, { Request, Response } from "express";
import path from "path";
import multer from "multer";
import { decompressFile } from './decompressFile';

const DECOMPRESSOR_PORT: number = process.env.DECOMPRESSOR_PORT ? parseInt(process.env.DECOMPRESSOR_PORT) : 3000;
const DECOMPRESSOR_ROUTE: string = process.env.DECOMPRESSOR_ROUTE || "/upload";
const DECOMPRESSOR_DIR: string = process.env.DECOMPRESSOR_DIR || "/tmp";
const DECOMPRESSOR_BACKUP_DIR: string = process.env.DECOMPRESSOR_BACKUP_DIR || "./backup";

const upload = multer({
	storage: multer.diskStorage({
		destination: function (req: Request, file: Express.Multer.File, callback: Function) {
			callback(null, DECOMPRESSOR_DIR);
		},
		filename: (req: Request, file: Express.Multer.File, callback: Function) => {
			callback(null, `${file.originalname}`);
			//callback(null, `${Date.now()}-${file.originalname}`);
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

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post(DECOMPRESSOR_ROUTE, (request: Request, response: Response) => {
	upload(request, response, async (error: any) => {

		if (error || !request.file) {
			return (console.error(error), response.status(400).send({ error: error ? error.message : 'No file uploaded' }));
		}

		const file = request.file;

		const outputPath = path.join(DECOMPRESSOR_DIR, file.originalname);

		console.log(`filepath ${outputPath}\nfile path ${file.path}`)

		try {
			const decompressedData = await decompressFile(outputPath, DECOMPRESSOR_BACKUP_DIR);
			return response.send(decompressedData);
		} catch (decompressionError) {
			return response.status(500).send(decompressionError);
		}
	});


	/* 	fs.rename(file.path, backupFilePath, async (err) => {
			if (err) {
				fs.unlinkSync(filePath);
				res.status(500).send("Failed to backup file.");
				return;
			}
		}); */

	/* 		const backupDirExists = fs.existsSync(BACKUP_DIR);

	if (!backupDirExists) {
		try {
			fs.mkdirSync(BACKUP_DIR);
		} catch (err) {
			fs.unlinkSync(filePath);
			res.status(500).send(`Failed to create backup directory...\nDeleting file ${file.originalname}...`);
			return;
		}
	}

	const backupFilePath = path.join(BACKUP_DIR, `${fileName}_${Date.now()}.${fileExtension}`); */

	/* 		if (!["application/gzip", "application/zip"].includes(file.mimetype)) {
				res.status(400).send("File must be compressed.");
				return;
			} */
});

app.listen(DECOMPRESSOR_PORT, () => {
	console.log(`Server started on port ${DECOMPRESSOR_PORT}`);
});
