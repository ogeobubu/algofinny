export declare function isPDFParserAvailable(): boolean;
export declare function isPDFBuffer(buffer: Buffer): boolean;
export declare function initializePDFParser(): Promise<boolean>;
export declare function parsePDFBuffer(buffer: Buffer): Promise<string>;
