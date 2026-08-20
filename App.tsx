import { StatusBar } from "expo-status-bar";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, I18nManager, Linking, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import type { WebViewProgressEvent } from "react-native-webview/lib/WebViewTypes";

// The wrapped Bloom web application loads Vazirmatn itself; the native shell
// explicitly enables Persian RTL so loading/error surfaces match the web UI.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }) });
const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL ?? "https://bloomplan-sfqewszz.manus.space";
const LOAD_TIMEOUT_MS = 20_000;

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;
  const current = await Notifications.getPermissionsAsync();
  const status = current.status === "granted" ? current.status : (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return null;
  const token = await Notifications.getExpoPushTokenAsync({ projectId: "23e48afd-8f1c-4dfd-a915-75948af175b7" });
  return token.data;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const failureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const documentStartedRef = useRef(false);
  const clearFailureTimer = useCallback(() => {
    if (failureTimerRef.current) clearTimeout(failureTimerRef.current);
    failureTimerRef.current = null;
  }, []);

  useEffect(() => {
    void registerForPushNotificationsAsync().then(setPushToken).catch(() => setPushToken(null));
    const received = Notifications.addNotificationReceivedListener(() => undefined);
    const response = Notifications.addNotificationResponseReceivedListener(event => {
      const url = event.notification.request.content.data?.url;
      if (typeof url === "string") void Linking.openURL(url);
    });
    return () => { received.remove(); response.remove(); };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!documentStartedRef.current) {
        setLoading(false);
        setFailed(true);
      }
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [webViewKey]);

  const reload = useCallback(() => {
    setFailed(false);
    setLoading(true);
    setWebViewKey(value => value + 1);
  }, []);
  const openInBrowser = useCallback(() => {
    void Linking.openURL(WEB_APP_URL);
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
    if (event.nativeEvent.progress >= 0.1) {
      documentStartedRef.current = true;
      clearFailureTimer();
      setFailed(false);
    }
    if (event.nativeEvent.progress >= 0.6) setLoading(false);
  }, [clearFailureTimer]);
  const handoffPushToken = useCallback(() => {
    if (!pushToken) return;
    const encoded = JSON.stringify(pushToken);
    webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('bloom-native-push-token',{detail:{token:${encoded},platform:'android'}})); true;`);
  }, [pushToken]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          key={webViewKey}
          source={{ uri: WEB_APP_URL }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          cacheMode="LOAD_DEFAULT"
          originWhitelist={["*"]}
          onLoadStart={() => { documentStartedRef.current = false; clearFailureTimer(); setLoading(true); setFailed(false); }}
          onLoadProgress={handleProgress}
          onLoadEnd={() => { documentStartedRef.current = true; clearFailureTimer(); setLoading(false); setFailed(false); handoffPushToken(); }}
          onError={() => { clearFailureTimer(); failureTimerRef.current = setTimeout(() => { if (!documentStartedRef.current) { setLoading(false); setFailed(true); } }, 5000); }}
          // Do not treat subresource/API HTTP errors as a failed document; the web app can still render and let the user sign in.
          onShouldStartLoadWithRequest={handleNavigation}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          cacheEnabled={false}
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
        />
          {loading && <View pointerEvents="none" style={styles.overlay}><Loading /></View>}
        {failed && <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>اتصال به Bloom Planner برقرار نشد</Text>
          <Text style={styles.errorText}>بارگذاری داخل برنامه طول کشید. ممکن است WebView گوشی با این صفحه سازگار نباشد؛ اینترنت گوشی لزوماً قطع نیست.</Text>
          <View style={styles.actions}><Text onPress={reload} style={styles.retry}>تلاش دوباره</Text><Text onPress={openInBrowser} style={styles.browserButton}>باز کردن در مرورگر</Text></View>
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
  loadingText: { color: "#7c3045", fontSize: 15, textAlign: "center", writingDirection: "rtl" },
  errorCard: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: "#fffaf6" },
  errorTitle: { color: "#512435", fontSize: 21, fontWeight: "700", textAlign: "center", writingDirection: "rtl", marginBottom: 10 },
  errorText: { color: "#805f68", fontSize: 15, lineHeight: 24, textAlign: "center", writingDirection: "rtl", marginBottom: 20 },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  retry: { color: "#fffaf6", backgroundColor: "#7c3045", paddingVertical: 13, paddingHorizontal: 22, borderRadius: 14, overflow: "hidden", fontWeight: "700" },
  browserButton: { color: "#7c3045", borderColor: "#7c3045", borderWidth: 1, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14, overflow: "hidden", fontWeight: "700" },
});
