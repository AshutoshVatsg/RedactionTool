# -----------------------------------------------------------------
# api.py
#
# This is your "bridge" (your API server).
# It uses Flask to listen for requests from the frontend,
# passes the data to your `engine.py` "brain",
# and sends the final redacted PDF back.
#
# To run:
# 1. Make sure 'flask' is installed: pip install Flask
# 2. Run this file: python3 api.py
# -----------------------------------------------------------------

import json
import traceback
from io import BytesIO
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS  # Import CORS

# --- Import all your backend "brain" functions ---
try:
    from image_converter import convert_to_image
    from engine import (
        run_ocr_on_image, 
        find_sensitive_entities, 
        redact_image_with_labels, 
        export_image_to_pdf
    )
except ImportError as e:
    print("="*50)
    print(f"ERROR: Could not import modules: {e}")
    print("Please make sure 'engine.py' and 'image_converter.py' are in this directory.")
    print("="*50)
    exit()
except Exception as e:
    print("An unexpected error occurred during import:")
    traceback.print_exc()
    exit()

# --- 1. Setup the Flask App ---
app = Flask(__name__)
# Enable CORS to allow your React app (on http://localhost:5173)
# to talk to this server (on http://127.0.0.1:5000)
CORS(app) 

print("Backend API server is starting...")

# --- 2. Define the "/redact" Endpoint ---
@app.route('/redact', methods=['POST'])
def redact_document():
    """
    This is the main API endpoint that the frontend will call.
    It expects a file and a list of categories.
    """
    print("\n--- Received new /redact request ---")
    
    # --- A. Get Data from Frontend ---
    
    # Check if a file was sent
    if 'file' not in request.files:
        print("Error: No file part in request.")
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    
    # Check if the filename is empty
    if file.filename == '':
        print("Error: No file selected.")
        return jsonify({"error": "No selected file"}), 400

    # Get the list of categories (sent as a JSON string)
    try:
        categories_json = request.form.get('categories', '[]')
        categories_to_find = json.loads(categories_json)
        print(f"File: {file.filename}")
        print(f"Categories: {categories_to_find}")
    except json.JSONDecodeError:
        print("Error: Invalid categories JSON.")
        return jsonify({"error": "Invalid categories format"}), 400
    except Exception as e:
        print(f"Error parsing form data: {e}")
        return jsonify({"error": "Error parsing request"}), 500

    # --- B. Run Your Full Backend Pipeline ---
    
    try:
        # Step 1: Convert uploaded file to a single image
        # (We use file.read() to get the bytes)
        # We also create a "mock" file object for your function
        class MockFile:
            def __init__(self, name, data):
                self.name = name
                self.file_data = data
            def getvalue(self):
                return self.file_data

        mock_file = MockFile(file.filename, file.read())
        image_bytes = convert_to_image(mock_file)
        if image_bytes is None:
            raise Exception("File conversion failed (unsupported format or corrupt file).")
        print(f"[Step 1] Converted {file.filename} to image.")

        # Step 2: Run OCR on the image
        ocr_results = run_ocr_on_image(image_bytes)
        if ocr_results is None:
            raise Exception("OCR process failed.")
        print(f"[Step 2] OCR found {len(ocr_results)} text blocks.")

        # Step 3: Find sensitive entities (The "Brain")
        entities_to_redact = find_sensitive_entities(ocr_results, categories_to_find)
        print(f"[Step 3] Found {len(entities_to_redact)} sensitive items.")

        # Step 4: Redact the image
        redacted_image_bytes = redact_image_with_labels(image_bytes, entities_to_redact)
        if redacted_image_bytes is None:
            raise Exception("Redaction drawing failed.")
        print("[Step 4] Image redacted successfully.")

        # Step 5: Export the final image as a PDF
        pdf_bytes = export_image_to_pdf(redacted_image_bytes)
        if pdf_bytes is None:
            raise Exception("PDF export failed.")
        print("[Step 5] Final PDF created.")
        
    except Exception as e:
        print(f"--- PIPELINE FAILED ---")
        print(f"Error: {e}")
        print("-------------------------")
        return jsonify({"error": str(e)}), 500

    # --- C. Send the Redacted PDF Back ---
    
    print("Sending redacted PDF back to frontend.")
    return send_file(
        BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name='REDACTED_OUTPUT.pdf'
    )

# --- 3. Start the Server ---
if __name__ == '__main__':
    # We run on port 5000
    print("="*50)
    print("Flask API server is running at http://127.0.0.1:5000/")
    print("Your React frontend can now send requests to this address.")
    print("Press CTRL+C to stop the server.")
    print("="*50)
    app.run(debug=True, port=5000)