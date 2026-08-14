export type InterpreterSpeaker = "traveler" | "local";

export type InterpreterTurn = {
  id: string;
  conversationId: string;
  speaker: InterpreterSpeaker;
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  translatedText: string;
  sourceAudioUrl: string;
  translatedAudioUrl: string;
  sourceMimeType: string;
  translatedMimeType: string;
  createdAt: string;
};

export type InterpreterConversation = {
  id: string;
  travelerLanguage: string;
  localLanguage: string;
  title: string | null;
  turns?: InterpreterTurn[];
  createdAt: string;
  updatedAt: string;
};
