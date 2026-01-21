// src/lib/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// --- Configuration ---
// Note: In Expo, use Constants.expoConfig.extra.apiUrl if strictly needed, 
// or hardcode for dev. For Android Emulator, use 10.0.2.2 instead of localhost.
const LOCAL_IP = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_BASE_URL = "http://" + LOCAL_IP + ":8000/api/v1"; 
const INGESTION_BASE_URL = "https://hammad712-ingestion.hf.space";

// --- Types & Interfaces ---

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: "user" | "admin"; 
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  refresh_token: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}

export interface Message {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  is_summarized: boolean;
}

// React Native File Type
export interface RNFile {
  uri: string;
  name: string;
  type: string;
}

// --- Helper: Auth Headers ---
const getHeaders = async (isJson = true) => {
  const headers: HeadersInit = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
};

// --- Helper: Generic Fetch Wrapper ---
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const authHeaders = await getHeaders(options.headers?.hasOwnProperty("Content-Type") ? false : true);
  
  const config = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "API Request Failed");
  }

  if (response.status === 204) return null as T;

  return response.json();
}

// ==========================================
// 🔐 AUTH METHODS
// ==========================================

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  
  // Save tokens immediately upon success
  await AsyncStorage.setItem("accessToken", data.access_token);
  await AsyncStorage.setItem("refreshToken", data.refresh_token);
  // Store user object as string
  await AsyncStorage.setItem("user", JSON.stringify(data.user));
  
  return data;
}

export async function signup(full_name: string, email: string, password: string): Promise<User> {
  return request<User>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name }),
  });
}

// ==========================================
// 📂 FILE INGESTION UTILITY
// ==========================================

export interface BulkIngestionCallbacks {
  onStatusUpdate: (event: any) => void;
  onError: (message: string) => void;
  onComplete: (reportUrl: string | null) => void;
}

// React Native Implementation of Bulk Ingestion
export const ingestBulkDocument = async (
  file: RNFile,
  callbacks: BulkIngestionCallbacks
) => {
  const { onStatusUpdate, onError, onComplete } = callbacks;

  if (!file || !file.uri) {
    onError("No file provided");
    return;
  }

  const formData = new FormData();
  // React Native requires the file object to look exactly like this:
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type || 'application/pdf',
  } as any);

  try {
    // Note: React Native's fetch implementation does not support ReadableStream properly
    // for streaming responses (SSE) out of the box on Android/iOS without extra libraries 
    // like 'react-native-sse' or 'react-native-fetch-api'.
    // However, for this implementation, we will try standard fetch.
    // If stream fails, consider using `react-native-event-source` for SSE endpoints.
    
    const response = await fetch(`${INGESTION_BASE_URL}/process/process-document`, {
      method: "POST",
      body: formData,
      // React Native sets Content-Type multipart/form-data automatically with boundary
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = "Upload failed";
      try {
        const jsonErr = JSON.parse(errText);
        errMsg = jsonErr.detail || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    // WARNING: React Native fetch() creates a basic text response, not a stream
    // unless using a polyfill. The following code assumes a text stream is mocked or 
    // valid in your specific RN environment (e.g. Expo SDK 50+ has better fetch support).
    
    // Fallback: Read full text if streaming isn't supported
    const text = await response.text();
    const lines = text.split("\n\n");

    for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.replace("data: ", "").trim();
          if (!jsonStr) continue;
          try {
            const eventData = JSON.parse(jsonStr);
            onStatusUpdate(eventData);

            if (eventData.event === "batch_completed") {
              onComplete(eventData.master_report_url);
              return;
            }
            if (eventData.event === "completed") {
              onComplete(eventData.report_url);
              return;
            }
            if (eventData.event === "fatal_error" || eventData.event === "error") {
              onError(eventData.error || "Unknown processing error");
              return;
            }
          } catch (e) {
            console.warn("Failed to parse SSE event:", jsonStr);
          }
        }
    }

  } catch (err: any) {
    onError(err.message || "Network error during bulk processing");
  }
};


// ==========================================
// 🚀 MAIN API OBJECT
// ==========================================

