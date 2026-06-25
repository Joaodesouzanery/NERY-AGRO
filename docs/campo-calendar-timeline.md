# Campo > Calendário: Linha do Tempo

Implementação atual:

- O Calendário lê ciclos e talhões existentes em `field_records` pelo adapter `src/features/campo-calendar/api/talhao360-calendar-adapter.ts`.
- Eventos operacionais continuam vindo de `module = calendar-event`.
- Registros antigos `module = calendario` continuam entrando pelo adapter legado do Calendário.
- Eventos manuais existentes do Talhão 360 (`module = talhao360-event`) são exibidos como marcos preservados, sem cópia para `calendar-event` e sem gravação em `talhao360-event`.
- O modelo consolidado evita duplicação quando um `calendar-event` aponta para `relatedRecordId` de um evento manual do Talhão 360.

Patch futuro pequeno no Talhão 360, ainda não aplicado:

1. Exportar um snapshot público de leitura com talhões, ciclos, alertas e eventos manuais já normalizados.
2. Reutilizar esse snapshot no Calendário no lugar do parsing direto de `field_records`.
3. Manter `buildTalhao360Model` como agregador interno por talhão, sem exigir que o Calendário chame essa função.

Esse patch deve ser feito em `src/features/talhao-360/**` em uma fase separada.
