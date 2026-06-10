import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { EMOCOES } from "../constants/emocoes";

interface Props {
  indice: number;
  confianca: number;
}

export function EmocaoCard({ indice, confianca }: Props) {
  const emocao = EMOCOES[indice];
  if (!emocao) return null;

  const pct = Math.round(confianca * 100);

  return (
    <View style={[styles.card, { borderColor: emocao.cor }]}>
      <Text style={styles.emoji}>{emocao.emoji}</Text>
      <Text style={[styles.nome, { color: emocao.cor }]}>{emocao.nome}</Text>
      <Text style={styles.confianca}>{pct}% de confiança</Text>

      <View style={styles.barraFundo}>
        <View
          style={[
            styles.barraPreenchida,
            { width: `${pct}%`, backgroundColor: emocao.cor },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFDF0",
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    alignItems: "center",
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 6,
  },
  nome: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 4,
  },
  confianca: {
    fontSize: 16,
    color: "#888",
    marginBottom: 12,
  },
  barraFundo: {
    width: "100%",
    height: 10,
    backgroundColor: "#EEE",
    borderRadius: 5,
    overflow: "hidden",
  },
  barraPreenchida: {
    height: 10,
    borderRadius: 5,
  },
});
