import os, smtplib
from email.message import EmailMessage
pw = (os.environ.get("AJIO_MAIL_FETCH") or os.environ.get("GMAIL_APP_PASSWORD") or "").replace(" ", "")
msg = EmailMessage()
msg["From"] = "OfferLoom <contact.offerloom@gmail.com>"
msg["To"] = "customercare@ajio.com"
msg["Subject"] = "Re: AJIO ACE product feed access for OfferLoom — publisher 1072"
msg.set_content("""Hello Anika and the AJIO Customer Care team,

Thank you for your reply. To clarify: OfferLoom is not a seller and does not want to list products on AJIO. We are an existing AJIO ACE affiliate publisher (publisher ID 1072, campaign 1 "AJIO ACE PROGRAM(Final)") that sends shoppers to AJIO through our tracking links.

Our request is for affiliate product data: an authorised product feed or API (or a regular CSV/XML export) with product links, photos, selling price, MRP and availability, so we can show AJIO products on https://offerloom.offerloom.workers.dev/ with our ACE tracking links.

Could you please forward this to the AJIO ACE affiliate / partnerships team, or share their contact email?

Thank you,
OfferLoom
contact.offerloom@gmail.com
""")
with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
    s.login("contact.offerloom@gmail.com", pw)
    s.send_message(msg)
print("::notice title=AJIO follow-up::Sent to customercare@ajio.com")
