import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { APP_CATALOG, Category, AppItem } from "../data/apps";
import {
  activateBlocking,
  deactivateBlocking,
  BlockTarget,
} from "../lib/blockingService";

const FOCUS_KEY = "focus_end_at";
const SCREEN_WIDTH = Dimensions.get("window").width;
const ICON_SIZE = (SCREEN_WIDTH - 40 - 40) / 5;

// ─── 앱 아이콘 컴포넌트 ─────────────────────────────────────────
function AppIconButton({
  app,
  selected,
  onToggle,
}: {
  app: AppItem;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.appIconWrap}
      onPress={() => onToggle(app.id)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.appIcon,
          { backgroundColor: selected ? app.color : "#f4f4f5" },
        ]}
      >
        <Text
          style={[
            styles.appIconText,
            { color: selected ? "#fff" : app.color },
          ]}
        >
          {app.icon}
        </Text>
      </View>
      {selected && <View style={[styles.checkBadge, { backgroundColor: app.color }]}><Text style={styles.checkMark}>✓</Text></View>}
      <Text style={styles.appName} numberOfLines={1}>
        {app.name}
      </Text>
    </TouchableOpacity>
  );
}

// ─── 카테고리 섹션 ──────────────────────────────────────────────
function CategorySection({
  category,
  selectedAppIds,
  onToggleApp,
  onToggleAll,
}: {
  category: Category;
  selectedAppIds: Set<string>;
  onToggleApp: (id: string) => void;
  onToggleAll: (categoryId: string) => void;
}) {
  const allSelected = category.apps.every((app) =>
    selectedAppIds.has(app.id),
  );

  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitleRow}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryCount}>
            {category.apps.filter((a) => selectedAppIds.has(a.id)).length}/
            {category.apps.length}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleAllBtn, allSelected && styles.toggleAllActive]}
          onPress={() => onToggleAll(category.id)}
        >
          <Text
            style={[
              styles.toggleAllText,
              allSelected && styles.toggleAllTextActive,
            ]}
          >
            {allSelected ? "전체 해제" : "전체 차단"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.appGrid}>
        {category.apps.map((app) => (
          <AppIconButton
            key={app.id}
            app={app}
            selected={selectedAppIds.has(app.id)}
            onToggle={onToggleApp}
          />
        ))}
      </View>
    </View>
  );
}