export const api = {
  
  auth: {
    login, 
    signup, 
    logout: async () => {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("user");
      // In React Native, you handle navigation outside via a Router hook or context
      // e.g. router.replace('/login')
    },
    // Add helper to retrieve user from storage
    getMe: async () => {
        const userStr = await AsyncStorage.getItem("user");
        return userStr ? JSON.parse(userStr) : null;
    }
  },

  user: {
    getProfile: () => 
      request<User>("/users/me"),
    
    updateProfile: (data: { full_name?: string; avatar_url?: string; password?: string }) => 
      request<User>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  chat: {
    list: () => 
      request<ChatSession[]>("/chat/history"),

    getDetails: (threadId: string) => 
      request<Message[]>(`/chat/history/${threadId}`),

    delete: (threadId: string) => 
      request<{ status: string; id: string }>(`/chat/history/${threadId}`, {
        method: "DELETE",
      }),

    rename: (threadId: string, title: string) => 
      request<{ id: string; title: string }>(`/chat/history/${threadId}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      }),
  },

  ingestion: {
    list: async () => {
      const res = await fetch(`${INGESTION_BASE_URL}/files/list`);
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json();
    },
    
    getDownloadUrl: (filename: string) => {
      return `${INGESTION_BASE_URL}/files/download?filename=${encodeURIComponent(filename)}`;
    },

    delete: async (filename: string) => {
      const res = await fetch(`${INGESTION_BASE_URL}/files/${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete file");
      }
      return res.json();
    },

    rename: async (oldFilename: string, newFilename: string) => {
      const res = await fetch(`${INGESTION_BASE_URL}/files/${encodeURIComponent(oldFilename)}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_filename: newFilename }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to rename file");
      }
      return res.json();
    },

    uploadBulk: ingestBulkDocument
  },

  // --- Message Handling ---
  // Note: Streaming in React Native fetch requires careful handling or external libs.
  // This logic works if the RN environment polyfills TextDecoder/fetch-stream.
  streamMessage: async (
    message: string, 
    threadId: string | null,
    onChunk: (content: string, threadId?: string) => void,
    onError: (error: string) => void,
    onDone: () => void,
    signal?: AbortSignal
  ) => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${API_BASE_URL}/chat/message/stream`, {
        method: "POST",
        headers: headers as any,
        body: JSON.stringify({ message, thread_id: threadId }),
        signal: signal, 
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Stream connection failed");
      }
      
      // Fallback for RN: if `response.body` (ReadableStream) isn't available
      // we might need to await response.text() which defeats the purpose of streaming.
      // Or use a library like `react-native-sse` or `react-native-fetch-api` polyfill.
      
      // Assuming a valid environment (like newer Expo or polyfilled fetch):
      if ((response as any).body) {
        // @ts-ignore
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") {
                onDone();
                return;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  onError(parsed.error);
                } else if (parsed.content) {
                  onChunk(parsed.content, parsed.thread_id);
                }
              } catch (e) { }
            }
          }
        }
      } else {
        // Fallback: Just read text (no stream effect but functional)
        const text = await response.text();
        const lines = text.split("\n\n");
        lines.forEach(line => {
             if (line.startsWith("data: ")) {
                const dataStr = line.replace("data: ", "").trim();
                if (dataStr === "[DONE]") {
                    onDone();
                    return;
                }
                try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.content) onChunk(parsed.content, parsed.thread_id);
                } catch(e) {}
             }
        });
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Stream stopped by user");
        onDone(); 
      } else {
        onError(err.message || "Stream failed");
      }
    }
  },

  // Simplified non-streaming edit for RN to reduce complexity
  editMessage: async (
    messageId: string, 
    newContent: string,
    onChunk: (content: string) => void,
    onDone: () => void,
    signal?: AbortSignal
  ) => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${API_BASE_URL}/chat/message/edit`, {
        method: "POST",
        headers: headers as any,
        body: JSON.stringify({ message_id: messageId, new_content: newContent }),
        signal: signal,
      });

      // Reading text directly for simplicity in RN context
      const text = await response.text();
      const lines = text.split("\n\n");
      
      for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") {
              onDone();
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.content) onChunk(parsed.content);
            } catch {}
          }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error("Edit stream failed", err);
    }
  },
  
  // Helper to get image function
  getAvatarImage: async (avatarPath: string) => {
      // If it's a full URL, return it
      if (avatarPath.startsWith('http')) return avatarPath;
      // If it's a relative path from your backend
      return `${API_BASE_URL}/${avatarPath}`;
  }
};