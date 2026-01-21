// src/lib/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Configuration ---

// ✅ FIX: Use the specific IP found in your Metro logs (10.49.43.164).
// 'localhost' only works for iOS Simulators.
// '10.0.2.2' only works for Android Emulators.
// For Physical Devices, you MUST use your computer's LAN IP.
const LAN_IP = "10.49.43.164"; 

const API_BASE_URL = `http://${LAN_IP}:8000/api/v1`; 
const INGESTION_BASE_URL = "https://hammad712-ingestion.hf.space";

export { API_BASE_URL, INGESTION_BASE_URL };

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
  refresh_token?: string; // Optional because some backends might not send it
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
  
  // ✅ FIX: Safely save tokens only if they exist
  if (data.access_token) {
    await AsyncStorage.setItem("accessToken", data.access_token);
  }
  
  if (data.refresh_token) {
    await AsyncStorage.setItem("refreshToken", data.refresh_token);
  }
  
  if (data.user) {
    await AsyncStorage.setItem("user", JSON.stringify(data.user));
  }
  
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
      
      // Fallback: Just read text (no stream effect but functional for RN fetch)
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
                  if (parsed.error) {
                    onError(parsed.error);
                  } else if (parsed.content) {
                    onChunk(parsed.content, parsed.thread_id);
                  }
              } catch(e) {}
           }
      });
      
      // Since we aren't truly streaming in this fetch implementation, call Done at the end
      onDone();

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Stream stopped by user");
        onDone(); 
      } else {
        onError(err.message || "Stream failed");
      }
    }
  },

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
      onDone();
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error("Edit stream failed", err);
    }
  },
  
  getAvatarImage: async (avatarPath: string) => {
      if (avatarPath.startsWith('http')) return avatarPath;
      return `${API_BASE_URL}/${avatarPath}`;
  }
};