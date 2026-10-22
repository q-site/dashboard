# Persoonlijk Dashboard · volledige installatie

Dit is de hele installatie in één keer, voor een nieuw en leeg Supabase-project. Heb je fase 2 en 3 al geïnstalleerd, volg dan alleen `INSTRUCTIE-fase-4.md`.

Je hebt geen terminal nodig. Alles gaat via supabase.com en github.com.

## Bestanden

| Bestand | Waar |
| --- | --- |
| `index.html`, `admin.html`, `sw.js`, `manifest.json`, `favicon.png` | hoofdmap van je GitHub-repository |
| `update-1.0.sql`, `update-1.1.sql`, `update-1.2.sql` | alleen in de SQL Editor van Supabase |
| `functions/sync-rooster/index.ts`, `functions/send-reminders/index.ts` | alleen in de Edge Functions van Supabase |

De SQL-bestanden, functies en instructies hoeven niet op GitHub.

## 1. Supabase-project

1. Maak op supabase.com een nieuw project.
2. **Authentication > Sign In / Providers**: zet **Email** aan.
3. **Authentication > URL Configuration**: zet bij **Site URL** het adres van je site, bijvoorbeeld `https://jouwnaam.github.io/dashboard/`.
4. Kopieer bij **Project Settings > API Keys** de **Publishable key** (`sb_publishable_...`) en bij **Project Settings > Data API** de **Project URL**. De **secret key** gebruik je nergens.

## 2. De database

Draai in **SQL Editor > New query** deze drie bestanden, één voor één en in deze volgorde, telkens met **Run**:

1. `update-1.0.sql`
2. `update-1.1.sql`
3. `update-1.2.sql`

Elk bestand mag je veilig vaker draaien.

## 3. De site koppelen en uploaden

1. Vul bovenin het script van `index.html` en van `admin.html` dezelfde twee waarden in:

   ```js
   const SUPABASE_URL = 'https://jouwproject.supabase.co';
   const SUPABASE_KEY = 'sb_publishable_...';
   ```

2. Upload `index.html`, `admin.html`, `sw.js`, `manifest.json` en `favicon.png` met **Add file > Upload files**, allemaal in de hoofdmap, en klik **Commit changes**.
3. Zet GitHub Pages aan bij **Settings > Pages** (bron: de hoofdtak, map `/ (root)`).
4. Open de site en maak je account aan.

## 4. Jezelf beheerder maken

Draai in de SQL Editor, met je eigen e-mailadres:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'jouw@email.nl'
on conflict do nothing;
```

De beheerpagina staat op `.../admin`. Er is nergens een knop naartoe, en de toegang wordt in de database gecontroleerd.

## 5. Somtoday-rooster (functie sync-rooster)

1. **Edge Functions > Deploy a new function > Via Editor**, naam `sync-rooster`.
2. Plak de inhoud van `functions/sync-rooster/index.ts` en klik **Deploy function**.
3. Zet bij **Details** de JWT-controle (**Verify JWT with legacy secret**) uit en sla op.

## 6. Herinneringen (functie send-reminders)

1. Maak op de beheerpagina bij **Pushsleutels** een sleutelpaar.
2. Haal het geheim voor de geplande taak op:

   ```sql
   select value from private.settings where key = 'reminders_secret';
   ```

3. Zet bij **Edge Functions > Secrets**: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:` met je e-mailadres) en `CRON_SECRET`.
4. **Deploy a new function > Via Editor**, naam `send-reminders`, plak `functions/send-reminders/index.ts`, deploy, en zet ook hier de JWT-controle uit.
5. Zet bij **Database > Extensions** `pg_cron` en `pg_net` aan en draai:

   ```sql
   select private.schedule_reminders('https://jouwproject.supabase.co');
   ```

6. In `index.html` hoef je niets te veranderen: de app vraagt de publieke sleutel zelf op bij de functie.
7. Test in de app: **Instellingen > Meldingen > Aanzetten > Testmelding sturen**.

## 7. Updatemeldingen publiceren

Open de beheerpagina, kies de nieuwste melding, zet **Gepubliceerd** aan en sla op. Nieuwe gebruikers krijgen de rondleiding in plaats van de melding.

## Hoe de beveiliging werkt

1. In de bestanden op GitHub staan geen wachtwoorden of geheimen. De publishable key en de publieke VAPID-sleutel mogen openbaar zijn.
2. Alle controle zit in de database (Row Level Security). De app gaat ervan uit dat iemand de API ook rechtstreeks kan aanroepen.
3. Kolomrechten: je mag je naam en deelkeuzes wijzigen, maar geen eigen vriendcode verzinnen. Bij een aanmoediging mag alleen "gezien" veranderen.
4. Functies die meer zien dan de gebruiker zelf zijn `security definer`, met een vast zoekpad en zonder uitvoerrecht voor `public` of `anon`.
5. Vrienden lezen nooit jouw tabellen, alleen de korte samenvatting die jij deelt.
6. Alles wat iemand anders heeft ingetypt, verschijnt als gewone tekst.
