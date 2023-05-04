import fs from "fs";
import path from "path";
import admZip from "adm-zip";


// Defines a signature for the decompressed file JSON objects
interface FileData {
	fileName: string,
	fileContent: Buffer;
}

/**
 * Fetches the list of files in a directory and returns them as an array of FileData objects
 * @param directoryPath - The path of the directory to fetch the files from
 * @returns An array of FileData objects
 */
async function fetchFileDatas(directoryPath: string): Promise<FileData[]> {
	const files: FileData[] = [];
	let index = 0;

	try {
		const decompressedFiles = await fs.promises.readdir(directoryPath);

		for (const fileName of decompressedFiles) {
			const filePath = path.join(directoryPath, fileName);
			const fileContent = await fs.promises.readFile(filePath);

			files[index++] = {
				fileName: fileName,
				fileContent: fileContent
			};
		}
	} catch (err) {
		throw new Error(`Error reading decompressed files: ${(err as Error).message}`);
	}

	return files;
}

/**
 * Decompresses the given file asynchrounously based on it's extension
 * @param filePath - The path of the compressed file
 * @returns A void promise to track the decompression status
 */
async function decompressFileTo(file: FileData): Promise<void> {
	const extension = path.extname(file.fileName).toLowerCase();
	const temp = file.fileName.substring(1, file.fileName.length);

	const outputPath = "/tmp/" + file.fileName.substring(0, 1) + (temp.substring(0, temp.lastIndexOf('.'))
		.replace('.', '-'));

	switch (extension) {
		case ".zip":
			new admZip(file.fileContent).extractAllTo(outputPath, true);
			break ;
/* 		case ".rar":
		case ".7z":
		case ".tar":
		case ".tgz":
		case ".gz": */
		default:
			throw new Error(`Unsupported file format: ${extension}`);
	}
}


/**
 * Decompresses the given file in it's appropriate folder, then moves the file from it's location to
 * the backup location, then returns an promise of an array of decompressed files.
 * @param filePath - The path of the compressed file
 * @param backupPath - The path of the directory to move the compressed file after decompression
 * @returns A promise of an array of FileData objects
 */
export async function decompressFile(file: FileData): Promise<FileData[]> {
	await decompressFileTo(file)
		.then(() => {
			console.log("Files decompressed successfully!");
		})
		.catch((err) => {

			throw Error(`Error decompressing file: ${(err as Error).message}`);
		});

	const temp = file.fileName.substring(1, file.fileName.length);

	const outputPath = "/tmp/" + file.fileName.substring(0, 1) + (temp.substring(0, temp.lastIndexOf('.'))
		.replace('.', '-'));
		
	const files = await fetchFileDatas(outputPath);

	return new Promise((resolve) => {
		resolve(files);
	});
}
