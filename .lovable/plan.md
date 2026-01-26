
# Plano: Adicionar Opção "Todos" aos Filtros

## Objetivo
Adicionar uma opção "Todos" (All) nos três filtros de busca - Armador, Porto de Origem e Porto de Destino - permitindo que o usuário visualize todos os registros sem filtrar por um valor específico.

## Comportamento Esperado
- Quando "Todos" for selecionado, o filtro será ignorado na busca
- A opção "Todos" aparecerá sempre como primeira opção em cada dropdown
- O texto será traduzido para os três idiomas (PT: "Todos", EN: "All", ES: "Todos")
- Os filtros continuarão funcionando de forma cascata (POL depende de Carrier, POD depende de Carrier+POL)

## Mudanças Necessárias

### 1. Componente TariffFilters
**Arquivo:** `src/components/TariffFilters.tsx`

Adicionar uma opção "Todos" em cada um dos três selects:
- Usar um valor especial (ex: `"__all__"`) para identificar a seleção de "Todos"
- Tratar a seleção de "Todos" chamando o onChange com string vazia, que já é tratado como "sem filtro"

```text
Carrier Select:
├── "Todos" (primeira opção)
└── Lista de armadores...

POL Select:
├── "Todos" (primeira opção)  
└── Lista de portos de origem...

POD Select:
├── "Todos" (primeira opção)
└── Lista de portos de destino...
```

### 2. Tratamento de Seleção
Quando o usuário selecionar "Todos":
- O valor passado para `onCarrierChange`, `onPolChange` ou `onPodChange` será uma string vazia (`""`)
- A lógica existente em `useTariffs` já ignora filtros vazios, então não precisa de mudanças

---

## Detalhes Técnicos

### Modificações no TariffFilters.tsx

Para cada Select (Carrier, POL, POD):

1. Adicionar `SelectItem` com valor `"__all__"` antes dos itens da lista
2. Criar handler wrapper que converte `"__all__"` para `""` antes de chamar o onChange original
3. Ajustar o `value` do Select para mostrar `"__all__"` quando o valor real for vazio

```tsx
// Exemplo de handler para Carrier:
const handleCarrierChange = (value: string) => {
  onCarrierChange(value === "__all__" ? "" : value);
};

// No Select:
<Select 
  value={carrier || "__all__"} 
  onValueChange={handleCarrierChange}
>
  <SelectContent>
    <SelectItem value="__all__">{t("common.all")}</SelectItem>
    {carriers.map((c) => (
      <SelectItem key={c} value={c}>{c}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Arquivos de Tradução
As traduções já existem:
- PT: `"common.all": "Todos"` ✓
- EN: `"common.all": "All"` (verificar/adicionar)
- ES: `"common.all": "Todos"` (verificar/adicionar)
