import * as DocumentPicker from "expo-document-picker";
import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";
import {
    AlertCircle,
    Archive,
    ArrowLeft,
    CheckCircle2,
    Download,
    FileJson,
    FileText,
    Loader2,
    Moon,
    RefreshCw,
    Sun,
    Terminal,
    Upload
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Alert as RNAlert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from "react-native";

import { api } from "../lib/api";

// --- UI COMPONENTS ---

const Button = ({ onPress, variant = "default", size = "default", children, style, disabled }: any) => {
  const isDark = useColorScheme() === "dark";
  
  let bg = isDark ? "#ea580c" : "#ea580c"; // orange-600
  let text = "#ffffff";
  let border = "transparent";

  if (variant === "secondary") {
    bg = "#059669"; // emerald-600
  } else if (variant === "outline") {
    bg = "transparent";
    border = isDark ? "#3f3f46" : "#d4d4d8"; // zinc-700 / 300
    text = isDark ? "#f4f4f5" : "#18181b";
  } else if (variant === "ghost") {
    bg = "transparent";
    text = isDark ? "#a1a1aa" : "#71717a";
  } else if (variant === "destructive") {
    bg = "#dc2626";
  }

  const baseStyle = {
    flexDirection: "row" as const,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    borderWidth: variant === "outline" ? 1 : 0,
    borderColor: border,
    backgroundColor: disabled ? (isDark ? "#3f3f46" : "#e4e4e7") : bg,
    opacity: disabled ? 0.6 : 1,
    paddingHorizontal: size === "sm" ? 12 : 16,
    paddingVertical: size === "sm" ? 6 : 10,
    height: size === "sm" ? 32 : 44,
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[baseStyle, style]} activeOpacity={0.8}>
      {typeof children === "string" ? (
        <Text style={{ color: text, fontWeight: "700", textTransform: "uppercase", fontSize: 12 }}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const Card = ({ children, style, variantColor }: any) => {
  const isDark = useColorScheme() === "dark";
  // ✅ FIX: Define styles inside the component
  const styles = getStyles(isDark); 

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: isDark ? "#18181b" : "#ffffff",
        borderColor: isDark ? "#27272a" : "#e4e4e7",
        borderLeftColor: variantColor || (isDark ? "#27272a" : "#e4e4e7")
      }, 
      style
    ]}>
      {children}
    </View>
  );
};

const StatusAlert = ({ variant, message }: any) => {
  const isError = variant === "destructive";
  const bg = isError ? "#fef2f2" : "#ecfdf5"; // red-50 / emerald-50
  const border = isError ? "#f87171" : "#34d399";
  const text = isError ? "#dc2626" : "#059669";
  const Icon = isError ? AlertCircle : CheckCircle2;

  const isDark = useColorScheme() === "dark";
  // ✅ FIX: Define styles inside the component
  const styles = getStyles(isDark);

  const finalBg = isDark ? (isError ? "rgba(220, 38, 38, 0.1)" : "rgba(5, 150, 105, 0.1)") : bg;

  return (
    <View style={[styles.alert, { backgroundColor: finalBg, borderColor: border }]}>
      <Icon size={20} color={text} style={{ marginRight: 10 }} />
      <Text style={{ color: text, fontWeight: "600", flex: 1 }}>{message}</Text>
    </View>
  );
};

// --- MAIN SCREEN ---

