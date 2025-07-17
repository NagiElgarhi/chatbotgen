
export enum Status {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR',
}

export interface Message {
  speaker: 'user' | 'ai';
  // A user message will only have `text`.
  text?: string; 
  // An AI message will have the following properties.
  textParts?: string[];
  spokenSummary?: string;
  suggestedQuestions?: string[];
}


export interface Knowledge {
  texts: string[];
  files: string[];
}

export interface Bot {
  id: string;
  name: string;
  welcome_message: string;
  knowledge?: Knowledge;
  created_at: string;
  updated_at: string;
  admin_pass: string;
  image_base64?: string | null;
  wavy_color?: string | null;
}

export interface Product {
  id: number;
  name: string;
  product_url: string;
  details: string;
  company_name: string;
  company_url: string;
  created_at: string;
}