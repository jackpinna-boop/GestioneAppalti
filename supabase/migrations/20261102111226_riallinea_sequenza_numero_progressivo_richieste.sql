-- La sequenza identity di richieste_intervento.numero_progressivo era rimasta
-- al valore iniziale (dopo rollback/reimportazione del 22/09) mentre la tabella
-- contiene già i numeri 1..4: ogni nuova richiesta (gestionale o Portale Scuola)
-- falliva per chiave duplicata finché la sequenza non superava il massimo.
-- Riallinea la sequenza al massimo esistente. Nessun dato modificato.
select setval(
  pg_get_serial_sequence('public.richieste_intervento', 'numero_progressivo'),
  greatest((select coalesce(max(numero_progressivo), 0) from public.richieste_intervento), 1),
  (select count(*) > 0 from public.richieste_intervento)
);
