import os, smtplib
from email.message import EmailMessage
pw = (os.environ.get("AJIO_MAIL_FETCH") or os.environ.get("GMAIL_APP_PASSWORD") or "").replace(" ", "")
msg = EmailMessage()
msg["From"] = "OfferLoom <contact.offerloom@gmail.com>"
msg["To"] = "customercare@ajio.com"
msg["Subject"] = "AJIO ACE product feed access for OfferLoom — publisher 1072"
msg.set_content("""Hello AJIO team,

Please route this request to the AJIO ACE affiliate team. We operate OfferLoom (https://offerloom.offerloom.workers.dev/) and have active campaign 1, AJIO ACE PROGRAM(Final), under publisher 1072.

We want to display individual AJIO products with approved photos, selling prices, MRP, discounts, availability and affiliate deep links on our website. Our previous Trackier deals request returned no deals, and the campaign's BAU Creative folder contains promotional artwork rather than a product catalogue.

Please enable an authorized product feed/API or provide a regularly updated CSV/XML export, including image usage permissions, permitted website placements and refresh requirements. Alternatively, please confirm the approved process for curating product photos and prices for our affiliate website.

Thank you,
OfferLoom
contact.offerloom@gmail.com
""")
with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
    s.login("contact.offerloom@gmail.com", pw)
    s.send_message(msg)
print("::notice title=AJIO feed request::Sent to customercare@ajio.com")
