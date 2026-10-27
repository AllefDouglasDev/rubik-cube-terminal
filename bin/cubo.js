#!/usr/bin/env node
import { run } from "../src/app.js";

const arg = process.argv[2];
if (arg === "-h" || arg === "--help") {
  process.stdout.write(`cubo — timer de cubo mágico no terminal

  segure espaço   prepara (vermelho → verde após 0,5 s)
  solte espaço    começa
  espaço          para e grava o tempo
  ↑ ↓             seleciona um tempo na lista
  d               apaga o tempo selecionado (pede y/n)
  t               mostra/oculta o tempo durante a execução
  q, ctrl+c       sai

Dentro do tmux o terminal não avisa quando o espaço é solto: o cubo
deduz isso pela repetição automática do teclado, que precisa estar
ligada (Ajustes → Teclado → Repetição de teclas).

Tempos:  \${XDG_DATA_HOME:-~/.local/share}/cubo/solves.json
Config:  \${XDG_CONFIG_HOME:-~/.config}/cubo/config.json
`);
  process.exit(0);
}

run();
