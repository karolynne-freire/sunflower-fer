# 🌻 Sunflower Vision

> **Artefato Tecnológico — Disciplina de Inteligência Artificial**  
> *Inspirado no projeto de pesquisa de Iniciação Científica (PIBIC) do IFPE*  
> Desenvolvido por: Karolynne Freire (ADS IFPE)

O **Sunflower** é um ecossistema tecnológico projetado para auxiliar crianças no reconhecimento e expressão de suas emoções. Através de uma interface lúdica, moderna e acessível, o aplicativo utiliza Inteligência Artificial para realizar a inferência de expressões faciais em tempo real, servindo como uma ferramenta de tecnologia assistiva para crianças com Transtorno do Espectro Autista (TEA).

---

## 🚀 Funcionalidades Principais

- **Identificação da Criança:** Fluxo de entrada simplificado focado na experiência do usuário (UX).
- **Detecção de Emoções Baseada em IA:** Captura de imagem via câmera frontal e processamento local utilizando um modelo TensorFlow Lite (`.tflite`).
- **Feedback Visual Lúdico:** Exibição de cards customizados que traduzem a emoção identificada de forma amigável para o público-alvo.
- **Logs de Debug em Tempo Real:** Tela de monitoramento técnico integrada para acompanhamento do ciclo de inferência do modelo.

---

## 🛠️ Tecnologias Utilizadas

O aplicativo foi desenvolvido utilizando as ferramentas mais modernas do ecossistema Full-Stack/Mobile:

- **Framework Principal:** [React Native](https://reactnative.dev/) com [Expo (SDK 51+)](https://expo.dev/)
- **Roteamento:** Expo Router (Navegação baseada em arquivos)
- **Linguagem:** TypeScript
- **Inteligência Artificial:** `react-native-fast-tflite` (Inferência de alta performance para modelos TensorFlow Lite)
- **Manipulação de Imagem:** `expo-image-manipulator` (Redimensionamento de frames para 96x96 pixels)
- **Persistência de Dados Local:** `@react-native-async-storage/async-storage`

---

## 📂 Estrutura do Projeto (Arquitetura)

```text
src/
├── app/
│   ├── _layout.tsx      # Configuração de rotas globais (Stack Navigation)
│   ├── index.tsx        # Tela de Login / Entrada
│   └── camera.tsx       # Tela principal de captura e inferência de IA
├── assets/
│   └── modelo_emocoes_quant.tflite  # Modelo de IA quantizado para dispositivos móveis
├── components/
│   └── EmocaoCard.tsx   # Componente visual para exibição das emoções detectadas
└── hooks/
    └── useModel.ts      # Hook customizado para carregamento assíncrono do TFLite

```

---

## 🔧 Como Executar o Projeto Localmente

### Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

* [Node.js](https://nodejs.org/) (Versão LTS)
* [EAS CLI](https://docs.expo.dev/build/introduction/) (`npm install -g eas-cli`)
* Ambiente Android configurado (Android Studio / SDK)

### Passo a Passo

1. **Clone o repositório:**
```bash
git clone https://github.com/karolynne-freire/sunflower-fer.git
cd sunflower-app

```


2. **Instale as dependências:**
```bash
npm install

```


3. **Gere os arquivos nativos (Prebuild):**
```bash
npx expo prebuild --platform android

```


4. **Inicie o servidor de desenvolvimento (Expo Go):**
```bash
npx expo start

```
---

## ⚙️ Processamento de Inferência (Como funciona)

O ciclo de reconhecimento ocorre a cada **2.5 segundos** para garantir fluidez e estabilidade no dispositivo:

1. **Captura:** O frame é capturado pela câmera frontal via `CameraView`.
2. **Redimensionamento:** A imagem é reduzida para uma matriz de `96x96` pixels para compatibilidade com o formato de entrada da rede neural.
3. **Normalização:** Os bytes em RGB são decodificados a partir de Base64 para um array de floats (`Float32Array`) variando de `-1.0` a `1.0`.
4. **Inferência:** O modelo TFLite quantizado processa os dados de forma síncrona nativa (`model.runSync`) e retorna as probabilidades da emoção correspondente.

---

## 📝 Licença e Contexto Acadêmico

Este software é fruto de um projeto de Iniciação Científica (PIBIC) desenvolvido no âmbito do **IFPE (Instituto Federal de Pernambuco)**. Esta versão foca na entrega da primeira arquitetura estável do artefato tecnológico.

---
