#!/bin/bash
# Confirm the public anon key cannot read privileged tables.
AK=$(netlify env:get NEXT_PUBLIC_SUPABASE_ANON_KEY --context production 2>/dev/null | tr -d '[:space:]')
echo "anon key length: ${#AK}"
for t in leads lead_drafts properties acquisition_offers analytics_events markets; do
  printf '%-22s -> ' "$t"
  curl -s "https://pezcnknuivsgqyeyhzgi.supabase.co/rest/v1/$t?select=*&limit=1" \
    -H "apikey: $AK" -H "Authorization: Bearer $AK" | head -c 120
  echo
done
