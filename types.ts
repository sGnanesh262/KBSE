
export interface DocumentFile {
  name: string;
  content: string;
}

export enum Sender {
    USER = 'user',
    AI = 'ai',
}

export interface ChatMessage {
  sender: Sender;
  text: string;
}
