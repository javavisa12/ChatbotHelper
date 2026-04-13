
#resource management, and exception handling


def add_item_to_list(item, my_list=[]):
    my_list.append(item)
    return my_list

def process_file(filename):
    file = open(filename, 'r')
    data = file.read()
    print("File processed successfully.")
    return data

print(add_item_to_list("apple"))
print(add_item_to_list("banana"))
content = process_file("config.json")
