import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import type { WebViewProgressEvent } from "react-native-webview/lib/WebViewTypes";

const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL ?? "https://bloomplan-sfqewszz.manus.space";
const LOAD_TIMEOUT_MS = 12_000;

export default function App() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [webViewKey]);

  const reload = useCallback(() => {
    setFailed(false);
    setLoading(true);
    setWebViewKey(value => value + 1);
  }, []);

  const handleNavigation = useCallback((request: WebViewNavigation) => {
    const target = request.url;
    if (target.startsWith("mailto:") || target.startsWith("tel:") || target.startsWith("intent:")) {
      void Linking.openURL(target);
      return false;
    }
    return true;
  }, []);

  const handleProgress = useCallback((event: WebViewProgressEvent) => {
    if (event.nativeEvent.progress >= 0.6) setLoading(false);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <WebView
          key={webViewKey}
          source={{ uri: WEB_APP_URL }}
          originWhitelist={["*"]}
          onLoadStart={() => { setLoading(true); setFailed(false); }}
          onLoadProgress={handleProgress}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setFailed(true); }}
          onHttpError={() => { setLoading(false); setFailed(true); }}
          onShouldStartLoadWithRequest={handleNavigation}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
        />
        {loading && <View pointerEvents="none" style={styles.overlay}><Loading /></View>}
        {failed && <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>اتصال به Bloom Planner برقرار نشد</Text>
          <Text style={styles.errorText}>اتصال اینترنت یا آدرس نسخه آنلاین برنامه در دسترس نیست.</Text>
          <Text onPress={reload} style={styles.retry}>تلاش دوباره</Text>
        </View>}
      </View>
    </SafeAreaView>
  );
}

function Loading() {
  return <View style={styles.loading}><ActivityIndicator size="large" color="#7c3045" /><Text style={styles.loadingText}>در حال آماده‌سازی Bloom Planner…</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fffaf6" },
  container: { flex: 1, backgroundColor: "#fffaf6" },
  overlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "#fffaf6" },
  loading: { alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
  loadingText: { color: "#7c3045", fontSize: 15, textAlign: "center" },
  errorCard: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: "#fffaf6" },
  errorTitle: { color: "#512435", fontSize: 21, fontWeight: "700", textAlign: "center", marginBottom: 10 },
  errorText: { color: "#805f68", fontSize: 15, lineHeight: 24, textAlign: "center", marginBottom: 20 },
  retry: { color: "#fffaf6", backgroundColor: "#7c3045", paddingVertical: 13, paddingHorizontal: 28, borderRadius: 14, overflow: "hidden", fontWeight: "700" },
});
