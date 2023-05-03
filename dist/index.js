"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const decompressFile_1 = require("./decompressFile");
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
const DECOMPRESSOR_PORT = process.env.DECOMPRESSOR_PORT ? parseInt(process.env.DECOMPRESSOR_PORT) : 3000;
const DECOMPRESSOR_ROUTE = process.env.DECOMPRESSOR_ROUTE || "/upload";
const DECOMPRESSOR_DIR = process.env.DECOMPRESSOR_DIR || "/tmp";
const DECOMPRESSOR_BACKUP_DIR = process.env.DECOMPRESSOR_BACKUP_DIR || "./backup";
/**
 * Creates an instance of the multer middleware configured to accept only compressed files.
 * The middleware saves the file in the directory specified in the DECOMPRESSOR_DIR variable.
 * The name of the file is a combination of the current timestamp and the original file name.
 *
 * @constant {object} upload - An instance of the multer middleware configured to accept compressed files.
 * @memberof module:server
 */
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: function (req, file, callback) {
            callback(null, DECOMPRESSOR_DIR);
        },
        filename: (req, file, callback) => {
            callback(null, `${Date.now()}-${file.originalname}`);
        }
    }),
    fileFilter: function (req, file, callback) {
        const extension = path_1.default.extname(file.originalname);
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
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.post(DECOMPRESSOR_ROUTE, (request, response) => {
    upload(request, response, (error) => __awaiter(void 0, void 0, void 0, function* () {
        if (error || !request.file) {
            return (console.error(error), response.status(400).send({ error: error ? error.message : 'No file uploaded' }));
        }
        try {
            const data = yield (0, decompressFile_1.decompressFile)(request.file.path, DECOMPRESSOR_BACKUP_DIR);
            return response.send(data);
        }
        catch (decompressionError) {
            return response.status(500).send(decompressionError);
        }
    }));
});
app.listen(DECOMPRESSOR_PORT, () => {
    console.log(`Server started on port ${DECOMPRESSOR_PORT}`);
});
module.exports = app;
