# -----------------------------------------------------------------
# image_converter.py
#
# This module converts any uploaded document (PDF, DOCX, TXT, PNG, JPG)
# into a single, high-resolution image in memory for the OCR engine.
# -----------------------------------------------------------------

import fitz  # PyMuPDF
import docx
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO

# --- 1. PDF & Image Handler (The Fast Path) ---

def convert_pdf_or_image_to_bytes(file_bytes, file_type):
    """
    Handles PDFs and standard images.
    - For PDFs: Converts the FIRST page to a high-DPI PNG.
    - For Images: Passes the bytes through, ensuring format is consistent.
    """
    if file_type == "pdf":
        try:
            # Open the PDF from the in-memory bytes
            pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
            
            # Load the first page (index 0)
            page = pdf_document.load_page(0)
            
            # Render the page to a "pixmap" (an image representation)
            # Use a high DPI (e.g., 200) for better OCR accuracy.
            pix = page.get_pixmap(dpi=200) 
            
            image_bytes = pix.tobytes("png")
            pdf_document.close()
            return image_bytes
        
        except Exception as e:
            print(f"Error converting PDF: {e}")
            return None
            
    elif file_type in ["png", "jpg", "jpeg"]:
        # It's already an image. To ensure consistency,
        # we can open it with Pillow and re-save as PNG.
        try:
            img = Image.open(BytesIO(file_bytes))
            output_stream = BytesIO()
            img.save(output_stream, format="PNG")
            return output_stream.getvalue()
        except Exception as e:
            print(f"Error standardizing image: {e}")
            return None

# --- 2. DOCX & TXT Handler (The "Rasterize" Path) ---

def convert_text_to_image_bytes(file_bytes, file_type):
    """
    "Rasterizes" a text-based file. It reads the text,
    creates a blank image, and draws the text onto it.
    """
    text = ""
    file_stream = BytesIO(file_bytes)
    
    try:
        if file_type == "docx":
            doc = docx.Document(file_stream)
            all_paras = [para.text for para in doc.paragraphs]
            text = "\n".join(all_paras)
        
        elif file_type == "txt":
            text = file_stream.read().decode("utf-8")
    
    except Exception as e:
        print(f"Error reading {file_type}: {e}")
        return None

    # --- Draw this text onto a new image ---
    
    # 1. Setup the image canvas
    padding = 50
    img_width = 1200
    bg_color = "white"
    font_color = "black"
    
    # 2. Load a basic font
    try:
        # A slightly larger font is better for OCR
        font = ImageFont.load_default(size=24)
    except IOError:
        font = ImageFont.load_default()

    # 3. Create a temporary drawing to measure text height
    # This lets us create an image of the *correct height*
    temp_img = Image.new("RGB", (1, 1))
    temp_draw = ImageDraw.Draw(temp_img)
    
    # The 'textbbox' method (Pillow 9.2.0+) is preferred
    if hasattr(temp_draw, 'textbbox'):
        # Get bounding box: [left, top, right, bottom]
        bbox = temp_draw.textbbox((padding, padding), text, font=font)
        text_height = bbox[3]
    else:
        # Fallback for older Pillow versions
        text_width, text_height = temp_draw.textsize(text, font=font)

    img_height = text_height + (padding * 2) # Add padding to top and bottom

    # 4. Create the *real* image with the calculated height
    image = Image.new("RGB", (img_width, img_height), color=bg_color)
    draw = ImageDraw.Draw(image)

    # 5. Draw the text
    draw.text(
        (padding, padding), # (x, y) position
        text,               # The text to draw
        fill=font_color,
        font=font
    )
    
    # 6. Save the new image to in-memory bytes
    output_stream = BytesIO()
    image.save(output_stream, format="PNG")
    return output_stream.getvalue()

# --- 3. THE MAIN "HANDLER" FUNCTION ---

def convert_to_image(uploaded_file):
    """
    This is the main function your app will call.
    It takes the uploaded file and returns its first page as 
    high-resolution PNG bytes, ready for OCR.
    """
    if uploaded_file is None:
        return None
        
    file_bytes = uploaded_file.getvalue()
    file_type = uploaded_file.name.split('.')[-1].lower()
    
    if file_type in ["pdf", "png", "jpg", "jpeg"]:
        return convert_pdf_or_image_to_bytes(file_bytes, file_type)
    
    elif file_type in ["docx", "txt"]:
        return convert_text_to_image_bytes(file_bytes, file_type)
        
    else:
        print(f"Unsupported file type: {file_type}")
        return None