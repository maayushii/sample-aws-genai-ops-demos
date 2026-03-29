#!/usr/bin/env python3
"""Test reading recent emails from the real inbox."""
import sys
sys.path.insert(0, 'src')
from appscript import app, k, its

outlook = app('Microsoft Outlook')

# Find the real inbox (the one with messages)
print("Finding the real inbox...")
real_inbox = None
for folder in outlook.mail_folders():
    try:
        name = folder.name()
        if name.lower() == "inbox":
            count = folder.count(each=k.message)
            if count > 0:
                real_inbox = folder
                print(f"Found Inbox with {count} messages")
                break
    except:
        continue

if not real_inbox:
    print("Could not find inbox with messages")
    sys.exit(1)

# Get subjects of last 10 messages using bulk property access (much faster)
print("\nGetting recent email subjects...")
try:
    subjects = real_inbox.messages.subject()
    print(f"Got {len(subjects)} subjects")
    print("\nLast 10 emails:")
    print("-" * 60)
    for i, subj in enumerate(subjects[-10:]):
        idx = len(subjects) - 10 + i + 1
        match = " *** MATCH ***" if "NEW EMPLOYEE ORDER" in (subj or "").upper() else ""
        print(f"  {idx}. {subj}{match}")
except Exception as e:
    print(f"Error: {e}")
