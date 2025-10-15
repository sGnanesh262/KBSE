import { DocumentFile } from '../types';

// Declare pdfjsLib globally as it's loaded from a CDN script
declare const pdfjsLib: any;

const parsePdfFile = (file: File): Promise<DocumentFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target && event.target.result instanceof ArrayBuffer) {
        try {
          const pdf = await pdfjsLib.getDocument({ data: event.target.result }).promise;
          let content = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            content += textContent.items.map((item: any) => item.str).join(' ');
            content += '\n'; // Add a newline between pages
          }
          resolve({
            name: file.name,
            content: content.trim(),
          });
        } catch (error) {
          reject(new Error(`Error parsing PDF file: ${file.name}. ${error instanceof Error ? error.message : String(error)}`));
        }
      } else {
        reject(new Error(`Failed to read PDF file as ArrayBuffer: ${file.name}`));
      }
    };
    reader.onerror = () => {
      reject(new Error(`Error reading file: ${file.name}`));
    };
    reader.readAsArrayBuffer(file);
  });
};

const parseTxtFile = (file: File): Promise<DocumentFile> => {
    return new Promise<DocumentFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && typeof event.target.result === 'string') {
            resolve({
              name: file.name,
              content: event.target.result,
            });
          } else {
            reject(new Error(`Failed to read file: ${file.name}`));
          }
        };
        reader.onerror = () => {
          reject(new Error(`Error reading file: ${file.name}`));
        };
        reader.readAsText(file);
      });
}

export const parseFiles = (files: FileList): Promise<DocumentFile[]> => {
  const promises: Promise<DocumentFile>[] = [];

  for (const file of Array.from(files)) {
    if (file.type === 'text/plain') {
      promises.push(parseTxtFile(file));
    } else if (file.type === 'application/pdf') {
      promises.push(parsePdfFile(file));
    }
    // Silently ignore unsupported file types
  }

  return Promise.all(promises);
};
