import { createWriteStream, ReadStream } from "fs";
import { extname } from "path";
import { UPLOADS_FOLDER } from "../helpers/";

export interface UploadProccessInterface {
  stream: ReadStream;
  filename: string;
  mimetype: string;
}

export interface UploadPromise {
  path: string;
  filename: string;
  mimetype: string;
}

export const upload_proccessing = async (
  args: UploadProccessInterface
): Promise<UploadPromise> => {
  const { stream, filename, mimetype } = await args;
  const Extname = extname(filename);
  const newFilename = `${Date.now()}-arch${Extname}`;
  const filePath = `${UPLOADS_FOLDER}/${newFilename}`;

  return new Promise((resolve, reject) => {
    stream
      .pipe(createWriteStream(filePath))
      .on("finish", () =>
        resolve({ path: filePath, filename: newFilename, mimetype })
      )
      .on("error", reject);
  });
};
