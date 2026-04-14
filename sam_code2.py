class BankAccount:
    def _init_(self, balance):
        self.balance = balance

    def deposit(amount):
        self.balance += amount

    def withdraw(self, amount):
        if amount > self.balance:
            print("Insufficient funds")
        else:
            self.balance -= amount

acc = BankAccount(1000)
acc.deposit(500)
print(acc.balance)
