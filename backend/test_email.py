from app.services.email_service import send_email

try:
    send_email('raghad.murad.buzia@gmail.com', 'Test DermaScan', 'Test email from DermaScan AI')
    print('SUCCESS: Email sent!')
except Exception as e:
    print('ERROR:', str(e))