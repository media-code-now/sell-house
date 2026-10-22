#!/bin/bash
# End-to-end smoke test of the public lead funnel against production.
# Creates a draft through step 6 and attempts a submit.
BASE="https://sellhomefastvegas.com"
ORIGIN="-H Origin:$BASE"
T=$(uuidgen | tr 'A-Z' 'a-z')
echo "draftToken=$T"
echo "$T" > /tmp/e2e-token.txt

post() {
  curl -s -o /tmp/e2e-body.txt -w "%{http_code}" -X POST "$BASE$1" \
    -H 'Content-Type: application/json' -H "Origin: $BASE" -d "$2"
}

A='"address":"742 Evergreen Terrace, Las Vegas, NV 89101"'
for step in 1 2 3 4 5 6; do
  case $step in
    1) ANS="{$A}";;
    2) ANS="{$A,\"propertyType\":\"Single Family\"}";;
    3) ANS="{$A,\"propertyType\":\"Single Family\",\"condition\":\"Good\"}";;
    4) ANS="{$A,\"propertyType\":\"Single Family\",\"condition\":\"Good\",\"reasons\":[\"Relocating\"]}";;
    5) ANS="{$A,\"propertyType\":\"Single Family\",\"condition\":\"Good\",\"reasons\":[\"Relocating\"],\"timeline\":\"1-3 months\"}";;
    6) ANS="{$A,\"propertyType\":\"Single Family\",\"condition\":\"Good\",\"reasons\":[\"Relocating\"],\"timeline\":\"1-3 months\",\"estimatedValue\":\"350000\"}";;
  esac
  code=$(post "/api/leads/draft/" "{\"draftToken\":\"$T\",\"step\":$step,\"answers\":$ANS}")
  printf 'draft step %s -> %s %s\n' "$step" "$code" "$(head -c 120 /tmp/e2e-body.txt)"
done

echo "--- submit ---"
code=$(post "/api/leads/submit/" "{\"draftToken\":\"$T\",\"firstName\":\"Smoke\",\"lastName\":\"Test\",\"phone\":\"7025550123\",\"email\":\"smoke.test@example.com\",\"contactConsent\":true,\"marketingConsent\":false}")
printf 'submit -> %s %s\n' "$code" "$(head -c 200 /tmp/e2e-body.txt)"
