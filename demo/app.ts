import { FileSystemIndexedStream } from "../models/indexed-stream";
import { FileSystemIndexedStreamOptions } from "../models/indexed-stream-options";


(async() => {
    const options = new FileSystemIndexedStreamOptions({
        path: 'big_file/file.text',
        output: 'output1',
        size: 3
    });
    const indexed_stream = FileSystemIndexedStream.create(options);
    indexed_stream.splitToChunks();
    indexed_stream.compressChunks('output1', 'output2');
})();