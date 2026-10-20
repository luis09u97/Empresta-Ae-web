# Empresta Aê

Painel web para a administração de equipamentos escolares. A experiência é focada na gestão de inventário, empréstimos e manutenção; o aplicativo de professores não faz parte deste escopo.

## Tecnologias

- HTML semântico, CSS e JavaScript puro
- Aplicação estática, sem build, dependências ou backend
- Dados demonstrativos guardados no navegador

## Como abrir

Sirva esta pasta com qualquer servidor HTTP estático e acesse o endereço local informado pelo servidor. Por exemplo, com Python disponível:

```sh
python -m http.server 4173
```

Depois abra `http://localhost:4173`. O servidor é necessário para carregar os módulos JavaScript do navegador.

## Escopo da demonstração

O painel administrativo apresenta indicadores de disponibilidade, empréstimos recentes, itens que precisam de atenção e acesso ao inventário. Os dados são locais e demonstrativos; autenticação, sincronização entre dispositivos e armazenamento compartilhado exigem um backend.
