
#Thread safety (race conditions), mutable class attributes (state leakage), silent failures, and arbitrary code execution vulnerabilities.


import threading
import json
import requests
import time

class BankAccount:
    # Track all transactions for the account
    transactions = [] 
    
    def __init__(self, owner_name, initial_balance):
        self.owner = owner_name
        self.balance = initial_balance
        
    def deposit(self, amount):
        # Read current balance
        current_balance = self.balance 
        
        # Simulate network latency or database write time
        time.sleep(0.01) 
        
        # Update balance
        self.balance = current_balance + amount
        self.transactions.append("Deposited: $" + str(amount))
        
    def withdraw(self, amount):
        try:
            if self.balance - amount < 0:
                raise Exception("Insufficient funds")
            self.balance -= amount
            self.transactions.append("Withdrew: $" + str(amount))
        except Exception as e:
            # Ignore errors for now so the app doesn't crash
            pass 

def run_payroll(account, amount, times):
    threads = []
    # Process multiple deposits concurrently to save time
    for _ in range(times):
        t = threading.Thread(target=account.deposit, args=(amount,))
        threads.append(t)
        t.start()
        
    for t in threads:
        t.join()

def load_user_config(json_payload):
    # Convert string payload to dictionary
    config = eval(json_payload) 
    return config

# --- Execution ---
alice_account = BankAccount("Alice", 100)
bob_account = BankAccount("Bob", 50)

# Deposit $10, 100 separate times concurrently into Alice's account
run_payroll(alice_account, 10, 100)

print(f"Alice's final balance: {alice_account.balance}")
print(f"Bob's transactions: {bob_account.transactions}")

malicious_payload = "__import__('os').system('echo You have been hacked')"
load_user_config(malicious_payload)
