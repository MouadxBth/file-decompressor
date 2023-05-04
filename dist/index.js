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
const DECOMPRESSOR_DIR = process.env.DECOMPRESSOR_DIR || "/tmp"; // DEPRACATED
const DECOMPRESSOR_BACKUP_DIR = process.env.DECOMPRESSOR_BACKUP_DIR || "./backup"; // DEPRACATED
/**
 * Creates an instance of the express app with body-parser middleware enabled for JSON and urlencoded bodies.
 * The server listens on the port specified in the DECOMPRESSOR_PORT variable.
 *
 * @constant {object} app - An instance of the express app with body-parser middleware enabled.
 * @memberof module:server
 */
const app = (0, express_1.default)();
app.use(express_1.default.json({
    verify: (request, response, buffer, encoding) => {
        try {
            JSON.parse(buffer.toString('utf-8'));
        }
        catch (error) {
            response.status(400).send("Invalid JSON body!\n \
			an example of a valid Request:\n{ \"fileName\": \"test.txt\", \"fileContent\": \"content in base64\" }");
            throw Error("Invalid request body!");
        }
    }
}));
app.use(express_1.default.urlencoded({ extended: true }));
app.post(DECOMPRESSOR_ROUTE, (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fileName = request.body['fileName'];
        const fileContentString = request.body['fileContent'];
        if (fileName == null || fileName.length == 0
            || fileContentString == null || fileContentString.length == 0) {
            return response.status(400).send("Error! fileName and fileContent are either missing or empty!");
        }
        (0, decompressFile_1.decompressFile)({
            fileName: "/tmp/" + request.body['fileName'],
            fileContent: Buffer.from(request.body['fileContent'], "base64")
        })
            .then((result) => {
            return response.send(result);
        })
            .catch((error) => {
            return response.status(500).send(error.message);
        });
    }
    catch (decompressionError) {
        return response.status(500).send(decompressionError);
    }
}));
app.listen(DECOMPRESSOR_PORT, () => {
    console.log(`Server started on port ${DECOMPRESSOR_PORT}`);
});
module.exports = app;