export default function AdminDashboard() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState(systemScheme);
  const isDark = theme === "dark";
  
  const [authorized, setAuthorized] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Files
  const [remoteUploadedPdfs, setRemoteUploadedPdfs] = useState<string[]>([]);
  const [remoteGeneratedReports, setRemoteGeneratedReports] = useState<string[]>([]);
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);

  // Single Upload
  const [isSingleUploading, setIsSingleUploading] = useState(false);
  const [singleProgress, setSingleProgress] = useState(0);
  const [singleStatusMsg, setSingleStatusMsg] = useState("");

  // Bulk Upload
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkStatusMsg, setBulkStatusMsg] = useState("Waiting for upload...");
  const [bulkLog, setBulkLog] = useState<string[]>([]);
  const [bulkTotalFiles, setBulkTotalFiles] = useState(0);
  const [bulkProcessedFiles, setBulkProcessedFiles] = useState(0);

  // Messages
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const styles = getStyles(isDark);

  // 1. Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await api.user.getProfile().catch(() => null);
        if (user && user.role === 'admin') {
          setAuthorized(true);
          fetchRemoteFiles();
        } else {
          RNAlert.alert("Access Denied", "You must be an admin to view this page.", [
             { text: "OK", onPress: () => router.replace("/") }
          ]);
        }
      } catch (e) {
        // Cast to 'any' to fix router typing issue
        router.replace("/login" as any);
      } finally {
        setLoadingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // 2. Fetch Files
  async function fetchRemoteFiles() {
    setIsFetchingRemote(true);
    try {
      const data = await api.ingestion.list();
      setRemoteUploadedPdfs(Array.isArray(data.uploaded_pdfs) ? data.uploaded_pdfs : []);
      setRemoteGeneratedReports(Array.isArray(data.generated_reports) ? data.generated_reports : []);
    } catch (err) {
      console.log('Error fetching remote files', err);
    } finally {
      setIsFetchingRemote(false);
    }
  }

  // 3. Download Handler
  async function handleDownloadMd(filename: string) {
    try {
      setErrorMessage("");
      const apiUrl = api.ingestion.getDownloadUrl(filename);
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Failed to get download link");
      
      const data = await res.json();
      if (data.report_download_url) {
        Linking.openURL(data.report_download_url);
      } else {
        throw new Error("Download URL missing");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Download failed');
    }
  }

  // 4. Single File Picker & Upload
  const pickSingleFile = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true
      });

      if (result.canceled) return;
      
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || "application/pdf"
      };

      setIsSingleUploading(true);
      setSingleProgress(0);
      setSingleStatusMsg("Starting upload...");

      const interval = setInterval(() => {
          setSingleProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      try {
        await api.ingestion.uploadBulk(file as any, {
          onStatusUpdate: () => {},
          onError: (msg) => { throw new Error(msg) },
          onComplete: () => {}
        });
        
        clearInterval(interval);
        setSingleProgress(100);
        setSingleStatusMsg("Complete");
        setSuccessMessage("PDF successfully processed.");
        setTimeout(() => setIsSingleUploading(false), 1500);
        fetchRemoteFiles();

      } catch (e: any) {
        clearInterval(interval);
        setErrorMessage(e.message || "Upload failed");
        setIsSingleUploading(false);
      }

    } catch (err) {
      console.log(err);
      setIsSingleUploading(false);
    }
  };

  // 5. Bulk Picker & Upload
  const pickBulkFile = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: ["application/zip", "application/x-zip-compressed"],
            copyToCacheDirectory: true
        });

        if (result.canceled) return;
        const asset = result.assets[0];

        setIsBulkUploading(true);
        setBulkStatusMsg("Initializing...");
        setBulkLog([]);
        setBulkTotalFiles(0);
        setBulkProcessedFiles(0);

        const file = {
            uri: asset.uri,
            name: asset.name,
            type: "application/zip"
        };

        await api.ingestion.uploadBulk(file as any, {
            onStatusUpdate: (eventData) => {
                const time = new Date().toLocaleTimeString().split(" ")[0];
                let logMsg = "";
                
                switch (eventData.event) {
                    case "initialized":
                      logMsg = `Job ID: ${eventData.job_id?.slice(0, 8)}...`;
                      setBulkStatusMsg("Job Initialized");
                      break;
                    case "upload_complete":
                      setBulkStatusMsg("Source Uploaded");
                      break;
                    case "processing_started":
                      setBulkStatusMsg("Server Processing...");
                      break;
                    case "batch_start":
                      setBulkTotalFiles(eventData.total_files);
                      setBulkStatusMsg(`Processing...`);
                      break;
                    case "file_finished":
                      logMsg = `✓ ${eventData.filename}`;
                      setBulkProcessedFiles(prev => prev + 1);
                      break;
                    case "batch_completed":
                       if (eventData.stats) {
                         logMsg = `DONE. Success: ${eventData.stats.processed}`;
                         setBulkProcessedFiles(eventData.stats.processed + eventData.stats.failed); 
                       }
                      break;
                    case "error":
                      logMsg = `ERROR: ${eventData.error}`;
                      break;
                }
        
                if (logMsg) {
                  setBulkLog(prev => [`[${time}] ${logMsg}`, ...prev].slice(0, 20));
                }
            },
            onError: (msg) => {
                setErrorMessage(msg);
                setIsBulkUploading(false);
            },
            onComplete: (reportUrl) => {
                setBulkStatusMsg("Finished");
                setSuccessMessage("Batch processing finished.");
                setIsBulkUploading(false);
                fetchRemoteFiles();
                if (reportUrl) Linking.openURL(reportUrl);
            }
        });

    } catch (err) {
        console.log(err);
        setIsBulkUploading(false);
    }
  };

  if (loadingAuth) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text style={styles.loadingText}>Verifying Privileges...</Text>
      </View>
    );
  }

  if (!authorized) return null;

  const bulkPercentage = bulkTotalFiles > 0 
    ? Math.round((bulkProcessedFiles / bulkTotalFiles) * 100) 
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <ArrowLeft size={24} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PDF MANAGEMENT</Text>
        <TouchableOpacity onPress={() => setTheme(isDark ? "light" : "dark")}>
           {isDark ? <Sun size={24} color="#fff" /> : <Moon size={24} color="#000" />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {errorMessage ? <StatusAlert variant="destructive" message={errorMessage} /> : null}
        {successMessage ? <StatusAlert variant="success" message={successMessage} /> : null}

        <View style={styles.cardsContainer}>
           
           {/* SINGLE UPLOAD */}
           <Card variantColor="#ea580c" style={styles.uploadCard}>
              <View style={styles.cardHeader}>
                 <Upload size={20} color="#ea580c" />
                 <Text style={styles.cardTitle}>SINGLE UPLOAD</Text>
              </View>
              
              <TouchableOpacity 
                 onPress={pickSingleFile} 
                 disabled={isSingleUploading || isBulkUploading}
                 style={[styles.uploadBox, isSingleUploading && styles.uploadBoxActive]}
              >
                 <FileText size={32} color={isSingleUploading ? "#ea580c" : (isDark ? "#52525b" : "#d4d4d8")} />
                 <Text style={styles.uploadText}>{isSingleUploading ? "Processing..." : "Tap to Select PDF"}</Text>
              </TouchableOpacity>

              {isSingleUploading && (
                <View style={styles.progressContainer}>
                   <View style={styles.progressLabel}>
                      <Text style={styles.progressText}>{singleStatusMsg}</Text>
                      <Text style={[styles.progressText, { color: "#ea580c" }]}>{singleProgress}%</Text>
                   </View>
                   <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${singleProgress}%`, backgroundColor: "#ea580c" }]} />
                   </View>
                </View>
              )}
           </Card>

           {/* BULK UPLOAD */}
           <Card variantColor="#059669" style={styles.uploadCard}>
              <View style={styles.cardHeader}>
                 <Archive size={20} color="#059669" />
                 <Text style={styles.cardTitle}>BULK UPLOAD (ZIP)</Text>
              </View>
              
              <TouchableOpacity 
                 onPress={pickBulkFile} 
                 disabled={isSingleUploading || isBulkUploading}
                 style={[styles.uploadBox, isBulkUploading && { borderColor: "#059669", backgroundColor: isDark ? "rgba(5, 150, 105, 0.1)" : "#ecfdf5" }]}
              >
                 {isBulkUploading ? (
                    <Loader2 size={32} color="#059669" />
                 ) : (
                    <Archive size={32} color={isDark ? "#52525b" : "#d4d4d8"} />
                 )}
                 <Text style={styles.uploadText}>{isBulkUploading ? "Processing Batch..." : "Tap to Select ZIP"}</Text>
              </TouchableOpacity>

              {isBulkUploading && (
                <View style={styles.progressContainer}>
                   <View style={styles.progressLabel}>
                      <Text style={[styles.progressText, { color: "#059669" }]}>{bulkProcessedFiles}/{bulkTotalFiles}</Text>
                      <Text style={[styles.progressText, { color: "#059669" }]}>{bulkPercentage}%</Text>
                   </View>
                   <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${bulkPercentage}%`, backgroundColor: "#059669" }]} />
                   </View>
                   
                   <View style={styles.terminal}>
                      <View style={styles.terminalHeader}>
                         <Terminal size={12} color="#34d399" />
                         <Text style={styles.terminalTitle}>SERVER EVENTS</Text>
                      </View>
                      <ScrollView style={styles.terminalScroll} nestedScrollEnabled>
                         {bulkLog.map((log, i) => (
                            <Text key={i} style={styles.terminalText}>{log}</Text>
                         ))}
                      </ScrollView>
                   </View>
                </View>
              )}
           </Card>

        </View>

        <View style={styles.cardsContainer}>
           {/* UPLOADED PDFs */}
           <Card style={styles.listCard}>
              <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
                 <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
                    <FileText size={20} color="#ea580c" />
                    <Text style={styles.cardTitle}>PDFs ({remoteUploadedPdfs.length})</Text>
                 </View>
                 <TouchableOpacity onPress={fetchRemoteFiles}>
                    <RefreshCw size={16} color={isDark ? "#a1a1aa" : "#71717a"} />
                 </TouchableOpacity>
              </View>
              <View style={styles.listContainer}>
                 {remoteUploadedPdfs.length === 0 && <Text style={styles.emptyText}>No files found.</Text>}
                 {remoteUploadedPdfs.map((name) => (
                    <View key={name} style={styles.listItem}>
                       <Text style={styles.listText} numberOfLines={1}>{name}</Text>
                       <View style={styles.badge}>
                          <Text style={styles.badgeText}>SRC</Text>
                       </View>
                    </View>
                 ))}
              </View>
           </Card>
           
           {/* GENERATED REPORTS */}
           <Card style={styles.listCard}>
              <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
                 <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
                    <FileJson size={20} color="#059669" />
                    <Text style={styles.cardTitle}>Reports ({remoteGeneratedReports.length})</Text>
                 </View>
                 <TouchableOpacity onPress={fetchRemoteFiles}>
                    <RefreshCw size={16} color={isDark ? "#a1a1aa" : "#71717a"} />
                 </TouchableOpacity>
              </View>
              <View style={styles.listContainer}>
                 {remoteGeneratedReports.length === 0 && <Text style={styles.emptyText}>No reports found.</Text>}
                 {remoteGeneratedReports.map((name) => (
                    <View key={name} style={styles.listItem}>
                       <Text style={styles.listText} numberOfLines={1}>{name}</Text>
                       <Button 
                         variant="secondary" 
                         size="sm" 
                         onPress={() => handleDownloadMd(name)}
                         style={{ height: 28, paddingHorizontal: 8 }}
                       >
                          <Download size={12} color="#fff" style={{marginRight: 4}} />
                          <Text style={{color:'#fff', fontSize: 10, fontWeight: 'bold'}}>DL</Text>
                       </Button>
                    </View>
                 ))}
              </View>
           </Card>

        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES ---

