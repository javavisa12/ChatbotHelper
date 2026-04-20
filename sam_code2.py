# method change ( class to static utility)
#before

class MathUtils:
    def square(self, x):
        return x * x

obj = MathUtils()
print(obj.square(5))


#after
class MathUtils:
    @staticmethod
    def square(x):
        return x * x

print(MathUtils.square(5))



#method split ( single responsibility )

#before
class User:
    def process(self, name, age):
        name = name.strip().title()

        if age < 18:
            category = "Minor"
        else:
            category = "Adult"

        print(f"{name} is {category}")

        
#after

class User:
    def format_name(self, name):
        return name.strip().title()

    def get_category(self, age):
        return "Minor" if age < 18 else "Adult"

    def display(self, name, age):
        clean_name = self.format_name(name)
        category = self.get_category(age)
        print(f"{clean_name} is {category}")

