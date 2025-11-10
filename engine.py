# -----------------------------------------------------------------
# engine.py
#
# This is the UPDATED "brain" (v19).
# - REMOVED the "context filter" for the PHONE regex.
#   This was too strict and caused us to miss the
#   phone number in your example.
# -----------------------------------------------------------------

import easyocr
import spacy
import re
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

# --- Import your image converter ---
try:
    from image_converter import convert_to_image
except ModuleNotFoundError:
    print("="*50)
    print("ERROR: 'image_converter.py' not found.")
    print("Please make sure that file is in the same directory.")
    print("="*50)
    exit()

# --- 1. GLOBAL MODEL LOADING ---

print("Loading EasyOCR model (this may take a moment)...")
try:
    OCR_READER = easyocr.Reader(['en'], gpu=False) 
    print("EasyOCR model loaded successfully.")
except Exception as e:
    print(f"Error loading EasyOCR model: {e}")
    OCR_READER = None

print("Loading spaCy (NLP) model...")
try:
    NLP = spacy.load("en_core_web_sm")
    print("spaCy model loaded successfully.")
except OSError:
    print("Error: spaCy model 'en_core_web_sm' not found.")
    print("Please run: python -m spacy download en_core_web_sm")
    NLP = None

# --- 2. GLOBAL REGEX RULES & BLOCK LISTS ---

# v16 Regex (escaped hyphen fix)
phone_pattern = r'(\b[689]\d{3}[\s-]?\d{4}\b)|(\+[\d\s\-\(\)]{7,17}\d\b)'
date_pattern = r'\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b'
id_pattern = r'\b(?:[A-Z]{2}\d{6}|\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{3,4})\b'

REGEX_RULES = {
    "NRIC/FIN": re.compile(r'\b[STFGM]\d{7}[A-Z]\b', re.IGNORECASE),
    "MCR no.": re.compile(r'\b\d{6}\b'), # Simple pattern, relies on context filter
    "EMAIL": re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', re.IGNORECASE),
    "PHONE": re.compile(phone_pattern),
    "DATE": re.compile(date_pattern),
    "ID_NUMBER": re.compile(id_pattern, re.IGNORECASE)
}


AI_BLOCK_LIST = {
    "patient", "patient's", "doctor", "doctor's", "medical", "report",
    "particulars", "name", "age", "mcr", "nric", "fin",
    "passport", "hospital", "clinic", "visit", "date", "birth"
}

ADDRESS_CONTEXT_WORDS = {
    "address:", "hospital", "clinic", "road", "street", "avenue",
    "blvd", "singapore", "block", "unit", "sunnyville", "harmony"
}

# --- 3. CORE FUNCTIONS ---

def run_ocr_on_image(image_bytes):
    """
    Runs EasyOCR on the provided image bytes to extract text and coordinates.
    """
    if OCR_READER is None:
        print("OCR_READER is not loaded. Cannot run OCR.")
        return None
    try:
        results = OCR_READER.readtext(image_bytes, paragraph=False, detail=1)
        return results
    except Exception as e:
        print(f"Error during EasyOCR.readtext: {e}")
        return None

