import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function Login() {
  const [nome, setNome] = useState("");
  const router = useRouter();

  async function entrar() {
    if (!nome.trim()) return;
    await AsyncStorage.setItem("nomeCrianca", nome.trim());
    router.push("/camera");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.logo}>🌻</Text>
      <Text style={styles.titulo}>Sunflower</Text>
      <Text style={styles.subtitulo}>
        Reconhecimento de emoções para crianças com TEA
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nome da criança"
        placeholderTextColor="#BBB"
        value={nome}
        onChangeText={setNome}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={entrar}
      />

      <TouchableOpacity
        style={[styles.botao, !nome.trim() && styles.botaoDesabilitado]}
        onPress={entrar}
        disabled={!nome.trim()}
      >
        <Text style={styles.botaoTexto}>Começar →</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFDF0",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  logo: {
    fontSize: 72,
    marginBottom: 8,
  },
  titulo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#E6A817",
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 20,
  },
  input: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E6A817",
    padding: 16,
    fontSize: 18,
    color: "#333",
    marginBottom: 16,
  },
  botao: {
    width: "100%",
    backgroundColor: "#E6A817",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  botaoDesabilitado: {
    backgroundColor: "#DDD",
  },
  botaoTexto: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
