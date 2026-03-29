#!/usr/bin/env python3
"""List all Outlook folders and check for emails."""
import sys
sys.path.insert(0, 'src')
from appscript import app, k

outlook = app('Microsoft Outlook')

# List all accounts
print("=== Outlook Accounts ===")
try:
    for acct in outlook.exchange_accounts():
        print(f"  Exchange: {acct.name()}")
except:
    pass
try:
    for acct in outlook.pop_accounts():
        print(f"  POP: {acct.name()}")
except:
    pass
try:
    for acct in outlook.imap_accounts():
        print(f"  IMAP: {acct.name()}")
except:
    pass

# List top-level folders
print("\n=== Top-Level Folders ===")
try:
    for folder in outlook.mail_folders():
        try:
            name = folder.name()
            count = folder.count(each=k.message)
            print(f"  {name}: {count} messages")
        except Exception as e:
            print(f"  (error reading folder: {e})")
except Exception as e:
    print(f"Error listing folders: {e}")

# Try inbox directly
print("\n=== Direct Inbox Access ===")
try:
    inbox_messages = outlook.inbox.messages()
    print(f"  outlook.inbox: {len(inbox_messages)} messages")
    for i, msg in enumerate(inbox_messages[:5]):
        print(f"    {i+1}. {msg.subject()}")
except Exception as e:
    print(f"  outlook.inbox failed: {e}")

# Try via exchange account
print("\n=== Exchange Account Inbox ===")
try:
    for acct in outlook.exchange_accounts():
        name = acct.name()
        inbox = acct.inbox_folder()
        msgs = inbox.messages()
        print(f"  {name} inbox: {len(msgs)} messages")
        for i, msg in enumerate(msgs[:5]):
            print(f"    {i+1}. {msg.subject()}")
except Exception as e:
    print(f"  Exchange inbox failed: {e}")