# ---------------------------------------------------------------
# 🧠 THE "BRAIN" FUNCTION (v18) 🧠
# ---------------------------------------------------------------
def find_sensitive_entities(ocr_results, categories_to_find):
    """
    v18 - Refined DATE context filter
    """
    print(f"Finding sensitive entities for: {categories_to_find}")
    
    if NLP is None or not ocr_results:
        print("NLP model or OCR results not available. Skipping.")
        return []

    entities_to_redact = [] 

    AI_ADDRESS_LABELS = {"ORG", "GPE", "LOCATION"}
    AI_PERSON_LABEL = {"PERSON"}

    for (line_coords, text, conf) in ocr_results:
        
        all_findings_in_line = []
        lower_text = text.lower()
        
        # --- A. Address Heuristic ---
        if "ADDRESS" in categories_to_find and "address:" in lower_text:
            colon_index = lower_text.find(":")
            if colon_index != -1: 
                start_char = colon_index + 1
                end_char = len(text)
                
                if start_char < end_char:
                    all_findings_in_line.append({
                        "start_char": start_char,
                        "end_char": end_char,
                        "label": "<ADDRESS>"
                    })
        
        # --- B. Run AI Model (spaCy) ---
        run_ai = "@" not in text
        
        if run_ai:
            doc = NLP(text)
            address_context_found = any(word in lower_text for word in ADDRESS_CONTEXT_WORDS)
            
            for ent in doc.ents:
                
                # Detect <PERSON>
                if (ent.label_ in AI_PERSON_LABEL and 
                    "PERSON" in categories_to_find and 
                    ent.text.lower() not in AI_BLOCK_LIST):
                    
                    all_findings_in_line.append({
                        "start_char": ent.start_char,
                        "end_char": ent.end_char,
                        "label": "<PERSON>"
                    })
                
                # Detect unified <ADDRESS>
                elif (ent.label_ in AI_ADDRESS_LABELS and 
                      "ADDRESS" in categories_to_find and 
                      address_context_found and 
                      ent.text.lower() not in AI_BLOCK_LIST):
                    
                    all_findings_in_line.append({
                        "start_char": ent.start_char,
                        "end_char": ent.end_char,
                        "label": "<ADDRESS>"
                    })

        # --- C. Run refined Regex patterns ---
        for label, pattern in REGEX_RULES.items():
            if label not in categories_to_find:
                continue

            # Context filters
            if label == "MCR no." and "mcr" not in lower_text:
                continue
            if label == "NRIC/FIN" and not re.search(r'\b(nric|fin|passport)\b', lower_text):
                continue
            
            # --- THIS IS THE FIX (v19) ---
            # REMOVED the context filter for PHONE, as it was
            # too strict and missed the number in the header.
            # if label == "PHONE" and not re.search(r'\b(phone|tel...)\b', lower_text):
            #     continue
            # -----------------------------
            
            if label == "DATE" and not re.search(r'\b(birth|dob)\b', lower_text):
                continue
            
            if label == "ID_NUMBER" and not re.search(r'\b(med\. number|ihi|id)\b', lower_text):
                continue
                
            for match in pattern.finditer(text):
                all_findings_in_line.append({
                    "start_char": match.start(),
                    "end_char": match.end(),
                    "label": f"<{label}>"
                })
        
        # --- D. Calculate Coordinates for findings in this line ---
        if not all_findings_in_line:
            continue
            
        line_x0 = line_coords[0][0]
        line_y0 = line_coords[0][1]
        line_x1 = line_coords[2][0]
        line_y1 = line_coords[2][1]
        
        line_pixel_width = line_x1 - line_x0
        line_char_length = len(text)
        
        if line_char_length == 0: continue
        
        avg_pixels_per_char = line_pixel_width / line_char_length

        for finding in all_findings_in_line:
            
            ent_x0 = line_x0 + (finding['start_char'] * avg_pixels_per_char)
            ent_x1 = line_x0 + (finding['end_char'] * avg_pixels_per_char)
            ent_y0 = line_y0
            ent_y1 = line_y1
            
            approx_coords = [
                [ent_x0, ent_y0],
                [ent_x1, ent_y0],
                [ent_x1, ent_y1],
                [ent_x0, ent_y1]
            ]
            
            entities_to_redact.append( (approx_coords, finding['label']) )

    print(f"Found {len(entities_to_redact)} sensitive items to redact.")
    return entities_to_redact

# ---------------------------------------------------------------
# (End of the "Brain" function)
# ---------------------------------------------------------------

def redact_image_with_labels(image_bytes, entities_to_redact):
    """
    Takes the original image and a list of (coordinates, label)
    and draws the redactions on the image.
    """
    print(f"Redacting image with {len(entities_to_redact)} labels...")
    
    if not entities_to_redact or image_bytes is None:
        return image_bytes

    try:
        image = Image.open(BytesIO(image_bytes))
        draw = ImageDraw.Draw(image)
        
        font = ImageFont.load_default(size=18)
        
        for (coordinates, label_text) in entities_to_redact:
            x0 = coordinates[0][0]
            y0 = coordinates[0][1]
            x1 = coordinates[2][0]
            y1 = coordinates[2][1]
            box_to_cover = [(x0, y0), (x1, y1)]

            # 2. Cover the original text (white-out)
            draw.rectangle(box_to_cover, fill="white")

            # 3. Write the new label
            draw.text(
                (x0 + 2, y0 + 2), # Add a small 2px padding
                label_text,
                fill="red",
                font=font
            )

        output_stream = BytesIO()
        image.save(output_stream, format="PNG")
        return output_stream.getvalue()

    except Exception as e:
        print(f"Error redacting image: {e}")
        return None

