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
const adm_zip_1 = __importDefault(require("adm-zip"));
/**
 * Fetches the list of files in a directory and returns them as an array of FileData objects
 * @param directoryPath - The path of the directory to fetch the files from
 * @returns An array of FileData objects
 */
function fetchFileDatas(directoryPath) {
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
                    fileContent: fileContent
                };
            }
        }
        catch (err) {
            throw new Error(`Error reading decompressed files: ${err.message}`);
        }
        return files;
    });
}
/**
 * Decompresses the given file asynchrounously based on it's extension
 * @param filePath - The path of the compressed file
 * @returns A void promise to track the decompression status
 */
function decompressFileTo(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const extension = path_1.default.extname(file.fileName).toLowerCase();
        const temp = file.fileName.substring(1, file.fileName.length);
        const outputPath = file.fileName.substring(0, 1) + (temp.substring(0, temp.lastIndexOf('.'))
            .replace('.', '-'));
        switch (extension) {
            case ".zip":
                new adm_zip_1.default(file.fileContent).extractAllTo(outputPath, true);
                break;
            /* 		case ".rar":
                    case ".7z":
                    case ".tar":
                    case ".tgz":
                    case ".gz": */
            default:
                throw new Error(`Unsupported file format: ${extension}`);
        }
    });
}
/**
 * Decompresses the given file in it's appropriate folder, then moves the file from it's location to
 * the backup location, then returns an promise of an array of decompressed files.
 * @param filePath - The path of the compressed file
 * @param backupPath - The path of the directory to move the compressed file after decompression
 * @returns A promise of an array of FileData objects
 */
function decompressFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        yield decompressFileTo(file)
            .then(() => {
            console.log("Files decompressed successfully!");
        })
            .catch((err) => {
            throw Error(`Error decompressing file: ${err.message}`);
        });
        const temp = file.fileName.substring(1, file.fileName.length);
        const directoryPath = file.fileName.substring(0, 1) + (temp.substring(0, temp.lastIndexOf('.'))
            .replace('.', '-'));
        const files = yield fetchFileDatas(directoryPath);
        return new Promise((resolve) => {
            resolve(files);
        });
    });
}
exports.decompressFile = decompressFile;
