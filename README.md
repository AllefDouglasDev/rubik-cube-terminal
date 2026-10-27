# cubo

Timer de cubo mágico que roda só no terminal. Node, sem dependências.

```
node bin/cubo.js      # ou `cubo`, pelo wrapper dos dotfiles
npm test
```

| Tecla | O que faz |
|---|---|
| segurar espaço | prepara: vermelho, e verde após 0,5 s |
| soltar espaço | começa (soltar antes do verde cancela) |
| espaço | para e grava o tempo |
| ↑ ↓ | seleciona um tempo na lista |
| d, depois y | apaga o tempo selecionado |
| t | mostra/oculta o tempo durante a execução |
| q, ctrl+c | sai |

À esquerda ficam os 3 melhores tempos de todo o histórico e os 7 últimos.

## Soltar o espaço

Terminais não avisam quando uma tecla é solta. O cubo pede o protocolo de teclado do kitty (Alacritty,
kitty, WezTerm, Ghostty), que manda o release de verdade. Dentro do tmux esse evento não chega, e o
cubo deduz o release pela repetição automática do teclado: quando as repetições param, o espaço foi
solto, e o início é retroagido para logo depois da última repetição. O erro fica em torno de um
intervalo de repetição (30 ms no padrão do macOS). A repetição de teclas precisa estar ligada.

## Arquivos

- Tempos: `${XDG_DATA_HOME:-~/.local/share}/cubo/solves.json`
- Configuração: `${XDG_CONFIG_HOME:-~/.config}/cubo/config.json`

`CUBO_DATA_DIR` e `CUBO_CONFIG_DIR` trocam as pastas. Os arquivos são gravados a cada tempo, com
escrita atômica; um arquivo corrompido é renomeado para `*.corrupt-<data>`, nunca sobrescrito.