def export_image_to_pdf(image_bytes):
    """
    Takes the final redacted image (as bytes) and saves
    it into a new, single-page PDF document in memory.
    """
    if image_bytes is None:
        print("No image data to export to PDF.")
        return None
    try:
        image = Image.open(BytesIO(image_bytes))
        image_rgb = image.convert("RGB")
        pdf_bytes_io = BytesIO()
        image_rgb.save(pdf_bytes_io, format="PDF", resolution=image.info.get("dpi", (200, 200))[0])
        return pdf_bytes_io.getvalue()
    except Exception as e:
        print(f"Error converting final image to PDF: {e}")
        return None

# --- 5. TEST BLOCK (Updated to use the REAL brain) ---
if __name__ == "__main__":
    
    print("\n" + "="*50)
    print("--- [BACKEND ENGINE TEST] ---")
    print("="*50)
    
    if OCR_READER is None or NLP is None:
        print("A model failed to load. Exiting test.")
        exit()
        
    test_file_path = "test_docs/test.pdf" 

    class MockUploadedFile:
        def __init__(self, file_path):
            self.name = file_path
            try:
                with open(file_path, 'rb') as f:
                    self.file_data = f.read()
            except FileNotFoundError:
                self.file_data = None
        def getvalue(self):
            return self.file_data

    print(f"\n[STEP 1] Loading and converting '{test_file_path}'...")
    mock_file = MockUploadedFile(test_file_path)
    
    if mock_file.getvalue() is None:
        print(f"\nTEST FAILED: Please create a file named '{test_file_path}'")
    else:
        image_bytes = convert_to_image(mock_file)
        
        if image_bytes:
            print("File converted to image successfully.")
            with open("test_output_from_converter.png", "wb") as f:
                f.write(image_bytes)
            print("Test image saved to 'test_output_from_converter.png'")
            
            print("\n[STEP 2] Running EasyOCR on image...")
            ocr_results = run_ocr_on_image(image_bytes)
            
            if ocr_results and len(ocr_results) > 0:
                print(f"OCR found {len(ocr_results)} text blocks.")
                
                # --- Step 3: Test Entity Finder (REAL) ---
                print("\n[STEP 3] Finding sensitive entities (REAL)...")
                
                categories_to_find = ["PERSON", "NRIC/FIN", "EMAIL", "PHONE", 
                                      "MCR no.", "ADDRESS", "DATE", "ID_NUMBER"]
                
                entities_to_redact = find_sensitive_entities(ocr_results, categories_to_find)

                print(f"\n[STEP 4] Redacting image with {len(entities_to_redact)} labels...")
                redacted_image_bytes = redact_image_with_labels(image_bytes, entities_to_redact)
                
                if redacted_image_bytes:
                    print("Image redacted successfully.")
                    with open("test_output_redacted.png", "wb") as f:
                        f.write(redacted_image_bytes)
                    print("Redacted image saved to 'test_output_redacted.png'")
                
                    print("\n[STEP 5] Exporting redacted image to PDF...")
                    pdf_data = export_image_to_pdf(redacted_image_bytes)
                    
                    if pdf_data:
                        print("PDF export SUCCESS.")
                        with open("FINAL_REDACTED_OUTPUT.pdf", "wb") as f:
                            f.write(pdf_data)
                        print("Saved final file to 'FINAL_REDACTED_OUTPUT.pdf'")
                    else:
                        print("PDF export FAILED.")
                else:
                    print("Image redaction FAILED.")
            else:
                print("OCR failed or found no text.")
        else:
            print("Image conversion FAILED.")

    print("\n--- [BACKEND TEST COMPLETE] ---")