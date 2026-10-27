# Gera docs/demo/demo.gif: `vhs docs/demo/demo.tape`, na raiz do repositório.
# Usa um histórico de exemplo numa pasta temporária; os seus tempos não são tocados.

Output docs/demo/demo.gif

Set Shell bash
Set FontSize 16
Set Width 1200
Set Height 640
Set Padding 20
Set Theme "Catppuccin Mocha"
Set TypingSpeed 0

Hide
Type 'export CUBO_DATA_DIR=$(mktemp -d) CUBO_CONFIG_DIR=$(mktemp -d); cp docs/demo/solves.json $CUBO_DATA_DIR/; clear; node bin/cubo.js'
Enter
Sleep 1s
Show
Sleep 1.5s

# Segura o espaço: press, pausa da repetição automática e repetições
Space
Sleep 250ms
Space@30ms 25
Sleep 3s
Space
Sleep 2s

# Um tempo inválido: seleciona e apaga
Down
Sleep 400ms
Down@300ms 3
Sleep 400ms
Up@300ms 3
Sleep 600ms
Type "d"
Sleep 1.2s
Type "y"
Sleep 1.5s
Escape

# Oculta o tempo durante a execução
Type "t"
Sleep 800ms
Space
Sleep 250ms
Space@30ms 25
Sleep 2s
Space
Sleep 2.5s
Type "t"
Sleep 500ms
