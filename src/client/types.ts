export type Role = "user" | "assistant";

export type ChatMessage = {
  role: Role;
  content: string;
};

/** UIに描画するメッセージ。送信中/エラーの状態を持つ。 */
export type DisplayMessage = ChatMessage & {
  id: string;
  /** ストリーミング受信中フラグ（カーソル点滅用） */
  streaming?: boolean;
  /** エラーメッセージ（赤字表示）。あると role に関係なくエラー扱い。 */
  error?: boolean;
};

export type ServerConfig = {
  model: string;
  host: string;
};