// ✅ FIX: Changed const to function to allow hoisting
function getStyles(isDark: boolean) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? "#09090b" : "#f8fafc",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#71717a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#27272a" : "#e2e8f0",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: isDark ? "#fff" : "#0f172a",
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 16,
  },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4, 
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadCard: {},
  listCard: {},
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: isDark ? "#fff" : "#0f172a",
    letterSpacing: 0.5,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: isDark ? "#3f3f46" : "#e2e8f0", 
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? "#18181b" : "#f8fafc",
  },
  uploadBoxActive: {
    borderColor: "#ea580c",
    backgroundColor: isDark ? "rgba(234, 88, 12, 0.1)" : "#fff7ed", 
  },
  uploadText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: isDark ? "#a1a1aa" : "#64748b",
    textTransform: "uppercase",
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressText: {
    fontSize: 10,
    fontWeight: "700",
    color: isDark ? "#a1a1aa" : "#64748b",
    textTransform: "uppercase",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: isDark ? "#27272a" : "#e2e8f0",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 99,
  },
  terminal: {
    marginTop: 12,
    backgroundColor: "#09090b",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 8,
  },
  terminalHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
    paddingBottom: 4,
    marginBottom: 4,
    gap: 6,
  },
  terminalTitle: {
    fontSize: 10,
    color: "#34d399",
    fontWeight: "700",
    letterSpacing: 1,
  },
  terminalScroll: {
    height: 80,
  },
  terminalText: {
    color: "#34d399",
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
  },
  listContainer: {
    maxHeight: 200,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#27272a" : "#f1f5f9",
  },
  listText: {
    fontSize: 12,
    color: isDark ? "#d4d4d8" : "#334155",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: isDark ? "#27272a" : "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: isDark ? "#3f3f46" : "#e2e8f0",
  },
  badgeText: {
    fontSize: 10,
    color: isDark ? "#a1a1aa" : "#64748b",
    fontWeight: "700",
  },
  emptyText: {
    fontStyle: 'italic',
    color: isDark ? "#52525b" : "#94a3b8",
    fontSize: 12,
    textAlign: 'center',
    padding: 12,
  }
});
}