"""Import AJIO ACE campaign offers from AJIO Affiliate Support emails into D1.

Reads contact.offerloom@gmail.com over IMAP (read-only), accepts only messages
whose DKIM signature passes for mailer.ajio.in, and extracts offer rows of the
form "<title>  https://ajio.com/s/<short-code>". Sale dates come from the
subject, e.g. "(16th – 18th Oct)". Use --dry-run to print without writing.
"""
import datetime as dt, email, html as htmllib, imaplib, json, os, re, subprocess, sys
from email.header import decode_header, make_header
from email.utils import parsedate_to_datetime

DRY_RUN = "--dry-run" in sys.argv
LOOKBACK_DAYS = 21
CODE = re.compile(r"https?://(?:www\.)?ajio\.com/s/([a-z0-9]+(?:-curated)?-\d{6})\b", re.I)
MONTHS = {m: i for i, m in enumerate(["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"], 1)}
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))

def note(level, msg):
    print(f"::{level} title=AJIO mail offers::" + re.sub(r"[\r\n%]", " ", msg)[:900])

def text_of(fragment):
    return re.sub(r"\s+", " ", htmllib.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()

def sale_window(subject, sent):
    """Return (from, through) ISO dates from '(16th – 18th Oct)' style subjects."""
    m = re.search(r"\((\d{1,2})(?:st|nd|rd|th)?\s*(?:[A-Za-z]{3,9})?\s*[–\-to]+\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})", subject)
    if m:
        month = MONTHS.get(m.group(3)[:3].lower())
        if month:
            year = sent.year + (1 if month < sent.month - 6 else 0)
            start_month = month if int(m.group(1)) <= int(m.group(2)) else (month - 1 or 12)
            return dt.date(year, start_month, int(m.group(1))).isoformat(), dt.date(year, month, int(m.group(2))).isoformat()
    day = sent.astimezone(IST).date()
    return day.isoformat(), (day + dt.timedelta(days=3)).isoformat()

def campaign_name(subject):
    m = re.search(r"(AJIO [A-Z][\w&' ]*?Sale)", subject)
    return (m.group(1) if m else "AJIO offers").strip()

def dkim_ok(msg):
    auth = " ".join(msg.get_all("Authentication-Results", []))
    return bool(re.search(r"dkim=pass header\.(?:i|d)=@?mailer\.ajio\.in\b", auth))

def offers_from(msg):
    found = {}
    for part in msg.walk():
        if part.get_content_type() != "text/html":
            continue
        body = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", "replace")
        for row in re.findall(r"<tr[^>]*>((?:(?!<tr).)*?)</tr>", body, re.S | re.I):
            text = text_of(row)
            codes = CODE.findall(text)
            if len(codes) != 1:
                continue
            title = CODE.sub("", text).strip(" -–|:")
            if 3 <= len(title) <= 120:
                found[codes[0].lower()] = title
    return found

def main():
    password = (os.environ.get("AJIO_MAIL_FETCH") or os.environ.get("GMAIL_APP_PASSWORD") or "").replace(" ", "")
    if not password:
        note("error", "No Gmail app password secret (AJIO_MAIL_FETCH or GMAIL_APP_PASSWORD)"); return 1
    imap = imaplib.IMAP4_SSL("imap.gmail.com")
    imap.login(os.environ.get("GMAIL_USER", "contact.offerloom@gmail.com"), password)
    imap.select('"[Gmail]/All Mail"', readonly=True)
    since = (dt.date.today() - dt.timedelta(days=LOOKBACK_DAYS)).strftime("%d-%b-%Y")
    _, data = imap.search(None, f'(FROM "mailer.ajio.in" SINCE {since})')
    offers, checked, rejected = {}, 0, 0
    for mid in data[0].split():
        _, raw = imap.fetch(mid, "(BODY.PEEK[])")
        msg = email.message_from_bytes(raw[0][1])
        checked += 1
        if not dkim_ok(msg):
            rejected += 1; continue
        subject = str(make_header(decode_header(msg.get("Subject", ""))))
        sent = parsedate_to_datetime(msg.get("Date"))
        start, through = sale_window(subject, sent)
        for code, title in offers_from(msg).items():
            # Later emails win, so titles/dates follow AJIO's most recent update.
            offers[code] = {"code": code, "title": title, "campaign": campaign_name(subject), "from": start, "through": through, "msgid": (msg.get("Message-ID") or "")[:200], "sent": sent.isoformat()}
    imap.logout()
    today = dt.datetime.now(IST).date().isoformat()
    current = [o for o in offers.values() if o["through"] >= today]
    note("notice", f"Checked {checked} AJIO emails ({rejected} failed DKIM); {len(offers)} offers parsed, {len(current)} still running")
    for o in sorted(offers.values(), key=lambda o: o["through"], reverse=True)[:15]:
        note("notice", f"{o['from']}..{o['through']} {o['campaign']}: {o['title']} -> {o['code']}")
    if DRY_RUN or not offers:
        return 0
    q = lambda s: "'" + str(s).replace("'", "''") + "'"
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    sql = "\n".join(
        f"INSERT INTO ajio_campaign_offers (short_code,title,campaign,valid_from,valid_through,source_message_id,updated_at) VALUES ({q(o['code'])},{q(o['title'])},{q(o['campaign'])},{q(o['from'])},{q(o['through'])},{q(o['msgid'])},{q(now)}) "
        "ON CONFLICT(short_code) DO UPDATE SET title=excluded.title,campaign=excluded.campaign,valid_from=excluded.valid_from,valid_through=excluded.valid_through,source_message_id=excluded.source_message_id,updated_at=excluded.updated_at;"
        for o in offers.values())
    os.makedirs("outputs", exist_ok=True)
    with open("outputs/ajio-offers.sql", "w") as fh:
        fh.write(sql + "\n")
    subprocess.run(["npx", "wrangler", "d1", "execute", "offerloom", "--remote", "--file", "outputs/ajio-offers.sql"], check=True, stdout=subprocess.DEVNULL)
    note("notice", f"Published {len(offers)} AJIO offers to D1")
    return 0

if __name__ == "__main__":
    sys.exit(main())