// ─── 메인 대시보드 ──────────────────────────────────────────────
export default function DashboardScreen() {
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
  const [customUrls, setCustomUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [focusEndAt, setFocusEndAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [focusLoading, setFocusLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 저장된 타이머 복원
  useEffect(() => {
    AsyncStorage.getItem(FOCUS_KEY).then((val) => {
      if (val) {
        const end = Number(val);
        if (!Number.isNaN(end) && end > Date.now()) {
          setFocusEndAt(end);
          setRemaining(Math.floor((end - Date.now()) / 1000));
        } else {
          AsyncStorage.removeItem(FOCUS_KEY);
        }
      }
    });
  }, []);

  // 카운트다운
  useEffect(() => {
    if (!focusEndAt) return;

    timerRef.current = setInterval(() => {
      const diff = Math.floor((focusEndAt - Date.now()) / 1000);
      if (diff <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setFocusEndAt(null);
        setRemaining(0);
        AsyncStorage.removeItem(FOCUS_KEY);
        deactivateBlocking();
        Alert.alert("집중 모드 종료", "수고하셨습니다! 차단이 해제되었습니다.");
      } else {
        setRemaining(diff);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [focusEndAt]);

  // Supabase에서 저장된 차단 목록 불러오기
  useEffect(() => {
    loadSavedBlockList();
  }, []);

  const loadSavedBlockList = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("blocked_urls")
      .select("url")
      .eq("user_id", user.id);

    if (data) {
      const urls = data.map((row: { url: string }) => row.url);
      setCustomUrls(urls);
    }
  };

  const toggleApp = useCallback((id: string) => {
    setSelectedAppIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllInCategory = useCallback(
    (categoryId: string) => {
      const cat = APP_CATALOG.find((c) => c.id === categoryId);
      if (!cat) return;

      setSelectedAppIds((prev) => {
        const next = new Set(prev);
        const allSelected = cat.apps.every((a) => next.has(a.id));
        cat.apps.forEach((a) => {
          if (allSelected) next.delete(a.id);
          else next.add(a.id);
        });
        return next;
      });
    },
    [],
  );

  const handleAddUrl = async () => {
    const url = newUrl.trim();
    if (!url) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("blocked_urls").insert({ url, user_id: user.id });
    setCustomUrls((prev) => [url, ...prev]);
    setNewUrl("");
  };

  const handleRemoveUrl = async (url: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("blocked_urls")
      .delete()
      .eq("url", url)
      .eq("user_id", user.id);

    setCustomUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleStartFocus = async () => {
    if (selectedAppIds.size === 0 && customUrls.length === 0) {
      Alert.alert("차단 대상 없음", "앱이나 URL을 먼저 선택/추가해 주세요.");
      return;
    }

    setFocusLoading(true);

    const target: BlockTarget = {
      appIds: Array.from(selectedAppIds),
      customUrls,
    };

    const durationMinutes = 240; // 4시간
    const result = await activateBlocking(target, durationMinutes);

    if (!result.success) {
      Alert.alert("차단 실패", result.error ?? "알 수 없는 오류");
      setFocusLoading(false);
      return;
    }

    const fourHours = durationMinutes * 60 * 1000;
    const endAt = Date.now() + fourHours;

    setFocusEndAt(endAt);
    setRemaining(Math.floor(fourHours / 1000));
    await AsyncStorage.setItem(FOCUS_KEY, String(endAt));
    setFocusLoading(false);
  };

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (v: number) => v.toString().padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const totalSelected =
    selectedAppIds.size + customUrls.length;

  const isFocusActive = focusEndAt !== null && remaining > 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── 상단 헤더 ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Focus Block</Text>
          <Text style={styles.headerSub}>
            {isFocusActive
              ? `집중 모드 진행 중 · ${totalSelected}개 차단`
              : `${totalSelected}개 선택됨`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => supabase.auth.signOut()}
        >
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 타이머 + 집중 시작 ── */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>
            {isFocusActive ? "남은 시간" : "4시간 집중 모드"}
          </Text>
          <Text style={styles.timerValue}>
            {isFocusActive ? formatTime(remaining) : "04:00:00"}
          </Text>
          <Text style={styles.timerDescription}>
            {isFocusActive
              ? "선택한 앱과 사이트가 기기 수준에서 차단되었습니다.\nVPN으로도 우회할 수 없습니다."
              : "시작하면 선택한 앱/사이트가 OS 수준에서 차단됩니다.\niOS Screen Time · Android Local VPN 기반 강력 차단"}
          </Text>
          <TouchableOpacity
            style={[
              styles.focusBtn,
              isFocusActive && styles.focusBtnActive,
              focusLoading && styles.focusBtnDisabled,
            ]}
            onPress={isFocusActive ? undefined : handleStartFocus}
            disabled={focusLoading || isFocusActive}
          >
            <Text style={styles.focusBtnText}>
              {focusLoading
                ? "활성화 중..."
                : isFocusActive
                ? "차단 진행 중"
                : "4시간 집중 모드 시작"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 카테고리별 앱 그리드 ── */}
        {APP_CATALOG.map((cat) => (
          <CategorySection
            key={cat.id}
            category={cat}
            selectedAppIds={selectedAppIds}
            onToggleApp={toggleApp}
            onToggleAll={toggleAllInCategory}
          />
        ))}

        {/* ── 커스텀 URL 입력 ── */}
        <View style={styles.urlSection}>
          <Text style={styles.sectionTitle}>직접 URL 추가</Text>
          <Text style={styles.sectionDesc}>
            위 목록에 없는 사이트를 직접 입력하여 차단할 수 있습니다.
          </Text>
          <View style={styles.urlInputRow}>
            <TextInput
              style={styles.urlInput}
              placeholder="예: namu.wiki"
              placeholderTextColor="#a1a1aa"
              autoCapitalize="none"
              keyboardType="url"
              value={newUrl}
              onChangeText={setNewUrl}
              onSubmitEditing={handleAddUrl}
            />
            <TouchableOpacity
              style={[
                styles.urlAddBtn,
                !newUrl.trim() && styles.urlAddBtnDisabled,
              ]}
              onPress={handleAddUrl}
              disabled={!newUrl.trim()}
            >
              <Text style={styles.urlAddBtnText}>추가</Text>
            </TouchableOpacity>
          </View>

          {customUrls.length > 0 && (
            <View style={styles.urlList}>
              {customUrls.map((url) => (
                <View key={url} style={styles.urlItem}>
                  <Text style={styles.urlItemText} numberOfLines={1}>
                    {url}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveUrl(url)}>
                    <Text style={styles.urlRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── 차단 원리 안내 ── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>왜 VPN으로 뚫리지 않나요?</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoBullet}>iOS</Text>
            <Text style={styles.infoText}>
              Apple Screen Time API로 OS 커널 수준에서 차단합니다. 네트워크
              계층이 아닌 시스템 계층에서 앱/사이트 접근을 막기 때문에 VPN, 프록시,
              DNS 변경으로 우회가 불가능합니다.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoBullet}>Android</Text>
            <Text style={styles.infoText}>
              기기의 유일한 VPN 슬롯을 차단용 로컬 VPN이 점유합니다. 다른 VPN
              앱이 동시에 작동할 수 없으며, 해제 시도를 감지하면 즉시
              재활성화합니다.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── 스타일 ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafafa" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#18181b" },
  headerSub: { fontSize: 12, color: "#71717a", marginTop: 2 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: { fontSize: 12, fontWeight: "500", color: "#71717a" },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  // 타이머 카드
  timerCard: {
    backgroundColor: "#18181b",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  timerLabel: { fontSize: 13, color: "#a1a1aa", fontWeight: "500" },
  timerValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    fontVariant: ["tabular-nums"],
    marginVertical: 8,
  },
  timerDescription: {
    fontSize: 12,
    color: "#71717a",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  focusBtn: {
    backgroundColor: "#10b981",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  focusBtnActive: { backgroundColor: "#ef4444" },
  focusBtnDisabled: { opacity: 0.6 },
  focusBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // 카테고리
  categorySection: { marginBottom: 20 },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  categoryIcon: { fontSize: 16 },
  categoryName: { fontSize: 15, fontWeight: "700", color: "#18181b" },
  categoryCount: { fontSize: 12, color: "#a1a1aa", marginLeft: 4 },
  toggleAllBtn: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  toggleAllActive: { backgroundColor: "#18181b", borderColor: "#18181b" },
  toggleAllText: { fontSize: 11, fontWeight: "600", color: "#71717a" },
  toggleAllTextActive: { color: "#fff" },

  appGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  // 앱 아이콘
  appIconWrap: {
    width: ICON_SIZE,
    alignItems: "center",
    marginBottom: 4,
  },
  appIcon: {
    width: ICON_SIZE - 8,
    height: ICON_SIZE - 8,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  appIconText: { fontSize: 18, fontWeight: "800" },
  checkBadge: {
    position: "absolute",
    top: -2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fafafa",
  },
  checkMark: { color: "#fff", fontSize: 10, fontWeight: "700" },
  appName: { fontSize: 10, color: "#52525b", marginTop: 4, textAlign: "center" },

  // URL 입력
  urlSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#18181b" },
  sectionDesc: {
    fontSize: 12,
    color: "#a1a1aa",
    marginTop: 4,
    marginBottom: 12,
  },
  urlInputRow: { flexDirection: "row", gap: 8 },
  urlInput: {
    flex: 1,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#18181b",
  },
  urlAddBtn: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  urlAddBtnDisabled: { opacity: 0.4 },
  urlAddBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  urlList: { marginTop: 12, gap: 6 },
  urlItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fafafa",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  urlItemText: { fontSize: 13, color: "#3f3f46", flex: 1 },
  urlRemove: { fontSize: 14, color: "#a1a1aa", paddingLeft: 8 },

  // 안내 카드
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#18181b",
    marginBottom: 12,
  },
  infoRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  infoBullet: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "#18181b",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  infoText: { fontSize: 12, color: "#52525b", lineHeight: 18, flex: 1 },
});
