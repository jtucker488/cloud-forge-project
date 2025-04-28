declare module 'pdfjs-dist/legacy/build/pdf' {
  export const version: string;
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  export function getDocument(data: ArrayBuffer): {
    promise: Promise<{
      numPages: number;
      getPage(pageNumber: number): Promise<{
        getTextContent(): Promise<{
          items: Array<{ str: string }>;
        }>;
      }>;
    }>;
  };
}

declare module 'pdfjs-dist/legacy/build/pdf.worker.entry'; 