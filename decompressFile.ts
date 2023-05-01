import fs from "fs";
import path from "path";
import zlib from "zlib";
import admZip from "adm-zip";
import seven from "node-7z";
import { resolve } from "path";

interface DecompressedFile {
	fileName: string,
	content: Buffer;
}

async function fetchDecompressedFiles(directoryPath: string): Promise<DecompressedFile[]> {
	const files: DecompressedFile[] = [];
	let index = 0;

	try {
		const decompressedFiles = await fs.promises.readdir(directoryPath);

		for (const fileName of decompressedFiles) {
			const filePath = path.join(directoryPath, fileName);
			const fileContent = await fs.promises.readFile(filePath);

			files[index++] = {
				fileName: fileName,
				content: fileContent
			};
		}
	} catch (err) {
		throw new Error(`Error reading decompressed files: ${(err as Error).message}`);
	}

	return files;
}

async function decompressFileTo(filePath: string): Promise<void> {
	const extension = path.extname(filePath).toLowerCase();
	const outputPath = path.join(path.dirname(filePath), path.basename(filePath, extension)).replace('.', '-');

	switch (extension) {
		case ".zip":
		case ".rar":
		case ".7z":
		case ".tar":
		case ".tgz":
			if (extension == ".zip")
				new admZip(filePath).extractAllTo(outputPath, true);
			else
				seven.extractFull(filePath, outputPath)
					.on('end', resolve);
			break;
		case ".gz":
			const fileName = path.basename(filePath, extension);

			await fs.promises.mkdir(outputPath, { recursive: true });

			const gunzip = zlib.createGunzip();
			const gzipInput = fs.createReadStream(filePath);
			const gzipOutput = fs.createWriteStream(path.join(outputPath, fileName));

			await new Promise((resolve, reject) => {
				gzipInput.pipe(gunzip).pipe(gzipOutput)
					.on("error", reject)
					.on("finish", resolve);
			});
			break;
		default:
			throw new Error(`Unsupported file format: ${extension}`);
	}
}

async function moveFile(sourceFilePath: string, destFolderPath: string): Promise<void> {
	try {
	  await fs.promises.mkdir(destFolderPath, { recursive: true });

	  const fileName = path.basename(sourceFilePath);

	  const sourceFileExists = await fs.promises.stat(sourceFilePath)
		.then(stat => stat.isFile())
		.catch(() => false);

	  if (!sourceFileExists) {
		console.error(`Error moving file: source file does not exist: ${sourceFilePath}`);
		return;
	  }

	  const destFilePath = path.join(destFolderPath, fileName);
	  await fs.promises.rename(sourceFilePath, destFilePath);

	} catch (error) {
	  console.error(`Error moving file: ${(error as Error).message}`);
	}
  }

export async function decompressFile(filePath: string, backupPath: string): Promise<DecompressedFile[]> {
	await decompressFileTo(filePath)
		.then(() => {
			console.log("Files decompressed successfully!");
		})
		.catch((err) => console.error(`Error decompressing file: ${(err as Error).message}`));

	const temp = filePath.substring(1, filePath.length);

	const directoryPath = filePath.substring(0, 1) + (temp.substring(0, temp.lastIndexOf('.'))
		.replace('.', '-'));

	const files = await fetchDecompressedFiles(directoryPath);

	moveFile(filePath, backupPath);

	return new Promise((resolve) => {
		resolve(files);
	});
}
