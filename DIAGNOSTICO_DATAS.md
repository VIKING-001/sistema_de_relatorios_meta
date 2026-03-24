# Diagnóstico do Problema de Datas

## Problema Identificado
O sistema não está salvando corretamente o período de datas selecionado. Quando o usuário seleciona um período específico (ex: 31/01/2026 a 27/02/2026), o sistema salva datas aleatórias ou diferentes.

## Causa Provável
O problema está na conversão de datas entre o frontend (formato ISO string) e o backend (formato Date). Quando o usuário seleciona uma data no input type="date", o navegador retorna uma string no formato "YYYY-MM-DD" (ex: "2026-01-31"). Ao criar um novo Date() com essa string, pode haver problemas de timezone que causam a data ser interpretada como UTC e depois convertida para o timezone local, resultando em uma data diferente.

## Solução
Implementar um parser de datas que garanta que a data seja interpretada corretamente no timezone local do usuário, sem conversão de timezone.

## Arquivos Afetados
- client/src/components/ReportForm.tsx (linhas 62-63)
- client/src/components/EditReportModal.tsx (quando for criado)
- server/db.ts (função updateReport - linhas 206-214)

## Código Problemático
```typescript
// Frontend
startDate: new Date(startDate),  // "2026-01-31" -> pode virar 2026-01-30 em alguns timezones
endDate: new Date(endDate),
```

## Solução Implementada
Criar função que parse a data corretamente sem conversão de timezone:
```typescript
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
```
