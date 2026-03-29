#!/usr/bin/env python3
import sys
sys.path.insert(0, 'src')
from appscript import app, k

outlook = app('Microsoft Outlook')

# Replicate the patched logic
best_folder = None
best_count = -1
for folder in outlook.mail_folders():
    try:
        fname = folder.name()
        if fname.lower() == "inbox":
            count = folder.count(each=k.message)
            print(f"  Found inbox with {count} messages")
            if count > best_count:
                best_count = count
                best_folder = folder
    except:
        continue

if best_folder:
    print(f"\nSelected inbox with {best_count} messages")
    # Get just the last 3 subjects using bulk access (fast)
    subjects = best_folder.messages.subject()
    print(f"Total subjects retrieved: {len(subjects)}")
    print("\nLast 3 emails:")
    for s in subjects[-3:]:
        match = " *** MATCH ***" if "NEW EMPLOYEE ORDER" in (s or "").upper() else ""
        print(f"  {s}{match}")
