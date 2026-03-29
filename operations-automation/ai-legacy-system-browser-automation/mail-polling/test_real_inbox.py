#!/usr/bin/env python3
"""Test reading from the real inbox (27k messages one)."""
import sys
sys.path.insert(0, 'src')
from appscript import app, k

outlook = app('Microsoft Outlook')

# Get all folders and find the inbox with messages
print("Finding the real inbox...")
all_folders = outlook.mail_folders()
for folder in all_folders:
    try:
        name = folder.name()
        if name.lower() == "inbox":
            count = folder.count(each=k.message)
            if count > 0:
                print(f"Found real Inbox with {count} messages")
                print("\nLast 10 emails:")
                print("-" * 60)
                messages = folder.messages()
                for i, msg in enumerate(messages[:10]):
                    try:
                        subj = msg.subject()
                        match = " *** MATCH ***" if "NEW EMPLOYEE ORDER" in (subj or "").upper() else ""
                        print(f"  {i+1}. {subj}{match}")
                    except Exception as e:
                        print(f"  {i+1}. Error: {e}")
                break
    except:
        continue
