#!/usr/bin/env python3
"""Quick test to check Outlook connectivity and inbox contents."""
import sys
sys.path.insert(0, 'src')
from mail_monkey.mailclient import get_mailclient

print("Connecting to Outlook...")
try:
    client = get_mailclient()
    print("✓ Connected to Outlook")
except Exception as e:
    print(f"✗ Cannot connect to Outlook: {e}")
    sys.exit(1)

print("\nGetting inbox...")
try:
    inbox = client.get_folder("inbox")
    print("✓ Got inbox folder")
except Exception as e:
    print(f"✗ Cannot get inbox: {e}")
    sys.exit(1)

print("\nScanning last 10 emails:")
print("-" * 60)
count = 0
for message in inbox.get_messages():
    count += 1
    if count > 10:
        break
    try:
        subject = message.get_subject()
        sender = message.get_sender()
        match = "*** MATCH ***" if "NEW EMPLOYEE ORDER" in (subject or "").upper() else ""
        print(f"  {count}. From: {sender}")
        print(f"     Subject: {subject}")
        if match:
            print(f"     {match}")
        print()
    except Exception as e:
        print(f"  {count}. Error reading message: {e}")

if count == 0:
    print("  (no messages found in inbox)")
else:
    print(f"Scanned {min(count, 10)} messages")
