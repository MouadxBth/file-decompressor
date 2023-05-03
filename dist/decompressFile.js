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
exports.decompressFile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const zlib_1 = __importDefault(require("zlib"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const node_7z_1 = __importDefault(require("node-7z"));
const path_2 = require("path");
function fetchDecompressedFiles(directoryPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = [];
        let index = 0;
        try {
            const decompressedFiles = yield fs_1.default.promises.readdir(directoryPath);
            for (const fileName of decompressedFiles) {
                const filePath = path_1.default.join(directoryPath, fileName);
                const fileContent = yield fs_1.default.promises.readFile(filePath);
                files[index++] = {
                    fileName: fileName,
                    fileContent: fileContent.toString('base64')
                };
            }
        }
        catch (err) {
            throw new Error(`Error reading decompressed files: ${err.message}`);
        }
        return files;
    });
}
function decompressFileTo(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const extension = path_1.default.extname(filePath).toLowerCase();
        const outputPath = path_1.default.join(path_1.default.dirname(filePath), path_1.default.basename(filePath, extension)).replace('.', '-');
        console.log(`PATH ${outputPath}`);
        switch (extension) {
            case ".zip":
            case ".rar":
            case ".7z":
            case ".tar":
            case ".tgz":
                if (extension == ".zip")
                    new adm_zip_1.default(filePath).extractAllTo(outputPath, true);
                else
                    node_7z_1.default.extractFull(filePath, outputPath)
                        .on('end', path_2.resolve);
                break;
            case ".gz":
                const fileName = path_1.default.basename(filePath, extension);
                yield fs_1.default.promises.mkdir(outputPath, { recursive: true });
                const gunzip = zlib_1.default.createGunzip();
                const gzipInput = fs_1.default.createReadStream(filePath);
                const gzipOutput = fs_1.default.createWriteStream(path_1.default.join(outputPath, fileName));
                yield new Promise((resolve, reject) => {
                    gzipInput.pipe(gunzip).pipe(gzipOutput)
                        .on("error", reject)
                        .on("finish", resolve);
                });
                break;
            default:
                throw new Error(`Unsupported file format: ${extension}`);
        }
    });
}
function moveFile(sourceFilePath, destFolderPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs_1.default.promises.mkdir(destFolderPath, { recursive: true });
            const fileName = path_1.default.basename(sourceFilePath);
            const sourceFileExists = yield fs_1.default.promises.stat(sourceFilePath)
                .then(stat => stat.isFile())
                .catch(() => false);
            if (!sourceFileExists) {
                console.error(`Error moving file: source file does not exist: ${sourceFilePath}`);
                return;
            }
            const destFilePath = path_1.default.join(destFolderPath, fileName);
            yield fs_1.default.promises.rename(sourceFilePath, destFilePath);
        }
        catch (error) {
            console.error(`Error moving file: ${error.message}`);
        }
    });
}
function decompressFile(filePath, backupPath) {
    return __awaiter(this, void 0, void 0, function* () {
        yield decompressFileTo(filePath)
            .then(() => {
            console.log("Files decompressed successfully!");
        })
            .catch((err) => console.error(`Error decompressing file: ${err.message}`));
        const temp = filePath.substring(1, filePath.length);
        const directoryPath = filePath.substring(0, 1) + (temp.substring(0, temp.lastIndexOf('.'))
            .replace('.', '-'));
        const files = yield fetchDecompressedFiles(directoryPath);
        moveFile(filePath, backupPath);
        return new Promise((resolve) => {
            resolve(files);
        });
    });
}
exports.decompressFile = decompressFile;
