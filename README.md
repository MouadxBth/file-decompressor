# File Decompression API

This is an Express.js server application built using TypeScript that allows users to upload compressed files and receive an array of their contents as a JSON object.

## Prerequisites

- Node.js (v12 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:

```
git clone https://github.com/MouadxBth/file-decompressor.git
```

2. Install dependencies:

```
cd file-decompressor
npm install
```

3. Configure the server:

> You can configure various aspects of this server by modifying the values in the ```.env``` file.
Make sure to copy the ```.env.example``` file to ```.env``` and tailor it to fit your needs.

4. Start the server:

```
npm run start
```

5. The server is now running on http://localhost:{SPECIFIED PORT}.

## Usage

1. To decompress a file, send a POST request to the endpoint `http://localhost:3000/upload` with the file attached in a `multipart/form-data` format, the name of it's key should explicitly be as ```file```.

2. If the uploaded file is compressed, the server will decompress it and send back a JSON object with an array of decompressed files.

> An example:

```
[
    {
        "fileName": "file1.txt",
        "fileContent": ""
    },
    {
        "fileName": "file2.txt",
        "fileContent": "emFkYXoK"
    },
    {
        "fileName": "file3.txt",
        "fileContent": "YXpkYXoK"
    },
    {
        "fileName": "file4.txt",
        "fileContent": "emFkYXoK"
    },
    {
        "fileName": "file5.txt",
        "fileContent": "ZHphZGF6ZAo="
    }
]
```

Note: The file contents are encrypted in Base64 format.

## License

This project is licensed under the [MIT License](LICENSE).
