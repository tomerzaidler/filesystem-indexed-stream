import { EventEmitter } from 'stream';
import { join } from 'path';
import fs, {ReadStream, rmdirSync, createReadStream, writeFileSync, existsSync, mkdirSync, readFileSync} from 'fs';
import { FileSystemIndexedStreamOptions } from './indexed-stream-options';

export class FileSystemIndexedStream extends EventEmitter {
    private stream!: ReadStream;
    private options: FileSystemIndexedStreamOptions;
    private is_output_created: boolean;
    private counter: number;
    private file_extension: string;
    private constructor(options: FileSystemIndexedStreamOptions) {
        super();
        this.options = options;
        this.is_output_created = false;
        this.counter = 1;
        this.file_extension = this.getFileExtension();
        
    }

    public static create(options: FileSystemIndexedStreamOptions): FileSystemIndexedStream {
        return new FileSystemIndexedStream(options);
    }

    public splitToChunks() {
        this.stream = createReadStream(this.options.path, {
            highWaterMark: this.options.size * 1024 * 1024
        });
        this.addListeners();
        this.createOutputDir();
    }

    public compressChunks(path_to_read: string, output_file: string) {
        const file_list = this.getFileList(path_to_read);
        const first_file = file_list[0];
        let file_extension = ''; 
        if (first_file) {
            const splitted_file_path = first_file.split('.');
            file_extension = splitted_file_path[splitted_file_path.length -1] || '';
            file_extension = file_extension ?  `.${file_extension}` : file_extension;
        }
        for (const file of file_list) {
            console.log(file)
            const data = readFileSync(join(path_to_read, file))
            fs.appendFileSync(`${output_file}${file_extension}`, data)
        }
    }

    private getFileExtension() {
        const splitted_file_path = this.options.path.split('.');
        let file_extension = splitted_file_path[splitted_file_path.length -1] || '';
        if (file_extension) {
            file_extension = `.${file_extension}`;
        }
        return file_extension;
    }

    private onError(error: Error) {
        this.emit('error', error);
        console.error('IndexedStream/onError:', error);
    }

    private onEnd() {
        this.emit('end');
        console.log('IndexedStream/onEnd');
    }

    private onData(data: string | Buffer) {
        this.emit('data', data);
        console.log('IndexedStream/onData:', data);
        this.handleData(data);
    }

    private onClose() {
        this.emit('close');
        console.log('IndexedStream/onClose');
    }

    private addListeners() {
        this.stream.on('error', this.onError.bind(this));
        this.stream.on('end', this.onEnd.bind(this));
        this.stream.on('data', this.onData.bind(this));
        this.stream.on('close', this.onClose.bind(this));
    }

    private deleteFolderRecursive(dirPath: string) {
        if (fs.existsSync(dirPath)) {
          fs.readdirSync(dirPath).forEach((file) => {
            const filePath = join(dirPath, file);
      
            if (fs.lstatSync(filePath).isDirectory()) {
              this.deleteFolderRecursive.bind(this)(filePath);
            } else {
              fs.unlinkSync(filePath);
            }
          });
      
          fs.rmdirSync(dirPath);
          console.log(`Directory "${dirPath}" has been forcefully deleted along with its contents.`);
        } else {
          console.log(`Directory "${dirPath}" does not exist.`);
        }
    }

    private createOutputDir() {
        const output_path = join(process.cwd(), this.options.output);
        if (!this.is_output_created && existsSync(output_path)) {
            // If the folder doesn't exist, create it
            this.deleteFolderRecursive(output_path);
            console.log(`Folder "${output_path}" delete successfully.`);
            
        }
        mkdirSync(output_path);
        this.is_output_created = true;
        console.log(`Folder "${output_path}" created successfully.`);
    }

    private handleData(data: string | Buffer) {
        const output_path = join(process.cwd(), this.options.output);
        const output_file_name = `${output_path}/${this.counter}${this.file_extension}`;
        this.counter++;
        writeFileSync(output_file_name, data);
    }

    private getFileList(path_to_read: string) {
        return fs.readdirSync(path_to_read).sort((a,b) => {
            const aIndex = parseInt(a.replace(this.file_extension, ''));
            const bIndex = parseInt(b.replace(this.file_extension, ''));
            return aIndex - bIndex;
        });
    }
}