export type GenerationState =
  | "idle"
  | "loading"
  | "streaming"
  | "complete"
  | "error";

export interface GenerationProgress {
  stage: string;
  percent: number;
  message: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

export interface GenerationResult {
  files: GeneratedFile[];
  projectName: string;
  description: string;
  supabaseSchema: string;
  packageJson: string;
}
