# qr_generator.py
import qrcode

def generate_qr(data, filename):
    qr = qrcode.make(data)
    qr.save(filename)
    print(f"QR Code saved as {filename}")

# Example usage
attendee_info = "event_id=E1234&attendee_id=A5678"
generate_qr(attendee_info, "attendee_qr.png")
