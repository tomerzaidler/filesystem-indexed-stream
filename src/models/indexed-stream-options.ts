export class FileSystemIndexedStreamOptions {
    /** The size of every chunk*/
    public size: number;
    /** The path to file*/
    public path: string
    /** The the output directory*/
    public output: string

    constructor(options: FileSystemIndexedStreamOptions) {
        this.size = options.size;
        this.path = options.path;
        this.output = options.output;
    }
}