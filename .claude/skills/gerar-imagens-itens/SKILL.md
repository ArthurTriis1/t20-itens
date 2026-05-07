---
name: gerar-imagens-itens
description: Gera imagens para itens do itens.json que têm ao menos um Local definido mas não têm nome_arquivo_imagem. Chama o /banana para cada item, salva em public/images/ e atualiza o JSON.
---

## Objetivo

Gerar imagens ilustradas para itens de Tormenta 20 que ainda não têm imagem, mas já estão associados a um local de venda.

## Passo a passo

### 1. Identificar os itens alvo

Execute o script abaixo para listar os itens sem imagem:

```bash
python3 -c "
import json
with open('public/itens.json') as f:
    items = json.load(f)
targets = [i for i in items if i.get('Local') and not i.get('nome_arquivo_imagem','').strip()]
for i in targets:
    print(i['Equipamento'], '|', i.get('Descrição','')[:120])
"
```

### 2. Gerar cada imagem com /banana

Para cada item da lista, invoque o `/banana` com um prompt no seguinte formato:

> Ilustração de RPG de fantasia medieval no estilo de livro Tormenta 20 (arte brasileira, tons sérios e épicos).
> Item: **{Equipamento}**
> Descrição: {Descrição}
> Sem texto, sem UI, sem moldura — apenas o objeto isolado em fundo neutro escuro.

### 3. Salvar a imagem

Salve o arquivo gerado em `public/images/` com o nome em snake_case derivado do nome do item, usando extensão `.png`. Exemplos:

- "Óleo" → `oleo.png`
- "Estojo de disfarces" → `estojo_de_disfarces.png`
- "Bruma sonolenta" → `bruma_sonolenta.png`

Para normalizar o nome, remova acentos, substitua espaços por `_` e converta para minúsculas.

### 4. Atualizar o JSON

Após salvar cada imagem, atualize o campo `nome_arquivo_imagem` do item correspondente em `public/itens.json` com o nome do arquivo gerado (sem o caminho `public/images/`).

## Observações

- Processe um item por vez para garantir que cada imagem seja revisada antes de avançar.
- Se o /banana não conseguir gerar uma imagem satisfatória, tente refinar o prompt e tente novamente antes de pular o item.
- Mantenha consistência visual entre os itens do mesmo local (ex: itens do Bazar Sombrio devem ter tom mais sombrio/sinistro).
