'''html to pdf/docx'''

import os
from flask import Flask, render_template, request, send_file
import pdfkit
import pypandoc

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# If Windows, set wkhtmltopdf path
# config = pdfkit.configuration(wkhtmltopdf=r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe")

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/convert', methods=['POST'])
def convert():
    file = request.files['file']
    output_format = request.form['format']

    if not file:
        return "No file uploaded"

    input_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(input_path)

    filename = os.path.splitext(file.filename)[0]
    
    options = {
    'enable-local-file-access': None
}

    if output_format == "pdf":
        output_path = os.path.join(OUTPUT_FOLDER, filename + ".pdf")
        pdfkit.from_file(input_path, output_path, options=options)
        # pdfkit.from_file(input_path, output_path, configuration=config)

    elif output_format == "docx":
        output_path = os.path.join(OUTPUT_FOLDER, filename + ".docx")
        pypandoc.convert_file(input_path, 'docx', outputfile=output_path)

    return send_file(output_path, as_attachment=True)


if __name__ == '__main__':
    app.run(debug=True)
