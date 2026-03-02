import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";

type AuthMode = "login" | "signup";

export default function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("입력 오류", "이메일과 비밀번호를 모두 입력해 주세요.");
      return;
    }

    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (error) Alert.alert("로그인 실패", error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });
      if (error) {
        Alert.alert("회원가입 실패", error.message);
      } else {
        Alert.alert(
          "회원가입 완료",
          "이메일 인증 링크를 확인한 뒤 로그인해 주세요.",
        );
        setMode("login");
      }
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Focus Block</Text>
        <Text style={styles.subtitle}>
          {mode === "login"
            ? "집중을 방해하는 앱과 사이트를 차단하세요."
            : "새 계정을 만들어 시작하세요."}
        </Text>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "login" && styles.toggleActive]}
            onPress={() => setMode("login")}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "login" && styles.toggleTextActive,
              ]}
            >
              로그인
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "signup" && styles.toggleActive]}
            onPress={() => setMode("signup")}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "signup" && styles.toggleTextActive,
              ]}
            >
              회원가입
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#a1a1aa"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          placeholder="6자 이상 비밀번호"
          placeholderTextColor="#a1a1aa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === "login" ? "로그인" : "회원가입"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#18181b",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#71717a",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#a1a1aa",
  },
  toggleTextActive: {
    color: "#18181b",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3f3f46",
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#18181b",
    marginBottom: 14,
  },
  button: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
